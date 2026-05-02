import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

let accessToken: string | null = null;
let onTokenUpdate: ((token: string | null) => void) | null = null;

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (onTokenUpdate) {
    onTokenUpdate(token);
  }
};

export const subscribeToTokenUpdates = (callback: (token: string | null) => void) => {
  onTokenUpdate = callback;
};

// Request interceptor to add the bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor to handle 401 errors and refresh token
let isRefreshing = false;
let failedQueue: { resolve: (token: string | null) => void; reject: (error: AxiosError | Error) => void }[] = [];

const processQueue = (error: AxiosError | Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post('/api/refresh', {}, { withCredentials: true });
        const newToken = res.data.access_token || res.data.token;
        
        if (newToken) {
          setAccessToken(newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          throw new Error('No token in refresh response');
        }
      } catch (refreshError) {
        const err = refreshError as AxiosError | Error;
        processQueue(err, null);
        setAccessToken(null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

let accessToken: string | null = null;
const subscribers: ((token: string | null) => void)[] = [];
let refreshPromise: Promise<string | null> | null = null;

type AuthRequestConfig = AxiosRequestConfig & {
  skipAuthRefresh?: boolean;
};

type TokenResponse = {
  access_token?: string;
  token?: string;
  data?: {
    access_token?: string;
    token?: string;
  };
};

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const extractAccessToken = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const tokenPayload = payload as TokenResponse;
  return (
    tokenPayload.data?.access_token ||
    tokenPayload.data?.token ||
    tokenPayload.access_token ||
    tokenPayload.token ||
    null
  );
};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  subscribers.forEach((callback) => callback(token));
};

export const getAccessToken = () => accessToken;

export const subscribeToTokenUpdates = (callback: (token: string | null) => void) => {
  subscribers.push(callback);
  callback(accessToken);

  return () => {
    const index = subscribers.indexOf(callback);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  };
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/refresh', undefined, { skipAuthRefresh: true } as AuthRequestConfig)
      .then((res) => {
        const token = extractAccessToken(res.data);
        if (!token) {
          throw new Error('No token in refresh response');
        }
        setAccessToken(token);
        return token;
      })
      .catch((error) => {
        setAccessToken(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & {
      retryAfterRefresh?: boolean;
      skipAuthRefresh?: boolean;
    }) | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.retryAfterRefresh &&
      !originalRequest.skipAuthRefresh &&
      originalRequest.url !== '/login' &&
      originalRequest.url !== '/refresh'
    ) {
      originalRequest.retryAfterRefresh = true;

      try {
        const token = await refreshAccessToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch {
        setAccessToken(null);
      }
    }

    if (error.response?.status === 401) {
      setAccessToken(null);
    }

    return Promise.reject(error);
  }
);

export default api;

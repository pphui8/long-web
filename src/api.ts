import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

let accessToken: string | null = null;
const subscribers: ((token: string | null) => void)[] = [];

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  subscribers.forEach((callback) => callback(token));
};

export const subscribeToTokenUpdates = (callback: (token: string | null) => void) => {
  subscribers.push(callback);
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
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (accessToken) {
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

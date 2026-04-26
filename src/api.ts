const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface LoginResponse {
  access_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface PingResponse {
  message: string;
}

export interface ResourceResponse {
  message: string;
  user: string;
}

export interface ErrorResponse {
  error: string;
}

export class ApiError extends Error {
  public status: number;
  public data: ErrorResponse;

  constructor(status: number, data: ErrorResponse) {
    super(data.error || `HTTP error ${status}`);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Required to handle HttpOnly cookies for refresh tokens
    credentials: 'include',
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || 'Invalid JSON response' };
  }

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ Username: username, Password: password }),
    }),

  refresh: () =>
    request<RefreshTokenResponse>('/refresh', {
      method: 'POST',
    }),

  ping: () => request<PingResponse>('/ping'),

  getResource: (accessToken: string) =>
    request<ResourceResponse>('/resource', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};

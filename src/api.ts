const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
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
  constructor(public status: number, public data: ErrorResponse) {
    super(data.error || `HTTP error ${status}`);
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
      body: JSON.stringify({ username, password }),
    }),

  refresh: (refreshToken: string) =>
    request<RefreshTokenResponse>('/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  ping: () => request<PingResponse>('/ping'),

  getResource: (accessToken: string) =>
    request<ResourceResponse>('/resource', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};

import api, { setAccessToken, subscribeToTokenUpdates, TOKEN_KEY } from './api';

export interface AuthPayload {
  username: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

class AuthService {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly REFRESH_BUFFER_MS = 90 * 1000; // 90 seconds before expiry
  private isAutoRefreshEnabled = false;

  constructor() {
    // Stop auto-refresh if the token is cleared externally (e.g., via 401 interceptor)
    subscribeToTokenUpdates((token) => {
      if (!token) {
        this.isAutoRefreshEnabled = false;
        this.stopAutoRefresh();
      }
    });

    // Resume session if token exists
    const initialToken = localStorage.getItem(TOKEN_KEY);
    if (initialToken) {
      this.isAutoRefreshEnabled = true;
      this.scheduleRefresh(initialToken);
    }
  }

  async login(username: string, password: string): Promise<string | null> {
    try {
      const res = await api.post('/login', { username, password });
      const token = res.data.access_token || res.data.token;
      if (token) {
        this.isAutoRefreshEnabled = true;
        this.handleNewToken(token);
        return token;
      }
      return null;
    } catch (error) {
      this.isAutoRefreshEnabled = false;
      this.stopAutoRefresh();
      setAccessToken(null);
      throw error;
    }
  }

  async refresh(): Promise<string | null> {
    try {
      const res = await api.post('/refresh');
      const token = res.data.access_token || res.data.token;
      if (token) {
        this.isAutoRefreshEnabled = true;
        this.handleNewToken(token);
        return token;
      }
      throw new Error('No token in refresh response');
    } catch (error) {
      this.isAutoRefreshEnabled = false;
      this.stopAutoRefresh();
      setAccessToken(null);
      throw error;
    }
  }

  logout() {
    this.isAutoRefreshEnabled = false;
    this.stopAutoRefresh();
    setAccessToken(null);
    // Optionally call a logout endpoint if it exists
  }

  private handleNewToken(token: string) {
    if (!this.isAutoRefreshEnabled) {
      console.log('Auto-refresh is disabled. Ignoring new token.');
      return;
    }
    setAccessToken(token);
    this.scheduleRefresh(token);
  }

  private scheduleRefresh(token: string) {
    this.stopAutoRefresh();

    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) {
      console.warn('Could not parse token expiration. Auto-refresh disabled.');
      return;
    }

    const expiryTimeMs = payload.exp * 1000;
    const currentTimeMs = Date.now();
    const delay = expiryTimeMs - currentTimeMs - this.REFRESH_BUFFER_MS;

    console.log(`Token expires in ${Math.round((expiryTimeMs - currentTimeMs) / 1000)}s. Scheduling refresh in ${Math.round(delay / 1000)}s.`);

    if (delay > 0) {
      this.refreshTimer = setTimeout(() => {
        console.log('Proactive token refresh triggered...');
        this.refresh().catch(err => {
          console.error('Auto-refresh failed:', err);
        });
      }, delay);
    } else {
      // Already expired or very close to it, refresh immediately
      this.refresh().catch(err => {
        console.error('Immediate refresh failed:', err);
      });
    }
  }

  private stopAutoRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private parseJwt(token: string): AuthPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to parse JWT', e);
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;

import React, { useState } from 'react';
import axios from 'axios';
import authService from '../authService';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const token = await authService.login(username.trim(), password.trim());
      if (!token) {
        setError('Login failed: No token received');
      }
      // Note: No need to call onLoginSuccess because authService.login 
      // already triggers the state update via api.ts subscribers.
    } catch (err: unknown) {
      let message = 'An error occurred during login';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.error || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-200 p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-slate-900">Welcome Back</h1>
        <p className="text-text-muted text-center mb-8">Please sign in to your account</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-border-color rounded-lg text-base transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-border-color rounded-lg text-base transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

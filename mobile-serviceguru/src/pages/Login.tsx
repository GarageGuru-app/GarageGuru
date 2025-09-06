import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Eye, EyeOff, Smartphone } from 'lucide-react';
import { DatabaseManager, User } from '../lib/database';
import LoadingSpinner from '../components/LoadingSpinner';
import serviceguruLogo from '../assets/serviceguru-logo-final.jpeg';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await DatabaseManager.authenticate(email, password);
      
      if (user) {
        onLogin(user);
        // Direct navigation to dashboard based on role - NO HOMEPAGE
        const dashboardRoute = user.role === 'garage_admin' ? '/admin-dashboard' : '/mechanic-dashboard';
        navigate(dashboardRoute);
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (role: 'admin' | 'mechanic') => {
    setIsLoading(true);
    
    try {
      // Demo credentials - in real app, these would be configurable
      const demoEmail = role === 'admin' ? 'admin@demo.com' : 'mechanic@demo.com';
      const user = await DatabaseManager.authenticate(demoEmail, 'demo123');
      
      if (user) {
        onLogin(user);
        const dashboardRoute = user.role === 'garage_admin' ? '/admin-dashboard' : '/mechanic-dashboard';
        navigate(dashboardRoute);
      }
    } catch (err) {
      setError('Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* ServiceGuru Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden flex items-center justify-center">
            <img 
              src={serviceguruLogo} 
              alt="ServiceGuru Logo" 
              className="w-28 h-28 object-cover"
              style={{ 
                transform: 'scale(1.3) translateY(0.1px)',
                objectPosition: 'center'
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ServiceGuru</h1>
          <p className="text-blue-100 flex items-center justify-center space-x-2">
            <Smartphone className="w-4 h-4" />
            <span>Mobile Garage Management</span>
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email or Username
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mobile-input"
                placeholder="Enter your email or username"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mobile-input pr-12"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="mobile-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoadingSpinner size="sm" color="text-white" />
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Account Actions */}
        <div className="bg-white/90 rounded-lg p-4 mb-6">
          <div className="text-center space-y-3">
            <button
              onClick={() => navigate('/forgot-password')}
              className="text-blue-700 font-medium underline text-sm"
              disabled={isLoading}
            >
              Forgot Password? (Requires Internet)
            </button>
            
            <p className="text-gray-600 text-sm">Don't have an account?</p>
            <button
              onClick={() => navigate('/register')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium w-full disabled:opacity-50"
              disabled={isLoading}
            >
              Create New Account (Requires Internet)
            </button>
          </div>
        </div>

        {/* Demo Login Options */}
        <div className="bg-white/90 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 text-center mb-3">Quick Demo Access:</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => loginAsDemo('admin')}
              disabled={isLoading}
              className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Admin Demo
            </button>
            <button
              onClick={() => loginAsDemo('mechanic')}
              disabled={isLoading}
              className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Mechanic Demo
            </button>
          </div>
        </div>

        {/* Offline Notice */}
        <div className="text-center">
          <p className="text-blue-100 text-sm">
            ✨ Works completely offline - No internet required after login
          </p>
        </div>

        {/* Attribution */}
        <div className="text-center mt-8">
          <p className="text-blue-200 text-xs">
            Built by Quintellix Systems
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
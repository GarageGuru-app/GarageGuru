import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Mail, 
  ArrowLeft, 
  Wifi,
  WifiOff,
  CheckCircle
} from 'lucide-react';
import { OnlineAPIService } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ForgotPasswordPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      setError('Internet connection required for password reset');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await OnlineAPIService.requestPasswordReset({ email });
      
      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Password reset failed. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/login')}
            className="p-2 -ml-2 text-white hover:bg-white/10 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white ml-4">Reset Password</h1>
        </div>

        {/* Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <p className="text-blue-100">
            Enter your email to receive password reset instructions
          </p>
        </div>

        {/* Online Status Indicator */}
        <div className={`flex items-center justify-center space-x-2 mb-6 p-3 rounded-lg ${
          isOnline ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
        }`}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="text-sm">
            {isOnline ? 'Connected - Password reset available' : 'Offline - Password reset unavailable'}
          </span>
        </div>

        {/* Reset Form */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          
          {success ? (
            // Success State
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Check Your Email
              </h3>
              
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">
                {success}
              </div>
              
              <p className="text-gray-600 text-sm mb-6">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              
              <button
                onClick={() => navigate('/login')}
                className="mobile-button"
              >
                Back to Login
              </button>
            </div>
          ) : (
            // Reset Form
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mobile-input"
                  placeholder="Enter your email address"
                  disabled={isLoading || !isOnline}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !isOnline}
                className="mobile-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" color="text-white" />
                    <span>Sending Instructions...</span>
                  </div>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>

              {!isOnline && (
                <div className="text-center text-red-600 text-sm">
                  Connect to internet to reset your password
                </div>
              )}
            </form>
          )}
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-blue-100 text-sm">
            Remember your password?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-white font-medium underline"
            >
              Sign In
            </button>
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

export default ForgotPasswordPage;
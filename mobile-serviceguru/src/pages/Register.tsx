import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Eye, 
  EyeOff, 
  Building2, 
  Wifi,
  WifiOff,
  ArrowLeft
} from 'lucide-react';
import { OnlineAPIService } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
// Logo placeholder - using icon instead

const RegisterPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    garage_name: '',
    owner_name: ''
  });

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
      setError('Internet connection required for registration');
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || 
        !formData.garage_name.trim() || !formData.owner_name.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await OnlineAPIService.registerGarage(formData);
      
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/login')}
            className="p-2 -ml-2 text-white hover:bg-white/10 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white ml-4">Create Account</h1>
        </div>

        {/* ServiceGuru Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-white p-2">
            <Building2 className="w-full h-full text-blue-600" />
          </div>
          <p className="text-blue-100 text-sm">Register your garage with ServiceGuru</p>
        </div>

        {/* Online Status Indicator */}
        <div className={`flex items-center justify-center space-x-2 mb-4 p-2 rounded-lg ${
          isOnline ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
        }`}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="text-sm">
            {isOnline ? 'Connected - Registration available' : 'Offline - Registration unavailable'}
          </span>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mobile-input"
                  placeholder="Enter your name"
                  disabled={isLoading || !isOnline}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name *
                </label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                  className="mobile-input"
                  placeholder="Garage owner name"
                  disabled={isLoading || !isOnline}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Garage Name *
              </label>
              <input
                type="text"
                value={formData.garage_name}
                onChange={(e) => setFormData({...formData, garage_name: e.target.value})}
                className="mobile-input"
                placeholder="Enter your garage name"
                disabled={isLoading || !isOnline}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mobile-input"
                placeholder="Enter your email"
                disabled={isLoading || !isOnline}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="mobile-input"
                placeholder="Enter your phone number"
                disabled={isLoading || !isOnline}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="mobile-input pr-12"
                  placeholder="Create a strong password"
                  disabled={isLoading || !isOnline}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  disabled={isLoading || !isOnline}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isOnline}
              className="mobile-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoadingSpinner size="sm" color="text-white" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            {!isOnline && (
              <div className="text-center text-red-600 text-sm">
                Connect to internet to register your garage
              </div>
            )}
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-blue-100 text-sm">
            Already have an account?{' '}
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

export default RegisterPage;
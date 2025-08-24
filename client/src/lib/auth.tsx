import { createContext, useContext, useEffect, useState } from "react";
import type { User, Garage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  garage: Garage | null;
  login: (email: string, password: string) => Promise<string | null>;
  register: (data: RegisterData) => Promise<string | null>;
  logout: () => void;
  isLoading: boolean;
  token: string | null;
  routeUserBasedOnRole: (userData: User, garageData: Garage | null) => string;
  updateToken: (newToken: string) => void;
}

// Super Admin emails that can access /super-admin
const SUPER_ADMIN_EMAILS = [
  'gorla.ananthkalyan@gmail.com',
  'ananthautomotivegarage@gmail.com'
];

interface RegisterData {
  email: string;
  password: string;
  name: string;
  activationCode: string;
  garageName?: string;
  ownerName?: string;
  phone?: string;
  selectedGarageId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [garage, setGarage] = useState<Garage | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth-token"));
  const [isLoading, setIsLoading] = useState(true);

  // Role-based routing logic - returns route path instead of navigating
  const routeUserBasedOnRole = (userData: User, garageData: Garage | null): string => {
    const { role, email, firstLogin, garageId } = userData;

    // Super Admin routing
    if (role === 'super_admin' && SUPER_ADMIN_EMAILS.includes(email)) {
      return '/super-admin';
    }

    // Admin routing
    if (role === 'garage_admin') {
      if (firstLogin || !garageData) {
        return '/garage-setup';
      } else {
        return '/admin-dashboard';
      }
    }

    // Staff routing  
    if (role === 'mechanic_staff') {
      if (!garageId || !garageData) {
        return '/access-request';
      } else {
        return '/staff-dashboard';
      }
    }

    // Fallback for unrecognized roles
    console.error('User role not recognized or not provisioned:', role);
    return '/unauthorized';
  };

  useEffect(() => {
    console.log('🔥 [AUTH] useEffect triggered - token exists:', !!token, 'user exists:', !!user, 'isLoading:', isLoading);
    
    if (token) {
      // Only verify token if we don't already have user data
      if (!user) {
        console.log('🔥 [AUTH] Token exists but no user, fetching profile');
        
        apiRequest("GET", "/api/user/profile")
          .then(res => res.json())
          .then(data => {
            console.log('🔥 [AUTH] Profile fetch successful, user role:', data.user?.role);
            if (data.user) {
              setUser(data.user);
              setGarage(data.garage);
            } else {
              console.log('🔥 [AUTH] No user in profile response, clearing token');
              localStorage.removeItem("auth-token");
              setToken(null);
            }
          })
          .catch((error) => {
            console.log("🔥 [AUTH] Token validation failed:", error.message);
            // Only clear token if it's actually invalid (401), not for network errors
            if (error.message.includes('Invalid email or password') || error.message.includes('401')) {
              console.log("🔥 [AUTH] Token is invalid, clearing auth");
              localStorage.removeItem("auth-token");
              setToken(null);
            } else {
              console.log("🔥 [AUTH] Network/temporary error, keeping token:", error.message);
            }
          })
          .finally(() => {
            console.log('🔥 [AUTH] Setting isLoading to false after profile fetch');
            setIsLoading(false);
          });
      } else {
        // User data already exists, just stop loading
        console.log('🔥 [AUTH] User data already exists, stopping loading');
        setIsLoading(false);
      }
    } else {
      // No token, clear user data and stop loading
      console.log('🔥 [AUTH] No token, clearing user data');
      setUser(null);
      setGarage(null);
      setIsLoading(false);
    }
  }, [token]); // Remove user from dependencies to prevent loops

  const login = async (email: string, password: string) => {
    try {
      console.log('🔥 [AUTH] Login function called for:', email);
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();
      console.log('🔥 [AUTH] Login API response received, token exists:', !!data.token);
      
      // Set auth data from login response - do this synchronously to avoid race conditions
      localStorage.setItem("auth-token", data.token);
      console.log('🔥 [AUTH] Setting token, user, and garage state');
      setToken(data.token);
      setUser(data.user);
      setGarage(data.garage);
      setIsLoading(false); // Ensure loading is false after successful login
      console.log('🔥 [AUTH] Auth state updated - user role:', data.user?.role, 'isLoading set to false');

      // Return route path for navigation
      if (data.user) {
        const route = routeUserBasedOnRole(data.user, data.garage);
        console.log('🔥 [AUTH] Calculated route for user:', route);
        return route;
      }
      return null;
    } catch (error) {
      console.log('🔥 [AUTH] Login error:', error);
      // apiRequest already throws descriptive errors
      throw error;
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", registerData);
      const data = await response.json();
      localStorage.setItem("auth-token", data.token);
      setToken(data.token);
      setUser(data.user);
      setGarage(data.garage);

      // Return route path for navigation after registration
      if (data.user) {
        return routeUserBasedOnRole(data.user, data.garage);
      }
      return null;
    } catch (error) {
      // apiRequest already throws descriptive errors
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setGarage(null);
    setToken(null);
    localStorage.removeItem("auth-token");
  };

  const updateToken = (newToken: string) => {
    localStorage.setItem("auth-token", newToken);
    setToken(newToken);
    // Don't clear user data - keep existing session seamless
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        garage,
        login,
        register,
        logout,
        isLoading,
        token,
        routeUserBasedOnRole,
        updateToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

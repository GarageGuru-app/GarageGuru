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
    if (token) {
      // Only verify token if we don't already have user data
      if (!user) {
        apiRequest("GET", "/api/user/profile")
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              setUser(data.user);
              setGarage(data.garage);
            } else {
              localStorage.removeItem("auth-token");
              setToken(null);
            }
          })
          .catch((error) => {
            console.log("Token validation failed, clearing auth:", error.message);
            localStorage.removeItem("auth-token");
            setToken(null);
          })
          .finally(() => setIsLoading(false));
      } else {
        // User data already exists from login, just stop loading
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [token, user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();
      
      // Set auth data from login response
      localStorage.setItem("auth-token", data.token);
      setToken(data.token);
      setUser(data.user);
      setGarage(data.garage);

      // Return route path for navigation
      if (data.user) {
        return routeUserBasedOnRole(data.user, data.garage);
      }
      return null;
    } catch (error) {
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

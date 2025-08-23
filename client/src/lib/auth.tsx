import { createContext, useContext, useEffect, useState } from "react";
import type { User, Garage } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  garage: Garage | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  token: string | null;
}

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

  useEffect(() => {
    if (token) {
      // Verify token and get user profile
      fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Profile fetch failed');
          }
          return res.json();
        })
        .then(data => {
          if (data.user) {
            setUser(data.user);
            setGarage(data.garage);
          } else {
            localStorage.removeItem("auth-token");
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("auth-token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Set auth data from login response
      localStorage.setItem("auth-token", data.token);
      setToken(data.token);
      setUser(data.user);
      setGarage(data.garage);
    } catch (error) {
      // Handle network errors or JSON parsing errors
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error - please check your connection");
    }
  };

  const register = async (registerData: RegisterData) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    localStorage.setItem("auth-token", data.token);
    setToken(data.token);
    setUser(data.user);
    setGarage(data.garage);
  };

  const logout = () => {
    setUser(null);
    setGarage(null);
    setToken(null);
    localStorage.removeItem("auth-token");
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

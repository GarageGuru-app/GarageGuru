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
      console.log("🔐 Login attempt:", { email, password: "***" });
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("📡 Login response:", { 
        status: response.status, 
        ok: response.ok, 
        statusText: response.statusText 
      });

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorText = await response.text();
          console.log("❌ Error response body:", errorText);
          
          // Try to parse as JSON
          try {
            const error = JSON.parse(errorText);
            errorMessage = error.message || errorMessage;
          } catch {
            // If not JSON, use the text directly
            errorMessage = errorText || response.statusText || errorMessage;
          }
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log("✅ Success response body:", responseText);
      
      const data = JSON.parse(responseText);
      console.log("🔑 Parsed login data:", { 
        hasToken: !!data.token, 
        user: data.user?.email, 
        garage: data.garage?.name 
      });
      
      // Set auth data from login response
      localStorage.setItem("auth-token", data.token);
      setToken(data.token);
      setUser(data.user);
      setGarage(data.garage);
      
      console.log("✅ Login successful, auth state updated");
    } catch (error) {
      console.error("❌ Login error:", error);
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

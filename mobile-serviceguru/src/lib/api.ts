// ServiceGuru Mobile - Online API Integration
// Registration and password reset only work when connected to internet

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  garage_name: string;
  owner_name: string;
}

interface PasswordResetData {
  email: string;
}

export class OnlineAPIService {
  private static readonly API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
  
  // Check if device is online
  static isOnline(): boolean {
    return navigator.onLine;
  }

  // Register new garage - Requires internet
  static async registerGarage(data: RegisterData): Promise<{success: boolean, message: string, garage_id?: string}> {
    if (!this.isOnline()) {
      return {
        success: false,
        message: 'Internet connection required for registration'
      };
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: 'Garage registered successfully!',
          garage_id: result.garage_id
        };
      } else {
        return {
          success: false,
          message: result.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error. Please check your internet connection.'
      };
    }
  }

  // Request password reset - Requires internet
  static async requestPasswordReset(data: PasswordResetData): Promise<{success: boolean, message: string}> {
    if (!this.isOnline()) {
      return {
        success: false,
        message: 'Internet connection required for password reset'
      };
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: 'Password reset instructions sent to your email!'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Password reset failed'
        };
      }
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Network error. Please check your internet connection.'
      };
    }
  }

  // Verify online connection to server
  static async verifyConnection(): Promise<boolean> {
    if (!this.isOnline()) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.API_BASE_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      return response.ok;
    } catch (error) {
      console.error('Connection verification failed:', error);
      return false;
    }
  }

  // Sync local data to server when online - Optional feature
  static async syncDataToServer(userData: any): Promise<{success: boolean, message: string}> {
    if (!this.isOnline()) {
      return {
        success: false,
        message: 'Internet connection required for data sync'
      };
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: 'Data synced successfully to server!'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Data sync failed'
        };
      }
    } catch (error) {
      console.error('Data sync error:', error);
      return {
        success: false,
        message: 'Network error during sync'
      };
    }
  }
}
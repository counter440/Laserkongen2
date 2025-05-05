import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      const currentTime = Date.now() / 1000;
      
      return payload.exp && payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return false; // Let API calls handle any issues
    }
  };

  // Function to validate session on initial load
  const validateSession = async (userInfo) => {
    try {
      // Make sure we have a token before making the API call
      if (!userInfo || !userInfo.token) {
        console.log('No token available for session validation');
        return false;
      }
      
      console.log('Validating session with token:', userInfo.token.substring(0, 20) + '...');
      
      // Make an API call to validate the session on the server
      const response = await fetch('/api/users/validate-session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        credentials: 'same-origin' // Important for cookies if using them
      });
      
      console.log('Session validation response status:', response.status);
      
      // Try to parse the response even if it's not ok
      let data;
      try {
        data = await response.json();
        console.log('Session validation response data:', data);
        
        // Log detailed address data if available
        if (data.address) {
          console.log('Address in validation response:', {
            street: data.address.street,
            city: data.address.city,
            postalCode: data.address.postalCode,
            country: data.address.country,
            phone: data.address.phone || 'Not provided'
          });
        }
      } catch (parseError) {
        console.error('Error parsing validation response:', parseError);
        // If we can't parse the response, assume it's a server error
        // but don't log the user out immediately
        return true;
      }
      
      if (!response.ok) {
        console.log('Session invalid, logging out');
        
        // Check if token is explicitly marked as expired
        if (data && data.tokenExpired) {
          console.log('Token is marked as expired by server');
          sessionStorage.removeItem('userInfo');
          setUser(null);
          return false;
        }
        
        // Only forcibly log out on 401/403 errors
        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem('userInfo');
          setUser(null);
          return false;
        }
        
        // For other errors, we keep the user session
        return true;
      }
      
      // Ensure data has a proper address if present in token
      if (!data.address && userInfo.address) {
        console.log('Adding missing address from userInfo');
        data.address = userInfo.address;
      }
      
      // Merge the data to ensure we don't lose any properties from either source
      const mergedData = {
        ...userInfo,
        ...data
      };
      
      // Update the user object with the latest data from the server
      console.log('Updating user data from validation:', mergedData);
      setUser(mergedData);
      sessionStorage.setItem('userInfo', JSON.stringify(mergedData));
      console.log('Session validated successfully');
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      
      // If there's a connection error, we can check the token locally
      if (userInfo?.token && isTokenExpired(userInfo.token)) {
        console.log('Token expired, logging out');
        sessionStorage.removeItem('userInfo');
        setUser(null);
        return false;
      }
      
      // Don't log out on network errors
      console.log('Network error during validation, keeping session active');
      return true;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        // We still check for a user stored in sessionStorage (not localStorage)
        // This is just to quickly show UI elements while we validate the session
        const userInfoStr = sessionStorage.getItem('userInfo');
        if (!userInfoStr) {
          setLoading(false);
          return;
        }
        
        let userInfo;
        try {
          userInfo = JSON.parse(userInfoStr);
        } catch (parseError) {
          console.error('Error parsing user info from sessionStorage:', parseError);
          sessionStorage.removeItem('userInfo');
          setLoading(false);
          return;
        }
        
        if (userInfo && userInfo.token) {
          // Set the user immediately to avoid UI flicker
          setUser(userInfo);
          
          // But then validate the session with the server
          const isValid = await validateSession(userInfo);
          
          // If validation failed and user was logged out, we need to reset loading
          if (!isValid && !user) {
            setLoading(false);
          }
        } else {
          console.warn('User info found in sessionStorage but no token present');
          sessionStorage.removeItem('userInfo');
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // If we can't parse the stored user info, clear it
        sessionStorage.removeItem('userInfo');
        setUser(null);
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  // Login user
  const login = async (email, password) => {
    try {
      // Check if we're on checkout page where we don't want to redirect after login
      const onCheckoutPage = typeof window !== 'undefined' && sessionStorage.getItem('on_checkout_page');
      
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Instead of throwing an error, format and return error information
        console.error('Login failed:', data.message);
        return { 
          success: false, 
          error: data.message || 'Innlogging mislyktes. Vennligst sjekk e-post og passord.' 
        };
      }

      // After successful login, validate session to get full user data including address
      let userData = data;
      
      // Only validate if we have a token
      if (data.token) {
        try {
          const validateResponse = await fetch('/api/users/validate-session', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.token}`
            }
          });
          
          if (validateResponse.ok) {
            const validatedData = await validateResponse.json();
            console.log('Validation data after login:', validatedData);
            
            // Merge validation data with login data
            userData = {
              ...data,
              ...validatedData
            };
            
            console.log('Merged user data after login:', userData);
          } else {
            console.warn('Session validation failed after login, using login data only');
          }
        } catch (validateError) {
          console.error('Error validating session after login:', validateError);
        }
      }

      // Save user info to sessionStorage instead of localStorage
      sessionStorage.setItem('userInfo', JSON.stringify(userData));
      
      // Update user in context
      console.log('Setting user after login:', userData.name);
      if (userData.address) {
        console.log('Address data included in login:', userData.address);
      } else {
        console.warn('No address data in login response');
      }
      
      setUser(userData);
      
      // Log the login success and checkout page status
      console.log('Login successful, on checkout page:', !!onCheckoutPage);
      
      return { success: true, data: userData, onCheckoutPage: !!onCheckoutPage };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'En uventet feil oppstod under innlogging.' 
      };
    }
  };

  // Register user
  const register = async (name, email, password, address = null) => {
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, address }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Instead of throwing an error, format and return error information
        console.error('Registration failed:', data.message);
        return { 
          success: false, 
          error: data.message || 'Registrering mislyktes. Vennligst prøv igjen.' 
        };
      }

      // Save user info to sessionStorage instead of localStorage
      sessionStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      
      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'En uventet feil oppstod under registrering.' 
      };
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      // Make sure we have a user and token before making the request
      if (!user || !user.token) {
        console.error('Cannot update profile: No authenticated user');
        return { 
          success: false, 
          error: 'Du må være logget inn for å oppdatere profilen. Vennligst logg inn igjen.',
          tokenExpired: true  
        };
      }
      
      // For debugging
      console.log('updateProfile called with data:', userData);
      console.log('Using token:', user.token.substring(0, 20) + '...');
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`, // Note: ensure clean formatting with no extra spaces
        },
        body: JSON.stringify(userData),
        credentials: 'same-origin' // Important for cookies if using them
      });

      console.log('Profile update response status:', response.status);
      
      // Safely parse JSON response, falling back to text if not JSON
      let data;
      let responseText;
      try {
        // First try to get the response as text
        responseText = await response.text();
        
        // Then try to parse as JSON
        try {
          data = JSON.parse(responseText);
          console.log('Profile update response data:', data);
        } catch (jsonError) {
          // Not a JSON response
          console.error('Response is not valid JSON:', responseText.substring(0, 150) + '...');
          data = { 
            message: 'Server returned an invalid response',
            error: responseText.substring(0, 150) + '...',
            success: false
          };
        }
      } catch (textError) {
        console.error('Could not read response text:', textError);
        data = { 
          message: 'Could not read server response',
          error: textError.message,
          success: false
        };
      }

      if (!response.ok) {
        // Check if it's an authentication error
        if (response.status === 401) {
          console.error('Authentication failed during profile update:', data.message);
          
          // If token expired or user not found, trigger re-login
          if (data.tokenExpired) {
            console.log('Token is expired, clearing user session');
            sessionStorage.removeItem('userInfo');
            setUser(null);
          }
          
          return { 
            success: false, 
            error: 'Økten din har utløpt eller brukeren ble ikke funnet. Vennligst logg inn på nytt.',
            tokenExpired: true
          };
        }
        
        // Other errors
        console.error('Profile update failed:', data.message);
        return { 
          success: false, 
          error: data.message || 'Profiloppdatering mislyktes. Vennligst prøv igjen.' 
        };
      }

      console.log('Profile update successful, updating user state');
      
      // Make sure data has the address
      if (userData.address && !data.address) {
        data.address = userData.address;
        console.log('Adding address to user data before storing:', userData.address);
      }
      
      // Update sessionStorage with new user data
      console.log('Updating user data in session with:', data);
      sessionStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      
      return { success: true, data };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        error: error.message || 'En uventet feil oppstod under profiloppdatering.' 
      };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Call backend to invalidate the session if needed
      if (user && user.token) {
        await fetch('/api/users/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with client-side logout even if server logout fails
    } finally {
      // Clear session storage
      sessionStorage.removeItem('userInfo');
      setUser(null);
      
      // Check if we're on the checkout page - if so, don't redirect
      const onCheckoutPage = typeof window !== 'undefined' && sessionStorage.getItem('on_checkout_page');
      
      // Always redirect if on account page or its subpages
      const currentPath = router.pathname;
      const isAccountPage = currentPath.startsWith('/account');
      
      if (isAccountPage || !onCheckoutPage) {
        router.push('/login');
      }
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user && user.role === role;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        hasRole,
        isAuthenticated,
        setUser, // Expose setUser for direct user state manipulation
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
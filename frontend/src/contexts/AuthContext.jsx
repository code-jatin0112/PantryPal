import React, { createContext, useState, useEffect, useCallback } from "react";
import authService from "../services/authService";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("pantrypal_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("pantrypal_token") || null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Validate existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("pantrypal_token");
      if (storedToken) {
        try {
          const response = await authService.getCurrentUser();
          if (response?.data?.user) {
            setUser(response.data.user);
            localStorage.setItem("pantrypal_user", JSON.stringify(response.data.user));
          }
        } catch (error) {
          console.warn("Session expired or invalid:", error);
          authService.logout();
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback(async ({ email, password, rememberMe = true }) => {
    const response = await authService.login({ email, password });
    const { user: loggedInUser, accessToken } = response.data;

    if (rememberMe) {
      localStorage.setItem("pantrypal_token", accessToken);
      localStorage.setItem("pantrypal_user", JSON.stringify(loggedInUser));
    } else {
      sessionStorage.setItem("pantrypal_token", accessToken);
      sessionStorage.setItem("pantrypal_user", JSON.stringify(loggedInUser));
    }

    setToken(accessToken);
    setUser(loggedInUser);
    return response;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const response = await authService.register({ name, email, password });
    const { user: registeredUser, accessToken } = response.data;

    localStorage.setItem("pantrypal_token", accessToken);
    localStorage.setItem("pantrypal_user", JSON.stringify(registeredUser));

    setToken(accessToken);
    setUser(registeredUser);
    return response;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    sessionStorage.removeItem("pantrypal_token");
    sessionStorage.removeItem("pantrypal_user");
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

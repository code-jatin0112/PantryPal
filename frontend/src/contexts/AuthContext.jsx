import React, { createContext, useState, useCallback } from "react";
import authService from "../services/authService";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const data = await authService.login(credentials);
      if (data?.data?.user) {
        setUser(data.data.user);
      }
      if (data?.data?.accessToken) {
        setToken(data.data.accessToken);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    try {
      const data = await authService.register(userData);
      if (data?.data?.user) {
        setUser(data.data.user);
      }
      if (data?.data?.accessToken) {
        setToken(data.data.accessToken);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token || user),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;


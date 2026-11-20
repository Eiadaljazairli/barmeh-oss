import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from '../utils/storage';
import { notificationService, AUTH_INVALIDATED_EVENT } from '../services/api';
import { signOutGoogle } from '../utils/googleAuth';

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    const hardCap = setTimeout(() => {
      setLoading((prev) => {
        if (prev) console.warn('AuthContext: forcing loading=false after 8s timeout');
        return false;
      });
    }, 8000);
    const sub = DeviceEventEmitter.addListener(AUTH_INVALIDATED_EVENT, () => {
      setIsAuthenticated(false);
    });

    return () => {
      clearTimeout(hardCap);
      sub.remove();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const tokenPromise = SecureStore.getItemAsync('userToken');
      const timeoutPromise = new Promise<string | null>((_, reject) =>
        setTimeout(() => reject(new Error('SecureStore timeout')), 6000)
      );

      let token: string | null = null;
      try {
        token = await Promise.race([tokenPromise, timeoutPromise]);
      } catch (timeoutErr) {
        console.warn('checkAuth: SecureStore race timed out, falling back to plain read');
        try {
          token = await SecureStore.getItemAsync('userToken');
        } catch {
          token = null;
        }
      }
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Check auth error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const pushToken = await SecureStore.getItemAsync('pushToken');
      await notificationService.deletePushToken(pushToken || undefined);
    } catch {
    }

    await signOutGoogle();

    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userRefreshToken');
    await SecureStore.deleteItemAsync('userInfo');
    await SecureStore.deleteItemAsync('pushToken');
    try {
      await AsyncStorage.removeItem('@search_history');
    } catch {}
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

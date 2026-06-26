'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface WellheadReference {
  easting: number;
  northing: number;
  elevation: number;
  unit: 'metric' | 'imperial';
}

export interface UserSession {
  id: number;
  username: string;
  role: 'Admin' | 'Engineer';
  preferences: {
    theme?: 'light' | 'dark';
    unit?: 'metric' | 'imperial';
  };
}

interface AppContextType {
  user: UserSession | null;
  loadingUser: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  selectedSlotId: number | null;
  setSelectedSlotId: (id: number | null) => void;
  selectedTrajectoryId: number | null;
  setSelectedTrajectoryId: (id: number | null) => void;
  selectedTrajectoryType: 'Plan' | 'Survey' | null;
  setSelectedTrajectoryType: (type: 'Plan' | 'Survey' | null) => void;
  wellSettings: WellheadReference | null;
  setWellSettings: (settings: WellheadReference | null) => void;
  refreshTrigger: number;
  triggerRefreshTree: () => void;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // App-wide selected states
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedTrajectoryId, setSelectedTrajectoryId] = useState<number | null>(null);
  const [selectedTrajectoryType, setSelectedTrajectoryType] = useState<'Plan' | 'Survey' | null>(null);
  const [wellSettings, setWellSettings] = useState<WellheadReference | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefreshTree = () => setRefreshTrigger((prev) => prev + 1);

  // Fetch current authenticated user
  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        if (data.user.preferences?.theme) {
          setTheme(data.user.preferences.theme);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Update HTML class when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Perform Login
  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data);
      if (data.preferences?.theme) {
        setTheme(data.preferences.theme);
      }
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  // Perform Logout
  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setUser(null);
    setSelectedSlotId(null);
    setSelectedTrajectoryId(null);
    setSelectedTrajectoryType(null);
    setWellSettings(null);
  };

  // Load settings when slotId changes
  useEffect(() => {
    if (selectedSlotId) {
      fetch(`/api/settings?slotId=${selectedSlotId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setWellSettings({
              easting: data.easting,
              northing: data.northing,
              elevation: data.elevation,
              unit: data.unit,
            });
          }
        })
        .catch((err) => console.error('Error loading well settings:', err));
    } else {
      setWellSettings(null);
    }
  }, [selectedSlotId]);

  return (
    <AppContext.Provider
      value={{
        user,
        loadingUser,
        theme,
        toggleTheme,
        selectedSlotId,
        setSelectedSlotId,
        selectedTrajectoryId,
        setSelectedTrajectoryId,
        selectedTrajectoryType,
        setSelectedTrajectoryType,
        wellSettings,
        setWellSettings,
        refreshTrigger,
        triggerRefreshTree,
        login,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

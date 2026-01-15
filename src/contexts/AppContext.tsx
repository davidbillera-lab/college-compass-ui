import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, mockUser } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AppContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  userName: string;
  profileStrength: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Student');
  const [profileStrength, setProfileStrength] = useState(mockUser.profileStrength);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      // Fetch profile name from database
      supabase
        .from('profiles')
        .select('full_name, preferred_name')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setUserName(data.preferred_name || data.full_name || 'Student');
          }
        });
    } else {
      setIsLoggedIn(false);
      setUserName('Student');
    }
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        isLoggedIn,
        setIsLoggedIn,
        userName,
        profileStrength,
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

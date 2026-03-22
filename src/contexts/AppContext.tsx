import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/lib/mockData';
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
  const [profileStrength, setProfileStrength] = useState(0);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      // Fetch profile name from database
      supabase
        .from('profiles')
        .select('full_name, preferred_name, state, grad_year, gpa_unweighted, sat_score, intended_majors, budget_max_usd, financial_need, first_gen_college, interests, values, leadership_roles, awards, volunteer_hours, preferred_setting')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setUserName(data.preferred_name || data.full_name || 'Student');
            // Calculate real profile strength from actual fields
            const fields = [
              { key: 'full_name', weight: 5 },
              { key: 'state', weight: 5 },
              { key: 'grad_year', weight: 5 },
              { key: 'gpa_unweighted', weight: 10 },
              { key: 'sat_score', weight: 8 },
              { key: 'intended_majors', weight: 8 },
              { key: 'budget_max_usd', weight: 8 },
              { key: 'financial_need', weight: 5 },
              { key: 'first_gen_college', weight: 5 },
              { key: 'interests', weight: 8 },
              { key: 'values', weight: 8 },
              { key: 'leadership_roles', weight: 8 },
              { key: 'awards', weight: 7 },
              { key: 'volunteer_hours', weight: 5 },
              { key: 'preferred_setting', weight: 5 },
            ];
            const profile = data as Record<string, unknown>;
            let earned = 0;
            for (const { key, weight } of fields) {
              const val = profile[key];
              if (val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0)) {
                earned += weight;
              }
            }
            setProfileStrength(Math.min(100, Math.round(earned)));
          }
        });
    } else {
      setIsLoggedIn(false);
      setUserName('Student');
      setProfileStrength(0);
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

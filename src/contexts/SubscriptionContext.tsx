/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Premium tier configuration
export const PREMIUM_TIER = {
  price_id: "price_1SySFGHqg2vAFif7Tr7U09V8",
  product_id: "prod_TwKv99TtmRbLfO",
  name: "College Compass Premium",
  monthly_price: 19.99,
  onboarding_fee: 199,
  trial_days: 7,
};

export interface TrialStatus {
  isInTrial: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
}

interface SubscriptionContextType {
  isSubscribed: boolean;
  isPremium: boolean;
  /** True if user is either subscribed OR within their 7-day trial */
  hasAccess: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  trial: TrialStatus;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  openCheckout: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const defaultTrial: TrialStatus = {
  isInTrial: false,
  trialDaysRemaining: 0,
  trialExpired: false,
  trialStartDate: null,
  trialEndDate: null,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [trial, setTrial] = useState<TrialStatus>(defaultTrial);
  const [loading, setLoading] = useState(true);

  // Calculate trial status from profile created_at
  const calcTrial = useCallback(async (userId: string): Promise<TrialStatus> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (error || !data?.created_at) return defaultTrial;

      const trialStart = new Date(data.created_at);
      const trialEnd = new Date(trialStart.getTime() + PREMIUM_TIER.trial_days * 24 * 60 * 60 * 1000);
      const now = new Date();
      const msRemaining = trialEnd.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      const isInTrial = msRemaining > 0;
      const trialExpired = !isInTrial;

      return {
        isInTrial,
        trialDaysRemaining: daysRemaining,
        trialExpired,
        trialStartDate: trialStart.toISOString(),
        trialEndDate: trialEnd.toISOString(),
      };
    } catch {
      return defaultTrial;
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token || !user) {
      setIsSubscribed(false);
      setProductId(null);
      setSubscriptionEnd(null);
      setTrial(defaultTrial);
      setLoading(false);
      return;
    }

    try {
      const [subResult, trialResult] = await Promise.all([
        supabase.functions.invoke('check-subscription', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        calcTrial(user.id),
      ]);

      if (subResult.error) {
        console.error('Error checking subscription:', subResult.error);
      } else {
        setIsSubscribed(subResult.data?.subscribed || false);
        setProductId(subResult.data?.product_id || null);
        setSubscriptionEnd(subResult.data?.subscription_end || null);
      }

      setTrial(trialResult);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, user, calcTrial]);

  const openCheckout = async () => {
    if (!session?.access_token) {
      toast.error('Please sign in to subscribe');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        toast.error('Failed to start checkout');
        console.error('Checkout error:', error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast.error('Failed to start checkout');
      console.error('Checkout error:', error);
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      toast.error('Please sign in to manage subscription');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        toast.error('Failed to open subscription portal');
        console.error('Portal error:', error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast.error('Failed to open subscription portal');
      console.error('Portal error:', error);
    }
  };

  // Check subscription on auth change
  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setIsSubscribed(false);
      setProductId(null);
      setSubscriptionEnd(null);
      setTrial(defaultTrial);
      setLoading(false);
    }
  }, [user, checkSubscription]);

  // Auto-refresh subscription status every 60 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  // Check for checkout success/cancel in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');

    if (checkout === 'success') {
      toast.success('Welcome to College Compass Premium! 🎉');
      checkSubscription();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (checkout === 'cancelled') {
      toast.info('Checkout cancelled');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkSubscription]);

  const isPremium = isSubscribed && productId === PREMIUM_TIER.product_id;
  // hasAccess = paid subscriber OR still within free trial window
  const hasAccess = isPremium || trial.isInTrial;

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isPremium,
        hasAccess,
        productId,
        subscriptionEnd,
        trial,
        loading,
        checkSubscription,
        openCheckout,
        openCustomerPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

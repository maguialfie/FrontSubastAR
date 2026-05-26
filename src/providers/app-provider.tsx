import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { usePathname, useRouter } from 'expo-router';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { RegistrationDraft, Session } from '@/types/domain';
import { setUnauthorizedHandler } from '@/services/http';

const SESSION_KEY = 'subastar.session';
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

type SessionValue = {
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  registration: RegistrationDraft | null;
  setRegistration: (draft: RegistrationDraft | null) => void;
  signIn: (session: Session) => Promise<void>;
  enterAsGuest: () => void;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | undefined>(undefined);

async function readSession() {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(SESSION_KEY) ?? null;
  return SecureStore.getItemAsync(SESSION_KEY);
}

async function storeSession(value: string | null) {
  if (Platform.OS === 'web') {
    if (value) globalThis.localStorage?.setItem(SESSION_KEY, value);
    else globalThis.localStorage?.removeItem(SESSION_KEY);
    return;
  }
  if (value) await SecureStore.setItemAsync(SESSION_KEY, value);
  else await SecureStore.deleteItemAsync(SESSION_KEY);
}

export function AppProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setGuest] = useState(false);
  const [registration, setRegistration] = useState<RegistrationDraft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readSession()
      .then((stored) => stored && setSession(JSON.parse(stored) as Session))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      setSession(null);
      setGuest(false);
      await storeSession(null);
      queryClient.clear();
      router.replace({ pathname: '/login', params: { returnTo: pathname } });
    });
    return () => setUnauthorizedHandler(undefined);
  }, [pathname, router]);

  const value = useMemo<SessionValue>(() => ({
    session,
    isGuest,
    registration,
    setRegistration,
    loading,
    async signIn(nextSession) {
      setSession(nextSession);
      setGuest(false);
      await storeSession(JSON.stringify(nextSession));
    },
    enterAsGuest() {
      setGuest(true);
    },
    async signOut() {
      setSession(null);
      setGuest(false);
      await storeSession(null);
      queryClient.clear();
    },
  }), [isGuest, loading, registration, session]);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
    </QueryClientProvider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within AppProvider');
  return context;
}

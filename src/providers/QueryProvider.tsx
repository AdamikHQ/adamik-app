import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, useEffect } from "react";
import { CHAINS_QUERY_KEY } from "~/hooks/useChains";
import { getChains } from "~/api/adamik/chains";

export const queryCache = new QueryCache();

export const queryClientGlobal = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour in ms
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60, // 1 hour
    },
  },
});

export const QueryProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  // Instead do this, which ensures each request has its own cache:
  const [queryClient] = useState(() => queryClientGlobal);

  const localStoragePersister = createSyncStoragePersister({
    storage: typeof window !== "undefined" ? window.localStorage : null,
  });

  // Prefetch chains data when the provider mounts
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: CHAINS_QUERY_KEY,
      queryFn: async () => getChains(),
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
    });
  }, [queryClient]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: localStoragePersister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export const QueryProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  // Instead do this, which ensures each request has its own cache:
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 60, // 1 hour in ms
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

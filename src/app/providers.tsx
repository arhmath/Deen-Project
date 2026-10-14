import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "../services/api";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // 401/403/404 tidak perlu di-retry
            retry: (count, err) =>
              !(err instanceof ApiError && [401, 403, 404].includes(err.status)) && count < 1,
          },
        },
      })
  );
  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ErrorBoundary>
  );
}

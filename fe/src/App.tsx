import { QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/query-client";
import { AppRouter } from "@/routes/router";

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster richColors />
    </QueryClientProvider>
  );
};

export { App };

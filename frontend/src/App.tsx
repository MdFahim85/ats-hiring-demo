import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserContextProvider } from "./contexts/UserContext";
import RouteComponent from "./RouteComponent";

export default function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <UserContextProvider>
        <BrowserRouter>
          <RouteComponent />
        </BrowserRouter>
      </UserContextProvider>
    </QueryClientProvider>
  );
}

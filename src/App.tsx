import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import ScrollToTop from "./components/ScrollToTop"
import Index from "./pages/Index"
import NotFound from "./pages/NotFound"
import ProStudio from "./pages/ProStudio"
import ClientOffers from "./pages/ClientOffers"
import BusinessProfile from "./pages/BusinessProfile"
import AdminDashboard from "./pages/AdminDashboard"
import Legal from "./pages/Legal"
import AdminShortcut from "./components/AdminShortcut"

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AdminShortcut />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pro" element={<ProStudio />} />
          <Route path="/b/:id" element={<BusinessProfile />} />
          <Route path="/offers" element={<ClientOffers />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/privacy" element={<Legal />} />
          <Route path="/terms" element={<Legal />} />
          <Route path="/legal" element={<Legal />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App

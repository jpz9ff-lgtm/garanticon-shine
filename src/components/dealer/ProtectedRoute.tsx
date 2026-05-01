import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, dealer, dealerError, loading, refreshDealer } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && !dealer && dealerError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 text-center shadow-soft">
          <h1 className="text-xl font-semibold text-foreground">No hemos podido abrir tu panel</h1>
          <p className="text-sm text-muted-foreground">{dealerError}</p>
          <button
            type="button"
            onClick={() => void refreshDealer()}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!dealer) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 text-center shadow-soft">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Abriendo tu panel profesional</h1>
          <p className="text-sm text-muted-foreground">Estamos esperando la ficha de tu empresa. Si tarda demasiado, podrás reintentar desde aquí.</p>
          <button
            type="button"
            onClick={() => void refreshDealer()}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
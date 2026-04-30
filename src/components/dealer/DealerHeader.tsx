import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/garanticon/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const DealerHeader = () => {
  const { dealer, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link to="/dealer/dashboard" className="flex items-center gap-3">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold leading-tight">{dealer?.nombre_empresa}</p>
            <p className="text-xs text-muted-foreground">{dealer?.email}</p>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
            <Link to="/dealer/dashboard">
              <LayoutDashboard className="mr-1" /> Panel
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-1" /> Salir
          </Button>
        </div>
      </div>
    </header>
  );
};
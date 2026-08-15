import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import Login from "./Login";
import Workspace from "./Workspace";

export default function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f7f4ee]"><Loader2 className="h-6 w-6 animate-spin text-[#a47d3a]" /></div>;
  return user ? <Workspace /> : <Login />;
}

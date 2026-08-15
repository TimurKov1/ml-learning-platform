import { useAuth } from "@/_core/hooks/useAuth";
import AdminWorkspace from "./AdminWorkspace";
import StudentWorkspace from "./StudentWorkspace";

export default function Workspace() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  if (isAdmin) return <AdminWorkspace />;

  return <StudentWorkspace />;
}

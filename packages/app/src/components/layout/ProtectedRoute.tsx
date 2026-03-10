import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // isAuthenticated starts false until silent refresh resolves
  // We allow a brief window; the App-level useEffect handles the redirect
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

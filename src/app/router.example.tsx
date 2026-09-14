/**
 * Example only — merge these three routes into your real
 * `src/app/router.tsx` (per 06-FRONTEND-ARCHITECTURE.md §4).
 * The other routes (/dashboard, /maps, /learning, ...) come later.
 */
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
]);

export function AppRouterExample() {
  return <RouterProvider router={router} />;
}

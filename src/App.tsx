import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { SessionProvider, useSession } from "./data/SessionContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import IntakePage from "./pages/IntakePage";
import VisitBriefingPage from "./pages/VisitBriefingPage";
import AfterVisitPage from "./pages/AfterVisitPage";
import ConsentCasePage from "./pages/ConsentCasePage";

function RequireSession({ children }: { children: React.ReactNode }) {
  const { profile } = useSession();
  if (!profile) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireSession>
                <DashboardPage />
              </RequireSession>
            }
          />
          <Route
            path="/visit/:visitId/check-in"
            element={
              <RequireSession>
                <IntakePage />
              </RequireSession>
            }
          />
          <Route
            path="/visit/:visitId/briefing"
            element={
              <RequireSession>
                <VisitBriefingPage />
              </RequireSession>
            }
          />
          <Route
            path="/visit/:visitId/after"
            element={
              <RequireSession>
                <AfterVisitPage />
              </RequireSession>
            }
          />
          <Route
            path="/visit/:visitId/consent/:caseId"
            element={
              <RequireSession>
                <ConsentCasePage />
              </RequireSession>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}

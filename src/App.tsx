import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { SessionProvider, useSession } from "./data/SessionContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import IntakePage from "./pages/IntakePage";
import SummaryPage from "./pages/SummaryPage";
import ConsentHomePage from "./pages/ConsentHomePage";
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
            path="/intake/:visitId"
            element={
              <RequireSession>
                <IntakePage />
              </RequireSession>
            }
          />
          <Route
            path="/visit/:visitId"
            element={
              <RequireSession>
                <SummaryPage />
              </RequireSession>
            }
          />
          <Route path="/consent" element={<ConsentHomePage />} />
          <Route path="/consent/:caseId" element={<ConsentCasePage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}

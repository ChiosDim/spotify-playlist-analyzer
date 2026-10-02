import { Routes, Route } from "react-router-dom";
import * as Sentry from "@sentry/react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import Duplicates from "./pages/Duplicates";
import Compare from "./pages/Compare";
import Recommendations from "./pages/Recommendations";

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={<p className="p-8">Something went wrong. Try refreshing.</p>}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyze"
            element={
              <ProtectedRoute>
                <Analyze />
              </ProtectedRoute>
            }
          />
          <Route
            path="/duplicates"
            element={
              <ProtectedRoute>
                <Duplicates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <Compare />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommend"
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<p className="p-8 text-center">Page not found</p>} />
        </Routes>
      </Layout>
    </Sentry.ErrorBoundary>
  );
}

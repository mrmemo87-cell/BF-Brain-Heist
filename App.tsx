
import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DataProvider } from './services/api';
import { Layout } from './components/chrome/Layout';
import { ToastProvider } from './components/common/ToastProvider';
import ProtectedRoute from './components/common/ProtectedRoute';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const PvePage = lazy(() => import('./pages/PvePage'));
const PvpPage = lazy(() => import('./pages/PvpPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const SafehousePage = lazy(() => import('./pages/SafehousePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));


const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <HashRouter>
          <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Navigate to="/profile" replace />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/pve" element={<PvePage />} />
                  <Route path="/pvp" element={<PvpPage />} />
                  <Route path="/jobs" element={<JobsPage />} />
                  <Route path="/safehouse" element={<SafehousePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </HashRouter>
        <ToastProvider />
      </DataProvider>
    </QueryClientProvider>
  );
};

export default App;

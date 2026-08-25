import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LiveDisplay from './pages/LiveDisplay';
import Leaderboard from './pages/Leaderboard';
import AdminLayout from './layouts/AdminLayout';
import AdminLogin from './pages/admin/Login';
import AuctionControl from './pages/admin/AuctionControl';
import HistoryLogs from './pages/admin/HistoryLogs';
import TeamManager from './pages/admin/TeamManager';
import QuestionManager from './pages/admin/QuestionManager';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/live" replace />} />
            <Route path="/live" element={<LiveDisplay />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            
            <Route path="/admin/login" element={<AdminLogin />} />
            
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/admin/auction" replace />} />
              <Route path="auction" element={<AuctionControl />} />
              <Route path="history" element={<HistoryLogs />} />
              <Route path="teams" element={<TeamManager />} />
              <Route path="questions" element={<QuestionManager />} />
            </Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

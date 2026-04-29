import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Home from './pages/Home';
import Navigation from './pages/Navigation';
import Details from './pages/Details';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import UserLayout from './components/UserLayout';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, isAdmin } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // (Baris perlindungan yang sebelumnya mencegah Admin masuk ke halaman User dihapus
  // agar Admin bisa melihat halaman Detail Rute saat mengklik peta)

  return children;
};

const AuthRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  
  if (user) {
    return <Navigate to={isAdmin ? "/admin" : "/"} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

          {/* User App Routes (Protected) */}
          <Route element={<ProtectedRoute requireAdmin={false}><UserLayout /></ProtectedRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/navigation" element={<Navigation />} />
            <Route path="/details/:id" element={<Details />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin Dashboard Route (Protected) */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <Admin />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

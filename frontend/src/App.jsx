import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Analysis from './pages/Analysis';
import Login from './pages/Login';
import Comparison from './pages/Comparison';
import LawyerDashboard from './pages/LawyerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider, useCall } from './context/CallContext';
import IncomingCallModal from './components/IncomingCallModal';
import WebRTCCallModal from './components/WebRTCCallModal';

/** PrivateRoute — waits for auth to resolve, then guards by role */
const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    const dest =
      user.role === 'admin' ? '/admin-dashboard' :
        user.role === 'lawyer' ? '/lawyer-dashboard' :
          '/dashboard';
    return <Navigate to={dest} replace />;
  }

  return children;
};

/**
 * GlobalCallOverlay
 * Renders the IncomingCallModal + accepted WebRTCCallModal at the top level
 * so they appear above any page, regardless of which route is active.
 */
function GlobalCallOverlay() {
  const { incomingCall, acceptCall, rejectCall } = useCall();
  const [activeCall, setActiveCall] = useState(null);
  // { callData, remoteSocketId }

  function handleAccept(callData) {
    acceptCall(callData);
    setActiveCall({
      appointment: {
        id: callData.appointment_id,
        lawyer_name: callData.caller_name,
        client_name: callData.caller_name,
      },
      mode: callData.mode,
      role: 'callee',
      remoteSocketId: callData.caller_socket_id,
    });
  }

  function handleReject(callData) {
    rejectCall(callData);
  }

  return (
    <>
      {incomingCall && !activeCall && (
        <IncomingCallModal
          callData={incomingCall}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
      {activeCall && (
        <WebRTCCallModal
          appointment={activeCall.appointment}
          mode={activeCall.mode}
          role={activeCall.role}
          remoteSocketId={activeCall.remoteSocketId}
          onClose={() => setActiveCall(null)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CallProvider>
          <GlobalCallOverlay />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* Client-only */}
            <Route path="/dashboard" element={<PrivateRoute requiredRole="client"><Dashboard /></PrivateRoute>} />
            <Route path="/upload" element={<PrivateRoute requiredRole="client"><Upload /></PrivateRoute>} />
            <Route path="/analysis/:id" element={<PrivateRoute requiredRole="client"><Analysis /></PrivateRoute>} />
            <Route path="/compare" element={<PrivateRoute requiredRole="client"><Comparison /></PrivateRoute>} />

            {/* Lawyer-only */}
            <Route path="/lawyer-dashboard" element={<PrivateRoute requiredRole="lawyer"><LawyerDashboard /></PrivateRoute>} />

            {/* Admin-only */}
            <Route path="/admin-dashboard" element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CallProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

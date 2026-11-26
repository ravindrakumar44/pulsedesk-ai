import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import { getHomeRouteForRole } from './utils/formatters';

import CustomerLayout from './layouts/CustomerLayout';
import AgentLayout from './layouts/AgentLayout';
import AdminLayout from './layouts/AdminLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import SubmitComplaint from './pages/customer/SubmitComplaint';
import MyComplaints from './pages/customer/MyComplaints';
import CustomerComplaintDetails from './pages/customer/ComplaintDetails';
import CustomerProfile from './pages/customer/CustomerProfile';

import AgentDashboard from './pages/agent/AgentDashboard';
import AvailableComplaints from './pages/agent/AvailableComplaints';
import AssignedComplaints from './pages/agent/AssignedComplaints';
import AgentComplaintDetails from './pages/agent/ComplaintDetails';
import AgentProfile from './pages/agent/AgentProfile';

import AdminDashboard from './pages/admin/AdminDashboard';
import AllComplaints from './pages/admin/AllComplaints';
import AdminComplaintDetails from './pages/admin/ComplaintDetails';
import Customers from './pages/admin/Customers';
import Agents from './pages/admin/Agents';
import Analytics from './pages/admin/Analytics';

function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getHomeRouteForRole(user?.role)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRole="Customer">
                  <CustomerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CustomerDashboard />} />
              <Route path="submit" element={<SubmitComplaint />} />
              <Route path="complaints" element={<MyComplaints />} />
              <Route path="complaints/:id" element={<CustomerComplaintDetails />} />
              <Route path="profile" element={<CustomerProfile />} />
            </Route>

            <Route
              path="/agent"
              element={
                <ProtectedRoute allowedRole="Agent">
                  <AgentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AgentDashboard />} />
              <Route path="available" element={<AvailableComplaints />} />
              <Route path="complaints" element={<AssignedComplaints />} />
              <Route path="complaints/:id" element={<AgentComplaintDetails />} />
              <Route path="profile" element={<AgentProfile />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="Admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="complaints" element={<AllComplaints />} />
              <Route path="complaints/:id" element={<AdminComplaintDetails />} />
              <Route path="customers" element={<Customers />} />
              <Route path="agents" element={<Agents />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

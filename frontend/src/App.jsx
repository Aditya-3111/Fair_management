import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import MasterPanel from './pages/MasterPanel'
import AdminPanel from './pages/AdminPanel'
import EmployeePanel from './pages/EmployeePanel'
import AllFieldWorksPage from './pages/AllFieldWorksPage'
import AllEmployeesPage from './pages/AllEmployeesPage'
import AllAdminsPage from './pages/AllAdminsPage'
import ActiveDutyPage from './pages/ActiveDutyPage'
import CompletedDutyPage from './pages/CompletedDutyPage'
import Layout from './components/Layout'
import AllEmployeesMasterPage from './pages/AllEmployeesMasterPage'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.jpeg" alt="Logo" className="w-16 h-16 rounded-xl object-cover shadow-lg" />
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-800 loading-dot"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-primary-800 loading-dot"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-primary-800 loading-dot"></div>
        </div>
        <p className="text-slate-500 text-sm">Loading Venus...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />
  return children
}

function DashboardRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (user.role === 'master') return <Navigate to="/master" />
  if (user.role === 'admin') return <Navigate to="/admin" />
  return <Navigate to="/employee" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* Master */}
      <Route path="/master" element={
        <ProtectedRoute roles={['master']}><Layout><MasterPanel /></Layout></ProtectedRoute>
      } />
      <Route path="/master/field-works" element={
        <ProtectedRoute roles={['master']}><Layout><AllFieldWorksPage /></Layout></ProtectedRoute>
      } />
      <Route path="/master/admins" element={
        <ProtectedRoute roles={['master']}><Layout><AllAdminsPage /></Layout></ProtectedRoute>
      } />
      <Route path="/master/active-duty" element={
        <ProtectedRoute roles={['master']}><Layout><ActiveDutyPage /></Layout></ProtectedRoute>
      } />
      <Route path="/master/completed-duty" element={
        <ProtectedRoute roles={['master']}><Layout><CompletedDutyPage /></Layout></ProtectedRoute>
      } />
      <Route path="/master/employees" element={
        <ProtectedRoute roles={['master']}><Layout><AllEmployeesMasterPage /></Layout></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin', 'master']}><Layout><AdminPanel /></Layout></ProtectedRoute>
      } />
      <Route path="/admin/employees" element={
        <ProtectedRoute roles={['admin', 'master']}><Layout><AllEmployeesPage /></Layout></ProtectedRoute>
      } />
      <Route path="/admin/field-works" element={
        <ProtectedRoute roles={['admin', 'master']}><Layout><AllFieldWorksPage /></Layout></ProtectedRoute>
      } />
      <Route path="/admin/active-duty" element={
        <ProtectedRoute roles={['admin', 'master']}><Layout><ActiveDutyPage /></Layout></ProtectedRoute>
      } />
      <Route path="/admin/completed-duty" element={
        <ProtectedRoute roles={['admin', 'master']}><Layout><CompletedDutyPage /></Layout></ProtectedRoute>
      } />

      {/* Employee */}
      <Route path="/employee" element={
        <ProtectedRoute roles={['employee']}><Layout><EmployeePanel /></Layout></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: '12px', fontSize: '14px', fontWeight: '500' },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
      }} />
      <AppRoutes />
    </AuthProvider>
  )
}
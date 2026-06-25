import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList, LogOut,
  Menu, X, Shield, ChevronRight, UserCheck, CheckCircle, UserCog
} from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = { master: 'Master Admin', admin: 'Admin', employee: 'Employee' }
  const roleColor = {
    master: 'bg-purple-500/20 text-purple-200 ring-1 ring-purple-400/30',
    admin: 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/30',
    employee: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30'
  }

  const navMap = {
    master: [
      { path: '/master', label: 'Overview', icon: LayoutDashboard },
      { path: '/master/active-duty', label: 'Active Duty', icon: UserCheck },
      { path: '/master/completed-duty', label: 'Completed Duty', icon: CheckCircle },
      { path: '/master/field-works', label: 'All Field Works', icon: ClipboardList },
      { path: '/master/admins', label: 'All Admins', icon: UserCog },
      { path: '/master/employees', label: 'All Employees', icon: Users },
    ],
    admin: [
      { path: '/admin', label: 'Overview', icon: LayoutDashboard },
      { path: '/admin/active-duty', label: 'Active Duty', icon: UserCheck },
      { path: '/admin/completed-duty', label: 'Completed Duty', icon: CheckCircle },
      { path: '/admin/field-works', label: 'All Field Works', icon: ClipboardList },
      { path: '/admin/employees', label: 'All Employees', icon: Users },
    ],
    employee: [
      { path: '/employee', label: 'My Field Work', icon: ClipboardList }
    ]
  }
  const navItems = navMap[user?.role] || []

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-72 z-40
        bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900
        transform transition-transform duration-300 ease-in-out
        flex flex-col flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
          <img src="/logo.jpeg" alt="Venus Logo" className="w-11 h-11 rounded-xl object-cover shadow-lg ring-2 ring-white/20" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight tracking-tight">Venus Security</p>
            <p className="text-blue-300/80 text-[11px] font-medium">Fair Management System</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-block mt-0.5 ${roleColor[user?.role]}`}>
                {roleLabel[user?.role]}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <p className="text-blue-300/50 text-[11px] font-bold uppercase tracking-wider px-3 mb-2">Menu</p>
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <button key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false) }}
                className={`flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group
                  ${isActive
                    ? 'bg-white text-primary-800 shadow-lg shadow-black/10'
                    : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}`}>
                <Icon size={18} className={isActive ? 'text-primary-700' : ''} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight size={15} className="text-primary-700" />}
              </button>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 flex-shrink-0 space-y-1">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-red-300 hover:bg-red-500/15 hover:text-red-200 transition-all text-sm font-semibold">
            <LogOut size={18} />
            Logout
          </button>
          <p className="text-center text-blue-300/30 text-[10px] pt-2">© 2026 Venus Security</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 -ml-1">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-800 flex items-center justify-center flex-shrink-0">
              <Shield size={14} className="text-white" />
            </div>
            <span className="text-slate-800 font-bold text-sm hidden sm:inline">Fair Management System</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-emerald-50 rounded-full px-3 py-1.5 border border-emerald-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-emerald-700 font-semibold">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
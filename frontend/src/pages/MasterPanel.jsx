import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import StatCard from '../components/StatCard'
import {
  Users, ClipboardList, IndianRupee, Activity,
  UserCheck, Plus, RefreshCw,
  CheckCircle2, XCircle, Search, Phone, Mail, Crown, CheckCircle
} from 'lucide-react'

export default function MasterPanel() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState({})
  const [fieldWorks, setFieldWorks] = useState([])
  const [users, setUsers] = useState([])
  const [onDuty, setOnDuty] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', password: '' })

  const [activeTab, setActiveTab] = useState('active') // active | completed | admins
  const [search, setSearch] = useState('')

  const fetchAll = async () => {
  setLoading(true)
  try {
    const [sumRes, fwRes, allUsersRes, dutyRes] = await Promise.all([
      api.get('/reports/summary'),
      api.get('/field-works/'),
      api.get('/users/'),
      api.get('/users/employees-on-duty')
    ])
    setSummary(sumRes.data)
    setFieldWorks(fwRes.data)
    setUsers(allUsersRes.data)
    setOnDuty(dutyRes.data)
  } catch (e) {
    toast.error('Failed to load data')
  } finally {
    setLoading(false)
  }
}

  useEffect(() => { fetchAll() }, [])

  const createUser = async (e) => {
    e.preventDefault()
    try {
      await api.post('/users/', { ...newUser, role: 'admin' })
      toast.success('Admin created successfully!')
      setShowCreateUser(false)
      setNewUser({ name: '', email: '', phone: '', password: '' })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create admin')
    }
  }

  const toggleUser = async (id, isActive) => {
    try {
      await api.put(`/users/${id}`, { is_active: !isActive })
      toast.success('User status updated')
      fetchAll()
    } catch {
      toast.error('Failed to update user')
    }
  }

  const admins = users.filter(u => u.role === 'admin')
  const employeesList = users.filter(u => u.role === 'employee')
  const completedWorks = fieldWorks.filter(fw => fw.status === 'completed')

  // Filter data based on active tab + search
  const filteredOnDuty = onDuty.filter(emp =>
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.title?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredCompleted = completedWorks.filter(fw =>
    fw.title?.toLowerCase().includes(search.toLowerCase()) ||
    fw.employee_name?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredAdmins = admins.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredEmployees = employeesList.filter(u =>
  u.name?.toLowerCase().includes(search.toLowerCase()) ||
  u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    { key: 'active', label: 'Active Duty', count: onDuty.length, viewAll: '/master/active-duty' },
    { key: 'completed', label: 'Completed Duty', count: completedWorks.length, viewAll: '/master/completed-duty' },
    { key: 'admins', label: 'All Admins', count: admins.length, viewAll: '/master/admins' },
    { key: 'employees', label: 'All Employees', count: employeesList.length, viewAll: '/master/employees' },

  ]

  if (loading) return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-[3px] border-primary-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-medium">Loading master panel...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-10">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-blue-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full -mb-20"></div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 ring-1 ring-white/20">
              <Crown size={22} className="text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Master Dashboard</h1>
              <p className="text-blue-200/80 text-sm mt-0.5">Complete control center for all operations</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button onClick={fetchAll} className="flex items-center gap-2 text-sm py-2.5 px-4 rounded-xl bg-white/10 text-white hover:bg-white/20 font-semibold transition-all backdrop-blur-sm ring-1 ring-white/15">
              <RefreshCw size={15} /> Refresh
            </button>
            <button onClick={() => setShowCreateUser(true)} className="flex items-center gap-2 text-sm py-2.5 px-4 rounded-xl bg-white text-primary-800 hover:bg-blue-50 font-semibold transition-all shadow-lg">
              <Plus size={15} /> New Admin
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={22} />} label="Total Employees" value={summary.total_employees || 0} color="blue" />
        <StatCard icon={<UserCheck size={22} />} label="On Duty" value={summary.employees_on_duty || 0} color="green" sub="Currently active" />
        <StatCard icon={<ClipboardList size={22} />} label="Active Works" value={summary.active_field_works || 0} color="orange" />
        <StatCard icon={<IndianRupee size={22} />} label="Total Expenses" value={`₹${(summary.total_expenses || 0).toLocaleString('en-IN')}`} color="purple" />
      </div>

      {/* Tab Switcher - Left to Right */}
      <div className="card space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2
                  ${activeTab === tab.key ? 'bg-primary-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <button onClick={() => navigate(tabs.find(t => t.key === activeTab).viewAll)}
            className="text-xs font-bold text-primary-800 hover:underline flex-shrink-0 self-start sm:self-auto">
            View Full Page →
          </button>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-10 py-2.5 text-sm" placeholder="Search..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* ACTIVE DUTY TAB */}
        {activeTab === 'active' && (
          filteredOnDuty.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <Activity size={40} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm font-medium">{onDuty.length === 0 ? 'No employees on duty right now' : 'No matches found'}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOnDuty.slice(0, 6).map(emp => (
                <div key={emp.field_work_id} className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {emp.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.phone}</p>
                    </div>
                    <span className="badge-active flex-shrink-0">Live</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 bg-white/80 rounded-xl px-3 py-2 truncate">{emp.title}</p>
                  <div className="flex items-center justify-between mt-2.5 px-1">
                    <p className="text-xs text-slate-500">{emp.location || 'Location N/A'}</p>
                    <p className="text-sm font-bold text-emerald-700">₹{parseFloat(emp.total_expense || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* COMPLETED DUTY TAB */}
        {activeTab === 'completed' && (
          filteredCompleted.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <CheckCircle size={40} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm font-medium">{completedWorks.length === 0 ? 'No completed field works yet' : 'No matches found'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCompleted.slice(0, 6).map(fw => (
                <div key={fw.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {fw.employee_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{fw.title}</p>
                    <p className="text-xs text-slate-500">{fw.employee_name} • {fw.location || 'N/A'}</p>
                  </div>
                  <p className="font-bold text-slate-800 text-sm flex-shrink-0">₹{parseFloat(fw.total_expense||0).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* ADMINS TAB */}
        {activeTab === 'admins' && (
          filteredAdmins.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-14">{admins.length === 0 ? 'No admins found' : 'No matches found'}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAdmins.slice(0, 6).map(u => (
                <div key={u.id} className="border border-slate-200 rounded-2xl p-4 hover:shadow-card-hover hover:border-slate-300 transition-all">
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm bg-gradient-to-br from-blue-500 to-blue-700">
                      {u.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{u.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-blue-100 text-blue-700">Admin</span>
                    </div>
                    <button onClick={() => toggleUser(u.id, u.is_active)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0
                        ${u.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                      {u.is_active ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                    </button>
                  </div>
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                      <Mail size={12} className="text-slate-400" />{u.email}
                    </div>
                    {u.phone && <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone size={12} className="text-slate-400" />{u.phone}
                    </div>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* EMPLOYEES TAB */}
{activeTab === 'employees' && (
  filteredEmployees.length === 0 ? (
    <p className="text-slate-400 text-sm text-center py-14">{employeesList.length === 0 ? 'No employees found' : 'No matches found'}</p>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredEmployees.slice(0, 6).map(emp => {
        const activeWork = fieldWorks.find(fw => fw.employee_id === emp.id && fw.status === 'active')
        return (
          <div key={emp.id} className="border border-slate-200 rounded-2xl p-4 hover:shadow-card-hover hover:border-slate-300 transition-all">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm bg-gradient-to-br from-slate-500 to-slate-700">
                {emp.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{emp.name}</p>
                <span className={activeWork ? 'badge-active' : 'inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full'}>
                  {activeWork ? '● On Duty' : '○ Available'}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                <Phone size={12} className="text-slate-400" />{emp.phone || 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                <Mail size={12} className="text-slate-400" />{emp.email}
              </div>
              {activeWork && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-700 truncate">📍 {activeWork.title}</p>
                  <p className="text-xs text-emerald-600 font-bold mt-0.5">₹{parseFloat(activeWork.total_expense||0).toLocaleString('en-IN')} spent</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
)}

      {/* Create Admin Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Create New Admin</h3>
            <p className="text-sm text-slate-400 mb-5">Admins can create employees and manage field work</p>
            <form onSubmit={createUser} className="space-y-3.5">
              <div>
                <label className="label">Full Name</label>
                <input className="input-field" placeholder="Enter full name"
                  value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" placeholder="email@example.com"
                  value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input-field" placeholder="+91 XXXXXXXXXX"
                  value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input-field" placeholder="Set password"
                  value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowCreateUser(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
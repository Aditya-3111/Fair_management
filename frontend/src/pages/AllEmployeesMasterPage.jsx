import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Users, Phone, Mail, Search } from 'lucide-react'

export default function AllEmployeesMasterPage() {
  const [employees, setEmployees] = useState([])
  const [fieldWorks, setFieldWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([api.get('/users/'), api.get('/field-works/')])
      .then(([userRes, fwRes]) => {
        setEmployees(userRes.data.filter(u => u.role === 'employee'))
        setFieldWorks(fwRes.data)
      })
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = employees.filter(emp =>
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.email?.toLowerCase().includes(search.toLowerCase()) ||
    emp.phone?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-9 h-9 border-[3px] border-primary-800 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-slate-700 flex items-center justify-center">
          <Users size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Employees</h1>
          <p className="text-slate-500 text-sm">{employees.length} total employees across all admins</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-10 py-2.5 text-sm" placeholder="Search by name, email, or phone..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(emp => {
            const activeWork = fieldWorks.find(fw => fw.employee_id === emp.id && fw.status === 'active')
            return (
              <div key={emp.id} className="border border-slate-200 rounded-2xl p-4 hover:shadow-card-hover transition-shadow">
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
          {filtered.length === 0 && <p className="text-slate-400 text-sm text-center py-10 col-span-full">{employees.length === 0 ? 'No employees found' : 'No matches found'}</p>}
        </div>
      </div>
    </div>
  )
}
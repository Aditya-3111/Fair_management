import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Activity, UserCheck, Search } from 'lucide-react'

export default function ActiveDutyPage() {
  const [onDuty, setOnDuty] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/users/employees-on-duty')
      .then(res => setOnDuty(res.data))
      .catch(() => toast.error('Failed to load active duty'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = onDuty.filter(emp =>
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.title?.toLowerCase().includes(search.toLowerCase()) ||
    emp.location?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-9 h-9 border-[3px] border-primary-800 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center">
          <UserCheck size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Active Duty</h1>
          <p className="text-slate-500 text-sm">{onDuty.length} employees currently on field</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-10 py-2.5 text-sm" placeholder="Search by name, title, or location..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-14 text-slate-400">
            <Activity size={40} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm font-medium">{onDuty.length === 0 ? 'No employees on duty right now' : 'No matches found'}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(emp => (
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
        )}
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Search, ClipboardList } from 'lucide-react'

export default function AllFieldWorksPage() {
  const [fieldWorks, setFieldWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/field-works/')
      .then(res => setFieldWorks(res.data))
      .catch(() => toast.error('Failed to load field works'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = fieldWorks.filter(fw =>
    fw.title?.toLowerCase().includes(search.toLowerCase()) ||
    fw.employee_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-9 h-9 border-[3px] border-primary-800 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary-800 flex items-center justify-center">
          <ClipboardList size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Field Works</h1>
          <p className="text-slate-500 text-sm">{fieldWorks.length} total records</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-10 py-2.5 text-sm" placeholder="Search by name or title..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-3 text-slate-500 text-[11px] font-bold uppercase tracking-wide rounded-l-xl">Employee</th>
                <th className="text-left py-3 px-3 text-slate-500 text-[11px] font-bold uppercase tracking-wide">Title</th>
                <th className="text-left py-3 px-3 text-slate-500 text-[11px] font-bold uppercase tracking-wide hidden md:table-cell">Location</th>
                <th className="text-left py-3 px-3 text-slate-500 text-[11px] font-bold uppercase tracking-wide hidden lg:table-cell">Admin</th>
                <th className="text-left py-3 px-3 text-slate-500 text-[11px] font-bold uppercase tracking-wide">Status</th>
                <th className="text-right py-3 px-3 text-slate-500 text-[11px] font-bold uppercase tracking-wide rounded-r-xl">Expense</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(fw => (
                <tr key={fw.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3">
                    <p className="font-semibold text-slate-800 text-xs">{fw.employee_name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{fw.employee_phone}</p>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 text-xs font-medium max-w-[180px] truncate">{fw.title}</td>
                  <td className="py-3.5 px-3 text-slate-500 text-xs hidden md:table-cell">{fw.location || '—'}</td>
                  <td className="py-3.5 px-3 text-slate-500 text-xs hidden lg:table-cell">{fw.admin_name}</td>
                  <td className="py-3.5 px-3">
                    <span className={fw.status === 'active' ? 'badge-active' : 'badge-completed'}>
                      {fw.status === 'active' ? '● Active' : '✓ Done'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-slate-800 text-sm">
                    ₹{parseFloat(fw.total_expense || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">No field works found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
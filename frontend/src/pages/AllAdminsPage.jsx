import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { UserCog, Mail, Phone, CheckCircle2, XCircle, Search } from 'lucide-react'

export default function AllAdminsPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = () => {
    api.get('/users/admins')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load admins'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const toggleUser = async (id, isActive) => {
    try {
      await api.put(`/users/${id}`, { is_active: !isActive })
      toast.success('Status updated')
      fetchData()
    } catch { toast.error('Failed to update') }
  }

  const admins = users.filter(u => u.role === 'admin')
  const filtered = admins.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-9 h-9 border-[3px] border-primary-800 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-blue-700 flex items-center justify-center">
          <UserCog size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Admins</h1>
          <p className="text-slate-500 text-sm">{admins.length} admin accounts</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-10 py-2.5 text-sm" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(u => (
            <div key={u.id} className="border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm bg-gradient-to-br from-blue-500 to-blue-700">
                  {u.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{u.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-blue-100 text-blue-700">Admin</span>
                </div>
                <button onClick={() => toggleUser(u.id, u.is_active)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  {u.is_active ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                </button>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                  <Mail size={12} />{u.email}
                </div>
                {u.phone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone size={12} />{u.phone}</div>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-slate-400 text-sm text-center py-10 col-span-full">{admins.length === 0 ? 'No admins found' : 'No matches found'}</p>}
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { CheckCircle, Download, Send, Search } from 'lucide-react'

export default function CompletedDutyPage() {
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = () => {
    setLoading(true)
    api.get('/field-works/')
      .then(res => setWorks(res.data.filter(w => w.status === 'completed')))
      .catch(() => toast.error('Failed to load completed duties'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const downloadReport = async (id, title) => {
    try {
      const res = await api.get(`/reports/generate/${id}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `Report_${title?.replace(/ /g, '_')}_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Report downloaded!')
    } catch { toast.error('Failed to download report') }
  }

  const sendWhatsApp = async (id) => {
    toast.loading('Sending WhatsApp report...')
    try {
      await api.post(`/reports/send-whatsapp/${id}`)
      toast.dismiss()
      toast.success('WhatsApp report sent!')
    } catch (err) {
      toast.dismiss()
      toast.error(err.response?.data?.error || 'WhatsApp send failed')
    }
  }

  const filtered = works.filter(fw =>
    fw.title?.toLowerCase().includes(search.toLowerCase()) ||
    fw.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    fw.location?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-9 h-9 border-[3px] border-primary-800 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center">
          <CheckCircle size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Completed Duty</h1>
          <p className="text-slate-500 text-sm">{works.length} field works completed</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-10 py-2.5 text-sm" placeholder="Search by name, title, or location..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="space-y-2">
          {filtered.map(fw => (
            <div key={fw.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {fw.employee_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{fw.title}</p>
                <p className="text-xs text-slate-500">{fw.employee_name} • {fw.location || 'N/A'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-slate-800 text-sm">₹{parseFloat(fw.total_expense||0).toLocaleString('en-IN')}</p>
                <div className="flex gap-2 mt-1 justify-end">
                  <button onClick={() => downloadReport(fw.id, fw.title)} className="text-slate-500 hover:text-primary-800">
                    <Download size={14} />
                  </button>
                  <button onClick={() => sendWhatsApp(fw.id)} className="text-green-600 hover:text-green-700">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-slate-400 text-sm py-10">{works.length === 0 ? 'No completed field works yet' : 'No matches found'}</p>}
        </div>
      </div>
    </div>
  )
}
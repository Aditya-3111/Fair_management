import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import StatCard from '../components/StatCard'
import {
  Users, ClipboardList, IndianRupee, Plus, CheckCircle,
  RefreshCw, Download, Send, Eye, X,
  Phone, Image as ImageIcon, UserCheck, Search, Activity
} from 'lucide-react'

export default function AdminPanel() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [fieldWorks, setFieldWorks] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreateEmp, setShowCreateEmp] = useState(false)
  const [showCreateFW, setShowCreateFW] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [detailData, setDetailData] = useState(null)

  const [newEmp, setNewEmp] = useState({ name: '', email: '', phone: '', password: '' })
  const [newFW, setNewFW] = useState({ employee_id: '', title: '', location: '', description: '' })

  const [activeTab, setActiveTab] = useState('active') // active | completed | employees
  const [search, setSearch] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [empRes, fwRes, sumRes] = await Promise.all([
        api.get('/users/'),
        api.get('/field-works/'),
        api.get('/reports/summary')
      ])
      setEmployees(empRes.data)
      setFieldWorks(fwRes.data)
      setSummary(sumRes.data)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const createEmployee = async (e) => {
    e.preventDefault()
    try {
      await api.post('/users/', { ...newEmp, role: 'employee' })
      toast.success('Employee created!')
      setShowCreateEmp(false)
      setNewEmp({ name: '', email: '', phone: '', password: '' })
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const startFieldWork = async (e) => {
    e.preventDefault()
    try {
      await api.post('/field-works/', newFW)
      toast.success('Field work started!')
      setShowCreateFW(false)
      setNewFW({ employee_id: '', title: '', location: '', description: '' })
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const completeFieldWork = async (id) => {
    if (!window.confirm('Mark this field work as completed? This will automatically send the report to your company WhatsApp number.')) return
    try {
      const res = await api.put(`/field-works/${id}/complete`)
      if (res.data.whatsapp_sent) {
        toast.success('Field work completed & WhatsApp report sent! ✅')
      } else {
        toast.success('Field work completed')
        if (res.data.whatsapp_error) toast.error(res.data.whatsapp_error)
      }
      fetchAll()
      if (showDetail === id) setShowDetail(null)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const viewDetail = async (id) => {
    setShowDetail(id)
    try {
      const res = await api.get(`/field-works/${id}`)
      setDetailData(res.data)
    } catch { toast.error('Failed to load details') }
  }

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
      fetchAll()
    } catch (err) {
      toast.dismiss()
      toast.error(err.response?.data?.error || 'WhatsApp send failed')
    }
  }

  const availableEmployees = employees.filter(e => {
    const activeWork = fieldWorks.find(fw => fw.employee_id === e.id && fw.status === 'active')
    return !activeWork
  })

  const activeWorks = fieldWorks.filter(fw => fw.status === 'active')
  const completedWorks = fieldWorks.filter(fw => fw.status === 'completed')

  const filteredActive = activeWorks.filter(fw =>
    fw.title?.toLowerCase().includes(search.toLowerCase()) ||
    fw.employee_name?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredCompleted = completedWorks.filter(fw =>
    fw.title?.toLowerCase().includes(search.toLowerCase()) ||
    fw.employee_name?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.email?.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    { key: 'active', label: 'Active Duty', count: activeWorks.length, viewAll: '/admin/active-duty' },
    { key: 'completed', label: 'Completed Duty', count: completedWorks.length, viewAll: '/admin/completed-duty' },
    { key: 'employees', label: 'All Employees', count: employees.length, viewAll: '/admin/employees' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-primary-800 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
          <p className="text-slate-500 text-sm">Manage employees and field works</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
            <RefreshCw size={15} />Refresh
          </button>
          <button onClick={() => setShowCreateEmp(true)} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
            <Users size={15} />Add Employee
          </button>
          <button onClick={() => setShowCreateFW(true)} className="btn-primary flex items-center gap-2 text-sm py-2 px-3">
            <Plus size={15} />Start Field Work
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={22} />} label="Employees" value={employees.length} color="blue" />
        <StatCard icon={<UserCheck size={22} />} label="On Duty" value={summary.employees_on_duty || 0} color="green" />
        <StatCard icon={<ClipboardList size={22} />} label="Active Works" value={summary.active_field_works || 0} color="orange" />
        <StatCard icon={<IndianRupee size={22} />} label="Total Spent" value={`₹${(summary.total_expenses || 0).toLocaleString('en-IN')}`} color="purple" />
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
          filteredActive.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <Activity size={40} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm font-medium">{activeWorks.length === 0 ? 'No active field works' : 'No matches found'}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredActive.slice(0, 6).map(fw => (
                <div key={fw.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{fw.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{fw.employee_name} • {fw.location || 'Location N/A'}</p>
                    </div>
                    <span className="font-bold text-emerald-700 text-sm flex-shrink-0">₹{parseFloat(fw.total_expense||0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => viewDetail(fw.id)} className="flex items-center gap-1 text-xs text-primary-800 bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                      <Eye size={12} />View
                    </button>
                    <button onClick={() => completeFieldWork(fw.id)} className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                      <CheckCircle size={12} />Complete
                    </button>
                    <button onClick={() => downloadReport(fw.id, fw.title)} className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg font-medium transition-colors ml-auto">
                      <Download size={12} />PDF
                    </button>
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
              <p className="text-sm font-medium">{completedWorks.length === 0 ? 'No completed works' : 'No matches found'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCompleted.slice(0, 6).map(fw => (
                <div key={fw.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {fw.employee_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{fw.title}</p>
                    <p className="text-xs text-slate-500">{fw.employee_name}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-bold text-slate-800 text-sm">₹{parseFloat(fw.total_expense||0).toLocaleString('en-IN')}</p>
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => downloadReport(fw.id, fw.title)} className="text-xs text-slate-500 hover:text-primary-800 transition-colors">
                        <Download size={13} />
                      </button>
                      <button onClick={() => sendWhatsApp(fw.id)} className="text-xs text-green-600 hover:text-green-700 transition-colors ml-1">
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* EMPLOYEES TAB */}
        {activeTab === 'employees' && (
          filteredEmployees.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-14">{employees.length === 0 ? 'No employees yet' : 'No matches found'}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.slice(0, 6).map(emp => {
                const activeWork = fieldWorks.find(fw => fw.employee_id === emp.id && fw.status === 'active')
                return (
                  <div key={emp.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-card-hover transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-800 flex items-center justify-center text-white font-bold">
                        {emp.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{emp.name}</p>
                        <span className={activeWork ? 'badge-active' : 'inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full'}>
                          {activeWork ? '● On Duty' : '○ Available'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-500">
                      <p className="flex items-center gap-1.5"><Phone size={11}/>{emp.phone || 'N/A'}</p>
                      <p className="flex items-center gap-1.5 truncate">📧 {emp.email}</p>
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
      </div>

      {/* Field Work Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Field Work Details</h3>
              <button onClick={() => { setShowDetail(null); setDetailData(null) }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            {detailData ? (
              <div className="overflow-y-auto p-5 flex-1 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-slate-500 mb-0.5">Title</p><p className="font-semibold text-slate-800">{detailData.title}</p></div>
                  <div><p className="text-xs text-slate-500 mb-0.5">Employee</p><p className="font-semibold text-slate-800">{detailData.employee_name}</p></div>
                  <div><p className="text-xs text-slate-500 mb-0.5">Location</p><p className="font-semibold text-slate-800">{detailData.location || 'N/A'}</p></div>
                  <div><p className="text-xs text-slate-500 mb-0.5">Status</p>
                    <span className={detailData.status === 'active' ? 'badge-active' : 'badge-completed'}>
                      {detailData.status === 'active' ? '● Active' : '✓ Done'}
                    </span>
                  </div>
                  <div><p className="text-xs text-slate-500 mb-0.5">Started</p><p className="font-semibold text-slate-800">{detailData.started_at?.slice(0,16)}</p></div>
                  <div><p className="text-xs text-slate-500 mb-0.5">Ended</p><p className="font-semibold text-slate-800">{detailData.completed_at?.slice(0,16) || 'In Progress'}</p></div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800">Expenses ({detailData.expenses?.length || 0})</h4>
                    <span className="text-lg font-bold text-primary-800">Total: ₹{parseFloat(detailData.total_expense||0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="space-y-2">
                    {detailData.expenses?.map((exp) => (
                      <div key={exp.id} className="border border-slate-200 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">₹{parseFloat(exp.amount).toLocaleString('en-IN')}</p>
                            <p className="text-xs text-slate-600 mt-1">{exp.remark}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{exp.added_at?.slice(0,16)}</p>
                          </div>
                          {exp.payment_screenshot_url && (
                            <a href={exp.payment_screenshot_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary-800 bg-primary-50 px-2 py-1 rounded-lg hover:bg-primary-100 flex-shrink-0">
                              <ImageIcon size={12} />Screenshot
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    {!detailData.expenses?.length && <p className="text-slate-400 text-sm text-center py-4">No expenses yet</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-primary-800 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="p-5 border-t border-slate-100 flex gap-3">
              {detailData?.status === 'active' && (
                <button onClick={() => completeFieldWork(showDetail)} className="btn-success flex items-center gap-2 text-sm flex-1">
                  <CheckCircle size={15} />Complete Work
                </button>
              )}
              <button onClick={() => downloadReport(showDetail, detailData?.title)} className="btn-secondary flex items-center gap-2 text-sm flex-1">
                <Download size={15} />Download PDF
              </button>
              {detailData?.status === 'completed' && (
                <button onClick={() => sendWhatsApp(showDetail)} className="btn-primary flex items-center gap-2 text-sm flex-1">
                  <Send size={15} />Send WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {showCreateEmp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Employee</h3>
            <form onSubmit={createEmployee} className="space-y-3">
              <div><label className="label">Full Name</label>
                <input className="input-field" placeholder="Employee name" value={newEmp.name}
                  onChange={e => setNewEmp({...newEmp, name: e.target.value})} required /></div>
              <div><label className="label">Email</label>
                <input type="email" className="input-field" placeholder="email@example.com" value={newEmp.email}
                  onChange={e => setNewEmp({...newEmp, email: e.target.value})} required /></div>
              <div><label className="label">Phone</label>
                <input className="input-field" placeholder="+91 XXXXXXXXXX" value={newEmp.phone}
                  onChange={e => setNewEmp({...newEmp, phone: e.target.value})} /></div>
              <div><label className="label">Password</label>
                <input type="password" className="input-field" placeholder="Set password" value={newEmp.password}
                  onChange={e => setNewEmp({...newEmp, password: e.target.value})} required /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateEmp(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Field Work Modal */}
      {showCreateFW && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Start Field Work</h3>
            <p className="text-xs text-slate-500 mb-4">Assign field work to an available employee</p>
            <form onSubmit={startFieldWork} className="space-y-3">
              <div><label className="label">Select Employee</label>
                <select className="input-field" value={newFW.employee_id}
                  onChange={e => setNewFW({...newFW, employee_id: e.target.value})} required>
                  <option value="">— Select Employee —</option>
                  {availableEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.phone})</option>
                  ))}
                </select>
                {availableEmployees.length === 0 && <p className="text-xs text-orange-600 mt-1">All employees are currently on duty</p>}
              </div>
              <div><label className="label">Work Title</label>
                <input className="input-field" placeholder="e.g. Security Fair at Lal Qila" value={newFW.title}
                  onChange={e => setNewFW({...newFW, title: e.target.value})} required /></div>
              <div><label className="label">Location</label>
                <input className="input-field" placeholder="City / Area / Venue" value={newFW.location}
                  onChange={e => setNewFW({...newFW, location: e.target.value})} /></div>
              <div><label className="label">Description (Optional)</label>
                <textarea className="input-field resize-none" rows={3} placeholder="Work description..."
                  value={newFW.description} onChange={e => setNewFW({...newFW, description: e.target.value})} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateFW(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Start Field Work</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
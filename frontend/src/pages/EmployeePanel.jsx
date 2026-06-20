import { useState, useEffect, useRef } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  IndianRupee, Plus, Image as ImageIcon, X, ClipboardList,
  MapPin, Clock, CheckCircle, RefreshCw, AlertCircle, Camera
} from 'lucide-react'

export default function EmployeePanel() {
  const [activeWork, setActiveWork] = useState(null)
  const [allWorks, setAllWorks] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState('current')

  const [amount, setAmount] = useState('')
  const [remark, setRemark] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const fileRef = useRef()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [activeRes, allRes] = await Promise.all([
        api.get('/field-works/active'),
        api.get('/field-works/')
      ])
      setActiveWork(activeRes.data)
      setAllWorks(allRes.data)

      if (activeRes.data?.id) {
        const expRes = await api.get(`/expenses/field-work/${activeRes.data.id}`)
        setExpenses(expRes.data)
      } else {
        setExpenses([])
      }
    } catch (e) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleScreenshot = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB')
      return
    }
    setScreenshot(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }

  const addExpense = async (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return toast.error('Enter valid amount')
    if (!remark.trim()) return toast.error('Remark is required')
    if (!activeWork?.id) return toast.error('No active field work')

    setSubmitting(true)
    const formData = new FormData()
    formData.append('amount', amount)
    formData.append('remark', remark.trim())
    formData.append('field_work_id', activeWork.id)
    if (screenshot) formData.append('screenshot', screenshot)

    try {
      await api.post('/expenses/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Expense added!')
      setAmount('')
      setRemark('')
      setScreenshot(null)
      setScreenshotPreview(null)
      setShowAddExpense(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add expense')
    } finally {
      setSubmitting(false)
    }
  }

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Loading your work...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Field Work</h1>
          <p className="text-slate-500 text-sm">Track your expenses</p>
        </div>
        <button onClick={fetchData} className="btn-secondary py-2 px-3 text-sm flex items-center gap-2">
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* No Active Work */}
      {!activeWork ? (
        <div className="card text-center py-14">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={28} className="text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">No Active Field Work</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            You don't have any active field work assigned. Please contact your admin to start a new field work.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-medium px-4 py-2 rounded-full border border-amber-200">
            <AlertCircle size={14} />Contact admin to assign field work
          </div>
        </div>
      ) : (
        <>
          {/* Active Work Card */}
          <div className="bg-gradient-to-br from-primary-800 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-blue-200 text-xs font-medium uppercase tracking-wide">Active Work</span>
                </div>
                <h2 className="text-xl font-bold leading-tight">{activeWork.title}</h2>
                {activeWork.location && (
                  <div className="flex items-center gap-1.5 mt-2 text-blue-200 text-sm">
                    <MapPin size={13} />{activeWork.location}
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1 text-blue-200 text-xs">
                  <Clock size={11} />Started: {activeWork.started_at?.slice(0,16)}
                </div>
              </div>
            </div>

            {/* Expense Summary */}
            <div className="mt-4 bg-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-xs font-medium">Total Spent</p>
                <p className="text-2xl font-bold">₹{totalSpent.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs font-medium">Entries</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
            </div>

            <button onClick={() => setShowAddExpense(true)}
              className="mt-4 w-full bg-white text-primary-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors active:scale-95 shadow-sm">
              <Plus size={18} />Add Expense
            </button>
          </div>

          {/* Expenses List */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Expense History</h3>
              <span className="text-xs text-slate-500">{expenses.length} entries</span>
            </div>
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <IndianRupee size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No expenses added yet</p>
                <p className="text-xs mt-1">Tap "Add Expense" to record your first expense</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp, i) => (
                  <div key={exp.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-800">₹{parseFloat(exp.amount).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-slate-400 flex-shrink-0">{exp.added_at?.slice(0,16)}</p>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">{exp.remark}</p>
                      {exp.payment_screenshot_url && (
                        <a href={exp.payment_screenshot_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-primary-800 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-lg font-medium transition-colors">
                          <ImageIcon size={11} />View Screenshot
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {/* Total */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary-800 text-white mt-2">
                  <span className="font-bold text-sm">Total Expenses</span>
                  <span className="font-bold text-lg">₹{totalSpent.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Past Works */}
      {allWorks.filter(w => w.status === 'completed').length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-bold text-slate-800">Past Field Works</h3>
          {allWorks.filter(w => w.status === 'completed').map(fw => (
            <div key={fw.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{fw.title}</p>
                <p className="text-xs text-slate-500">{fw.location || 'N/A'} • {fw.completed_at?.slice(0,10)}</p>
              </div>
              <p className="font-bold text-slate-800 text-sm flex-shrink-0">₹{parseFloat(fw.total_expense||0).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Add Expense</h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeWork?.title}</p>
              </div>
              <button onClick={() => { setShowAddExpense(false); setScreenshotPreview(null); setScreenshot(null) }}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={addExpense} className="p-5 space-y-4">
              {/* Amount */}
              <div>
                <label className="label">Amount (₹) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-field pl-8 text-lg font-bold"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Remark */}
              <div>
                <label className="label">Remark <span className="text-red-500">*</span></label>
                <textarea
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  placeholder="Where was this money spent? (e.g. Petrol for travel to venue)"
                  className="input-field resize-none"
                  rows={3}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">* Remark is mandatory</p>
              </div>

              {/* Screenshot */}
              <div>
                <label className="label">Payment Screenshot <span className="text-slate-400">(Optional)</span></label>
                {screenshotPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={screenshotPreview} alt="Preview" className="w-full h-40 object-cover" />
                    <button type="button" onClick={() => { setScreenshot(null); setScreenshotPreview(null); fileRef.current.value = '' }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current.click()}
                    className="w-full border-2 border-dashed border-slate-300 rounded-xl py-5 flex flex-col items-center gap-2 text-slate-400 hover:border-primary-400 hover:text-primary-600 transition-colors">
                    <Camera size={24} />
                    <span className="text-sm font-medium">Tap to add screenshot</span>
                    <span className="text-xs">JPG, PNG, WebP (max 5MB)</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
              </div>

              <button type="submit" disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</>
                ) : (
                  <><Plus size={18} />Add Expense</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

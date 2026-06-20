import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please enter email and password')
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome, ${user.name}!`)
      if (user.role === 'master') navigate('/master')
      else if (user.role === 'admin') navigate('/admin')
      else navigate('/employee')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-blue-600 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl shadow-2xl mb-4 p-1 ring-4 ring-white/20">
            <img src="/logo.jpeg" alt="Venus Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h1 className="text-3xl font-bold text-white">Venus Security</h1>
          <p className="text-blue-200 mt-1 text-sm">Fair Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Sign In</h2>
              <p className="text-xs text-slate-500">Access your dashboard</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-center text-slate-400">
              🔒 Secured by Venus Security Systems
            </p>
          </div>
        </div>

        <p className="text-center text-blue-200/60 text-xs mt-6">
          © 2024 Venus Security. All rights reserved.
        </p>
      </div>
    </div>
  )
}

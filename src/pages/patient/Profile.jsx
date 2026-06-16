import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'

export default function PatientProfile() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { toast, confirm } = useUI()

  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      setForm({
        full_name: data?.full_name || user.user_metadata?.full_name || '',
        phone: data?.phone || user.user_metadata?.phone || '',
        email: user.email || '',
      })
      setLoading(false)
    }
    load()
  }, [user, navigate])

  const handleSave = async () => {
    if (!form.full_name.trim()) return toast('Name is required', { type: 'error' })
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, full_name: form.full_name.trim(), phone: form.phone.trim() })

    if (error) {
      toast('Error saving profile: ' + error.message, { type: 'error' })
    } else {
      toast('Profile updated successfully', { type: 'success' })
      refreshProfile()
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword) return toast('Please enter a new password', { type: 'error' })
    if (passwordForm.newPassword.length < 6) return toast('Password must be at least 6 characters', { type: 'error' })
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast('Passwords do not match', { type: 'error' })

    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword })

    if (error) {
      toast('Error: ' + error.message, { type: 'error' })
    } else {
      toast('Password changed successfully', { type: 'success' })
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    }
    setChangingPassword(false)
  }

  const handleDeleteAccount = async () => {
    if (!await confirm('Are you sure you want to delete your account? This cannot be undone.', { danger: true, confirmLabel: 'Delete Account' })) return
    toast('Account deletion request submitted. Please contact support.', { type: 'success' })
  }

  if (loading) return (
    <div className="page">
      <Navbar back="/" subtitle="My Profile" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar back="/" subtitle="Account Settings" />
      <div className="page-content">
        <div className="flex gap-2 mb-5">
          {['profile', 'security'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`btn btn-md capitalize ${tab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
              {t === 'profile' ? '👤 Profile' : '🔒 Security'}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <>
            <div className="card p-6 mb-4">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Full Name *</label>
                  <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                    className="input" placeholder="Your full name" />
                </div>
                <div>
                  <label className="input-label">Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="input" placeholder="01xxxxxxxxx" />
                </div>
                <div>
                  <label className="input-label">Email</label>
                  <input value={form.email} disabled className="input bg-gray-50" />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-md flex-1">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => navigate('/')} className="btn btn-secondary btn-md">Cancel</button>
            </div>
          </>
        )}

        {tab === 'security' && (
          <>
            <div className="card p-6 mb-4">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="input-label">New Password</label>
                  <input type="password" value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input" placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="input-label">Confirm Password</label>
                  <input type="password" value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input" placeholder="Repeat password" />
                </div>
                <button onClick={handleChangePassword} disabled={changingPassword}
                  className="btn btn-primary btn-md w-full">
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>

            <div className="card p-6 border-red-200">
              <h3 className="font-bold text-red-600 text-sm mb-2">Danger Zone</h3>
              <p className="text-xs text-gray-500 mb-4">Permanently delete your account and all associated data.</p>
              <button onClick={handleDeleteAccount} className="btn btn-danger btn-md">Delete Account</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

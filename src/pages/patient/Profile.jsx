import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PublicNavbar from '../../components/layout/PublicNavbar'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'

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
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <main className="pt-20 flex items-center justify-center p-10">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4 rounded-xl" />
          <Skeleton className="h-4 w-32 mx-auto rounded-xl" />
        </div>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <main className="pt-20 px-4 max-w-2xl mx-auto pb-8">
        <div className="flex gap-2 mb-5 flex-wrap">
          {['profile', 'security'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`h-10 px-5 rounded-xl text-sm font-semibold border transition-all capitalize ${tab === t ? 'bg-primary text-white border-primary' : 'bg-surface text-txt-secondary border-border'}`}>
              {t === 'profile' ? '👤 Profile' : '🔒 Security'}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <>
            <Card className="mb-4">
              <CardContent className="p-6">
                <h3 className="font-bold text-txt-primary text-sm mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1">Full Name *</label>
                    <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1">Phone</label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1">Email</label>
                    <Input value={form.email} disabled className="bg-gray-50" />
                    <p className="text-xs text-txt-muted mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button onClick={() => navigate('/')} variant="outline">Cancel</Button>
            </div>
          </>
        )}

        {tab === 'security' && (
          <>
            <Card className="mb-4">
              <CardContent className="p-6">
                <h3 className="font-bold text-txt-primary text-sm mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1">New Password</label>
                    <Input type="password" value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Min 6 characters" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1">Confirm Password</label>
                    <Input type="password" value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Repeat password" />
                  </div>
                  <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full">
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-red-600 text-sm mb-2">Danger Zone</h3>
                <p className="text-xs text-txt-muted mb-4">Permanently delete your account and all associated data.</p>
                <Button onClick={handleDeleteAccount} variant="danger">Delete Account</Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}

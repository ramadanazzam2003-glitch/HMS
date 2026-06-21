import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useUI } from '../../hooks/useUI'
import { useLanguage } from '../../contexts/LanguageContext'
import { User, Phone, CalendarDays, Clock, CheckCircle } from 'lucide-react'

export default function AddPatient() {
  const navigate = useNavigate()
  const { toast } = useUI()
  const { isRTL } = useLanguage()

  const [form, setForm] = useState({
    patient_name: '',
    phone: '',
    age: '',
  })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.patient_name || !form.phone) {
      return toast(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', { type: 'error' })
    }
    setSaving(true)
    const { error } = await supabase.from('bookings').insert({
      patient_name: form.patient_name,
      phone: form.phone,
      age: form.age || null,
      booking_date: new Date().toISOString().slice(0, 10),
      slot_time: '00:00',
      status: 'active',
    })
    setSaving(false)
    if (error) {
      toast(error.message, { type: 'error' })
    } else {
      setDone(true)
      toast(isRTL ? 'تم إضافة المريض بنجاح' : 'Patient added successfully', { type: 'success' })
    }
  }

  if (done) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center p-10">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle size={48} className="mx-auto text-success" />
              <h2 className="text-xl font-bold text-txt-primary">
                {isRTL ? 'تم إضافة المريض بنجاح' : 'Patient Added Successfully'}
              </h2>
              <p className="text-txt-muted text-sm">
                {isRTL ? 'يمكنك الآن إنشاء حجز للمريض' : 'You can now create a booking for this patient'}
              </p>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => navigate('/dashboard/patients')} className="flex-1">
                  {isRTL ? 'عرض المرضى' : 'View Patients'}
                </Button>
                <Button onClick={() => navigate('/receptionist/walk-in', { state: { patient_name: form.patient_name, phone: form.phone, age: form.age } })} className="flex-1">
                  {isRTL ? 'إنشاء حجز' : 'Create Booking'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">
            {isRTL ? 'إضافة مريض جديد' : 'Add New Patient'}
          </h1>
          <p className="text-txt-muted text-sm mt-1">
            {isRTL ? 'أدخل معلومات المريض للتسجيل' : 'Enter patient information to register'}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-txt-muted mb-1 block flex items-center gap-1">
                  <User size={12} /> {isRTL ? 'اسم المريض *' : 'Patient Name *'}
                </label>
                <Input
                  value={form.patient_name}
                  onChange={e => setForm({ ...form, patient_name: e.target.value })}
                  placeholder={isRTL ? 'الاسم الكامل' : 'Full name'}
                />
              </div>
              <div>
                <label className="text-xs text-txt-muted mb-1 block flex items-center gap-1">
                  <Phone size={12} /> {isRTL ? 'رقم الهاتف *' : 'Phone *'}
                </label>
                <Input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div>
                <label className="text-xs text-txt-muted mb-1 block flex items-center gap-1">
                  <Clock size={12} /> {isRTL ? 'العمر' : 'Age'}
                </label>
                <Input
                  type="number"
                  value={form.age}
                  onChange={e => setForm({ ...form, age: e.target.value })}
                  placeholder={isRTL ? 'اختياري' : 'Optional'}
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'إضافة المريض' : 'Add Patient')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

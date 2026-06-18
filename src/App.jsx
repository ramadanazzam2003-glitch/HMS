import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { UIProvider } from './contexts/UIProvider'
const NotFound = lazy(() => import('./pages/NotFound'))

// Patient Pages
const Home = lazy(() => import('./pages/patient/Home'))
const BookingType = lazy(() => import('./pages/patient/BookingType'))
const DoctorSelect = lazy(() => import('./pages/patient/DoctorSelect'))
const SlotSelect = lazy(() => import('./pages/patient/SlotSelect'))
const PatientForm = lazy(() => import('./pages/patient/PatientForm'))
const Confirmation = lazy(() => import('./pages/patient/Confirmation'))
const Cancel = lazy(() => import('./pages/patient/Cancel'))
const Triage = lazy(() => import('./pages/Triage'))
const Reschedule = lazy(() => import('./pages/patient/Reschedule'))
const PatientProfile = lazy(() => import('./pages/patient/Profile'))
const PatientMedicalHistory = lazy(() => import('./pages/patient/MedicalHistory'))
const PatientPayments = lazy(() => import('./pages/patient/Payments'))

// Auth Pages
const Register = lazy(() => import('./pages/auth/Register'))
const StaffLogin = lazy(() => import('./pages/auth/StaffLogin'))
const MyBookings = lazy(() => import('./pages/auth/MyBookings'))
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))

// Staff Dashboard Pages
const Overview = lazy(() => import('./pages/dashboard/Overview'))
const Bookings = lazy(() => import('./pages/dashboard/Bookings'))
const Settings = lazy(() => import('./pages/dashboard/Settings'))
const AdminPanel = lazy(() => import('./pages/dashboard/AdminPanel'))
const MedicalRecords = lazy(() => import('./pages/dashboard/MedicalRecords'))
const Analytics = lazy(() => import('./pages/dashboard/Analytics'))
const AuditLog = lazy(() => import('./pages/dashboard/AuditLog'))
const DepartmentDashboard = lazy(() => import('./pages/dashboard/DepartmentDashboard'))
const DirectorDashboard = lazy(() => import('./pages/dashboard/DirectorDashboard'))
const DeptManagerDashboard = lazy(() => import('./pages/dashboard/DeptManagerDashboard'))
const ReceptionistDashboard = lazy(() => import('./pages/dashboard/ReceptionistDashboard'))
const Patients = lazy(() => import('./pages/dashboard/Patients'))

// Doctor Pages
const DoctorDashboard = lazy(() => import('./pages/doctor/Dashboard'))
const Consultation = lazy(() => import('./pages/doctor/Consultation'))
const PatientRecord = lazy(() => import('./pages/doctor/PatientRecord'))
const DoctorSchedule = lazy(() => import('./pages/doctor/Schedule'))
const PatientSearch = lazy(() => import('./pages/doctor/PatientSearch'))
const LabOrders = lazy(() => import('./pages/doctor/LabOrders'))
const FollowUp = lazy(() => import('./pages/doctor/FollowUp'))
const EditRecord = lazy(() => import('./pages/doctor/EditRecord'))

// Nurse Pages
const NurseTriage = lazy(() => import('./pages/nurse/Triage'))
const PatientQueue = lazy(() => import('./pages/nurse/PatientQueue'))
const MedicationTracking = lazy(() => import('./pages/nurse/MedicationTracking'))

// Receptionist Pages
const WalkInBooking = lazy(() => import('./pages/receptionist/WalkInBooking'))
const PatientDirectory = lazy(() => import('./pages/receptionist/PatientDirectory'))
const CheckInOut = lazy(() => import('./pages/receptionist/CheckInOut'))

// Billing Pages
const InvoiceList = lazy(() => import('./pages/billing/InvoiceList'))
const InvoiceDetail = lazy(() => import('./pages/billing/InvoiceDetail'))
const CreateInvoice = lazy(() => import('./pages/billing/CreateInvoice'))

// Components
import ProtectedRoute from './components/ProtectedRoute'
import PatientRoute from './components/PatientRoute'
import DoctorRoute from './components/DoctorRoute'

function AppFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <div className="spinner spinner-lg mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <UIProvider>
      <Suspense fallback={<AppFallback />}>
      <Routes>
        {/* Patient Routes */}
        <Route path="/" element={<PatientRoute><Home /></PatientRoute>} />
        <Route path="/booking-type/:departmentId" element={<PatientRoute><BookingType /></PatientRoute>} />
        <Route path="/doctor-select/:departmentId" element={<PatientRoute><DoctorSelect /></PatientRoute>} />
        <Route path="/slot-select/:doctorId" element={<PatientRoute><SlotSelect /></PatientRoute>} />
        <Route path="/patient-form" element={<PatientRoute><PatientForm /></PatientRoute>} />
        <Route path="/confirmation" element={<PatientRoute><Confirmation /></PatientRoute>} />
        <Route path="/cancel" element={<PatientRoute><Cancel /></PatientRoute>} />
        <Route path="/triage" element={<PatientRoute><Triage /></PatientRoute>} />
        <Route path="/reschedule/:bookingId" element={<PatientRoute><Reschedule /></PatientRoute>} />
        <Route path="/profile" element={<PatientRoute><PatientProfile /></PatientRoute>} />
        <Route path="/medical-history" element={<PatientRoute><PatientMedicalHistory /></PatientRoute>} />
        <Route path="/payments" element={<PatientRoute><PatientPayments /></PatientRoute>} />

        {/* Auth Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<StaffLogin />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/my-bookings" element={<PatientRoute><MyBookings /></PatientRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
        <Route path="/dashboard/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
        <Route path="/dashboard/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/dashboard/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/dashboard/medical-records" element={<ProtectedRoute><MedicalRecords /></ProtectedRoute>} />
        <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/dashboard/audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
        <Route path="/dashboard/department" element={<ProtectedRoute><DepartmentDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/billing" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
        <Route path="/dashboard/billing/new" element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
        <Route path="/dashboard/billing/:invoiceId" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />

        {/* Director Route */}
        <Route path="/director" element={<ProtectedRoute><DirectorDashboard /></ProtectedRoute>} />

        {/* Dept Manager Route */}
        <Route path="/dept-manager" element={<ProtectedRoute><DeptManagerDashboard /></ProtectedRoute>} />

        {/* Receptionist Routes */}
        <Route path="/receptionist" element={<ProtectedRoute><ReceptionistDashboard /></ProtectedRoute>} />
        <Route path="/receptionist/walk-in" element={<ProtectedRoute><WalkInBooking /></ProtectedRoute>} />
        <Route path="/receptionist/patients" element={<ProtectedRoute><PatientDirectory /></ProtectedRoute>} />
        <Route path="/receptionist/check-in-out" element={<ProtectedRoute><CheckInOut /></ProtectedRoute>} />

        {/* Doctor Routes */}
        <Route path="/doctor" element={<DoctorRoute><DoctorDashboard /></DoctorRoute>} />
        <Route path="/doctor/consultation/:bookingId" element={<DoctorRoute><Consultation /></DoctorRoute>} />
        <Route path="/doctor/patient/:patientPhone" element={<DoctorRoute><PatientRecord /></DoctorRoute>} />
        <Route path="/doctor/schedule" element={<DoctorRoute><DoctorSchedule /></DoctorRoute>} />
        <Route path="/doctor/search" element={<DoctorRoute><PatientSearch /></DoctorRoute>} />
        <Route path="/doctor/lab-orders" element={<DoctorRoute><LabOrders /></DoctorRoute>} />
        <Route path="/doctor/follow-up" element={<DoctorRoute><FollowUp /></DoctorRoute>} />
        <Route path="/doctor/edit-record/:recordId" element={<DoctorRoute><EditRecord /></DoctorRoute>} />

        {/* Nurse Routes */}
        <Route path="/nurse/triage" element={<ProtectedRoute><NurseTriage /></ProtectedRoute>} />
        <Route path="/nurse/queue" element={<ProtectedRoute><PatientQueue /></ProtectedRoute>} />
        <Route path="/nurse/medications" element={<ProtectedRoute><MedicationTracking /></ProtectedRoute>} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      </UIProvider>
    </BrowserRouter>
  )
}

export default App

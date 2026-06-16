import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { UIProvider } from './contexts/UIProvider'

// Patient Pages
import Home from './pages/patient/Home'
import BookingType from './pages/patient/BookingType'
import DoctorSelect from './pages/patient/DoctorSelect'
import SlotSelect from './pages/patient/SlotSelect'
import PatientForm from './pages/patient/PatientForm'
import Confirmation from './pages/patient/Confirmation'
import Cancel from './pages/patient/Cancel'
import Triage from './pages/Triage'
import Reschedule from './pages/patient/Reschedule'
import PatientProfile from './pages/patient/Profile'
import PatientMedicalHistory from './pages/patient/MedicalHistory'
import PatientPayments from './pages/patient/Payments'

// Auth Pages
import Register from './pages/auth/Register'
import StaffLogin from './pages/auth/StaffLogin'
import MyBookings from './pages/auth/MyBookings'
import VerifyEmail from './pages/auth/VerifyEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Staff Dashboard Pages
import Overview from './pages/dashboard/Overview'
import Bookings from './pages/dashboard/Bookings'
import Settings from './pages/dashboard/Settings'
import AdminPanel from './pages/dashboard/AdminPanel'
import MedicalRecords from './pages/dashboard/MedicalRecords'
import Analytics from './pages/dashboard/Analytics'
import AuditLog from './pages/dashboard/AuditLog'
import DepartmentDashboard from './pages/dashboard/DepartmentDashboard'
import DirectorDashboard from './pages/dashboard/DirectorDashboard'
import DeptManagerDashboard from './pages/dashboard/DeptManagerDashboard'
import ReceptionistDashboard from './pages/dashboard/ReceptionistDashboard'

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard'
import Consultation from './pages/doctor/Consultation'
import PatientRecord from './pages/doctor/PatientRecord'
import DoctorSchedule from './pages/doctor/Schedule'
import PatientSearch from './pages/doctor/PatientSearch'
import LabOrders from './pages/doctor/LabOrders'
import FollowUp from './pages/doctor/FollowUp'
import EditRecord from './pages/doctor/EditRecord'

// Nurse Pages
import NurseTriage from './pages/nurse/Triage'
import PatientQueue from './pages/nurse/PatientQueue'
import MedicationTracking from './pages/nurse/MedicationTracking'

// Receptionist Pages
import WalkInBooking from './pages/receptionist/WalkInBooking'
import PatientDirectory from './pages/receptionist/PatientDirectory'
import CheckInOut from './pages/receptionist/CheckInOut'

// Billing Pages
import InvoiceList from './pages/billing/InvoiceList'
import InvoiceDetail from './pages/billing/InvoiceDetail'
import CreateInvoice from './pages/billing/CreateInvoice'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import PatientRoute from './components/PatientRoute'
import DoctorRoute from './components/DoctorRoute'

function App() {
  return (
    <BrowserRouter>
      <UIProvider>
      <Routes>
        {/* Patient Routes */}
        <Route path="/" element={<PatientRoute><Home /></PatientRoute>} />
        <Route path="/booking-type/:departmentId" element={<PatientRoute><BookingType /></PatientRoute>} />
        <Route path="/doctor-select/:departmentId" element={<PatientRoute><DoctorSelect /></PatientRoute>} />
        <Route path="/slot-select/:doctorId" element={<PatientRoute><SlotSelect /></PatientRoute>} />
        <Route path="/patient-form" element={<PatientRoute><PatientForm /></PatientRoute>} />
        <Route path="/confirmation" element={<PatientRoute><Confirmation /></PatientRoute>} />
        <Route path="/cancel" element={<Cancel />} />
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
      </Routes>
      </UIProvider>
    </BrowserRouter>
  )
}

export default App

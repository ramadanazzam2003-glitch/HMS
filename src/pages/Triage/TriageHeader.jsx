import Navbar from '../../components/Navbar'

export default function TriageHeader() {
  return (
    <Navbar
      back={-1}
      subtitle="سلامة · Salama"
      right={<span className="text-xs text-green-500 hidden sm:inline">AI Medical Triage • مساعد الفرز الطبي</span>}
    />
  )
}

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const STEPS = ['Department', 'Type', 'Doctor', 'Slot', 'Confirm']

export default function StepIndicator({ currentStep }) {
  return (
    <div className="steps">
      {STEPS.map((step, i) => {
        const status = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div className="step">
              <motion.div
                className={`step-circle ${status}`}
                animate={status === 'done' ? { scale: [1, 1.2, 1] } : status === 'active' ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                {status === 'done' ? <Check size={14} /> : i + 1}
              </motion.div>
              <span className={`step-label ${status}`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${i < currentStep ? 'done' : 'pending'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

import { motion } from 'framer-motion'

export default function AnimatedButton({
  children,
  className = '',
  whileHover = { scale: 1.02 },
  whileTap = { scale: 0.97 },
  onClick,
  disabled,
  type = 'button',
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : whileHover}
      whileTap={disabled ? undefined : whileTap}
      transition={{ duration: 0.15, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.button>
  )
}

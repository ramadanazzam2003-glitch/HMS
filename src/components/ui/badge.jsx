import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors duration-200',
  {
    variants: {
      variant: {
        default: 'bg-surface-hover text-txt-secondary',
        primary: 'bg-primary-light text-primary',
        success: 'bg-success-light text-success',
        warning: 'bg-warning-light text-warning',
        danger: 'bg-danger-light text-danger',
        outline: 'border border-border text-txt-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Badge = forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
})
Badge.displayName = 'Badge'

export { Badge, badgeVariants }

import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20',
        primary: 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20',
        secondary: 'bg-secondary text-white hover:bg-secondary-hover shadow-lg shadow-secondary/20',
        outline: 'border-2 border-border bg-surface text-txt-primary hover:bg-surface-hover',
        ghost: 'text-txt-primary hover:bg-surface-hover',
        danger: 'bg-danger text-white hover:bg-red-600 shadow-lg shadow-red-500/20',
        success: 'bg-success text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20',
      },
      size: {
        xs: 'h-8 px-3 text-xs rounded-lg',
        sm: 'h-9 px-4 text-sm rounded-lg',
        md: 'h-10 px-5',
        lg: 'h-12 px-7 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

const Button = forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }

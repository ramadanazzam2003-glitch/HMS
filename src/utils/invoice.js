export function generateInvoiceNumber() {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${datePart}-${randomPart}`
}

export function formatCurrency(amount, currency = 'EGP') {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)

  return currency === 'EGP' ? `EGP ${formatted}` : `$${formatted}`
}

export function calculateBillTotal(items, taxRate = 0) {
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.amount) || 0) * (item.quantity || 1)
  }, 0)

  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

export const BILL_ITEMS_PRESETS = [
  { name: 'Consultation', amount: 200, quantity: 1 },
  { name: 'Lab Test', amount: 150, quantity: 1 },
  { name: 'X-Ray', amount: 300, quantity: 1 },
  { name: 'ECG', amount: 250, quantity: 1 },
  { name: 'Ultrasound', amount: 400, quantity: 1 },
  { name: 'Blood Test', amount: 100, quantity: 1 },
  { name: 'MRI', amount: 1500, quantity: 1 },
  { name: 'CT Scan', amount: 1200, quantity: 1 },
]

export function getPaymentStatusColor(status) {
  switch (status) {
    case 'paid': return 'badge-success'
    case 'partial': return 'badge-warning'
    case 'unpaid': return 'badge-danger'
    case 'refunded': return 'badge-secondary'
    default: return 'badge-secondary'
  }
}

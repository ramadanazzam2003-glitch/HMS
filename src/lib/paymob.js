const PAYMOB_API_KEY = import.meta.env.VITE_PAYMOB_API_KEY
const PAYMOB_INTEGRATION_ID = import.meta.env.VITE_PAYMOB_INTEGRATION_ID

export async function authenticatePaymob() {
  const res = await fetch('/api/paymob/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
  })

  if (!res.ok) throw new Error('Paymob authentication failed')
  const data = await res.json()
  return data.token
}

export async function createPaymobOrder({ amount, currency = 'EGP', items = [] }) {
  const token = await authenticatePaymob()

  const res = await fetch('/api/paymob/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency,
      items: items.map(item => ({
        name: item.name || 'Consultation',
        amount: Math.round((item.amount || 0) * 100),
        quantity: item.quantity || 1,
      })),
    }),
  })

  if (!res.ok) throw new Error('Order creation failed')
  const data = await res.json()
  return { token, orderId: data.id }
}

export async function createPaymobPaymentKey({ orderId, billingData = {} }) {
  const token = await authenticatePaymob()

  const res = await fetch('/api/paymob/payment_keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: billingData.amount || 0,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        apartment: billingData.apartment || 'NA',
        email: billingData.email || 'patient@medibook.com',
        floor: billingData.floor || 'NA',
        first_name: billingData.firstName || 'Patient',
        street: billingData.street || 'NA',
        building: billingData.building || 'NA',
        phone_number: billingData.phone || '+201000000000',
        country: billingData.country || 'EG',
        state: billingData.state || 'Cairo',
      },
      integration_id: parseInt(PAYMOB_INTEGRATION_ID),
    }),
  })

  if (!res.ok) throw new Error('Payment key creation failed')
  const data = await res.json()
  return data.token
}

export async function getPaymobTransaction(orderId) {
  const token = await authenticatePaymob()

  const res = await fetch(`/api/paymob/transactions/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!res.ok) return null
  return await res.json()
}

export function getPaymobCheckoutUrl(paymentToken) {
  return `https://accept.paymob.com/api/acceptance/iframes/816684?payment_token=${paymentToken}`
}

export function isPaymobPaymentSuccess(transaction) {
  return transaction && transaction.success === true
}

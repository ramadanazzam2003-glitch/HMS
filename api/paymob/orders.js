export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  const { amount, currency, items } = req.body

  const response = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      auth_token: token,
      delivery_needed: false,
      amount_cents: Math.round(amount * 100),
      currency: currency || 'EGP',
      items: items || [],
    }),
  })

  const data = await response.json()
  console.log('Paymob order response:', JSON.stringify(data))
  return res.status(response.ok ? 200 : response.status).json(data)
}
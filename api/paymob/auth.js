export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { api_key } = req.body
  
  const response = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key }),
  })
  
  const data = await response.json()
  
  if (!response.ok) return res.status(response.status).json(data)
  return res.status(200).json({ token: data.token })
}
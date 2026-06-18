export function calcEndTime(startTime) {
  if (!startTime) return ''
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + 15
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

export function formatApptDate(dateStr, timeStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const monthName = date.toLocaleDateString('en-US', { month: 'long' })
  const timeFormatted = timeStr
    ? (() => {
        const [h, m] = timeStr.split(':').map(Number)
        const period = h >= 12 ? 'PM' : 'AM'
        const h12 = h % 12 || 12
        return `${h12}:${m.toString().padStart(2, '0')} ${period}`
      })()
    : ''
  return `${dayName}, ${monthName} ${day}${timeFormatted ? ' · ' + timeFormatted : ''}`
}

export function generateBookingRef() {
  const rand = crypto.randomUUID().slice(0, 8).toUpperCase()
  return 'BK-' + rand
}

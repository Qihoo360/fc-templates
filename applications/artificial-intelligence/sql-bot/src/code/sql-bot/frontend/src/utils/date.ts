export function formatTimestamp(timestamp: number, format: string = 'YYYY-MM-DD'): string {
  if (!timestamp) {
    return '-'
  }

  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => {
    switch (match) {
      case 'YYYY':
        return String(year)
      case 'MM':
        return month
      case 'DD':
        return day
      case 'HH':
        return hours
      case 'mm':
        return minutes
      case 'ss':
        return seconds
      default:
        return match
    }
  })
}

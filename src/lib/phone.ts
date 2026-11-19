export function toInternationalPhone(input: string, dialCode: string): string {
  const trimmed = input.trim()
  if (trimmed.startsWith('+')) return `+${trimmed.replace(/\D/g, '')}`
  return `${dialCode}${trimmed.replace(/\D/g, '').replace(/^0+/, '')}`
}

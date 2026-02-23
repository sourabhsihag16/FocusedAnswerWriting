/**
 * Tracks "done for today" in browser localStorage (no login required).
 * Key: faw_completed_date — value: ISO date string (YYYY-MM-DD).
 */

const STORAGE_KEY = 'faw_completed_date'

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isDoneForToday(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(STORAGE_KEY)
  const today = getTodayDateString()
  return stored === today
}

export function setDoneForToday(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, getTodayDateString())
}

export function clearDoneForToday(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

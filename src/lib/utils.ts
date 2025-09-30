import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Spaced repetition scheduling (SM-2 inspired with response time + confidence)
export type ReviewOutcome = {
  grade: 0 | 1 | 2 | 3 | 4 | 5 // 5 best, 0 fail
  responseMs?: number
  confidence?: number // 0..1
}

export type ProgressState = {
  easeFactor: number // typical start 2.5
  repetitions: number
  intervalMinutes: number
  lastGrade?: number
  lastResponseMs?: number
  responseMsAvg?: number
  confidenceAvg?: number
}

export type ScheduleResult = ProgressState & {
  nextIntervalMinutes: number
  nextDueAtISO: string
}

export function scheduleNextReview(
  now: Date,
  progress: ProgressState | undefined,
  outcome: ReviewOutcome
): ScheduleResult {
  const state: ProgressState = {
    easeFactor: progress?.easeFactor ?? 2.5,
    repetitions: progress?.repetitions ?? 0,
    intervalMinutes: progress?.intervalMinutes ?? 0,
    lastGrade: progress?.lastGrade,
    lastResponseMs: progress?.lastResponseMs,
    responseMsAvg: progress?.responseMsAvg ?? 0,
    confidenceAvg: progress?.confidenceAvg ?? 0,
  }

  // Update rolling averages
  if (typeof outcome.responseMs === 'number') {
    state.responseMsAvg = Math.round((state.responseMsAvg || 0) * 0.7 + outcome.responseMs * 0.3)
  }
  if (typeof outcome.confidence === 'number') {
    state.confidenceAvg = (state.confidenceAvg || 0) * 0.7 + outcome.confidence * 0.3
  }

  let ef = state.easeFactor
  const q = outcome.grade

  if (q < 3) {
    // Failure: reset repetitions, shorten interval drastically
    state.repetitions = 0
    state.intervalMinutes = Math.max(1, Math.round((state.intervalMinutes || 10) * 0.25))
  } else {
    // Success: increase repetitions
    state.repetitions += 1
    if (state.repetitions === 1) {
      state.intervalMinutes = 10 // first successful recall after learn
    } else if (state.repetitions === 2) {
      state.intervalMinutes = 60 // 1 hour
    } else {
      // Subsequent intervals in minutes ~ previous * ef
      state.intervalMinutes = Math.round(state.intervalMinutes * ef)
    }
  }

  // Adjust ease factor (SM-2)
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (typeof outcome.responseMs === 'number') {
    // Penalize slow recalls slightly
    const seconds = outcome.responseMs / 1000
    ef -= Math.min(0.2, Math.max(0, (seconds - 6) * 0.02))
  }
  if (typeof outcome.confidence === 'number') {
    // Reward high confidence
    ef += Math.min(0.15, Math.max(-0.15, (outcome.confidence - 0.6) * 0.3))
  }
  ef = Math.max(1.3, Math.min(2.8, ef))
  state.easeFactor = ef

  // Ensure gradual expansion: minutes → hours → days → weeks
  const minIntervals = [10, 60, 60 * 6, 60 * 24, 60 * 24 * 7]
  if (state.repetitions <= minIntervals.length) {
    state.intervalMinutes = Math.max(state.intervalMinutes, minIntervals[state.repetitions - 1] || state.intervalMinutes)
  }

  const nextDue = new Date(now.getTime() + state.intervalMinutes * 60 * 1000)
  return {
    ...state,
    nextIntervalMinutes: state.intervalMinutes,
    nextDueAtISO: nextDue.toISOString(),
  }
}

export function pickDailyNewLimit(totalNew: number, dailyCap: number): number {
  return Math.max(0, Math.min(totalNew, dailyCap))
}

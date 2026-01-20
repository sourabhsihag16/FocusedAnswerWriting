import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { progressAPI, sessionsAPI, streakAPI } from '../services/api'
import { 
  FireIcon, 
  ClockIcon, 
  CalendarDaysIcon,
  ChartBarIcon,
  TrophyIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface ProgressStats {
  total_sessions: number
  total_time_minutes: number
  average_time_minutes: number
  current_streak: number
  longest_streak: number
  questions_this_week: number
  questions_this_month: number
}

interface CalendarDay {
  date: string
  questions_completed: number
  total_time_minutes: number
  streak_active: boolean
}

interface SessionHistory {
  id: number
  question_id: number
  started_at: string
  completed_at: string
  status: string
  time_spent_seconds: number
  session_date: string
  question_title: string
  question_category: string
}

export default function Progress() {
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [calendar, setCalendar] = useState<CalendarDay[]>([])
  const [sessions, setSessions] = useState<SessionHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, calendarData, sessionsData] = await Promise.all([
          progressAPI.getStats(),
          progressAPI.getCalendar(),
          sessionsAPI.getHistory()
        ])
        setStats(statsData)
        setCalendar(calendarData || [])
        setSessions(sessionsData || [])
      } catch (error) {
        console.error('Failed to fetch progress data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const generateCalendarGrid = () => {
    const today = new Date()
    const days: (CalendarDay | null)[] = []
    
    // Go back 90 days
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayData = calendar.find(d => d.date === dateStr)
      if (dayData) {
        days.push(dayData)
      } else {
        days.push({ date: dateStr, questions_completed: 0, total_time_minutes: 0, streak_active: false })
      }
    }
    
    return days
  }

  const getIntensityClass = (questionsCompleted: number): string => {
    if (questionsCompleted === 0) return 'bg-navy-800'
    if (questionsCompleted <= 2) return 'bg-primary-900'
    if (questionsCompleted <= 4) return 'bg-primary-700'
    return 'bg-primary-500'
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.round(seconds / 60)
    if (mins < 60) return `${mins} min`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  const calendarDays = generateCalendarGrid()

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-white mb-2">Your Progress</h1>
        <p className="text-navy-300">Track your consistency and improvement over time</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <FireIcon className="w-8 h-8 text-primary-400 mb-3" />
          <div className="font-mono text-3xl font-bold text-white mb-1">
            {stats?.current_streak || 0}
          </div>
          <p className="text-sm text-navy-400">Current Streak</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card"
        >
          <TrophyIcon className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="font-mono text-3xl font-bold text-white mb-1">
            {stats?.longest_streak || 0}
          </div>
          <p className="text-sm text-navy-400">Best Streak</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <ChartBarIcon className="w-8 h-8 text-green-400 mb-3" />
          <div className="font-mono text-3xl font-bold text-white mb-1">
            {stats?.total_sessions || 0}
          </div>
          <p className="text-sm text-navy-400">Total Sessions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
        >
          <ClockIcon className="w-8 h-8 text-blue-400 mb-3" />
          <div className="font-mono text-3xl font-bold text-white mb-1">
            {stats?.total_time_minutes || 0}
          </div>
          <p className="text-sm text-navy-400">Minutes Practiced</p>
        </motion.div>
      </div>

      {/* Activity Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-white">
            <CalendarDaysIcon className="w-6 h-6 inline mr-2" />
            Activity (Last 90 Days)
          </h2>
          <div className="flex items-center gap-2 text-xs text-navy-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-navy-800" />
              <div className="w-3 h-3 rounded-sm bg-primary-900" />
              <div className="w-3 h-3 rounded-sm bg-primary-700" />
              <div className="w-3 h-3 rounded-sm bg-primary-500" />
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(13,1fr)] gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`aspect-square rounded-sm ${getIntensityClass(day?.questions_completed || 0)} 
                         hover:ring-2 hover:ring-primary-400 transition-all cursor-pointer`}
              title={day ? `${formatDate(day.date)}: ${day.questions_completed} questions` : ''}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm text-navy-400">
          <div>
            <span className="font-medium text-white">{stats?.questions_this_week || 0}</span> questions this week
          </div>
          <div>
            <span className="font-medium text-white">{stats?.questions_this_month || 0}</span> questions this month
          </div>
          <div>
            <span className="font-medium text-white">{stats?.average_time_minutes?.toFixed(1) || 0}</span> min avg per session
          </div>
        </div>
      </motion.div>

      {/* Recent Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h2 className="font-display text-xl font-semibold text-white mb-6">
          Recent Sessions
        </h2>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-navy-400">No sessions yet. Start practicing to see your history!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 10).map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 bg-navy-800/50 rounded-xl"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  session.status === 'completed' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                }`}>
                  {session.status === 'completed' ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <ClockIcon className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{session.question_title}</p>
                  <div className="flex items-center gap-3 text-sm text-navy-400">
                    <span>{session.question_category}</span>
                    <span>•</span>
                    <span>{formatDate(session.session_date)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono text-sm text-primary-400">
                    {formatTime(session.time_spent_seconds || 0)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Motivation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card bg-gradient-to-r from-primary-500/10 to-navy-900 border-primary-500/20"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">💪</span>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Keep pushing forward!
            </h3>
            <p className="text-navy-300">
              {stats?.current_streak === 0 
                ? "Start your streak today and build the habit of consistent practice."
                : stats?.current_streak && stats.current_streak < 7
                ? "Great start! A few more days and you'll build a strong habit."
                : stats?.current_streak && stats.current_streak < 30
                ? "Amazing consistency! You're building a powerful study routine."
                : "Incredible dedication! You're on the path to success! 🏆"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

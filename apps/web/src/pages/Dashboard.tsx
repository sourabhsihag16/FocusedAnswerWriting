import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { streakAPI, progressAPI, questionsAPI } from '../services/api'
import { 
  FireIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  TrophyIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'

interface StreakData {
  current_streak: number
  longest_streak: number
  total_days_completed: number
}

interface ProgressStats {
  total_sessions: number
  total_time_minutes: number
  questions_this_week: number
  questions_this_month: number
}

interface TodayData {
  questions: Array<{ id: number; title: string; category: string }>
  completed_count: number
  total_count: number
  today_completed: boolean
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [today, setToday] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streakData, statsData, todayData] = await Promise.all([
          streakAPI.getStreak(),
          progressAPI.getStats(),
          questionsAPI.getTodayQuestions()
        ])
        setStreak(streakData)
        setStats(statsData)
        setToday(todayData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getMotivationalMessage = () => {
    if (!streak) return "Let's start your journey!"
    if (streak.current_streak === 0) return "Start your streak today! 🚀"
    if (streak.current_streak < 7) return "Great start! Keep building momentum! 💪"
    if (streak.current_streak < 30) return "You're on fire! Don't break the chain! 🔥"
    return "Incredible consistency! You're unstoppable! 🏆"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-navy-300 mt-1">{getMotivationalMessage()}</p>
        </div>

        {today && !today.today_completed && (
          <Link to="/practice" className="btn-primary flex items-center gap-2">
            Start Today's Practice
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <FireIcon className="w-8 h-8 text-primary-400 mb-3" />
          <div className="font-mono text-4xl font-bold text-white mb-1">
            {streak?.current_streak || 0}
          </div>
          <p className="text-sm text-navy-400">Day Streak</p>
          {streak && streak.current_streak > 0 && (
            <span className="fire-emoji absolute top-4 right-4 text-2xl">🔥</span>
          )}
        </motion.div>

        {/* Longest Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card"
        >
          <TrophyIcon className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="font-mono text-4xl font-bold text-white mb-1">
            {streak?.longest_streak || 0}
          </div>
          <p className="text-sm text-navy-400">Best Streak</p>
        </motion.div>

        {/* Total Days */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <CalendarDaysIcon className="w-8 h-8 text-green-400 mb-3" />
          <div className="font-mono text-4xl font-bold text-white mb-1">
            {streak?.total_days_completed || 0}
          </div>
          <p className="text-sm text-navy-400">Total Days</p>
        </motion.div>

        {/* Total Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
        >
          <ClockIcon className="w-8 h-8 text-blue-400 mb-3" />
          <div className="font-mono text-4xl font-bold text-white mb-1">
            {stats?.total_time_minutes || 0}
          </div>
          <p className="text-sm text-navy-400">Minutes Practiced</p>
        </motion.div>
      </div>

      {/* Today's Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-white">Today's Progress</h2>
          {today && (
            <span className="text-sm text-navy-400">
              {today.completed_count} of {today.total_count} completed
            </span>
          )}
        </div>

        {today?.today_completed ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="font-display text-xl font-semibold text-white mb-2">
              All done for today!
            </h3>
            <p className="text-navy-400">
              Great job! Come back tomorrow to continue your streak.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {today?.questions?.slice(0, 3).map((question, index) => (
              <div
                key={question.id}
                className="flex items-center gap-4 p-4 bg-navy-800/50 rounded-xl border border-navy-700"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < (today?.completed_count || 0)
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-navy-700 text-navy-400'
                }`}>
                  {index < (today?.completed_count || 0) ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <span className="font-mono text-sm">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{question.title}</p>
                  <p className="text-sm text-navy-400">{question.category}</p>
                </div>
              </div>
            ))}

            {today && today.total_count > 3 && (
              <p className="text-center text-sm text-navy-400">
                +{today.total_count - 3} more questions
              </p>
            )}

            <Link
              to="/practice"
              className="block w-full mt-4 py-3 text-center bg-primary-500/10 border border-primary-500/30 text-primary-400 rounded-xl hover:bg-primary-500/20 transition-colors"
            >
              Continue Practice →
            </Link>
          </div>
        )}
      </motion.div>

      {/* Weekly Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card"
        >
          <h3 className="font-display text-lg font-semibold text-white mb-4">This Week</h3>
          <div className="flex items-end justify-between">
            <div>
              <div className="font-mono text-3xl font-bold text-white">
                {stats?.questions_this_week || 0}
              </div>
              <p className="text-sm text-navy-400">Questions completed</p>
            </div>
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-12 rounded-full ${
                    i < (stats?.questions_this_week || 0) 
                      ? 'bg-primary-500' 
                      : 'bg-navy-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="font-display text-lg font-semibold text-white mb-4">This Month</h3>
          <div className="flex items-end justify-between">
            <div>
              <div className="font-mono text-3xl font-bold text-white">
                {stats?.questions_this_month || 0}
              </div>
              <p className="text-sm text-navy-400">Questions completed</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-primary-400">
                {stats?.total_sessions || 0}
              </div>
              <p className="text-sm text-navy-400">Total sessions</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

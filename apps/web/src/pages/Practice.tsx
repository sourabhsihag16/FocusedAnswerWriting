import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { questionsAPI } from '../services/api'
import { useSessionStore } from '../store/sessionStore'
import { isDoneForToday } from '../lib/doneForToday'
import { 
  PlayIcon, 
  ClockIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface Question {
  id: number
  title: string
  content: string
  category: string
  difficulty: string
  subject?: string
  marks: number
  word_limit: number
}

interface TodayData {
  date: string
  questions: Question[]
  completed_count: number
  total_count: number
  today_completed: boolean
  current_streak: number
}

export default function Practice() {
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const navigate = useNavigate()
  const { setQuestions, setConfig } = useSessionStore()

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const todayData = await questionsAPI.getTodayQuestions()
        setData(todayData)
      } catch (error) {
        console.error('Failed to fetch questions:', error)
        toast.error('Failed to load questions')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const handleStartSession = async () => {
    if (!data?.questions?.length) return
    
    setStarting(true)
    try {
      // Get first question details with config
      const questionData = await questionsAPI.getQuestion(data.questions[0].id)
      
      // Set session config from backend
      if (questionData.session_config) {
        setConfig(questionData.session_config)
      }
      
      // Set all questions for the session
      setQuestions(data.questions)
      
      // Navigate to session page
      navigate('/session')
    } catch (error) {
      console.error('Failed to start session:', error)
      toast.error('Failed to start session')
    } finally {
      setStarting(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-500/10'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10'
      case 'hard': return 'text-red-400 bg-red-500/10'
      default: return 'text-navy-400 bg-navy-500/10'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  // "Done for today" is tracked in browser localStorage (no login)
  if (isDoneForToday()) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="font-display text-3xl font-bold text-white mb-4">
            You&apos;re done for the day!
          </h1>
          <p className="text-navy-300 mb-8">
            Come back tomorrow for your next practice session.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Start answer writing for today
        </h1>
        <p className="text-navy-300">
          {data?.total_count ?? 2} questions to practice today
        </p>
      </motion.div>

      {/* Session Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
          {[
            { icon: '📖', label: 'Read', time: '20 sec' },
            { icon: '🤔', label: 'Think', time: '30 sec' },
            { icon: '✍️', label: 'Write', time: '5 min' },
            { icon: '⏰', label: 'Warning', time: '30 sec' },
          ].map((phase, index) => (
            <div key={phase.label} className="flex items-center gap-4">
              <div className="text-center">
                <span className="text-2xl block mb-1">{phase.icon}</span>
                <div className="font-mono text-sm text-primary-400">{phase.time}</div>
                <p className="text-xs text-navy-400">{phase.label}</p>
              </div>
              {index < 3 && (
                <ArrowRightIcon className="w-4 h-4 text-navy-600" />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleStartSession}
          disabled={starting || !data?.questions?.length}
          className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {starting ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <PlayIcon className="w-6 h-6" />
              Start Practice Session
            </>
          )}
        </button>

        <p className="text-center text-sm text-navy-400 mt-4">
          ⚡ Session will start immediately. Make sure you have pen and paper ready.
        </p>
      </motion.div>

      {/* Questions Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display text-xl font-semibold text-white mb-4">
          Today's Questions
        </h2>
        
        <div className="space-y-4">
          {data?.questions?.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="card hover:border-primary-500/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  index < (data?.completed_count || 0)
                    ? 'bg-green-500/20'
                    : 'bg-navy-700'
                }`}>
                  {index < (data?.completed_count || 0) ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <span className="font-mono text-white">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-navy-700 text-navy-200 rounded-md">
                      {question.category}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-primary-500/10 text-primary-400 rounded-md">
                      {question.marks} marks
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-white mb-2">{question.title}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-navy-400">
                    <span className="flex items-center gap-1">
                      <BookOpenIcon className="w-4 h-4" />
                      {question.word_limit} words
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      ~6 min
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card bg-primary-500/5 border-primary-500/20"
      >
        <h3 className="font-display text-lg font-semibold text-white mb-3">
          💡 Tips for Better Practice
        </h3>
        <ul className="space-y-2 text-sm text-navy-300">
          <li>• Keep your phone on silent and avoid distractions</li>
          <li>• Use the thinking time to structure your answer mentally</li>
          <li>• Write on actual paper to simulate exam conditions</li>
          <li>• Focus on quality over quantity - clear, concise points win</li>
          <li>• Review your answers after the session for self-improvement</li>
        </ul>
      </motion.div>
    </div>
  )
}

import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useSessionStore, SessionPhase } from '../store/sessionStore'
import { setDoneForToday } from '../lib/doneForToday'
import { 
  BookOpenIcon,
  LightBulbIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// Audio context for beeps
const createBeep = (frequency: number, duration: number) => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
  } catch (e) {
    console.warn('Audio not supported:', e)
  }
}

const playPhaseChangeBeep = () => createBeep(800, 0.2)
const playWarningBeep = () => createBeep(600, 0.3)
const playCompletionBeep = () => {
  createBeep(523, 0.15) // C
  setTimeout(() => createBeep(659, 0.15), 150) // E
  setTimeout(() => createBeep(784, 0.3), 300) // G
}

export default function Session() {
  const navigate = useNavigate()
  const {
    currentQuestion,
    currentQuestionIndex,
    questions,
    phase,
    timeRemaining,
    totalSessionTime,
    config,
    completedQuestions,
    setPhase,
    setTimeRemaining,
    incrementTotalTime,
    completeQuestion,
    nextQuestion,
    resetSession,
    startSession
  } = useSessionStore()
  
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showTabWarning, setShowTabWarning] = useState(false)
  const [showFocusRedirectModal, setShowFocusRedirectModal] = useState(false)
  const tabSwitchCountRef = useRef(0)
  const intervalRef = useRef<number | null>(null)
  const warningPlayedRef = useRef(false)

  // Initialize session on mount (no backend call when no login)
  useEffect(() => {
    if (questions.length === 0) {
      navigate('/practice')
      return
    }
    startSession(0, questions[0])
  }, [])

  // Fullscreen when session is active; Escape key exits fullscreen only (stays on session)
  useEffect(() => {
    if (phase === 'idle' || phase === 'completed') return
    const el = document.documentElement
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {})
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {})
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {})
      }
    }
  }, [phase])

  // Tab switch detection: warn first; after 3 switches show "stay focused" message and redirect
  useEffect(() => {
    if (phase === 'idle' || phase === 'completed') return

    const onVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCountRef.current += 1
        if (tabSwitchCountRef.current >= 3) {
          setShowFocusRedirectModal(true)
          return
        }
        setShowTabWarning(true)
      } else {
        setShowTabWarning(false)
      }
    }
    const onWindowBlur = () => {
      setShowTabWarning(true)
    }
    const onWindowFocus = () => {
      setShowTabWarning(false)
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onWindowBlur)
    window.addEventListener('focus', onWindowFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onWindowBlur)
      window.removeEventListener('focus', onWindowFocus)
    }
  }, [phase])

  // After 3 tab switches: redirect to practice after showing message
  useEffect(() => {
    if (!showFocusRedirectModal) return
    const t = setTimeout(() => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
      resetSession()
      navigate('/practice')
    }, 2500)
    return () => clearTimeout(t)
  }, [showFocusRedirectModal, resetSession, navigate])

  // Timer logic
  useEffect(() => {
    if (phase === 'idle' || phase === 'completed') return

    intervalRef.current = window.setInterval(() => {
      setTimeRemaining(timeRemaining - 1)
      incrementTotalTime()
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [phase, timeRemaining, setTimeRemaining, incrementTotalTime])

  // Phase transition logic
  useEffect(() => {
    if (timeRemaining <= 0 && phase !== 'idle' && phase !== 'completed') {
      handlePhaseComplete()
    }

    // Warning beep in writing phase
    if (phase === 'writing' && timeRemaining === 30 && !warningPlayedRef.current) {
      warningPlayedRef.current = true
      playWarningBeep()
      toast('⏰ 30 seconds remaining!', { icon: '⚠️' })
    }

    // Reset warning flag when not in writing phase
    if (phase !== 'writing') {
      warningPlayedRef.current = false
    }
  }, [timeRemaining, phase])

  const handlePhaseComplete = useCallback(async () => {
    switch (phase) {
      case 'reading':
        playPhaseChangeBeep()
        setPhase('thinking')
        break
      case 'thinking':
        playPhaseChangeBeep()
        setPhase('writing')
        break
      case 'writing':
        playCompletionBeep()
        if (currentQuestion) {
          completeQuestion(currentQuestion.id)
        }
        if (currentQuestionIndex < questions.length - 1) {
          nextQuestion()
        } else {
          setPhase('completed')
          setDoneForToday()
        }
        break
    }
  }, [phase, currentQuestion, totalSessionTime, currentQuestionIndex, questions, setPhase, completeQuestion, nextQuestion])

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
    resetSession()
    navigate('/practice')
  }

  const getPhaseInfo = (): { icon: React.ComponentType<{ className?: string }>, label: string, color: string, bgColor: string } => {
    switch (phase) {
      case 'reading':
        return { icon: BookOpenIcon, label: 'Reading', color: 'text-blue-400', bgColor: 'bg-blue-500/20' }
      case 'thinking':
        return { icon: LightBulbIcon, label: 'Thinking', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' }
      case 'writing':
        return { icon: PencilIcon, label: 'Writing', color: 'text-green-400', bgColor: 'bg-green-500/20' }
      case 'warning':
        return { icon: ExclamationTriangleIcon, label: 'Hurry Up!', color: 'text-red-400', bgColor: 'bg-red-500/20' }
      case 'completed':
        return { icon: CheckCircleIcon, label: 'Completed', color: 'text-primary-400', bgColor: 'bg-primary-500/20' }
      default:
        return { icon: BookOpenIcon, label: 'Ready', color: 'text-navy-400', bgColor: 'bg-navy-500/20' }
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = (): number => {
    let total = 0
    switch (phase) {
      case 'reading': total = config.read_time_seconds; break
      case 'thinking': total = config.think_time_seconds; break
      case 'writing': total = config.write_time_seconds; break
      default: return 0
    }
    return ((total - timeRemaining) / total) * 100
  }

  const phaseInfo = getPhaseInfo()

  // Completed state
  if (phase === 'completed') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center max-w-md"
        >
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="font-display text-3xl font-bold text-white mb-4">
            Session Complete!
          </h1>
          <p className="text-navy-300 mb-6">
            You've completed all {questions.length} questions. 
            Your streak has been updated!
          </p>
          
          <div className="card inline-block mb-8">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-white">
                  {completedQuestions.length}
                </div>
                <p className="text-xs text-navy-400">Questions</p>
              </div>
              <div className="w-px h-10 bg-navy-700" />
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-white">
                  {Math.round(totalSessionTime / 60)}
                </div>
                <p className="text-xs text-navy-400">Minutes</p>
              </div>
            </div>
          </div>

          <button onClick={handleExit} className="btn-primary">
            Back to Practice
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Tab switch 3x: motivating message then redirect to practice */}
      <AnimatePresence>
        {showFocusRedirectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card max-w-md mx-4 text-center border-2 border-primary-500/50"
            >
              <p className="text-primary-400 font-display text-xl font-semibold mb-2">
                🌟 You need to be more focused
              </p>
              <p className="text-navy-200 mb-2">
                Great things happen when you give full attention. Take a breath and come back when you&apos;re ready to focus.
              </p>
              <p className="text-navy-400 text-sm">
                Redirecting you to the main page…
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab/window blur warning: stay focused (before 3 switches) */}
      <AnimatePresence>
        {showTabWarning && !showFocusRedirectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card max-w-md mx-4 text-center border-2 border-amber-500/50"
            >
              <p className="text-amber-400 font-display text-xl font-semibold mb-2">
                ⚠️ Stay focused
              </p>
              <p className="text-navy-200">
                Don&apos;t switch tabs or leave the window till the time is running.
              </p>
              <p className="text-navy-400 text-sm mt-4">
                Return to this tab to continue. (Switching away too many times will end the session.)
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit confirmation modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-sm mx-4"
            >
              <h3 className="font-display text-xl font-semibold text-white mb-2">
                Exit Session?
              </h3>
              <p className="text-navy-300 mb-6">
                Your progress won't be saved. Are you sure you want to exit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Continue
                </button>
                <button
                  onClick={handleExit}
                  className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <span className="text-sm text-navy-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < currentQuestionIndex ? 'bg-green-500' :
                  i === currentQuestionIndex ? 'bg-primary-500' : 'bg-navy-700'
                }`}
              />
            ))}
          </div>
        </div>
        
        <button
          onClick={() => setShowExitConfirm(true)}
          className="p-2 text-navy-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Main Timer Section */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Phase Indicator */}
        <motion.div
          key={phase}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`phase-indicator ${phaseInfo.bgColor} ${phaseInfo.color} mb-8`}
        >
          <phaseInfo.icon className="w-5 h-5 mr-2" />
          {phaseInfo.label} Phase
        </motion.div>

        {/* Circular clock */}
        <div className="relative inline-flex items-center justify-center mt-4 mb-8">
          <svg className="w-48 h-48 md:w-56 md:h-56 -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle
              className="text-navy-800"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
            />
            <motion.circle
              className={
                phase === 'reading' ? 'text-blue-500' :
                phase === 'thinking' ? 'text-yellow-500' :
                phase === 'writing' ? 'text-green-500' : 'text-primary-500'
              }
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
              strokeDasharray={264}
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 - (getProgressPercentage() / 100) * 264 }}
              transition={{ duration: 0.3 }}
            />
          </svg>
          <motion.div
            key={`${phase}-${timeRemaining}`}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className={`absolute inset-0 flex items-center justify-center font-mono text-3xl md:text-4xl font-bold ${phaseInfo.color} ${
              timeRemaining <= 10 ? 'countdown-active' : ''
            }`}
          >
            {formatTime(timeRemaining)}
          </motion.div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion?.id}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card max-w-2xl w-full"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 text-sm font-medium bg-navy-700 text-navy-200 rounded-lg">
              {currentQuestion?.category}
            </span>
            <span className="px-3 py-1 text-sm font-medium bg-primary-500/10 text-primary-400 rounded-lg">
              {currentQuestion?.marks} marks • {currentQuestion?.word_limit} words
            </span>
          </div>
          
          <h2 className="font-display text-xl font-semibold text-white mb-4">
            {currentQuestion?.title}
          </h2>
          
          <p className="text-navy-200 leading-relaxed">
            {currentQuestion?.content}
          </p>
        </motion.div>

        {/* Phase Instructions */}
        <motion.p
          key={`instruction-${phase}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-center text-navy-400"
        >
          {phase === 'reading' && '📖 Read and understand the question carefully'}
          {phase === 'thinking' && '🤔 Plan your answer structure in your mind'}
          {phase === 'writing' && '✍️ Write your answer on paper now!'}
        </motion.p>
      </div>

      {/* Bottom Info */}
      <div className="text-center py-4 border-t border-navy-800 mt-8">
        <p className="text-sm text-navy-500">
          Total time: {formatTime(totalSessionTime)} • Stay focused!
        </p>
      </div>
    </div>
  )
}

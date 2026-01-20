import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FireIcon, 
  ClockIcon, 
  BoltIcon,
  DevicePhoneMobileIcon,
  AcademicCapIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-950 bg-hero-pattern">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute top-40 -left-40 w-80 h-80 bg-navy-500/20 rounded-full blur-3xl" />
        </div>

        <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
              <span className="font-display font-bold text-xl text-white">FocusedAnswer</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-navy-200 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-sm font-medium mb-6">
                <FireIcon className="w-4 h-4" />
                Build your streak, ace your exam
              </span>
            </motion.div>

            <motion.h1 
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Master UPSC
              <span className="text-gradient"> Answer Writing</span>
              <br />with Focus & Consistency
            </motion.h1>

            <motion.p 
              className="text-xl text-navy-300 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              A distraction-free environment with structured timer sessions to help you practice 
              answer writing daily. Build streaks, stay consistent, and succeed.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Start Free Today
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                Already have an account?
              </Link>
            </motion.div>
          </div>

          {/* Timer Preview */}
          <motion.div 
            className="mt-20 max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="card glow-primary">
              <div className="text-center">
                <span className="phase-indicator bg-green-500/20 text-green-400 mb-4">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  Reading Phase
                </span>
                <div className="timer-display text-white my-6">00:20</div>
                <p className="text-navy-300">Read and understand the question</p>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-navy-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Why FocusedAnswer?
            </h2>
            <p className="text-navy-300 max-w-2xl mx-auto">
              Designed specifically for UPSC aspirants who want to build consistency in answer writing practice.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ClockIcon,
                title: 'Structured Timer Sessions',
                description: '20s to read, 30s to think, 5min to write. Mimics real exam pressure and builds time management skills.',
                color: 'from-blue-400 to-blue-600'
              },
              {
                icon: FireIcon,
                title: 'Streak System',
                description: 'Track your daily practice with streaks. Visual motivation to maintain consistency and never break the chain.',
                color: 'from-primary-400 to-primary-600'
              },
              {
                icon: BoltIcon,
                title: 'Focus Mode',
                description: 'Mobile app blocks notifications during sessions. Zero distractions, maximum focus on your answers.',
                color: 'from-yellow-400 to-yellow-600'
              },
              {
                icon: DevicePhoneMobileIcon,
                title: 'Cross-Platform',
                description: 'Practice anywhere - web, iOS, or Android. Your progress syncs seamlessly across all devices.',
                color: 'from-purple-400 to-purple-600'
              },
              {
                icon: AcademicCapIcon,
                title: 'Curated Questions',
                description: 'Practice with previous year UPSC questions and curated topics across all GS papers.',
                color: 'from-green-400 to-green-600'
              },
              {
                icon: CheckCircleIcon,
                title: 'Progress Tracking',
                description: 'Detailed analytics and calendar view to track your improvement over time.',
                color: 'from-pink-400 to-pink-600'
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card hover:border-primary-500/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-navy-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-navy-300 max-w-2xl mx-auto">
              Each session follows a structured flow designed to maximize your learning.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { time: '20 sec', label: 'Read', emoji: '📖', description: 'Read and understand the question' },
              { time: '30 sec', label: 'Think', emoji: '🤔', description: 'Plan your answer structure' },
              { time: '5 min', label: 'Write', emoji: '✍️', description: 'Write your answer on paper' },
              { time: '30 sec', label: 'Warning', emoji: '⏰', description: 'Beep alerts time ending' },
            ].map((step, index) => (
              <motion.div
                key={step.label}
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="card text-center">
                  <div className="text-4xl mb-3">{step.emoji}</div>
                  <div className="font-mono text-2xl font-bold text-primary-400 mb-2">
                    {step.time}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-1">
                    {step.label}
                  </h3>
                  <p className="text-sm text-navy-400">{step.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-primary-500/30" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-navy-900/50 to-navy-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="fire-emoji text-5xl mb-6 block">🔥</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Build Your Streak?
            </h2>
            <p className="text-xl text-navy-300 mb-8">
              Join thousands of UPSC aspirants who are mastering answer writing with consistency.
            </p>
            <Link to="/register" className="btn-primary text-lg px-10 py-4">
              Start Your Journey Today
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              <span className="font-display font-bold text-white">FocusedAnswer</span>
            </div>
            <p className="text-sm text-navy-400">
              Made with ❤️ for UPSC aspirants. Stay focused, stay consistent! 🇮🇳
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

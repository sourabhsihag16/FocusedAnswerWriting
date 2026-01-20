import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { 
  HomeIcon, 
  BookOpenIcon, 
  ChartBarIcon, 
  ArrowRightOnRectangleIcon,
  FireIcon 
} from '@heroicons/react/24/outline'
import { streakAPI } from '../services/api'
import { useEffect, useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const data = await streakAPI.getStreak()
        setStreak(data.current_streak)
      } catch {
        // Ignore error
      }
    }
    fetchStreak()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItems = [
    { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/practice', icon: BookOpenIcon, label: 'Practice' },
    { to: '/progress', icon: ChartBarIcon, label: 'Progress' },
  ]

  return (
    <div className="min-h-screen bg-navy-950 bg-hero-pattern">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-950/80 backdrop-blur-lg border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
              <span className="font-display font-bold text-lg text-white hidden sm:block">
                FocusedAnswer
              </span>
            </NavLink>

            {/* Nav Links */}
            <div className="flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-navy-300 hover:text-white hover:bg-navy-800'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* User section */}
            <div className="flex items-center gap-4">
              {/* Streak Badge */}
              {streak > 0 && (
                <motion.div 
                  className="streak-badge"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <span className="fire-emoji">🔥</span>
                  <span className="font-bold text-primary-400">{streak}</span>
                </motion.div>
              )}
              
              {/* User info */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-navy-200">{user?.name}</span>
              </div>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-navy-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Outlet />
      </main>

      {/* Footer streak reminder */}
      {streak === 0 && (
        <motion.div 
          className="fixed bottom-4 right-4 bg-navy-900 border border-primary-500/30 rounded-xl p-4 shadow-xl max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-start gap-3">
            <FireIcon className="w-6 h-6 text-primary-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Start your streak today!</p>
              <p className="text-xs text-navy-300 mt-1">
                Complete today's questions to begin building your consistency.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

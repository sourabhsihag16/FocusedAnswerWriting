import { Outlet, NavLink } from 'react-router-dom'
import { BookOpenIcon } from '@heroicons/react/24/outline'

export default function Layout() {
  return (
    <div className="min-h-screen bg-navy-950 bg-hero-pattern">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-950/80 backdrop-blur-lg border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/practice" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
              <span className="font-display font-bold text-lg text-white hidden sm:block">
                FocusedAnswer
              </span>
            </NavLink>

            <div className="flex items-center gap-2">
              <NavLink
                to="/practice"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-primary-500/20 text-primary-400' : 'text-navy-300 hover:text-white hover:bg-navy-800'
                  }`
                }
              >
                <BookOpenIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Today&apos;s Practice</span>
              </NavLink>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}

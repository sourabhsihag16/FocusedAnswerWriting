import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Practice from './pages/Practice'
import Session from './pages/Session'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/" element={<Layout />}>
        <Route path="practice" element={<Practice />} />
        <Route path="session" element={<Session />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

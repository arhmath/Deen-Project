import { Routes, Route } from 'react-router-dom'
import { SmoothScroll } from "./components/ui/SmoothScroll"
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <SmoothScroll>
            <LandingPage />
          </SmoothScroll>
        } 
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  )
}

export default App
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { applyTheme, getStoredTheme, watchSystemTheme } from './lib/theme'
import AuthScreen from './AuthScreen'
import MainApp from './MainApp'
import ConcertDetail from './ConcertDetail'
import ArtistDetail from './ArtistDetail'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(getStoredTheme())

  useEffect(() => {
    applyTheme(theme)
    const unwatch = watchSystemTheme(() => {
      if (theme === 'system') applyTheme('system')
    })
    return unwatch
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="text-pink-500 text-sm tracking-widest animate-pulse">
          LOADING...
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<MainApp session={session} theme={theme} onThemeChange={setTheme} />}
        />
        <Route
          path="/concerts/:id"
          element={<ConcertDetail session={session} />}
        />
        <Route
          path="/artists/:id"
          element={<ArtistDetail session={session} />}
        />
        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <AuthScreen />}
        />
      </Routes>
    </BrowserRouter>
  )
}
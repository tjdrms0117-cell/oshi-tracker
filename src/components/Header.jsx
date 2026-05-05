import { LogOut, Shield, User as UserIcon, Sun, Moon, Monitor } from 'lucide-react'
import { signOut } from '../lib/auth'
import { setStoredTheme } from '../lib/theme'

export default function Header({ profile, session, mode, onModeChange, theme, onThemeChange }) {
  const isAdmin = profile?.is_admin === true
  const isLoggedIn = !!session

  const handleLogout = async () => {
    if (confirm('로그아웃 할까요?')) {
      await signOut()
    }
  }

  const handleTheme = (newTheme) => {
    onThemeChange(newTheme)
    setStoredTheme(newTheme)
  }

  return (
    <header className="px-5 pt-8 pb-4">
      <div className="flex items-start justify-between">
        {/* 로고 영역 */}
        <div>
          <h1
            className="text-2xl font-black tracking-tight leading-none"
            style={{
              background: 'linear-gradient(90deg, #e91e63 0%, #00acc1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            OSHI TRACKER
          </h1>
          <p className="text-[10px] tracking-[0.2em] text-pink-500/70 dark:text-pink-400/70 uppercase mt-1">
            @{profile?.nickname || 'guest'}
          </p>
        </div>

        {/* 우측 액션 영역 */}
        <div className="flex items-center gap-1.5">

          {/* USER/ADMIN 토글 (관리자만) */}
          {isAdmin && (
            <button
              onClick={() => onModeChange(mode === 'user' ? 'admin' : 'user')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition ${
                mode === 'admin'
                  ? 'bg-amber-400 text-amber-950'
                  : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {mode === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
              {mode === 'admin' ? 'ADMIN' : 'USER'}
            </button>
          )}

          {/* 로그인/로그아웃 */}
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              title="로그아웃"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/login'}
              className="px-2.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider bg-pink-500 text-white hover:bg-pink-600 transition"
            >
              로그인
            </button>
          )}
        </div>
      </div>

      {/* 관리자 모드 배너 */}
      {mode === 'admin' && isAdmin && (
        <div className="mt-3 px-3 py-2 rounded-lg flex items-center gap-2 text-[11px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200">
          <Shield className="w-3.5 h-3.5" />
          <span>관리자 모드 · 검수 및 콘텐츠 관리</span>
        </div>
      )}
    </header>
  )
}

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
            className="text-2xl font-black tracking-tight leading-none cursor-pointer"
            style={{
              background: 'linear-gradient(90deg, #e91e63 0%, #00acc1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
            onClick={() => { window.location.href = '/' }}
          >
            OSHI TRACKER
          </h1>
          {isLoggedIn ? (
  <button
    onClick={() => window.location.href = '/mypage'}
    className="group inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-50 to-cyan-50 dark:from-pink-950/30 dark:to-cyan-950/30 border border-pink-200/60 dark:border-pink-800/40 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-sm transition-all"
  >
    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-cyan-400 flex items-center justify-center">
      <UserIcon className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
    </div>
    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
      {profile?.nickname || 'guest'}
    </span>
    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition">
      →
    </span>
  </button>
) : (
  <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700">
    <div className="w-4 h-4 rounded-full bg-stone-300 dark:bg-zinc-700 flex items-center justify-center">
      <UserIcon className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
    </div>
    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
      guest
    </span>
  </div>
)}
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

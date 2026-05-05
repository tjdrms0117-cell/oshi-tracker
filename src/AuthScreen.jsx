import { useState } from 'react'
import { Mail, Lock, User, ArrowRight, AlertCircle, Sun, Moon, Monitor } from 'lucide-react'
import { signIn, signUp, resetPassword, getErrorMessage } from './lib/auth'
import { setStoredTheme, getStoredTheme } from './lib/theme'

export default function AuthScreen() {
  const [mode, setMode] = useState('login') // login | signup | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [theme, setTheme] = useState(getStoredTheme())

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    setStoredTheme(newTheme)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('Password should be at least 6 characters')
        }
        if (!nickname.trim()) {
          throw new Error('닉네임을 입력해주세요')
        }
        
        const data = await signUp({ email, password, nickname: nickname.trim() })
        
        if (data.user && !data.session) {
          setSuccess('가입 완료! 이메일 인증 후 로그인해주세요.')
        } else {
          setSuccess('가입 완료! 자동 로그인되었어요.')
        }
      } else if (mode === 'login') {
        await signIn({ email, password })
        // 로그인 성공 시 App.jsx의 onAuthStateChange가 자동으로 화면 전환
      } else if (mode === 'reset') {
        await resetPassword(email)
        setSuccess('이메일로 비밀번호 재설정 링크를 보냈어요.')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-stone-50 dark:bg-zinc-950 transition-colors">
      
      {/* 테마 토글 (우측 상단) */}
      <div className="fixed top-4 right-4 flex gap-1 p-1 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-stone-200 dark:border-zinc-800 backdrop-blur">
        <button
          onClick={() => handleThemeChange('light')}
          className={`p-2 rounded-full transition ${
            theme === 'light' ? 'bg-amber-100 text-amber-600' : 'text-zinc-400 hover:text-zinc-600'
          }`}
          title="라이트 모드"
        >
          <Sun className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleThemeChange('dark')}
          className={`p-2 rounded-full transition ${
            theme === 'dark' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'text-zinc-400 hover:text-zinc-600'
          }`}
          title="다크 모드"
        >
          <Moon className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleThemeChange('system')}
          className={`p-2 rounded-full transition ${
            theme === 'system' ? 'bg-stone-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200' : 'text-zinc-400 hover:text-zinc-600'
          }`}
          title="시스템 설정"
        >
          <Monitor className="w-4 h-4" />
        </button>
      </div>

      <div className="w-full max-w-sm">
        
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 
            className="text-4xl font-black tracking-tight mb-2"
            style={{
              background: 'linear-gradient(90deg, #e91e63 0%, #00acc1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            OSHI TRACKER
          </h1>
          <p className="text-xs tracking-[0.3em] text-pink-500/70 dark:text-pink-400/70 uppercase">
            推し活マネージャー
          </p>
        </div>

        {/* 카드 */}
        <div className="rounded-2xl p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-sm">
          
          {/* 모드 탭 */}
          {mode !== 'reset' && (
            <div className="flex gap-1 p-1 rounded-full bg-stone-100 dark:bg-zinc-800 mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className={`flex-1 py-2 px-3 rounded-full text-sm font-semibold transition ${
                  mode === 'login' 
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                로그인
              </button>
              <button
                onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
                className={`flex-1 py-2 px-3 rounded-full text-sm font-semibold transition ${
                  mode === 'signup' 
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                회원가입
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2 text-zinc-900 dark:text-zinc-100">
                비밀번호 재설정
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                가입한 이메일을 입력하면 재설정 링크를 보내드려요.
              </p>
            </div>
          )}

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {mode === 'signup' && (
              <InputField 
                icon={User} 
                placeholder="닉네임" 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            )}

            <InputField 
              icon={Mail} 
              type="email" 
              placeholder="이메일" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {mode !== 'reset' && (
              <InputField 
                icon={Lock} 
                type="password" 
                placeholder="비밀번호 (6자 이상)" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}

            {/* 에러 */}
            {error && (
              <div className="rounded-lg p-3 flex items-start gap-2 text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {/* 성공 */}
            {success && (
              <div className="rounded-lg p-3 text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400">
                {success}
              </div>
            )}

            {/* 메인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white disabled:opacity-50 transition"
              style={{
                background: 'linear-gradient(135deg, #e91e63, #00acc1)',
              }}
            >
              {loading ? '처리중...' : (
                <>
                  {mode === 'login' && '로그인'}
                  {mode === 'signup' && '가입하기'}
                  {mode === 'reset' && '재설정 링크 보내기'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* 보조 링크 */}
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => { setMode('reset'); setError(''); setSuccess('') }}
                className="w-full text-xs text-zinc-500 dark:text-zinc-400 hover:text-pink-500 dark:hover:text-pink-400 transition mt-2"
              >
                비밀번호를 잊으셨나요?
              </button>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="w-full text-xs text-zinc-500 dark:text-zinc-400 hover:text-pink-500 dark:hover:text-pink-400 transition mt-2"
              >
                ← 로그인으로 돌아가기
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600 mt-6 leading-relaxed">
          가입하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  )
}

function InputField({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      <input
        {...props}
        className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-pink-400 dark:focus:border-pink-500"
      />
    </div>
  )
}

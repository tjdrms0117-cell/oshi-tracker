/**
 * 테마 관리
 * - light: 라이트 모드
 * - dark: 다크 모드
 * - system: 시스템 설정 따라가기
 */

const THEME_KEY = 'oshi-tracker-theme'

/**
 * 저장된 테마 가져오기
 */
export function getStoredTheme() {
  if (typeof window === 'undefined') return 'system'
  return localStorage.getItem(THEME_KEY) || 'system'
}

/**
 * 테마 저장
 */
export function setStoredTheme(theme) {
  localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}

/**
 * 실제 테마 적용 (HTML에 'dark' 클래스 추가/제거)
 */
export function applyTheme(theme) {
  const root = document.documentElement
  
  let actualTheme = theme
  if (theme === 'system') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light'
  }
  
  if (actualTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

/**
 * 시스템 테마 변경 감지 (자동 전환)
 */
export function watchSystemTheme(callback) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => callback()
  mediaQuery.addEventListener('change', handler)
  return () => mediaQuery.removeEventListener('change', handler)
}

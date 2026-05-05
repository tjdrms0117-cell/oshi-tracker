import { supabase } from './supabase'

/**
 * 회원가입
 */
export async function signUp({ email, password, nickname }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname: nickname,
      },
    },
  })
  
  if (error) throw error
  return data
}

/**
 * 로그인
 */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

/**
 * 로그아웃
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * 비밀번호 재설정 메일 보내기
 */
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

/**
 * 현재 로그인된 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * 현재 사용자의 프로필 (닉네임, is_admin 등) 가져오기
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

/**
 * 한국어 에러 메시지 변환
 */
export function getErrorMessage(error) {
  const message = error?.message || '알 수 없는 오류가 발생했어요'
  
  // 자주 나오는 영문 에러를 한국어로 변환
  const errorMap = {
    'Invalid login credentials': '이메일 또는 비밀번호가 일치하지 않아요',
    'User already registered': '이미 가입된 이메일이에요',
    'Email not confirmed': '이메일 인증을 완료해주세요',
    'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 해요',
    'Unable to validate email address: invalid format': '올바른 이메일 형식이 아니에요',
    'For security purposes, you can only request this once every 60 seconds': '보안상 60초에 한 번만 요청할 수 있어요',
  }
  
  for (const [eng, kor] of Object.entries(errorMap)) {
    if (message.includes(eng)) return kor
  }
  
  return message
}

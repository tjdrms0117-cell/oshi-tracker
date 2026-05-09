// YouTube 채널 정보 동기화 헬퍼
import { supabase } from './supabase'

/**
 * YouTube API에서 채널 정보를 받아 가공된 객체 반환
 * @param {string} channelId - YouTube 채널 ID (UCxxx...)
 * @returns {Promise<{thumbnailUrl: string|null, bannerUrl: string|null} | null>}
 */
export async function fetchYouTubeChannelInfo(channelId) {
  if (!channelId) return null
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (!apiKey) {
    console.warn('YouTube API key not configured')
    return null
  }
  
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${channelId}&key=${apiKey}`
    )
    const json = await res.json()
    const item = json.items?.[0]
    if (!item) return null
    
    const thumbnailUrl = 
      item.snippet?.thumbnails?.high?.url || 
      item.snippet?.thumbnails?.medium?.url || 
      null
    
    const rawBanner = item.brandingSettings?.image?.bannerExternalUrl
    const bannerUrl = rawBanner ? `${rawBanner}=w2560` : null
    
    return { thumbnailUrl, bannerUrl }
  } catch (err) {
    console.error('YouTube API 호출 실패:', err)
    return null
  }
}

/**
 * 아티스트의 YouTube 채널 정보를 동기화하여 DB에 저장
 * @param {string} artistId - 아티스트 ID
 * @param {string} channelId - YouTube 채널 ID
 * @returns {Promise<boolean>} 성공 여부
 */
export async function syncArtistYouTubeData(artistId, channelId) {
  if (!artistId) return false
  
  // 채널 ID 비었으면 캐시 클리어
  if (!channelId) {
    await supabase
      .from('artists')
      .update({
        youtube_thumbnail_url: null,
        youtube_banner_url: null,
        youtube_synced_at: new Date().toISOString(),
      })
      .eq('id', artistId)
    return true
  }
  
  const info = await fetchYouTubeChannelInfo(channelId)
  if (!info) return false
  
  const { error } = await supabase
    .from('artists')
    .update({
      youtube_thumbnail_url: info.thumbnailUrl,
      youtube_banner_url: info.bannerUrl,
      youtube_synced_at: new Date().toISOString(),
    })
    .eq('id', artistId)
  
  if (error) {
    console.error('아티스트 YouTube 정보 저장 실패:', error)
    return false
  }
  return true
}

/**
 * 모든 아티스트의 YouTube 정보 일괄 동기화 (관리자용)
 * @param {(progress: {current: number, total: number, artistName: string}) => void} onProgress
 * @returns {Promise<{success: number, failed: number, skipped: number}>}
 */
export async function syncAllArtistsYouTubeData(onProgress) {
  const { data: artists, error } = await supabase
    .from('artists')
    .select('id, name, youtube_channel_id')
    .not('youtube_channel_id', 'is', null)
  
  if (error || !artists) {
    return { success: 0, failed: 0, skipped: 0 }
  }
  
  let success = 0
  let failed = 0
  const total = artists.length
  
  for (let i = 0; i < artists.length; i++) {
    const artist = artists[i]
    onProgress?.({ 
      current: i + 1, 
      total, 
      artistName: artist.name 
    })
    
    const ok = await syncArtistYouTubeData(artist.id, artist.youtube_channel_id)
    if (ok) success++
    else failed++
    
    // API rate limit 회피용 딜레이
    await new Promise(r => setTimeout(r, 100))
  }
  
  return { success, failed, skipped: 0 }
}
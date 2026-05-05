import { supabase } from './supabase'

// ============================================
// ARTISTS (가수)
// ============================================

export async function fetchArtists() {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data || []
}

export async function createArtist({ name, nameJp, color, topSongTitle, topSongTitleJp, topSongYoutubeUrl }) {
  const { data, error } = await supabase
    .from('artists')
    .insert({ 
      name, 
      name_jp: nameJp, 
      color,
      top_song_title: topSongTitle,
      top_song_title_jp: topSongTitleJp,
      top_song_youtube_url: topSongYoutubeUrl,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateArtist(id, updates) {
  const { data, error } = await supabase
    .from('artists')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteArtist(id) {
  const { data: concerts } = await supabase
    .from('concerts')
    .select('id')
    .eq('artist_id', id)
  
  const concertCount = concerts?.length || 0
  
  const { error } = await supabase
    .from('artists')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return { concertCount }
}

// ============================================
// VENUES (공연장)
// ============================================

export async function fetchVenues({ country } = {}) {
  let query = supabase
    .from('venues')
    .select('*')
    .order('name')
  
  if (country) {
    query = query.eq('country', country)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

export async function fetchVenue(id) {
  const { data, error } = await supabase
    .from('venues')
    .select('*, concerts(*, artist:artists(*))')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createVenue(venueData) {
  const { data, error } = await supabase
    .from('venues')
    .insert(venueData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateVenue(id, updates) {
  const { data, error } = await supabase
    .from('venues')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteVenue(id) {
  const { error } = await supabase
    .from('venues')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ============================================
// CONCERTS (공연)
// ============================================

export async function fetchConcerts() {
  const { data, error } = await supabase
    .from('concerts')
    .select(`
      *,
      artist:artists(*),
      venue:venues(*),
      ticket_rounds(*)
    `)
    .order('date', { ascending: true })
  
  if (error) throw error
  
  // ticket_rounds 정렬
  const sorted = (data || []).map(concert => ({
    ...concert,
    ticket_rounds: (concert.ticket_rounds || []).sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    )
  }))
  
  // series_id로 묶기 (양일 공연 통합)
  const seriesMap = new Map()
  const standalone = []
  
  sorted.forEach(c => {
    if (c.series_id) {
      if (!seriesMap.has(c.series_id)) {
        seriesMap.set(c.series_id, [])
      }
      seriesMap.get(c.series_id).push(c)
    } else {
      standalone.push(c)
    }
  })
  
  // 시리즈를 1개 카드로 변환
  const seriesGrouped = []
  seriesMap.forEach(concerts => {
    const sortedByDate = concerts.sort((a, b) => new Date(a.date) - new Date(b.date))
    const first = sortedByDate[0]
    
    // 모든 날짜의 ticket_rounds 합치기 (날짜 정보 포함)
    const allTicketRounds = sortedByDate.flatMap(c =>
      (c.ticket_rounds || []).map(r => ({
        ...r,
        _concert_date: c.date,
        _day_label: c.day_label,
      }))
    )
    // display_order 순 정렬
    allTicketRounds.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    
    seriesGrouped.push({
      ...first,
      is_series: true,
      series_dates: sortedByDate.map(c => ({
        id: c.id,
        date: c.date,
        time: c.time,
        day_label: c.day_label,
      })),
      ticket_rounds: allTicketRounds,
      id: first.id,
    })
  })
  
  // 합치고 날짜순 정렬
  const all = [...standalone, ...seriesGrouped]
  all.sort((a, b) => new Date(a.date) - new Date(b.date))
  
  return all
}

export async function fetchConcert(id) {
  const { data, error } = await supabase
    .from('concerts')
    .select(`
      *, 
      artist:artists(*),
      venue:venues(*),
      ticket_rounds(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  
  // ticket_rounds 정렬
  if (data.ticket_rounds) {
    data.ticket_rounds.sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    )
  }
  
  return data
}

export async function createConcert(concertData) {
  const { data, error } = await supabase
    .from('concerts')
    .insert(concertData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateConcert(id, updates) {
  const { data, error } = await supabase
    .from('concerts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteConcert(id) {
  const { data: concert } = await supabase
    .from('concerts')
    .select('series_id')
    .eq('id', id)
    .single()
  
  if (concert?.series_id) {
    const { error } = await supabase
      .from('concerts')
      .delete()
      .eq('series_id', concert.series_id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('concerts')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// ============================================
// TICKET ROUNDS (티켓팅 라운드)
// ============================================

export async function fetchTicketRounds(concertId) {
  const { data, error } = await supabase
    .from('ticket_rounds')
    .select('*')
    .eq('concert_id', concertId)
    .order('display_order', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function createTicketRound(roundData) {
  const { data, error } = await supabase
    .from('ticket_rounds')
    .insert(roundData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateTicketRound(id, updates) {
  const { data, error } = await supabase
    .from('ticket_rounds')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteTicketRound(id) {
  const { error } = await supabase
    .from('ticket_rounds')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ============================================
// SUBMISSIONS (제보)
// ============================================

export async function fetchSubmissions({ status } = {}) {
  let query = supabase
    .from('submissions')
    .select('*, artist:artists(*)')
    .order('created_at', { ascending: false })
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

export async function createSubmission(submissionData) {
  const { data, error } = await supabase
    .from('submissions')
    .insert(submissionData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function approveSubmission(submissionId, finalData, reviewerId) {
  // 1. concerts에 추가
  const { error: insertError } = await supabase
    .from('concerts')
    .insert(finalData)
  
  if (insertError) throw insertError
  
  // 2. submission 상태 업데이트
  const { error: updateError } = await supabase
    .from('submissions')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
  
  if (updateError) throw updateError
}

export async function rejectSubmission(submissionId, reason, reviewerId) {
  const { error } = await supabase
    .from('submissions')
    .update({
      status: 'rejected',
      reject_reason: reason,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
  
  if (error) throw error
}

// ============================================
// OSHI LIST (내 오시 - 가수 즐겨찾기)
// ============================================

export async function fetchMyOshiList(userId) {
  const { data, error } = await supabase
    .from('oshi_list')
    .select('*, artist:artists(*)')
    .eq('user_id', userId)
  
  if (error) throw error
  return data || []
}

export async function addToOshi(userId, artistId) {
  const { error } = await supabase
    .from('oshi_list')
    .insert({ user_id: userId, artist_id: artistId })
  
  if (error) throw error
}

export async function removeFromOshi(userId, artistId) {
  const { error } = await supabase
    .from('oshi_list')
    .delete()
    .eq('user_id', userId)
    .eq('artist_id', artistId)
  
  if (error) throw error
}

// ============================================
// ATTENDING LIST (내 공연 - 갈 거예요)
// ============================================

export async function fetchMyAttendingList(userId) {
  const { data, error } = await supabase
    .from('attending_list')
    .select('*, concert:concerts(*, artist:artists(*))')
    .eq('user_id', userId)
  
  if (error) throw error
  return data || []
}

export async function addToAttending(userId, concertId) {
  const { error } = await supabase
    .from('attending_list')
    .insert({ user_id: userId, concert_id: concertId })
  
  if (error) throw error
}

export async function removeFromAttending(userId, concertId) {
  const { error } = await supabase
    .from('attending_list')
    .delete()
    .eq('user_id', userId)
    .eq('concert_id', concertId)
  
  if (error) throw error
}
// ============================================
// 단일 공연 가져오기 (상세 페이지용)
// ============================================
export async function fetchConcertById(concertId) {
  const { data, error } = await supabase
    .from('concerts')
    .select(`
      *,
      artist:artists(*),
      venue:venues(*),
      ticket_rounds(id, concert_id, round_name, open_at, method, ticket_site, price_info, note, display_order, ticket_url)
    `)
    .eq('id', concertId)
    .single()
  
  if (error) throw error
  
  if (data.ticket_rounds) {
    data.ticket_rounds.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  }
  
  // 시리즈 공연이면 나머지 날짜 + ticket_rounds도 가져오기
  if (data.series_id) {
    const { data: siblings } = await supabase
      .from('concerts')
      .select(`*, ticket_rounds(*)`)
      .eq('series_id', data.series_id)
      .neq('id', concertId)
      .order('date', { ascending: true })
    
    if (siblings && siblings.length > 0) {
      // series_dates 구성 (자신 포함 날짜순)
      const allDates = [
        { id: data.id, date: data.date, time: data.time, day_label: data.day_label },
        ...siblings.map(c => ({ id: c.id, date: c.date, time: c.time, day_label: c.day_label }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date))
      
      // 모든 ticket_rounds 합치기
      const siblingRounds = siblings.flatMap(c =>
        (c.ticket_rounds || []).map(r => ({
          ...r,
          _concert_date: c.date,
          _day_label: c.day_label,
        }))
      )
      const allRounds = [
        ...data.ticket_rounds.map(r => ({ ...r, _concert_date: data.date })),
        ...siblingRounds,
      ].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      
      data.is_series = true
      data.series_dates = allDates
      data.ticket_rounds = allRounds
    }
  }
  
  return data
}
// ============================================
// 공연장 정보 가져오기
// ============================================
export async function fetchVenueById(venueId) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .single()
  
  if (error) throw error
  return data
}

// ============================================
// 공연장에서 열리는 공연 목록
// ============================================
export async function fetchConcertsByVenue(venueId) {
  const { data, error } = await supabase
    .from('concerts')
    .select('*, artist:artists(*)')
    .eq('venue_id', venueId)
    .order('date', { ascending: true })
  
  if (error) throw error

  // series 묶기 (fetchConcerts와 동일 로직)
  const seriesMap = new Map()
  const standalone = []

  ;(data || []).forEach(c => {
    if (c.series_id) {
      if (!seriesMap.has(c.series_id)) seriesMap.set(c.series_id, [])
      seriesMap.get(c.series_id).push(c)
    } else {
      standalone.push(c)
    }
  })

  const seriesGrouped = []
  seriesMap.forEach(concerts => {
    const sorted = concerts.sort((a, b) => new Date(a.date) - new Date(b.date))
    const first = sorted[0]
    seriesGrouped.push({
      ...first,
      is_series: true,
      series_dates: sorted.map(c => ({
        id: c.id,
        date: c.date,
        time: c.time,
        day_label: c.day_label,
      })),
    })
  })

  const all = [...standalone, ...seriesGrouped]
  all.sort((a, b) => new Date(a.date) - new Date(b.date))
  return all
}
// ============================================
// 가수별 공연 개수 가져오기
// ============================================
export async function fetchArtistsWithCounts() {
  const { data: artists, error: artistError } = await supabase
    .from('artists')
    .select('*')
    .order('name')
  
  if (artistError) throw artistError
  
  const { data: concerts, error: concertError } = await supabase
    .from('concerts')
    .select('artist_id, date, country')
  
  if (concertError) throw concertError
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 가수별 공연 개수 계산
  const artistsWithCounts = artists.map(artist => {
    const artistConcerts = concerts.filter(c => c.artist_id === artist.id)
    const upcoming = artistConcerts.filter(c => new Date(c.date) >= today)
    const past = artistConcerts.filter(c => new Date(c.date) < today)
    
    return {
      ...artist,
      total_concerts: artistConcerts.length,
      upcoming_concerts: upcoming.length,
      past_concerts: past.length,
    }
  })
  
  return artistsWithCounts
}

// ============================================
// 단일 가수 정보 + 공연 가져오기 (상세 페이지용)
// ============================================
export async function fetchArtistById(artistId) {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', artistId)
    .single()
  
  if (error) throw error
  return data
}

export async function fetchConcertsByArtist(artistId) {
  const { data, error } = await supabase
    .from('concerts')
    .select(`
      *,
      artist:artists(*),
      venue:venues(*),
      ticket_rounds(*)
    `)
    .eq('artist_id', artistId)
    .order('date', { ascending: true })
  
  if (error) throw error
  
  // ticket_rounds 정렬
  const sorted = (data || []).map(concert => ({
    ...concert,
    ticket_rounds: (concert.ticket_rounds || []).sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    )
  }))
  
  return sorted
}
// ============================================
// SUBMISSIONS (제보) - 추가 함수들
// ============================================

// 내 제보 목록
export async function fetchMySubmissions(userId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, artist:artists(*)')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// 제보 + 티켓팅 라운드 한 번에 생성
export async function createSubmissionWithRounds(submissionData, ticketRounds = []) {
  // 1. submission 생성
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .insert(submissionData)
    .select()
    .single()
  
  if (subError) throw subError
  
  // 2. 티켓팅 라운드들 추가
  if (ticketRounds.length > 0) {
    const roundsWithSubId = ticketRounds.map((round, idx) => ({
      ...round,
      submission_id: submission.id,
      display_order: idx + 1,
    }))
    
    const { error: roundError } = await supabase
      .from('submission_ticket_rounds')
      .insert(roundsWithSubId)
    
    if (roundError) {
      // 롤백: submission 삭제
      await supabase.from('submissions').delete().eq('id', submission.id)
      throw roundError
    }
  }
  
  return submission
}
// ============================================
// 검수 (관리자) 관련 함수들
// ============================================

// 검수 대기 제보 + 티켓팅 라운드 함께
export async function fetchPendingSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      artist:artists(*),
      submission_ticket_rounds(*)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
  // 제보자 닉네임 별도 조회
  if (data && data.length > 0) {
    const userIds = [...new Set(data.map(s => s.submitted_by).filter(Boolean))]
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', userIds)
      
      const profileMap = {}
      ;(profiles || []).forEach(p => { profileMap[p.id] = p })
      
      data.forEach(s => {
        s.submitter = profileMap[s.submitted_by] || null
      })
    }
  }
  
  // 티켓팅 라운드 정렬
  return (data || []).map(s => ({
    ...s,
    submission_ticket_rounds: (s.submission_ticket_rounds || [])
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  }))
}

// 검수 통과 처리 (승인)
export async function approveSubmissionFull(submissionId, finalData, rounds, reviewerId) {
  // 1. 새 가수면 먼저 가수 생성 (대표곡 포함)
  let artistId = finalData.artist_id
  
  if (finalData.create_new_artist) {
    const { data: newArtist, error: artistError } = await supabase
      .from('artists')
      .insert({
        name: finalData.new_artist_name,
        name_jp: finalData.new_artist_name_jp,
        color: finalData.new_artist_color || '#e91e63',
        top_song_title: finalData.top_song_title || null,
        top_song_title_jp: finalData.top_song_title_jp || null,
        top_song_youtube_url: finalData.top_song_youtube_url || null,
      })
      .select()
      .single()
    
    if (artistError) throw artistError
    artistId = newArtist.id
  }
  
  // 2. 공연장 처리 (새로 입력된 venue 정보 있으면 venues 테이블에 추가)
  let venueId = finalData.venue_id
  
  if (!venueId && finalData.venue && (finalData.venue_address || finalData.venue_subway_info || finalData.venue_capacity)) {
    // 새 공연장으로 등록
    const { data: newVenue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: finalData.venue,
        name_local: finalData.venue_name_local || null,
        country: finalData.country,
        city: finalData.city || null,
        address: finalData.venue_address || null,
        subway_info: finalData.venue_subway_info || null,
        parking_info: finalData.venue_parking_info || null,
        tips: finalData.venue_tips || null,
        capacity: finalData.venue_capacity ? parseInt(finalData.venue_capacity) : null,
      })
      .select()
      .single()
    
    if (!venueError && newVenue) {
      venueId = newVenue.id
    }
  } else if (venueId && (finalData.venue_address || finalData.venue_subway_info || finalData.venue_capacity)) {
    // 기존 공연장에 정보 추가/업데이트 (빈 필드만)
    const updates = {}
    if (finalData.venue_name_local) updates.name_local = finalData.venue_name_local
    if (finalData.venue_address) updates.address = finalData.venue_address
    if (finalData.venue_subway_info) updates.subway_info = finalData.venue_subway_info
    if (finalData.venue_parking_info) updates.parking_info = finalData.venue_parking_info
    if (finalData.venue_tips) updates.tips = finalData.venue_tips
    if (finalData.venue_capacity) updates.capacity = parseInt(finalData.venue_capacity)
    
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('venues')
        .update(updates)
        .eq('id', venueId)
    }
  }
  
  // 3. concerts 테이블에 추가
  const concertPayload = {
    artist_id: artistId,
    venue_id: venueId || null,
    title: finalData.title,
    country: finalData.country,
    venue: finalData.venue,
    city: finalData.city,
    date: finalData.date,
    time: finalData.time,
    duration_minutes: finalData.duration_minutes,
    seat_type: finalData.seat_type,
    ticket_price: finalData.ticket_price,
    memo: finalData.memo,
    source_url: finalData.source_url,
  }
  
  const { data: newConcert, error: concertError } = await supabase
    .from('concerts')
    .insert(concertPayload)
    .select()
    .single()
  
  if (concertError) throw concertError
  
  // 4. 티켓팅 라운드 추가
  if (rounds && rounds.length > 0) {
    const roundsPayload = rounds.map((r, idx) => ({
      concert_id: newConcert.id,
      round_name: r.round_name,
      open_at: r.open_at,
      close_at: r.close_at || null,
      method: r.method,
      ticket_site: r.ticket_site,
      price_info: r.price_info,
      note: r.note,
      display_order: idx + 1,
    }))
    
    await supabase.from('ticket_rounds').insert(roundsPayload)
  }
  
  // 5. submission 상태 업데이트
  const { error: updateError } = await supabase
    .from('submissions')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
  
  if (updateError) throw updateError
  
  return newConcert
}

// 반려
export async function rejectSubmissionWithReason(submissionId, reason, reviewerId) {
  const { error } = await supabase
    .from('submissions')
    .update({
      status: 'rejected',
      reject_reason: reason,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
  
  if (error) throw error
}

// 중복 가수 검색 (새 가수 제안 시)
export async function searchSimilarArtists(name) {
  if (!name) return []
  
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .or(`name.ilike.%${name}%,name_jp.ilike.%${name}%`)
    .limit(5)
  
  if (error) return []
  return data || []
}
// ============================================
// 양일 공연 시리즈 처리
// ============================================

// 시리즈로 묶인 공연들 가져오기
export async function fetchConcertSeries(seriesId) {
  if (!seriesId) return []
  
  const { data, error } = await supabase
    .from('concerts')
    .select(`
      *,
      artist:artists(*),
      venue:venues(*),
      ticket_rounds(*)
    `)
    .eq('series_id', seriesId)
    .order('date', { ascending: true })
  
  if (error) throw error
  
  return (data || []).map(concert => ({
    ...concert,
    ticket_rounds: (concert.ticket_rounds || []).sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    )
  }))
}
// ============================================
// 관리자 - 공연 수정/삭제
// ============================================

// 티켓팅 라운드 수정
export async function replaceTicketRounds(concertId, rounds) {
  // series_id 확인해서 관련된 모든 concert의 티켓팅 삭제
  const { data: concert } = await supabase
    .from('concerts')
    .select('series_id')
    .eq('id', concertId)
    .single()

  if (concert?.series_id) {
    // 양일공연: series 전체 concert_id 가져와서 삭제
    const { data: siblings } = await supabase
      .from('concerts')
      .select('id')
      .eq('series_id', concert.series_id)
    
    const ids = siblings.map(s => s.id)
    await supabase.from('ticket_rounds').delete().in('concert_id', ids)
  } else {
    await supabase.from('ticket_rounds').delete().eq('concert_id', concertId)
  }
  
  if (rounds && rounds.length > 0) {
    const payload = rounds.map((r, idx) => ({
      // concert_id가 있으면 원래 것 유지, 없으면 현재 concertId 사용
      concert_id: r.concert_id || concertId,
      round_name: r.round_name,
      open_at: r.open_at || null,
      close_at: r.close_at || null,
      method: r.method || null,
      ticket_site: r.ticket_site || null,
      price_info: r.price_info || null,
      note: r.note || null,
      ticket_url: r.ticket_url || null,
      display_order: idx + 1,
    }))
    
    const { error } = await supabase.from('ticket_rounds').insert(payload)
    if (error) throw error
  }
}

// 공연장 수정
// ============================================
// 아티스트 제보
// ============================================

export async function createArtistSubmission(data) {
  const { error } = await supabase
    .from('artist_submissions')
    .insert(data)
  if (error) throw error
}

export async function fetchPendingArtistSubmissions() {
  const { data, error } = await supabase
    .from('artist_submissions')
    .select('*, submitter:profiles(nickname)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function approveArtistSubmission(submissionId, reviewerId) {
  // 1. artists 테이블에 추가
  const { data: sub } = await supabase
    .from('artist_submissions')
    .select('*')
    .eq('id', submissionId)
    .single()

  const { error: insertError } = await supabase
    .from('artists')
    .insert({
      name: sub.name,
      name_jp: sub.name_jp,
      color: sub.color,
      top_song_title: sub.top_song_title,
      top_song_title_jp: sub.top_song_title_jp,
      top_song_youtube_url: sub.top_song_youtube_url,
    })
  if (insertError) throw insertError

  // 2. 상태 업데이트
  const { error } = await supabase
    .from('artist_submissions')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
  if (error) throw error
}

export async function rejectArtistSubmission(submissionId, reason, reviewerId) {
  const { error } = await supabase
    .from('artist_submissions')
    .update({
      status: 'rejected',
      reject_reason: reason,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
  if (error) throw error
}

export async function fetchMyArtistSubmissions(userId) {
  const { data, error } = await supabase
    .from('artist_submissions')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

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

export async function createArtist({ name, nameJp, color, topSongTitle, topSongTitleJp, topSongYoutubeUrl, youtubeChannelId }) {
  const { data, error } = await supabase
    .from('artists')
    .insert({ 
      name, 
      name_jp: nameJp, 
      color,
      top_song_title: topSongTitle,
      top_song_title_jp: topSongTitleJp,
      top_song_youtube_url: topSongYoutubeUrl,
      youtube_channel_id: youtubeChannelId || null,
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
    .select('*, concerts(*, artist:artists!concerts_artist_id_fkey(*))')
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
// 공통 series 묶기 헬퍼 함수
// ============================================

function groupBySeries(data) {
  const seriesMap = new Map()
  const standalone = []

  data.forEach(c => {
    if (c.series_id) {
      if (!seriesMap.has(c.series_id)) seriesMap.set(c.series_id, [])
      seriesMap.get(c.series_id).push(c)
    } else {
      standalone.push(c)
    }
  })

  const seriesGrouped = []
  seriesMap.forEach(concerts => {
    const sortedByDate = concerts.sort((a, b) => new Date(a.date) - new Date(b.date))
    const first = sortedByDate[0]

    const allTicketRounds = sortedByDate.flatMap(c =>
      (c.ticket_rounds || []).map(r => ({
        ...r,
        _concert_date: c.date,
        _day_label: c.day_label,
      }))
    )
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

  const all = [...standalone, ...seriesGrouped]
  all.sort((a, b) => new Date(a.date) - new Date(b.date))
  return all
}

// ============================================
// CONCERTS (공연)
// ============================================

export async function fetchConcerts() {
  const { data, error } = await supabase
    .from('concerts')
    .select(`
      *,
      artist:artists!concerts_artist_id_fkey(*),
      co_artist:artists!concerts_co_artist_id_fkey(*),
      co_artist_2:artists!concerts_co_artist_id_2_fkey(*),
      co_artist_3:artists!concerts_co_artist_id_3_fkey(*),
      venue:venues(*),
      ticket_rounds(*)
    `)
    .order('date', { ascending: true })
  
  if (error) throw error
  
  const sorted = (data || []).map(concert => ({
    ...concert,
    ticket_rounds: (concert.ticket_rounds || []).sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    )
  }))

  return groupBySeries(sorted)
}

export async function fetchConcert(id) {
  const { data, error } = await supabase
    .from('concerts')
    .select(`
      *,
      artist:artists!concerts_artist_id_fkey(*),
      co_artist:artists!concerts_co_artist_id_fkey(*),
      co_artist_2:artists!concerts_co_artist_id_2_fkey(*),
      co_artist_3:artists!concerts_co_artist_id_3_fkey(*),
      venue:venues(*),
      ticket_rounds(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  
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
    .select('*, artist:artists!submissions_artist_id_fkey(*)')
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
  const { error: insertError } = await supabase
    .from('concerts')
    .insert(finalData)
  
  if (insertError) throw insertError
  
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
    .select('*, concert:concerts(*, artist:artists!concerts_artist_id_fkey(*), venue:venues(*), ticket_rounds(*))')
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
      artist:artists!concerts_artist_id_fkey(*),
      co_artist:artists!concerts_co_artist_id_fkey(*),
      co_artist_2:artists!concerts_co_artist_id_2_fkey(*),
      co_artist_3:artists!concerts_co_artist_id_3_fkey(*),
      venue:venues(*),
      ticket_rounds(id, concert_id, round_name, open_at, close_at, result_at, method, ticket_site, price_info, note, display_order, ticket_url)
    `)
    .eq('id', concertId)
    .single()
  
  if (error) throw error
  
  if (data.ticket_rounds) {
    data.ticket_rounds.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  }
  
  if (data.series_id) {
    const { data: siblings } = await supabase
      .from('concerts')
      .select(`*, ticket_rounds(*)`)
      .eq('series_id', data.series_id)
      .neq('id', concertId)
      .order('date', { ascending: true })
    
    if (siblings && siblings.length > 0) {
      const allDates = [
        { id: data.id, date: data.date, time: data.time, day_label: data.day_label },
        ...siblings.map(c => ({ id: c.id, date: c.date, time: c.time, day_label: c.day_label }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date))
      
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
    .select('*, artist:artists!concerts_artist_id_fkey(*), ticket_rounds(*)')
    .eq('venue_id', venueId)
    .order('date', { ascending: true })
  
  if (error) throw error

  const sorted = (data || []).map(concert => ({
    ...concert,
    ticket_rounds: (concert.ticket_rounds || []).sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    )
  }))

  return groupBySeries(sorted)
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

  const { data: festivalArtists } = await supabase
    .from('festival_artists')
    .select('artist_id, performance_date, festival:festivals(id, name, date, end_date, country)')
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return artists.map(artist => {
    const artistConcerts = concerts.filter(c => c.artist_id === artist.id)
    const upcoming = artistConcerts.filter(c => new Date(c.date) >= today)
    const past = artistConcerts.filter(c => new Date(c.date) < today)

    const myFestivals = (festivalArtists || [])
      .filter(fa => fa.artist_id === artist.id && fa.festival)
      .map(fa => ({ ...fa.festival, performance_date: fa.performance_date }))

    const upcomingFestivals = myFestivals.filter(f => new Date(f.date) >= today)

    return {
      ...artist,
      total_concerts: artistConcerts.length,
      upcoming_concerts: upcoming.length,
      past_concerts: past.length,
      upcoming_kr: upcoming.filter(c => c.country === 'korea').length,
      upcoming_jp: upcoming.filter(c => c.country === 'japan').length,
      upcoming_festivals: upcomingFestivals,
    }
  })
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
      artist:artists!concerts_artist_id_fkey(*),
      co_artist:artists!concerts_co_artist_id_fkey(*),
      co_artist_2:artists!concerts_co_artist_id_2_fkey(*),
      co_artist_3:artists!concerts_co_artist_id_3_fkey(*),
      venue:venues(*),
      ticket_rounds(*)
    `)
    .eq('artist_id', artistId)
    .order('date', { ascending: true })
  
  if (error) throw error
  
  const sorted = (data || []).map(concert => ({
    ...concert,
    ticket_rounds: (concert.ticket_rounds || []).sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    )
  }))

  return groupBySeries(sorted)
}

// ============================================
// SUBMISSIONS (제보) - 추가 함수들
// ============================================

export async function fetchMySubmissions(userId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, artist:artists!submissions_artist_id_fkey(*)')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function createSubmissionWithRounds(submissionData, ticketRounds = []) {
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .insert(submissionData)
    .select()
    .single()
  
  if (subError) throw subError
  
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
      await supabase.from('submissions').delete().eq('id', submission.id)
      throw roundError
    }
  }
  
  return submission
}

// ============================================
// 검수 (관리자) 관련 함수들
// ============================================

export async function fetchPendingSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      artist:artists!submissions_artist_id_fkey(*),
      submission_ticket_rounds(*)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
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
  
  return (data || []).map(s => ({
    ...s,
    submission_ticket_rounds: (s.submission_ticket_rounds || [])
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  }))
}

export async function approveSubmissionFull(submissionId, finalData, rounds, reviewerId) {
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
  
  let venueId = finalData.venue_id
  
  if (!venueId && finalData.venue && (finalData.venue_address || finalData.venue_subway_info || finalData.venue_capacity)) {
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
    const updates = {}
    if (finalData.venue_name_local) updates.name_local = finalData.venue_name_local
    if (finalData.venue_address) updates.address = finalData.venue_address
    if (finalData.venue_subway_info) updates.subway_info = finalData.venue_subway_info
    if (finalData.venue_parking_info) updates.parking_info = finalData.venue_parking_info
    if (finalData.venue_tips) updates.tips = finalData.venue_tips
    if (finalData.venue_capacity) updates.capacity = parseInt(finalData.venue_capacity)
    
    if (Object.keys(updates).length > 0) {
      await supabase.from('venues').update(updates).eq('id', venueId)
    }
  }
  
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

export async function fetchConcertSeries(seriesId) {
  if (!seriesId) return []
  
  const { data, error } = await supabase
    .from('concerts')
    .select(`
      *,
      artist:artists!concerts_artist_id_fkey(*),
      co_artist:artists!concerts_co_artist_id_fkey(*),
      co_artist_2:artists!concerts_co_artist_id_2_fkey(*),
      co_artist_3:artists!concerts_co_artist_id_3_fkey(*),
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
// 관리자 - 티켓팅 라운드 교체
// ============================================

export async function replaceTicketRounds(concertId, rounds) {
  await supabase.from('ticket_rounds').delete().eq('concert_id', concertId)
  
  if (rounds && rounds.length > 0) {
    const payload = rounds.map((r, idx) => ({
      concert_id: r.concert_id || concertId,
      round_name: r.round_name,
      open_at: r.open_at || null,
      close_at: r.close_at && r.close_at.trim() !== '' ? r.close_at : null,
      result_at: r.result_at && r.result_at.trim() !== '' ? r.result_at : null,
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
    .select('*, submitter:profiles!artist_submissions_submitted_by_fkey(nickname)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function approveArtistSubmission(submissionId, reviewerId) {
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

// ============================================
// FESTIVALS (페스티벌)
// ============================================

export async function fetchFestivals() {
  const { data, error } = await supabase
    .from('festivals')
    .select(`
      *,
      venue:venues(*),
      festival_artists(
        id,
        artist_id,
        performance_date,
        start_time,
        end_time,
        stage,
        artist:artists(*)
      )
    `)
    .order('date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchFestivalById(festivalId) {
  const { data, error } = await supabase
    .from('festivals')
    .select(`
      *,
      venue:venues(*),
      festival_artists(
        id,
        artist_id,
        performance_date,
        start_time,
        end_time,
        stage,
        artist:artists(*)
      )
    `)
    .eq('id', festivalId)
    .single()
  if (error) throw error
  return data
}

export async function fetchMyFestivalPicks(userId, festivalId) {
  const { data, error } = await supabase
    .from('festival_picks')
    .select('artist_id')
    .eq('user_id', userId)
    .eq('festival_id', festivalId)
  if (error) throw error
  return (data || []).map(p => p.artist_id)
}

export async function toggleFestivalPick(userId, festivalId, artistId, currentlyPicked) {
  if (currentlyPicked) {
    const { error } = await supabase
      .from('festival_picks')
      .delete()
      .eq('user_id', userId)
      .eq('festival_id', festivalId)
      .eq('artist_id', artistId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('festival_picks')
      .insert({ user_id: userId, festival_id: festivalId, artist_id: artistId })
    if (error) throw error
  }
}

export async function createFestivalSubmission(submissionData) {
  const { error } = await supabase
    .from('festival_submissions')
    .insert(submissionData)
  if (error) throw error
}

export async function fetchPendingFestivalSubmissions() {
  const { data, error } = await supabase
    .from('festival_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error

  if (data && data.length > 0) {
    const userIds = [...new Set(data.map(s => s.submitted_by).filter(Boolean))]
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', userIds)
      const profileMap = {}
      ;(profiles || []).forEach(p => { profileMap[p.id] = p })
      data.forEach(s => { s.submitter = profileMap[s.submitted_by] || null })
    }
  }
  return data || []
}

export async function approveFestivalSubmission(submissionId, reviewerId) {
  const { data: sub } = await supabase
    .from('festival_submissions')
    .select('*')
    .eq('id', submissionId)
    .single()
  if (!sub) throw new Error('제보를 찾을 수 없어요')

  if (sub.festival_id) {
    if (sub.artists && sub.artists.length > 0) {
      const rows = sub.artists.map(a => ({
        festival_id: sub.festival_id,
        artist_id: a.artist_id,
      }))
      await supabase.from('festival_artists').upsert(rows, { onConflict: 'festival_id,artist_id' })
    }
  } else {
    const { data: newFest, error: festError } = await supabase
      .from('festivals')
      .insert({
        name: sub.name,
        name_jp: sub.name_jp || null,
        date: sub.dates?.[0]?.date || null,
        end_date: sub.dates?.length > 1 ? sub.dates[sub.dates.length - 1].date : null,
        venue_id: sub.venue_id || null,
        venue: sub.venue || null,
        city: sub.city || null,
        country: sub.country || 'japan',
        ticket_price: sub.ticket_price || null,
        source_url: sub.source_url || null,
      })
      .select()
      .single()
    if (festError) throw festError

    if (sub.artists && sub.artists.length > 0) {
      const rows = sub.artists.map(a => ({
        festival_id: newFest.id,
        artist_id: a.artist_id,
        performance_date: a.performance_date || null,
      }))
      await supabase.from('festival_artists').insert(rows)
    }
  }

  await supabase
    .from('festival_submissions')
    .update({ status: 'approved', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)
}

export async function rejectFestivalSubmission(submissionId, reason, reviewerId) {
  const { error } = await supabase
    .from('festival_submissions')
    .update({ status: 'rejected', reject_reason: reason, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)
  if (error) throw error
}

// ============================================
// 문의
// ============================================

export async function createInquiry({ submitted_by, nickname, content }) {
  const { error } = await supabase
    .from('inquiries')
    .insert({ submitted_by: submitted_by || null, nickname: nickname || null, content })
  if (error) throw error
}

export async function fetchInquiries() {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateInquiryStatus(id, status) {
  const { error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

// ============================================
// 마이페이지 - 프로필 / 닉네임
// ============================================

export async function fetchMyProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateMyNickname(userId, nickname) {
  const { error } = await supabase
    .from('profiles')
    .update({ nickname })
    .eq('id', userId)
  if (error) throw error
}

// ============================================
// 마이페이지 - 페스티벌 제보 내역
// ============================================

export async function fetchMyFestivalSubmissions(userId) {
  const { data, error } = await supabase
    .from('festival_submissions')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ============================================
// 마이페이지 - 내 문의 내역 (답변 포함)
// ============================================

export async function fetchMyInquiries(userId) {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
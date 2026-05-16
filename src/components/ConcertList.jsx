import ConcertCard from './ConcertCard'
import FestivalCard from './FestivalCard'

export default function ConcertList({
  concerts,
  festivals = [],
  oshiArtistIds = [],
  attendingConcertIds = [],
  festivalAttendingIds = [],
  festivalAttendingList = [],
  isAdmin = false,
  onToggleAttending,
  onToggleAttendingDays,
  onToggleFestivalAttending,
  onEdit,
  onDelete,
  onEditFestival,
  activeFilter,
  emptyMessage = '공연이 없어요',
  emptySubMessage = '',
}) {
  // 페스티벌 필터
  if (activeFilter === 'festival') {
    if (!festivals || festivals.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-30">🎪</div>
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">등록된 페스티벌이 없어요</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">제보 탭에서 알려주세요</p>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {festivals.map(festival => (
          <FestivalCard
            key={festival.id}
            festival={festival}
            isAdmin={isAdmin}
            onEdit={onEditFestival}
            attendingDates={festivalAttendingList?.filter(a => a.festival_id === festival.id).map(a => a.date) || []}
            onToggleAttending={onToggleFestivalAttending}
          />
        ))}
      </div>
    )
  }

  // 일반 공연 목록
  if (!concerts || concerts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3 opacity-30">🎤</div>
        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">{emptyMessage}</p>
        {emptySubMessage && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">{emptySubMessage}</p>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {concerts.map(concert => {
        const isOshi = oshiArtistIds.includes(concert.artist_id)
        const isAttending = concert.is_tour
  ? concert.tour_concerts?.flatMap(tc => tc.series_dates || [{ id: tc.id }])
      .some(d => attendingConcertIds.includes(d.id))
  : concert.is_series
    ? concert.series_dates?.some(d => attendingConcertIds.includes(d.id))
    : attendingConcertIds.includes(concert.id)

        return (
          <ConcertCard
            key={concert.id}
            concert={concert}
            isOshi={isOshi}
            isAttending={isAttending}
            attendingConcertIds={attendingConcertIds}
            isAdmin={isAdmin}
            onToggleAttending={onToggleAttending}
            onToggleAttendingDays={onToggleAttendingDays}
            onEdit={onEdit}
            onDelete={onDelete}
            showPastStyle={activeFilter === 'attending'}
          />
        )
      })}
    </div>
  )
}
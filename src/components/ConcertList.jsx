import ConcertCard from './ConcertCard'

export default function ConcertList({
  concerts,
  oshiArtistIds = [],
  attendingConcertIds = [],
  isAdmin = false,
  onToggleAttending,
  onToggleAttendingDays,
  onEdit,
  onDelete,
  emptyMessage = '공연이 없어요',
  emptySubMessage = '',
}) {
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
        const isAttending = concert.is_series
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
          />
        )
      })}
    </div>
  )
}
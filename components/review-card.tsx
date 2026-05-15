import { Review } from '@/lib/types'
import { StarDisplay } from '@/components/star-rating'

interface ReviewCardProps {
  review: Review
  showDistributor?: boolean
  className?: string
}

export function ReviewCard({ review, showDistributor = false, className }: ReviewCardProps) {
  const date = new Date(review.createdAt).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5${className ? ` ${className}` : ''}`}>
      <div className="flex items-start gap-3">
        {/* Avatar initials */}
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">
            {review.commerceName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">{review.commerceName}</p>
              {showDistributor && (
                <p className="text-xs text-gray-400 mt-0.5">{review.distributorName}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StarDisplay rating={review.ratingGeneral} size="sm" />
              <span className="text-xs text-gray-400">{date}</span>
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              &ldquo;{review.comment}&rdquo;
            </p>
          )}

          {/* Criteria mini-badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <MiniCriteria label="Cumplimiento" value={review.ratingFulfillment} />
            <MiniCriteria label="Entrega" value={review.ratingDelivery} />
            <MiniCriteria label="Mercadería" value={review.ratingProductCondition} />
            <MiniCriteria label="Atención" value={review.ratingCommunication} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniCriteria({ label, value }: { label: string; value: number }) {
  const color =
    value >= 4 ? 'bg-green-50 text-green-700' :
    value === 3 ? 'bg-amber-50 text-amber-700' :
    'bg-red-50 text-red-600'
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label} {value}/5
    </span>
  )
}

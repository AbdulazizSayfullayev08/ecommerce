import { useCallback, useEffect, useState } from 'react'
import { reviewApi } from '@/features/review/reviewApi'
import { useAuth } from '@/features/auth/AuthContext'
import { Alert } from '@/components/ui/Alert'
import type { Review } from '@/types'
import { getFileUrl } from '@/utils/fileUrl'

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'text-2xl' : 'text-sm'
  return (
    <span className={`${cls} leading-none`} aria-label={`${rating} yulduz`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </span>
  )
}

export function ReviewsSection({
  productId,
  onRatingChange,
}: {
  productId: string
  onRatingChange: (avg: number, count: number) => void
}) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState('')

  const load = useCallback(async () => {
    const data = await reviewApi.list(productId, { page })
    setReviews(data.reviews)
    setAverageRating(data.averageRating)
    setRatingCount(data.ratingCount)
    setPages(data.pages)
    onRatingChange(data.averageRating, data.ratingCount)
  }, [productId, page, onRatingChange])

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Sharhlar yuklanmadi')
    )
  }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (editingId) {
        await reviewApi.update(productId, editingId, { rating, comment })
        setInfo('Sharh yangilandi')
        setEditingId('')
      } else {
        await reviewApi.create(productId, { rating, comment })
        setInfo('Sharh qoldirildi')
      }
      setComment('')
      setPage(1)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sharh saqlanmadi')
    } finally {
      setBusy(false)
    }
  }

  async function remove(reviewId: string) {
    setError('')
    setInfo('')
    try {
      await reviewApi.remove(productId, reviewId)
      setInfo('Sharh o\'chirildi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sharh o\'chirilmadi')
    }
  }

  function startEdit(r: Review) {
    setEditingId(r._id)
    setRating(r.rating)
    setComment(r.comment ?? '')
  }

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Sharhlar</h2>
        {ratingCount > 0 && (
          <span className="flex items-center gap-1 text-sm text-gray-600">
            <Stars rating={averageRating} />
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-gray-400">({ratingCount})</span>
          </span>
        )}
      </div>

      {user ? (
        <form onSubmit={submit} className="mt-4 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className={`text-3xl leading-none ${
                  (hover || rating) >= n ? 'text-amber-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Fikringizni yozing (ixtiyoriy)"
            rows={3}
            maxLength={1000}
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">{comment.length}/1000</span>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? 'Saqlanmoqda...' : editingId ? 'Yangilash' : 'Yuborish'}
            </button>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId('')
                setRating(5)
                setComment('')
              }}
              className="mt-1 text-xs text-gray-500 hover:underline"
            >
              Bekor qilish
            </button>
          )}
        </form>
      ) : (
        <p className="mt-3 text-sm text-gray-500">
          Sharh qoldirish uchun <span className="font-medium text-indigo-600">kiring</span>
        </p>
      )}

      {error && <div className="mt-3"><Alert type="error" message={error} /></div>}
      {info && <div className="mt-3"><Alert type="success" message={info} /></div>}

      <div className="mt-4 space-y-3">
        {reviews.map((r) => {
          const rUser = typeof r.user === 'object' ? r.user : null
          const isMine = rUser && user ? rUser._id === (user as { _id: string })._id : false
          return (
            <div key={r._id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {rUser?.avatar && (
                    <img
                      src={getFileUrl(rUser.avatar)}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-800">{rUser?.name ?? 'Foydalanuvchi'}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  {isMine && (
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => startEdit(r)} className="font-medium text-indigo-600 hover:underline">
                        Tahrirlash
                      </button>
                      <button onClick={() => void remove(r._id)} className="font-medium text-red-500 hover:underline">
                        O\'chirish
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {r.comment && <p className="mt-2 text-sm text-gray-600">{r.comment}</p>}
            </div>
          )
        })}
        {reviews.length === 0 && (
          <p className="text-sm text-gray-400">Hozircha sharhlar yo'q. Birinchi bo'ling!</p>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="font-medium text-indigo-600 hover:underline disabled:opacity-40"
          >
            ← Oldingi
          </button>
          <span className="text-gray-500">
            {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="font-medium text-indigo-600 hover:underline disabled:opacity-40"
          >
            Keyingi →
          </button>
        </div>
      )}
    </div>
  )
}

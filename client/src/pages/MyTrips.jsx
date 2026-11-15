import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarX, Luggage, MapPin } from 'lucide-react';
import { api, fdate, money, onImgError } from '../api';
import Stars from '../components/Stars';
import { ConfirmDialog, Modal, useToast } from '../components/ui';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const EMPTY = {
  upcoming: ['No trips booked... yet!', "Time to dust off your bags and start planning your next adventure."],
  past: ['No past trips', 'Once you have completed a stay, it will show up here so you can review it.'],
  cancelled: ['No cancelled trips', 'Reservations you cancel will be listed here.'],
};

function TripSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#DDDDDD] p-4 sm:flex-row">
      <div className="skeleton h-40 w-full !rounded-lg sm:w-56" />
      <div className="flex-1 space-y-3">
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-4 w-1/4" />
      </div>
    </div>
  );
}

export default function MyTrips() {
  const loc = useLocation();
  const nav = useNavigate();
  const [toast, showToast] = useToast();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');
  const [cancelling, setCancelling] = useState(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewErr, setReviewErr] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  const load = () => api('/bookings/mine').then(setRows).catch((e) => setError(e.message));

  useEffect(() => {
    load();
    if (loc.state?.toast) { showToast(loc.state.toast); nav('/trips', { replace: true, state: null }); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toISOString().slice(0, 10);
  const group = (b) => (b.status === 'CANCELLED' ? 'cancelled' : b.endDate.slice(0, 10) < today ? 'past' : 'upcoming');
  const buckets = { upcoming: [], past: [], cancelled: [] };
  (rows || []).forEach((b) => buckets[group(b)].push(b));
  const list = buckets[tab];

  const doCancel = async () => {
    setCancelBusy(true);
    try { await api('/bookings/' + cancelling.id, { method: 'DELETE' }); showToast('Reservation cancelled'); setCancelling(null); await load(); }
    catch (e) { showToast(e.message); }
    setCancelBusy(false);
  };

  const openReview = (b) => { setReviewing(b); setRating(0); setComment(''); setReviewErr(''); };
  const submitReview = async () => {
    if (!rating) return setReviewErr('Please choose a star rating.');
    setReviewBusy(true); setReviewErr('');
    try {
      await api('/reviews', { method: 'POST', body: { bookingId: reviewing.id, rating, comment } });
      setReviewing(null); showToast('Thanks for your review!'); await load();
    } catch (e) { setReviewErr(e.message); }
    setReviewBusy(false);
  };

  return (
    <div className="mx-auto max-w-4xl">
      {toast}
      <h1 className="text-[32px] font-semibold">Trips</h1>

      <div className="mt-6 flex gap-2 border-b border-[#DDDDDD]">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} aria-pressed={tab === t.key}
            className={`-mb-px border-b-2 px-4 pb-3 pt-2 text-sm font-semibold ${tab === t.key ? 'border-[#222222] text-[#222222]' : 'border-transparent text-[#717171] hover:text-[#222222]'}`}>
            {t.label}{rows ? <span className="ml-2 rounded-full bg-[#F7F7F7] px-2 py-0.5 text-xs">{buckets[t.key].length}</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {error ? (
          <p className="rounded-lg bg-[#FFF1F0] p-4 text-[#C13515]">{error}</p>
        ) : !rows ? (
          [0, 1, 2].map((i) => <TripSkeleton key={i} />)
        ) : list.length === 0 ? (
          <div className="mx-auto max-w-sm py-16 text-center">
            {tab === 'cancelled' ? <CalendarX size={44} className="mx-auto text-[#717171]" /> : <Luggage size={44} className="mx-auto text-[#717171]" />}
            <h2 className="mt-4 text-xl font-semibold">{EMPTY[tab][0]}</h2>
            <p className="mt-2 text-[#717171]">{EMPTY[tab][1]}</p>
            {tab === 'upcoming' && <Link to="/" className="mt-6 inline-block rounded-lg bg-[#222222] px-6 py-3 font-semibold text-white hover:bg-black">Start searching</Link>}
          </div>
        ) : (
          list.map((b) => {
            const nights = Math.round((new Date(b.endDate) - new Date(b.startDate)) / 864e5);
            const state = group(b);
            return (
              <div key={b.id} className="rounded-xl border border-[#DDDDDD] p-4 transition-shadow duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link to={`/listings/${b.listing.id}`} className="block h-40 w-full shrink-0 overflow-hidden rounded-lg sm:w-56">
                    <img src={b.listing.images[0]} onError={onImgError} alt="" className={`h-full w-full object-cover transition-transform duration-300 hover:scale-105 ${state === 'cancelled' ? 'grayscale' : ''}`} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${state === 'upcoming' ? 'bg-[#E8F5E9] text-[#1B7F3B]' : state === 'past' ? 'bg-[#F7F7F7] text-[#717171]' : 'bg-[#FFF1F0] text-[#C13515]'}`}>
                      {state === 'upcoming' ? 'Confirmed' : state === 'past' ? 'Completed' : 'Cancelled'}
                    </span>
                    <Link to={`/listings/${b.listing.id}`} className="mt-2 block truncate text-lg font-semibold hover:underline">{b.listing.title}</Link>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-[#717171]"><MapPin size={14} /> {b.listing.location}</p>
                    <p className="mt-3 text-[15px]">{fdate(b.startDate)} – {fdate(b.endDate)} · {nights} night{nights > 1 ? 's' : ''}</p>
                    <p className={`text-[15px] font-semibold ${state === 'cancelled' ? 'text-[#717171] line-through' : ''}`}>{money(b.totalPrice)} total</p>
                  </div>

                  {b.status === 'CONFIRMED' && (
                    <div className="flex gap-2 sm:flex-col">
                      {!b.review && (
                        <button onClick={() => openReview(b)} className="flex-1 rounded-lg border border-[#222222] px-4 py-2 text-sm font-semibold hover:bg-[#F7F7F7]">
                          Leave a review
                        </button>
                      )}
                      {state === 'upcoming' && (
                        <button onClick={() => setCancelling(b)} className="flex-1 rounded-lg border border-[#DDDDDD] px-4 py-2 text-sm font-semibold text-[#C13515] hover:border-[#C13515] hover:bg-[#FFF1F0]">
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {b.review && (
                  <div className="mt-4 rounded-lg bg-[#F7F7F7] p-4">
                    <p className="mb-1 text-xs font-semibold text-[#717171]">Your review</p>
                    <Stars value={b.review.rating} size={16} />
                    <p className="mt-2 text-sm">{b.review.comment}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!cancelling}
        title="Cancel reservation"
        message={cancelling ? `Cancel your stay at "${cancelling.listing.title}" (${fdate(cancelling.startDate)} – ${fdate(cancelling.endDate)})? The dates will open up for other guests.` : ''}
        confirmLabel="Cancel reservation"
        cancelLabel="Keep reservation"
        danger
        busy={cancelBusy}
        onConfirm={doCancel}
        onCancel={() => setCancelling(null)}
      />

      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title="Leave a review"
        footer={
          <div className="flex justify-end">
            <button onClick={submitReview} disabled={reviewBusy} className="btn-gradient flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-lg px-6">
              {reviewBusy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              Submit review
            </button>
          </div>
        }
      >
        {reviewing && (
          <div>
            <p className="font-semibold">{reviewing.listing.title}</p>
            <p className="text-sm text-[#717171]">{reviewing.listing.location}</p>
            <p className="mb-2 mt-6 text-sm font-semibold">Overall rating</p>
            <Stars value={rating} onChange={setRating} size={36} />
            <p className="mb-2 mt-6 text-sm font-semibold">Tell others about your stay</p>
            <textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 500))} rows={4} placeholder="What did you love? Anything future guests should know?" className="input" />
            <p className="mt-1 text-right text-xs text-[#717171]">{comment.length}/500</p>
            {reviewErr && <p role="alert" className="mt-2 text-sm text-[#C13515]">{reviewErr}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}

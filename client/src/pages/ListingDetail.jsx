import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Bed, Briefcase, Car, Check, ChevronLeft, ChevronRight, Coffee, Dumbbell, Flame, Heart, LayoutGrid,
  MapPin, Mountain, Share, Snowflake, Sparkles, Star, Tv, Users, UtensilsCrossed, Waves, Wifi,
} from 'lucide-react';
import { api, fdate, money, onImgError } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../components/ui';

const DAY = 864e5;
const addDays = (s, n) => new Date(new Date(s).getTime() + n * DAY).toISOString().slice(0, 10);

const iconFor = (a) => {
  const s = a.toLowerCase();
  if (s.includes('wifi')) return Wifi;
  if (/pool|beach|sea/.test(s)) return Waves;
  if (s.includes('kitchen')) return UtensilsCrossed;
  if (/fire|bonfire|heating/.test(s)) return Flame;
  if (/air/.test(s)) return Snowflake;
  if (/park|bike|pickup/.test(s)) return Car;
  if (s.includes('gym')) return Dumbbell;
  if (/breakfast|coffee/.test(s)) return Coffee;
  if (/view|mountain/.test(s)) return Mountain;
  if (s.includes('tv')) return Tv;
  if (s.includes('work')) return Briefcase;
  if (/spa|butler/.test(s)) return Sparkles;
  return Check;
};

/* bento layouts for 1..5 photos on a 4x2 grid */
const LAYOUTS = {
  1: ['col-span-4 row-span-2'],
  2: ['col-span-2 row-span-2', 'col-span-2 row-span-2'],
  3: ['col-span-2 row-span-2', 'col-span-2', 'col-span-2'],
  4: ['col-span-2 row-span-2', 'col-span-2', 'col-span-1', 'col-span-1'],
  5: ['col-span-2 row-span-2', '', '', '', ''],
};

const readWish = () => { try { return JSON.parse(localStorage.getItem('wishlist')) || []; } catch { return []; } };

/* ----------------------- full-screen photo tour ----------------------- */
function PhotoTour({ images, start, title, onClose }) {
  const [i, setI] = useState(start);
  const n = images.length;
  const go = (d) => setI((p) => (p + d + n) % n);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const arrow = 'absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[#DDDDDD] bg-white shadow-md hover:scale-105 hover:shadow-lg';

  return (
    <div className="fixed inset-0 z-[70] flex animate-fade flex-col bg-white" role="dialog" aria-modal="true" aria-label="Photo tour">
      <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-8">
        <button onClick={onClose} aria-label="Close photo tour" className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#F7F7F7]">
          <ChevronLeft size={20} />
        </button>
        <p className="max-w-[60%] truncate text-sm font-semibold">{title} <span className="ml-2 font-normal text-[#717171]">{i + 1} / {n}</span></p>
        <span className="w-10" />
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
        {n > 1 && <button aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-3 sm:left-6`}><ChevronLeft size={20} /></button>}
        <img key={i} src={images[i]} onError={onImgError} alt={`${title} photo ${i + 1}`} className="max-h-full max-w-full animate-fade rounded-lg object-contain" />
        {n > 1 && <button aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-3 sm:right-6`}><ChevronRight size={20} /></button>}
      </div>

      <div className="no-scrollbar flex shrink-0 justify-center gap-2 overflow-x-auto p-4">
        {images.map((src, n2) => (
          <button key={n2} onClick={() => setI(n2)} aria-label={`Go to photo ${n2 + 1}`}
            className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${n2 === i ? 'border-[#222222]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
            <img src={src} onError={onImgError} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ skeleton ------------------------------ */
function DetailSkeleton() {
  return (
    <div>
      <div className="skeleton h-8 w-2/3" />
      <div className="skeleton mt-3 h-4 w-1/3" />
      <div className="skeleton mt-6 h-[300px] w-full !rounded-xl sm:h-[420px]" />
      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="skeleton h-7 w-1/2" />
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton mt-8 h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-4/5" />
        </div>
        <div className="skeleton h-[380px] w-full !rounded-xl" />
      </div>
    </div>
  );
}

/* ------------------------------- page ------------------------------- */
export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [params] = useSearchParams();
  const [toast, showToast] = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [l, setL] = useState(null);
  const [error, setError] = useState('');
  const [tour, setTour] = useState(null); // photo index or null
  const [liked, setLiked] = useState(false);
  const [moreDesc, setMoreDesc] = useState(false);
  const [moreAmen, setMoreAmen] = useState(false);
  const [moreRev, setMoreRev] = useState(false);

  const qIn = params.get('checkIn') || '';
  const qOut = params.get('checkOut') || '';
  const [start, setStart] = useState(qIn >= today ? qIn : '');
  const [end, setEnd] = useState(qIn >= today && qOut > qIn ? qOut : '');
  const [guestCount, setGuestCount] = useState(1);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let dead = false;
    setL(null); setError('');
    api('/listings/' + id)
      .then((d) => {
        if (dead) return;
        setL(d);
        setLiked(readWish().includes(d.id));
        const g = parseInt(params.get('guests'), 10) || 1;
        setGuestCount(Math.min(Math.max(g, 1), d.guests));
      })
      .catch((e) => !dead && setError(e.message));
    window.scrollTo(0, 0);
    return () => { dead = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="mx-auto mt-20 max-w-md text-center">
        <h1 className="text-2xl font-semibold">Listing unavailable</h1>
        <p className="mt-2 text-[#717171]">{error}</p>
        <button onClick={() => nav('/')} className="mt-6 rounded-lg bg-[#222222] px-6 py-3 font-semibold text-white hover:bg-black">Back to home</button>
      </div>
    );
  }
  if (!l) return <DetailSkeleton />;

  /* derived */
  const imgs = l.images;
  const n = Math.min(imgs.length, 5);
  const layout = LAYOUTS[n];
  const nights = start && end ? Math.round((new Date(end) - new Date(start)) / DAY) : 0;
  const invalid = !!(start && end && nights < 1);
  const clash = nights > 0 && l.bookings.some((b) => new Date(b.startDate) < new Date(end) && new Date(b.endDate) > new Date(start));
  const own = !!user && user.id === l.hostId;
  const total = nights * l.price;
  const canReserve = nights > 0 && !invalid && !clash && !own;

  const toggleLike = () => {
    const list = readWish();
    const next = list.includes(l.id) ? list.filter((x) => x !== l.id) : [...list, l.id];
    try { localStorage.setItem('wishlist', JSON.stringify(next)); } catch { /* ignore */ }
    setLiked(next.includes(l.id));
    showToast(next.includes(l.id) ? 'Saved to your wishlist' : 'Removed from your wishlist');
  };

  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); showToast('Link copied to clipboard'); }
    catch { showToast('Copy the link from your address bar'); }
  };

  const reserve = async () => {
    if (!user) return nav('/login', { state: { from: loc.pathname + loc.search } });
    setBusy(true); setMsg('');
    try {
      await api('/bookings', { method: 'POST', body: { listingId: l.id, startDate: start, endDate: end } });
      nav('/trips', { state: { toast: 'Reservation confirmed. Have a great stay!' } });
    } catch (e) { setMsg(e.message); setBusy(false); }
  };

  const desc = l.description;
  const longDesc = desc.length > 260;
  const amenList = moreAmen ? l.amenities : l.amenities.slice(0, 6);
  const reviews = moreRev ? l.reviews : l.reviews.slice(0, 4);
  const iconBtn = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold underline hover:bg-[#F7F7F7]';

  return (
    <div className="pb-24 lg:pb-0">
      {toast}
      {tour !== null && <PhotoTour images={imgs} start={tour} title={l.title} onClose={() => setTour(null)} />}

      {/* title row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold sm:text-[26px]">{l.title}</h1>
        <div className="flex items-center">
          <button onClick={share} className={iconBtn}><Share size={16} /> Share</button>
          <button onClick={toggleLike} aria-pressed={liked} className={iconBtn}>
            <Heart size={16} className={liked ? 'fill-[#FF385C] text-[#FF385C]' : ''} /> {liked ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* bento gallery */}
      <div className="relative mt-5">
        <button onClick={() => setTour(0)} className="block aspect-[4/3] w-full overflow-hidden rounded-xl sm:hidden">
          <img src={imgs[0]} onError={onImgError} alt={l.title} className="h-full w-full object-cover" />
        </button>
        <div className="hidden h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl sm:grid">
          {imgs.slice(0, n).map((src, k) => (
            <button key={k} onClick={() => setTour(k)} aria-label={`Open photo ${k + 1}`} className={`group relative overflow-hidden bg-[#F7F7F7] active:scale-100 ${layout[k]}`}>
              <img src={src} onError={onImgError} alt={k === 0 ? l.title : ''} className="h-full w-full object-cover transition-all duration-300 group-hover:brightness-90" />
            </button>
          ))}
        </div>
        <button onClick={() => setTour(0)}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-[#222222] bg-white px-4 py-1.5 text-sm font-semibold shadow-sm hover:bg-[#F7F7F7]">
          <LayoutGrid size={16} /> Show all photos
        </button>
      </div>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_380px]">
        {/* ------------ left column ------------ */}
        <div>
          <h2 className="text-[22px] font-semibold">{l.category} stay in {l.location}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[#222222]">
            <span className="flex items-center gap-1"><Users size={16} /> {l.guests} guests</span> ·
            <span className="flex items-center gap-1"><Bed size={16} /> {l.bedrooms} bedroom{l.bedrooms > 1 ? 's' : ''}</span>
          </p>
          <p className="mt-2 flex items-center gap-1 text-sm">
            <Star size={14} className="fill-[#222222]" />
            <span className="font-semibold">{l.rating ?? 'New'}</span>
            {l.reviewCount > 0 && <><span>·</span><a href="#reviews" className="font-semibold underline">{l.reviewCount} review{l.reviewCount > 1 ? 's' : ''}</a></>}
          </p>

          <div className="mt-6 flex items-center gap-4 border-y border-[#DDDDDD] py-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#222222] text-lg font-semibold text-white">{l.host.name[0].toUpperCase()}</span>
            <div>
              <p className="font-semibold">Hosted by {l.host.name}</p>
              <p className="text-sm text-[#717171]">Joined {new Date(l.host.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {/* description */}
          <div className="border-b border-[#DDDDDD] py-8">
            <p className={`whitespace-pre-line leading-relaxed ${longDesc && !moreDesc ? 'line-clamp-4' : ''}`}>{desc}</p>
            {longDesc && (
              <button onClick={() => setMoreDesc(!moreDesc)} className="mt-3 flex items-center gap-1 font-semibold underline">
                {moreDesc ? 'Show less' : 'Show more'} <ChevronRight size={16} className={moreDesc ? '-rotate-90' : 'rotate-90'} />
              </button>
            )}
          </div>

          {/* amenities */}
          <div className="border-b border-[#DDDDDD] py-8">
            <h2 className="mb-5 text-[22px] font-semibold">What this place offers</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {amenList.map((a) => {
                const Icon = iconFor(a);
                return <li key={a} className="flex items-center gap-4"><Icon size={24} strokeWidth={1.6} />{a}</li>;
              })}
            </ul>
            {l.amenities.length > 6 && (
              <button onClick={() => setMoreAmen(!moreAmen)} className="mt-6 rounded-lg border border-[#222222] px-6 py-3 font-semibold hover:bg-[#F7F7F7]">
                {moreAmen ? 'Show fewer amenities' : `Show all ${l.amenities.length} amenities`}
              </button>
            )}
          </div>

          {/* reviews */}
          <div id="reviews" className="scroll-mt-28 py-8">
            <h2 className="mb-6 flex items-center gap-2 text-[22px] font-semibold">
              <Star size={20} className="fill-[#222222]" />
              {l.reviewCount > 0 ? `${l.rating} · ${l.reviewCount} review${l.reviewCount > 1 ? 's' : ''}` : 'No reviews (yet)'}
            </h2>
            {l.reviewCount === 0 ? (
              <p className="text-[#717171]">Be the first to stay here and share your experience.</p>
            ) : (
              <>
                <div className="grid gap-x-16 gap-y-8 sm:grid-cols-2">
                  {reviews.map((r) => (
                    <div key={r.id}>
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#717171] font-semibold text-white">{r.user.name[0].toUpperCase()}</span>
                        <div>
                          <p className="font-semibold">{r.user.name}</p>
                          <p className="text-sm text-[#717171]">{new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <p className="mt-2 flex">
                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} className={s <= r.rating ? 'fill-[#222222]' : 'text-[#DDDDDD]'} />)}
                      </p>
                      <p className="mt-2 text-[15px] leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
                {l.reviews.length > 4 && (
                  <button onClick={() => setMoreRev(!moreRev)} className="mt-8 rounded-lg border border-[#222222] px-6 py-3 font-semibold hover:bg-[#F7F7F7]">
                    {moreRev ? 'Show fewer reviews' : `Show all ${l.reviews.length} reviews`}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="border-t border-[#DDDDDD] py-8">
            <h2 className="mb-2 text-[22px] font-semibold">Where you'll be</h2>
            <p className="flex items-center gap-2 text-[#222222]"><MapPin size={18} /> {l.location}</p>
          </div>
        </div>

        {/* ------------ sticky booking card ------------ */}
        <aside id="booking-card" className="scroll-mt-28">
          <div className="sticky top-28 rounded-xl border border-[#DDDDDD] p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
            <p className="flex items-baseline gap-1">
              <span className="text-[22px] font-semibold">{money(l.price)}</span>
              <span className="text-[#222222]">night</span>
            </p>

            <div className="mt-5 overflow-hidden rounded-lg border border-[#B0B0B0]">
              <div className="grid grid-cols-2">
                <label className="cursor-pointer border-b border-r border-[#B0B0B0] p-3 transition-colors hover:bg-[#F7F7F7]">
                  <span className="block text-[10px] font-bold uppercase">Check-in</span>
                  <input type="date" min={today} value={start} className="w-full cursor-pointer bg-transparent text-sm outline-none"
                    onChange={(e) => { setStart(e.target.value); setMsg(''); if (end && e.target.value >= end) setEnd(''); }} />
                </label>
                <label className="cursor-pointer border-b border-[#B0B0B0] p-3 transition-colors hover:bg-[#F7F7F7]">
                  <span className="block text-[10px] font-bold uppercase">Check-out</span>
                  <input type="date" min={start ? addDays(start, 1) : addDays(today, 1)} value={end} className="w-full cursor-pointer bg-transparent text-sm outline-none"
                    onChange={(e) => { setEnd(e.target.value); setMsg(''); }} />
                </label>
              </div>
              <label className="block p-3 transition-colors hover:bg-[#F7F7F7]">
                <span className="block text-[10px] font-bold uppercase">Guests</span>
                <select value={guestCount} onChange={(e) => setGuestCount(+e.target.value)} className="w-full cursor-pointer bg-transparent text-sm outline-none">
                  {Array.from({ length: l.guests }, (_, k) => k + 1).map((g) => <option key={g} value={g}>{g} guest{g > 1 ? 's' : ''}</option>)}
                </select>
              </label>
            </div>

            {invalid && <p className="mt-3 text-sm text-[#C13515]">Check-out must be after check-in.</p>}
            {clash && <p className="mt-3 text-sm text-[#C13515]">These dates overlap an existing booking. Please pick different dates.</p>}
            {msg && <p role="alert" className="mt-3 text-sm text-[#C13515]">{msg}</p>}

            <button onClick={reserve} disabled={busy || (!!user && !canReserve)}
              className="btn-gradient mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg text-base">
              {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {own ? 'This is your listing' : busy ? 'Reserving...' : nights > 0 ? 'Reserve' : user ? 'Check availability' : 'Log in to reserve'}
            </button>
            <p className="mt-3 text-center text-sm text-[#717171]">You won't be charged yet</p>

            {nights > 0 && !clash && !invalid && (
              <div className="mt-5 space-y-3 text-[15px]">
                <div className="flex justify-between"><span className="underline">{money(l.price)} x {nights} night{nights > 1 ? 's' : ''}</span><span>{money(total)}</span></div>
                <div className="flex justify-between"><span className="underline">Taxes and fees</span><span className="text-[#717171]">Included</span></div>
                <div className="flex justify-between border-t border-[#DDDDDD] pt-4 text-base font-semibold"><span>Total</span><span>{money(total)}</span></div>
              </div>
            )}

            {l.bookings.length > 0 && (
              <div className="mt-5 border-t border-[#DDDDDD] pt-4 text-xs text-[#717171]">
                <p className="mb-1 font-semibold text-[#222222]">Already booked</p>
                {l.bookings.map((b, k) => <p key={k}>{fdate(b.startDate)} – {fdate(b.endDate)}</p>)}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* mobile reserve bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-[#DDDDDD] bg-white px-4 py-3 lg:hidden">
        <div>
          <p className="font-semibold">{money(l.price)} <span className="font-normal">night</span></p>
          {nights > 0 && !clash && <p className="text-xs text-[#717171]">{money(total)} total</p>}
        </div>
        <button onClick={() => document.getElementById('booking-card')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-gradient h-11 rounded-lg px-8">{nights > 0 ? 'Reserve' : 'Select dates'}</button>
      </div>
    </div>
  );
}

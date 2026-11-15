import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import { money, onImgError } from '../api';

/* Wishlist lives in localStorage (per browser) */
const KEY = 'wishlist';
const readWishlist = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const writeWishlist = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* ignore */ } };

export function ListingCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-square w-full !rounded-xl" />
      <div className="mt-3 flex justify-between gap-6">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-4 w-10" />
      </div>
      <div className="skeleton mt-2 h-4 w-1/2" />
      <div className="skeleton mt-2 h-4 w-2/5" />
      <div className="skeleton mt-3 h-4 w-1/3" />
    </div>
  );
}

export default function ListingCard({ l, nights = 0 }) {
  const imgs = l.images.slice(0, 5);
  const [i, setI] = useState(0);
  const [liked, setLiked] = useState(() => readWishlist().includes(l.id));
  const [pop, setPop] = useState(false);
  const touchX = useRef(null);

  const swallow = (e, fn) => { e.preventDefault(); e.stopPropagation(); fn(); };
  const go = (d) => setI((p) => Math.min(Math.max(p + d, 0), imgs.length - 1));

  const toggleLike = () => {
    const list = readWishlist();
    const next = list.includes(l.id) ? list.filter((x) => x !== l.id) : [...list, l.id];
    writeWishlist(next);
    setLiked(next.includes(l.id));
    setPop(true);
    setTimeout(() => setPop(false), 220);
  };

  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  const arrow = 'absolute top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#222222] opacity-0 shadow-md hover:scale-105 hover:bg-white group-hover:opacity-100';
  const favourite = l.rating >= 4.8 && l.reviewCount > 0;

  return (
    <Link to={`/listings/${l.id}`} className="group block">
      {/* image carousel */}
      <div
        className="relative aspect-square overflow-hidden rounded-xl bg-[#F7F7F7]"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
          {imgs.map((src, n) => (
            <img key={n} src={src} onError={onImgError} alt={n === 0 ? l.title : ''} loading="lazy" draggable={false}
              className="h-full w-full shrink-0 object-cover" />
          ))}
        </div>

        {favourite && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-md">Guest favourite</span>
        )}

        {/* wishlist heart */}
        <button type="button" aria-label={liked ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={liked}
          onClick={(e) => swallow(e, toggleLike)}
          className={`absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full hover:scale-110 ${pop ? 'scale-125' : ''}`}>
          <Heart size={24} strokeWidth={2}
            className={`drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-colors duration-200 ${liked ? 'fill-[#FF385C] text-[#FF385C]' : 'fill-black/50 text-white'}`} />
        </button>

        {/* arrows */}
        {i > 0 && (
          <button type="button" aria-label="Previous photo" onClick={(e) => swallow(e, () => go(-1))} className={`${arrow} left-2`}>
            <ChevronLeft size={16} />
          </button>
        )}
        {i < imgs.length - 1 && (
          <button type="button" aria-label="Next photo" onClick={(e) => swallow(e, () => go(1))} className={`${arrow} right-2`}>
            <ChevronRight size={16} />
          </button>
        )}

        {/* dots */}
        {imgs.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">
            {imgs.map((_, n) => (
              <span key={n} className={`h-1.5 rounded-full bg-white transition-all duration-200 ${n === i ? 'w-1.5' : 'w-1.5 opacity-60'} ${Math.abs(n - i) > 2 ? 'hidden' : ''}`} />
            ))}
          </div>
        )}
      </div>

      {/* details */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="truncate text-[15px] font-semibold leading-5 text-[#222222]">{l.location}</h3>
        <span className="flex shrink-0 items-center gap-1 text-[15px] leading-5">
          <Star size={13} className="fill-[#222222] text-[#222222]" />
          {l.rating ?? 'New'}
        </span>
      </div>
      <p className="truncate text-[15px] leading-5 text-[#717171]">{l.title}</p>
      <p className="truncate text-[15px] leading-5 text-[#717171]">
        Hosted by {l.host?.name?.split(' ')[0] || 'host'} · {l.bedrooms} bedroom{l.bedrooms > 1 ? 's' : ''}
      </p>
      <p className="mt-1 text-[15px] leading-5 text-[#222222]">
        {nights > 0 ? (
          <>
            <span className="font-semibold">{money(l.price * nights)}</span> total <span className="text-[#717171]">for {nights} night{nights > 1 ? 's' : ''}</span>
          </>
        ) : (
          <>
            <span className="font-semibold">{money(l.price)}</span> night
          </>
        )}
      </p>
    </Link>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Globe, Menu, Minus, Plus, Search, User, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { onImgError } from '../api';
import AuthModal from './AuthModal';

/* ------------------------------------------------------------------ */
/* Logo: B\u00e9lo symbol (hand-drawn approximation) + lowercase wordmark  */
/* ------------------------------------------------------------------ */
export function Logo({ className = '' }) {
  return (
    <span className={`flex items-center gap-1 text-[#FF385C] ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d="M16 21.8C14 24.6 11.6 27.2 9 26.4C6.2 25.5 5.8 22 7.6 18.2C9 15.2 11.4 9.4 14 5C14.9 3.4 17.1 3.4 18 5C20.6 9.4 23 15.2 24.4 18.2C26.2 22 25.8 25.5 23 26.4C20.4 27.2 18 24.6 16 21.8Z" />
        <path d="M16 19.8c-1.6-2-2.6-3.8-2.6-5.2a2.6 2.6 0 0 1 5.2 0c0 1.4-1 3.2-2.6 5.2z" />
      </svg>
      <span className="hidden text-[26px] font-extrabold lowercase leading-none lg:block" style={{ letterSpacing: '-0.045em' }}>
        airbnb
      </span>
    </span>
  );
}

/* ----------------------------- helpers ----------------------------- */
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const short = (s) => parse(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const pic = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=300&q=70`;

const REGIONS = [
  { label: "I'm flexible", value: '', img: pic('photo-1488646953014-85cb44e25828') },
  { label: 'Europe', value: 'Europe', img: pic('photo-1499856871958-5b9627545d1a') },
  { label: 'Goa', value: 'Goa', img: pic('photo-1507525428034-b723cf961d3e') },
  { label: 'Himachal', value: 'Himachal', img: pic('photo-1506905925346-21bda4d32df4') },
  { label: 'Kerala', value: 'Kerala', img: pic('photo-1602216056096-3b40cc0c9944') },
];

const GUEST_ROWS = [
  { key: 'adults', title: 'Adults', sub: 'Ages 13 or above' },
  { key: 'children', title: 'Children', sub: 'Ages 2\u201312' },
  { key: 'infants', title: 'Infants', sub: 'Under 2' },
];

const LANGS = ['English (India)', 'English (US)', '\u0939\u093f\u0928\u094d\u0926\u0940', '\u092e\u0930\u093e\u0920\u0940', '\u0ba4\u0bae\u0bbf\u0bb4\u0bcd', 'Fran\u00e7ais'];

/* --------------------------- calendar UI --------------------------- */
function Month({ date, start, end, hover, setHover, onPick, todayISO, className = '' }) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const offset = new Date(y, m, 1).getDay();
  const count = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(offset).fill(0), ...Array.from({ length: count }, (_, i) => i + 1)];
  const tail = end || (start && hover > start ? hover : '');

  return (
    <div className={className}>
      <p className="mb-4 text-center text-[15px] font-semibold">
        {date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
      </p>
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-[#717171]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="py-2">{d}</span>)}
      </div>
      <div className="grid grid-cols-7" onMouseLeave={() => setHover('')}>
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const id = iso(new Date(y, m, d));
          const past = id < todayISO;
          const selected = id === start || id === end;
          const mid = start && tail && id > start && id < tail;
          const bandRight = id === start && tail;
          const bandLeft = start && tail && id === tail && tail !== start;
          return (
            <div key={i} className="relative flex h-12 items-center justify-center">
              {mid && <span className="absolute inset-0 bg-[#F7F7F7]" />}
              {bandRight && <span className="absolute inset-y-0 right-0 w-1/2 bg-[#F7F7F7]" />}
              {bandLeft && <span className="absolute inset-y-0 left-0 w-1/2 bg-[#F7F7F7]" />}
              <button
                type="button"
                disabled={past}
                onMouseEnter={() => setHover(id)}
                onClick={() => onPick(id)}
                aria-label={id}
                className={`relative z-10 h-12 w-12 rounded-full border border-transparent text-sm font-medium ${
                  past
                    ? 'text-[#B0B0B0] line-through'
                    : selected
                    ? 'bg-[#222222] text-white'
                    : 'text-[#222222] hover:border-[#222222]'
                }`}
              >
                {d}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Calendar({ start, end, onPick, onClear }) {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayISO = iso(now);
  const [view, setView] = useState(() => (start ? new Date(parse(start).getFullYear(), parse(start).getMonth(), 1) : thisMonth));
  const [hover, setHover] = useState('');
  const next = new Date(view.getFullYear(), view.getMonth() + 1, 1);
  const go = (n) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  return (
    <div>
      <div className="relative">
        <button type="button" onClick={() => go(-1)} disabled={view <= thisMonth} aria-label="Previous month"
          className="absolute left-0 top-0 z-10 grid h-8 w-8 place-items-center rounded-full hover:bg-[#F7F7F7] disabled:opacity-25 disabled:hover:bg-transparent">
          <ChevronLeft size={18} />
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Next month"
          className="absolute right-0 top-0 z-10 grid h-8 w-8 place-items-center rounded-full hover:bg-[#F7F7F7]">
          <ChevronRight size={18} />
        </button>
        <div className="flex gap-12 px-1">
          <Month date={view} {...{ start, end, hover, setHover, onPick, todayISO }} className="w-full" />
          <Month date={next} {...{ start, end, hover, setHover, onPick, todayISO }} className="hidden w-full md:block" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#DDDDDD] pt-4 text-sm">
        <span className="text-[#717171]">
          {start && end ? `${short(start)} \u2013 ${short(end)}` : start ? 'Now choose a check-out date' : 'Choose your check-in date'}
        </span>
        <button type="button" onClick={onClear} disabled={!start}
          className="rounded-lg px-3 py-2 font-semibold underline hover:bg-[#F7F7F7] disabled:opacity-40 disabled:no-underline disabled:hover:bg-transparent">
          Clear dates
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ small UI ------------------------------ */
const MenuItem = ({ onClick, strong, children }) => (
  <button onClick={onClick}
    className={`block w-full px-4 py-3 text-left text-sm hover:bg-[#F7F7F7] active:scale-100 ${strong ? 'font-semibold' : ''}`}>
    {children}
  </button>
);

const Stepper = ({ onMinus, onPlus, value, minusOff, plusOff, label }) => (
  <div className="flex items-center gap-4">
    <button type="button" onClick={onMinus} disabled={minusOff} aria-label={`Decrease ${label}`}
      className="grid h-8 w-8 place-items-center rounded-full border border-[#B0B0B0] text-[#717171] hover:border-[#222222] hover:text-[#222222] disabled:opacity-30 disabled:hover:border-[#B0B0B0] disabled:hover:text-[#717171]">
      <Minus size={14} />
    </button>
    <span className="w-5 text-center text-base">{value}</span>
    <button type="button" onClick={onPlus} disabled={plusOff} aria-label={`Increase ${label}`}
      className="grid h-8 w-8 place-items-center rounded-full border border-[#B0B0B0] text-[#717171] hover:border-[#222222] hover:text-[#222222] disabled:opacity-30 disabled:hover:border-[#B0B0B0] disabled:hover:text-[#717171]">
      <Plus size={14} />
    </button>
  </div>
);

/* ------------------------------- Navbar ------------------------------- */
export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const headerRef = useRef(null);
  const whereRef = useRef(null);

  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(null); // 'where' | 'in' | 'out' | 'who'
  const [menu, setMenu] = useState(null); // 'user' | 'lang'
  const [lang, setLang] = useState(LANGS[0]);
  const [where, setWhere] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [g, setG] = useState({ adults: 0, children: 0, infants: 0 });
  const [auth, setAuth] = useState({ open: false, mode: 'login', redirect: null });

  const openAuth = (mode, redirect = null) => { setMenu(null); setAuth({ open: true, mode, redirect }); };

  /* labels */
  const total = g.adults + g.children;
  const guestLabel = total || g.infants
    ? [total ? `${total} guest${total > 1 ? 's' : ''}` : '', g.infants ? `${g.infants} infant${g.infants > 1 ? 's' : ''}` : ''].filter(Boolean).join(', ')
    : 'Add guests';
  const dateLabel = checkIn && checkOut ? `${short(checkIn)} \u2013 ${short(checkOut)}` : checkIn ? `${short(checkIn)} \u2013 Add date` : '';

  /* close on outside click, Escape, scroll */
  useEffect(() => {
    const closeAll = () => { setExpanded(false); setActive(null); setMenu(null); };
    const onDown = (e) => { if (headerRef.current && !headerRef.current.contains(e.target)) closeAll(); };
    const onKey = (e) => { if (e.key === 'Escape') closeAll(); };
    const onScroll = () => { if (window.scrollY > 8) { setExpanded(false); setActive(null); } };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  /* keep the search bar in sync with the URL on the home page */
  useEffect(() => {
    if (loc.pathname !== '/') return;
    const p = new URLSearchParams(loc.search);
    setWhere(p.get('location') || '');
    setCheckIn(p.get('checkIn') || '');
    setCheckOut(p.get('checkOut') || '');
    const n = parseInt(p.get('guests'), 10) || 0;
    setG((prev) => (prev.adults + prev.children === n ? prev : { adults: n, children: 0, infants: 0 }));
  }, [loc.pathname, loc.search]);

  /* /login and /signup (e.g. from protected-route redirects) open the modal instead */
  useEffect(() => {
    if (loading) return;
    if (loc.pathname === '/login' || loc.pathname === '/signup') {
      if (!user) openAuth(loc.pathname === '/login' ? 'login' : 'signup', loc.state?.from || null);
      nav('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, loading]);

  /* search bar actions */
  const openSearch = (k) => {
    setMenu(null);
    setExpanded(true);
    setActive(k);
    if (k === 'where') setTimeout(() => whereRef.current?.focus(), 80);
  };

  const pickDate = (id) => {
    if (!checkIn || (checkIn && checkOut)) { setCheckIn(id); setCheckOut(''); setActive('out'); }
    else if (id > checkIn) { setCheckOut(id); setActive('who'); }
    else { setCheckIn(id); }
  };

  const bump = (k, d) =>
    setG((p) => {
      const n = { ...p, [k]: p[k] + d };
      if (d > 0 && k !== 'adults' && p.adults === 0) n.adults = 1;
      if (n[k] < 0 || n.infants > 5 || n.adults + n.children > 16) return p;
      if (n.adults === 0 && (n.children || n.infants)) return p;
      return n;
    });

  const submit = () => {
    const p = new URLSearchParams();
    if (where.trim()) p.set('location', where.trim());
    if (checkIn) p.set('checkIn', checkIn);
    if (checkOut) p.set('checkOut', checkOut);
    if (total) p.set('guests', String(total));
    nav({ pathname: '/', search: p.toString() ? `?${p.toString()}` : '' });
    setExpanded(false);
    setActive(null);
  };

  /* styles */
  const seg = (k) =>
    `relative cursor-pointer rounded-full px-6 py-3 text-left transition-all duration-200 md:flex-1 md:px-8 md:py-0 md:flex md:flex-col md:justify-center ${
      active === k ? 'z-10 bg-white shadow-[0_6px_20px_rgba(0,0,0,0.2)]' : active ? 'hover:bg-[#DDDDDD]' : 'hover:bg-[#EBEBEB]'
    }`;
  const Divider = ({ hide }) => (
    <span className={`hidden h-8 w-px flex-none self-center bg-[#DDDDDD] transition-opacity duration-200 md:block ${hide ? 'opacity-0' : ''}`} />
  );
  const onKeyOpen = (k) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSearch(k); } };

  return (
    <>
      {expanded && active && <div className="fixed inset-0 z-30 animate-fade bg-black/30" />}

      <header ref={headerRef} className="sticky top-0 z-40 border-b border-[#DDDDDD] bg-white">
        {/* ---------- row 1 ---------- */}
        <div className="mx-auto flex h-20 max-w-[1760px] items-center justify-between gap-3 px-4 md:px-10 xl:px-20">
          <Link to="/" onClick={() => { setExpanded(false); setActive(null); }} className="flex flex-1 items-center" aria-label="Airbnb home">
            <Logo />
          </Link>

          <div className="flex flex-none justify-center">
            {expanded ? (
              <nav className="flex animate-fade items-center gap-2 text-base">
                <span className="relative px-4 py-2 font-semibold after:absolute after:inset-x-4 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#222222]">Stays</span>
                <button className="rounded-full px-4 py-2 text-[#717171] hover:bg-[#F7F7F7] hover:text-[#222222]">Experiences</button>
                <button className="hidden rounded-full px-4 py-2 text-[#717171] hover:bg-[#F7F7F7] hover:text-[#222222] sm:block">Online Experiences</button>
              </nav>
            ) : (
              <>
                {/* compact pill (sm and up) */}
                <div className="hidden animate-fade items-center rounded-full border border-[#DDDDDD] py-2 pl-2 pr-2 shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] sm:flex">
                  <button onClick={() => openSearch('where')} className="max-w-[160px] truncate rounded-full px-4 text-sm font-semibold active:scale-100">{where || 'Anywhere'}</button>
                  <span className="h-6 w-px bg-[#DDDDDD]" />
                  <button onClick={() => openSearch('in')} className="rounded-full px-4 text-sm font-semibold active:scale-100">{dateLabel || 'Any week'}</button>
                  <span className="h-6 w-px bg-[#DDDDDD]" />
                  <button onClick={() => openSearch('who')} className={`rounded-full pl-4 pr-3 text-sm active:scale-100 ${guestLabel === 'Add guests' ? 'text-[#717171]' : 'font-semibold'}`}>{guestLabel}</button>
                  <span className="btn-brand grid h-8 w-8 place-items-center rounded-full"><Search size={14} strokeWidth={3} className="text-white" /></span>
                </div>
                {/* compact pill (mobile) */}
                <button onClick={() => openSearch('where')} className="flex animate-fade items-center gap-2 rounded-full border border-[#DDDDDD] px-4 py-2.5 text-sm font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)] sm:hidden">
                  <Search size={16} strokeWidth={2.5} /> Start your search
                </button>
              </>
            )}
          </div>

          {/* right-hand menu */}
          <div className="flex flex-1 items-center justify-end gap-1">
            <button
              onClick={() => (user ? nav('/host/listings') : openAuth('login', '/host/listings'))}
              className="hidden rounded-full px-4 py-3 text-sm font-semibold hover:bg-[#F7F7F7] md:block"
            >
              Airbnb your home
            </button>

            <div className="relative">
              <button onClick={() => setMenu(menu === 'lang' ? null : 'lang')} aria-label="Choose language"
                className="hidden h-10 w-10 place-items-center rounded-full hover:bg-[#F7F7F7] sm:grid">
                <Globe size={18} />
              </button>
              {menu === 'lang' && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 animate-pop rounded-xl bg-white py-2 shadow-[0_2px_16px_rgba(0,0,0,0.18)]">
                  <p className="px-4 pb-2 pt-1 text-xs font-semibold text-[#717171]">Language and region</p>
                  {LANGS.map((l) => (
                    <button key={l} onClick={() => { setLang(l); setMenu(null); }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-[#F7F7F7] active:scale-100">
                      {l} {lang === l && <Check size={16} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setMenu(menu === 'user' ? null : 'user')} aria-label="Account menu" aria-expanded={menu === 'user'}
                className={`flex items-center gap-3 rounded-full border border-[#DDDDDD] py-2 pl-3.5 pr-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.18)] ${menu === 'user' ? 'shadow-[0_2px_8px_rgba(0,0,0,0.18)]' : ''}`}>
                <Menu size={16} />
                {loading ? (
                  <span className="skeleton h-8 w-8 !rounded-full" />
                ) : (
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold text-white ${user ? 'bg-[#222222]' : 'bg-[#717171]'}`}>
                    {user ? user.name[0].toUpperCase() : <User size={18} fill="currentColor" strokeWidth={0} />}
                  </span>
                )}
              </button>

              {menu === 'user' && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 animate-pop overflow-hidden rounded-xl bg-white py-2 shadow-[0_2px_16px_rgba(0,0,0,0.18)]">
                  {user ? (
                    <>
                      <p className="truncate px-4 pb-2 pt-1 text-xs text-[#717171]">Signed in as {user.email}</p>
                      <MenuItem strong onClick={() => { setMenu(null); nav('/trips'); }}>Trips</MenuItem>
                      <MenuItem onClick={() => { setMenu(null); nav('/host/listings'); }}>Airbnb your home</MenuItem>
                      <div className="my-2 h-px bg-[#DDDDDD]" />
                      <MenuItem onClick={() => { setMenu(null); logout(); nav('/'); }}>Log out</MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem strong onClick={() => openAuth('signup')}>Sign up</MenuItem>
                      <MenuItem onClick={() => openAuth('login')}>Log in</MenuItem>
                      <div className="my-2 h-px bg-[#DDDDDD]" />
                      <MenuItem onClick={() => openAuth('login', '/host/listings')}>Airbnb your home</MenuItem>
                      <MenuItem onClick={() => openAuth('login', '/trips')}>Trips</MenuItem>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------- row 2: expanded search bar ---------- */}
        <div
          className={`mx-auto max-w-[850px] px-4 transition-all duration-300 ease-out md:px-0 ${
            expanded ? 'max-h-[520px] translate-y-0 pb-5 opacity-100' : 'pointer-events-none max-h-0 -translate-y-3 overflow-hidden opacity-0'
          }`}
        >
          <div className="relative">
            <div className={`flex flex-col gap-1 rounded-3xl border border-[#DDDDDD] p-1 shadow-[0_3px_12px_rgba(0,0,0,0.1)] transition-colors duration-200 md:h-[66px] md:flex-row md:items-stretch md:rounded-full md:p-0 ${active ? 'bg-[#EBEBEB]' : 'bg-white'}`}>
              {/* Where */}
              <div onClick={() => openSearch('where')} className={`${seg('where')} md:flex-[1.35]`}>
                <label htmlFor="nb-where" className="block cursor-pointer text-xs font-semibold">Where</label>
                <input
                  id="nb-where" ref={whereRef} value={where} autoComplete="off" placeholder="Search destinations"
                  onChange={(e) => { setWhere(e.target.value); setActive('where'); }}
                  onFocus={() => setActive('where')}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setActive('in'); } }}
                  className="w-full truncate bg-transparent pr-6 text-sm text-[#222222] outline-none placeholder:text-[#717171]"
                />
                {where && active === 'where' && (
                  <button type="button" aria-label="Clear destination"
                    onClick={(e) => { e.stopPropagation(); setWhere(''); whereRef.current?.focus(); }}
                    className="absolute right-4 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-[#DDDDDD] hover:bg-[#B0B0B0]">
                    <X size={12} strokeWidth={3} />
                  </button>
                )}
              </div>
              <Divider hide={active === 'where' || active === 'in'} />

              {/* Check in */}
              <div role="button" tabIndex={0} onClick={() => openSearch('in')} onKeyDown={onKeyOpen('in')} className={seg('in')}>
                <span className="block text-xs font-semibold">Check in</span>
                <span className={`block text-sm ${checkIn ? 'text-[#222222]' : 'text-[#717171]'}`}>{checkIn ? short(checkIn) : 'Add dates'}</span>
              </div>
              <Divider hide={active === 'in' || active === 'out'} />

              {/* Check out */}
              <div role="button" tabIndex={0} onClick={() => openSearch('out')} onKeyDown={onKeyOpen('out')} className={seg('out')}>
                <span className="block text-xs font-semibold">Check out</span>
                <span className={`block text-sm ${checkOut ? 'text-[#222222]' : 'text-[#717171]'}`}>{checkOut ? short(checkOut) : 'Add dates'}</span>
              </div>
              <Divider hide={active === 'out' || active === 'who'} />

              {/* Who + search button */}
              <div role="button" tabIndex={0} onClick={() => openSearch('who')} onKeyDown={onKeyOpen('who')} className={`${seg('who')} md:flex-[1.2] md:!flex-row md:items-center md:justify-between md:gap-2 md:!pr-2`}>
                <span className="block min-w-0">
                  <span className="block text-xs font-semibold">Who</span>
                  <span className={`block truncate text-sm ${guestLabel === 'Add guests' ? 'text-[#717171]' : 'text-[#222222]'}`}>{guestLabel}</span>
                </span>
                <button type="button" aria-label="Search"
                  onClick={(e) => { e.stopPropagation(); submit(); }}
                  className="btn-brand absolute right-2 top-1/2 flex h-12 -translate-y-1/2 items-center gap-2 rounded-full px-4 font-semibold text-white md:static md:translate-y-0">
                  <Search size={18} strokeWidth={2.5} />
                  {active && <span className="text-base">Search</span>}
                </button>
              </div>
            </div>

            {/* ----- popovers ----- */}
            {active === 'where' && (
              <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-full animate-pop rounded-[32px] bg-white p-8 shadow-[0_8px_28px_rgba(0,0,0,0.2)] md:w-[480px]">
                <p className="mb-4 text-xs font-semibold">Search by region</p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-5">
                  {REGIONS.map((r) => (
                    <button key={r.label} type="button" onClick={() => { setWhere(r.value); setActive('in'); }} className="group text-left active:scale-100">
                      <div className={`overflow-hidden rounded-xl border-2 transition-all duration-200 group-hover:border-[#222222] group-active:scale-95 ${where === r.value && r.value ? 'border-[#222222]' : 'border-[#DDDDDD]'}`}>
                        <img src={r.img} onError={onImgError} alt="" className="h-24 w-full object-cover" />
                      </div>
                      <p className="mt-2 text-sm">{r.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(active === 'in' || active === 'out') && (
              <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-50 animate-pop rounded-[32px] bg-white p-8 shadow-[0_8px_28px_rgba(0,0,0,0.2)] md:left-1/2 md:right-auto md:w-[860px] md:-translate-x-1/2">
                <Calendar start={checkIn} end={checkOut} onPick={pickDate} onClear={() => { setCheckIn(''); setCheckOut(''); setActive('in'); }} />
              </div>
            )}

            {active === 'who' && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-full animate-pop rounded-[32px] bg-white px-8 py-4 shadow-[0_8px_28px_rgba(0,0,0,0.2)] md:w-[400px]">
                {GUEST_ROWS.map((r, i) => (
                  <div key={r.key} className={`flex items-center justify-between py-5 ${i < 2 ? 'border-b border-[#DDDDDD]' : ''}`}>
                    <div>
                      <p className="text-base font-semibold">{r.title}</p>
                      <p className="text-sm text-[#717171]">{r.sub}</p>
                    </div>
                    <Stepper
                      label={r.title.toLowerCase()}
                      value={g[r.key]}
                      onMinus={() => bump(r.key, -1)}
                      onPlus={() => bump(r.key, 1)}
                      minusOff={g[r.key] === 0 || (r.key === 'adults' && g.adults === 1 && g.children + g.infants > 0)}
                      plusOff={r.key === 'infants' ? g.infants >= 5 : g.adults + g.children >= 16}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        open={auth.open}
        mode={auth.mode}
        onClose={() => setAuth((a) => ({ ...a, open: false }))}
        onSuccess={() => { if (auth.redirect) nav(auth.redirect); }}
      />
    </>
  );
}

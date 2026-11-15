import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Home, Pencil, Plus, Trash2, Star, MapPin, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react';

// ---- config: change these two lines if your project stores things differently ----
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'token'; // localStorage key where your login saves the JWT
// ---------------------------------------------------------------------------------

const CATEGORIES = ['Beach', 'Cabins', 'Amazing Views', 'City', 'Luxury'];
const EMPTY = {
  title: '',
  description: '',
  location: '',
  category: 'City',
  price: '',
  guests: 2,
  bedrooms: 1,
  images: '',
  amenities: '',
};

async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const lines = (s) => String(s).split('\n').map((x) => x.trim()).filter(Boolean);
const list = (s) => String(s).split(/[\n,]/).map((x) => x.trim()).filter(Boolean);

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const ok = toast.type === 'success';
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-xl"
    >
      {ok ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-rose-400" />}
      {toast.message}
    </div>
  );
}

function ConfirmDelete({ listing, busy, onCancel, onConfirm }) {
  if (!listing) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Delete this listing?</h3>
        <p className="mt-2 text-sm text-neutral-600">
          “{listing.title}” and its bookings and reviews will be removed. This can’t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-neutral-100">
            Keep listing
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? 'Deleting…' : 'Delete listing'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

function ListingForm({ initial, editing, saving, onSubmit, onCancel }) {
  const [f, setF] = useState(initial);
  const [error, setError] = useState('');

  useEffect(() => {
    setF(initial);
    setError('');
  }, [initial]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const images = lines(f.images);

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.description.trim() || !f.location.trim()) return setError('Add a title, description and location.');
    if (!(parseInt(f.price, 10) > 0)) return setError('Enter a nightly price greater than 0.');
    if (!images.length) return setError('Add at least one image URL.');
    setError('');
    onSubmit({
      title: f.title.trim(),
      description: f.description.trim(),
      location: f.location.trim(),
      category: f.category,
      price: parseInt(f.price, 10),
      guests: parseInt(f.guests, 10) || 1,
      bedrooms: parseInt(f.bedrooms, 10) || 1,
      images,
      amenities: list(f.amenities),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
      <div>
        <h2 className="text-xl font-semibold">{editing ? 'Edit your listing' : 'Airbnb your home'}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {editing ? 'Update the details guests see.' : 'Tell guests about your place. You can edit it any time.'}
        </p>
      </div>

      <Field label="Title">
        <input className={inputCls} value={f.title} onChange={set('title')} placeholder="Sea-facing villa in Goa" maxLength={100} />
      </Field>

      <Field label="Description">
        <textarea className={inputCls} rows={4} value={f.description} onChange={set('description')} placeholder="What makes your place special?" />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location">
          <input className={inputCls} value={f.location} onChange={set('location')} placeholder="Goa, India" />
        </Field>
        <Field label="Category">
          <select className={inputCls} value={f.category} onChange={set('category')}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Price per night (₹)">
          <input type="number" min="1" className={inputCls} value={f.price} onChange={set('price')} placeholder="4500" />
        </Field>
        <Field label="Max guests">
          <input type="number" min="1" max="20" className={inputCls} value={f.guests} onChange={set('guests')} />
        </Field>
        <Field label="Bedrooms">
          <input type="number" min="1" max="20" className={inputCls} value={f.bedrooms} onChange={set('bedrooms')} />
        </Field>
      </div>

      <Field label="Image URLs" hint="One link per line. The first image is the cover photo.">
        <textarea
          className={`${inputCls} font-mono text-xs`}
          rows={4}
          value={f.images}
          onChange={set('images')}
          placeholder={'https://images.unsplash.com/photo-...\nhttps://images.unsplash.com/photo-...'}
        />
      </Field>

      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.slice(0, 6).map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt={`Preview ${i + 1}`}
              className="h-20 w-28 flex-none rounded-lg object-cover bg-neutral-100"
              onError={(e) => {
                e.currentTarget.style.opacity = 0.25;
              }}
            />
          ))}
        </div>
      )}

      <Field label="Amenities" hint="Separate with commas, for example Wifi, Pool, Kitchen, Air conditioning.">
        <input className={inputCls} value={f.amenities} onChange={set('amenities')} placeholder="Wifi, Pool, Kitchen" />
      </Field>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle size={16} /> {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        {editing && (
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-neutral-100">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish listing'}
        </button>
      </div>
    </form>
  );
}

function MyListingCard({ l, onEdit, onDelete }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm sm:flex-row">
      <Link to={`/listings/${l.id}`} className="block sm:w-56 sm:flex-none">
        <img src={l.images[0]} alt={l.title} className="h-44 w-full bg-neutral-100 object-cover sm:h-full" />
      </Link>
      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <Link to={`/listings/${l.id}`} className="font-semibold hover:underline">
              {l.title}
            </Link>
            {l.rating && (
              <span className="flex flex-none items-center gap-1 text-sm">
                <Star size={14} className="fill-current" /> {l.rating} ({l.reviewCount})
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
            <MapPin size={14} /> {l.location} · {l.category}
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {l.guests} guests · {l.bedrooms} bedrooms · <span className="font-semibold text-neutral-900">{inr(l.price)}</span> / night
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(l)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={() => onDelete(l)}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function Reservations({ onToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await api('/host/reservations'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (id) => {
    setBusyId(id);
    try {
      await api(`/host/bookings/${id}/cancel`, { method: 'PATCH' });
      setRows((p) => p.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r)));
      setConfirmId(null);
      onToast({ type: 'success', message: 'Booking cancelled' });
    } catch (e) {
      onToast({ type: 'error', message: e.message });
    } finally {
      setBusyId(null);
    }
  };

  const today = new Date().setHours(0, 0, 0, 0);
  const confirmed = rows.filter((r) => r.status === 'CONFIRMED');
  const upcoming = confirmed.filter((r) => new Date(r.endDate) >= today).length;
  const payout = confirmed.reduce((s, r) => s + r.totalPrice, 0);

  if (loading) return <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />)}</div>;

  if (error)
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm text-rose-700">{error}</p>
        <button onClick={load} className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Try again</button>
      </div>
    );

  if (!rows.length)
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center">
        <CalendarDays className="mx-auto text-neutral-400" size={36} />
        <h2 className="mt-3 text-lg font-semibold">No reservations yet</h2>
        <p className="mt-1 text-sm text-neutral-500">When guests book one of your places, they will show up here.</p>
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Upcoming stays', upcoming],
          ['Confirmed bookings', confirmed.length],
          ['Total payout', inr(payout)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {rows.map((r) => {
        const cancellable = r.status === 'CONFIRMED' && new Date(r.endDate) >= today;
        return (
          <div key={r.id} className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <img src={r.listing.image} alt={r.listing.title} className="h-24 w-full flex-none rounded-xl bg-neutral-100 object-cover sm:w-36" />
            <div className="min-w-0 flex-1">
              <Link to={`/listings/${r.listing.id}`} className="line-clamp-1 font-semibold hover:underline">{r.listing.title}</Link>
              <p className="mt-0.5 text-sm text-neutral-600">{r.guest.name} · {r.guest.email}</p>
              <p className="mt-0.5 text-sm text-neutral-600">
                {fmtDate(r.startDate)} – {fmtDate(r.endDate)} · {r.nights} {r.nights === 1 ? 'night' : 'nights'}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <p className="text-lg font-semibold">{inr(r.totalPrice)}</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  r.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {r.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
              </span>
              {cancellable &&
                (confirmId === r.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmId(null)} className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-neutral-100">Keep</button>
                    <button
                      onClick={() => cancel(r.id)}
                      disabled={busyId === r.id}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                      {busyId === r.id ? 'Cancelling…' : 'Yes, cancel'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmId(r.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
                    Cancel booking
                  </button>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HostDashboard() {
  const { pathname } = useLocation();
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(pathname === '/host/new' ? 'form' : pathname === '/host/reservations' ? 'reservations' : 'listings'); // 'listings' | 'form' | 'reservations'
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setListings(await api('/listings/mine'));
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // opening /host/edit/:id directly loads that listing into the form
  useEffect(() => {
    if (!editId || loading || editing) return;
    const l = listings.find((x) => x.id === Number(editId));
    if (l) {
      setEditing(l);
      setTab('form');
    } else if (!loadError) {
      setToast({ type: 'error', message: 'That listing was not found in your listings' });
    }
  }, [editId, loading, listings, editing, loadError]);

  const showList = () => {
    setEditing(null);
    setTab('listings');
    navigate('/host/listings');
  };

  const startCreate = () => {
    setEditing(null);
    setTab('form');
    navigate('/host/new');
  };

  const startEdit = (l) => {
    setEditing(l);
    setTab('form');
    navigate(`/host/edit/${l.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const initial = editing
    ? {
        title: editing.title,
        description: editing.description,
        location: editing.location,
        category: editing.category,
        price: editing.price,
        guests: editing.guests,
        bedrooms: editing.bedrooms,
        images: editing.images.join('\n'),
        amenities: editing.amenities.join(', '),
      }
    : EMPTY;

  const save = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await api(`/listings/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        setToast({ type: 'success', message: 'Listing updated' });
      } else {
        await api('/listings', { method: 'POST', body: JSON.stringify(payload) });
        setToast({ type: 'success', message: 'Listing published' });
      }
      showList();
      await load();
    } catch (e) {
      setToast({ type: 'error', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api(`/listings/${toDelete.id}`, { method: 'DELETE' });
      setListings((p) => p.filter((x) => x.id !== toDelete.id));
      setToast({ type: 'success', message: 'Listing deleted' });
      setToDelete(null);
    } catch (e) {
      setToast({ type: 'error', message: e.message });
    } finally {
      setDeleting(false);
    }
  };

  const tabCls = (active) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      active ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
    }`;

  return (
    <div className="mx-auto max-w-4xl py-2">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Host dashboard</h1>
        <div className="flex gap-2">
          <button className={tabCls(tab === 'listings')} onClick={showList}>
            My listings{listings.length ? ` (${listings.length})` : ''}
          </button>
          <button className={tabCls(tab === 'form')} onClick={startCreate}>
            {editing ? 'Editing' : 'Add a listing'}
          </button>
          <button
            className={tabCls(tab === 'reservations')}
            onClick={() => {
              setEditing(null);
              setTab('reservations');
              navigate('/host/reservations');
            }}
          >
            Reservations on my places
          </button>
        </div>
      </div>

      {tab === 'form' && (
        <ListingForm
          initial={initial}
          editing={!!editing}
          saving={saving}
          onSubmit={save}
          onCancel={showList}
        />
      )}

      {tab === 'listings' && (
        <section className="space-y-4">
          {loading &&
            [0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-neutral-100" />)}

          {!loading && loadError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
              <p className="text-sm text-rose-700">{loadError}</p>
              <button onClick={load} className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                Try again
              </button>
            </div>
          )}

          {!loading && !loadError && listings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center">
              <Home className="mx-auto text-neutral-400" size={36} />
              <h2 className="mt-3 text-lg font-semibold">You haven’t listed a place yet</h2>
              <p className="mt-1 text-sm text-neutral-500">Add your first listing and it will show up on the home page.</p>
              <button
                onClick={startCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"
              >
                <Plus size={16} /> Add a listing
              </button>
            </div>
          )}

          {!loading &&
            !loadError &&
            listings.map((l) => <MyListingCard key={l.id} l={l} onEdit={startEdit} onDelete={setToDelete} />)}
        </section>
      )}

      {tab === 'reservations' && <Reservations onToast={setToast} />}

      <ConfirmDelete listing={toDelete} busy={deleting} onCancel={() => setToDelete(null)} onConfirm={remove} />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

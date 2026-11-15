import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Home, User, X } from 'lucide-react';
import { useAuth } from '../AuthContext';

const DEMO_PASSWORD = 'password123';
const DEMO = [
  { email: 'guest@demo.com', Icon: User },
  { email: 'host@demo.com', Icon: Home },
];

/* Floating-label input */
function Field({ id, label, type = 'text', value, onChange, autoComplete, inputRef, right }) {
  return (
    <div className="relative">
      <input
        id={id}
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        autoComplete={autoComplete}
        className="peer h-14 w-full rounded-lg border border-[#B0B0B0] bg-white px-3 pb-1 pt-5 text-base text-[#222222] outline-none transition-all duration-200 hover:border-[#222222] focus:border-2 focus:border-[#222222] focus:px-[11px] focus:pb-[3px] focus:pt-[19px]"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-4 origin-left text-base text-[#717171] transition-all duration-200 peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:scale-75"
      >
        {label}
      </label>
      {right}
    </div>
  );
}

const Spinner = ({ dark }) => (
  <span className={`h-4 w-4 animate-spin rounded-full border-2 ${dark ? 'border-[#DDDDDD] border-t-[#222222]' : 'border-white/40 border-t-white'}`} />
);

export default function AuthModal({ open, mode: initialMode = 'login', onClose, onSuccess }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(''); // '' | 'form' | demo email
  const emailRef = useRef(null);

  /* reset every time the modal opens; lock page scroll; Esc closes */
  useEffect(() => {
    if (!open) return undefined;
    setMode(initialMode);
    setName(''); setEmail(''); setPassword('');
    setShow(false); setError(''); setBusy('');
    const t = setTimeout(() => emailRef.current?.focus(), 80);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const isLogin = mode === 'login';

  const run = async (m, n, e, p, tag) => {
    setError('');
    setBusy(tag);
    try {
      if (m === 'login') await login(e, p);
      else await signup(n, e, p);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err?.message || '';
      setError(/failed to fetch|networkerror/i.test(msg)
        ? "We can't reach the server. Make sure the backend is running on port 5000."
        : msg || 'Something went wrong. Please try again.');
      setBusy('');
    }
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!isLogin && !name.trim()) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (!password) return setError('Please enter your password.');
    if (!isLogin && password.length < 6) return setError('Password must be at least 6 characters.');
    run(mode, name.trim(), email.trim(), password, 'form');
  };

  const quick = (em) => {
    setMode('login');
    setEmail(em);
    setPassword(DEMO_PASSWORD);
    run('login', '', em, DEMO_PASSWORD, em);
  };

  const switchMode = () => { setMode(isLogin ? 'signup' : 'login'); setError(''); };

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div className="max-h-[92vh] w-full max-w-[568px] animate-pop overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="sticky top-0 z-10 flex h-16 items-center justify-center border-b border-[#DDDDDD] bg-white">
          <button onClick={onClose} aria-label="Close" className="absolute left-4 grid h-8 w-8 place-items-center rounded-full hover:bg-[#F7F7F7]">
            <X size={16} strokeWidth={2.5} />
          </button>
          <h2 className="text-base font-semibold">Log in or sign up</h2>
        </div>

        <div className="px-6 pb-8 pt-6 sm:px-8">
          <h3 id="auth-title" className="mb-1 text-[22px] font-semibold">Welcome to Airbnb</h3>
          <p className="mb-6 text-sm text-[#717171]">
            {isLogin ? 'Log in to book stays, manage trips and host your home.' : 'Create an account to book stays and host your home.'}
          </p>

          <form onSubmit={submit} noValidate className="space-y-3">
            {!isLogin && (
              <Field id="auth-name" label="Full name" value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
            )}
            <Field id="auth-email" label="Email" type="email" value={email} inputRef={emailRef} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
            <Field
              id="auth-password"
              label="Password"
              type={show ? 'text' : 'password'}
              value={password}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              onChange={(e) => setPassword(e.target.value)}
              right={
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#717171] hover:bg-[#F7F7F7] hover:text-[#222222]">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {error && (
              <p role="alert" className="flex items-start gap-2 pt-1 text-sm text-[#C13515]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}

            <button type="submit" disabled={!!busy} className="btn-gradient mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg text-base">
              {busy === 'form' && <Spinner />} Continue
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-[#717171]">
            {isLogin ? 'New to Airbnb?' : 'Already have an account?'}{' '}
            <button type="button" onClick={switchMode} className="font-semibold text-[#222222] underline hover:text-[#717171]">
              {isLogin ? 'Create an account' : 'Log in'}
            </button>
          </p>

          {/* divider */}
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-[#DDDDDD]" />
            <span className="text-xs text-[#717171]">or try a demo account</span>
            <span className="h-px flex-1 bg-[#DDDDDD]" />
          </div>

          <div className="space-y-3">
            {DEMO.map(({ email: em, Icon }) => (
              <button key={em} type="button" disabled={!!busy} onClick={() => quick(em)}
                className="relative flex h-12 w-full items-center justify-center rounded-lg border border-[#222222] px-10 text-sm font-semibold hover:bg-[#F7F7F7] disabled:opacity-60">
                <Icon size={18} className="absolute left-4" />
                {busy === em ? <Spinner dark /> : null}
                <span className={busy === em ? 'ml-2' : ''}>{busy === em ? 'Logging in...' : `Continue as ${em}`}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-[#717171]">Demo password: {DEMO_PASSWORD}</p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (isLogin) await login(f.email, f.password);
      else await signup(f.name, f.email, f.password);
      nav(loc.state?.from || '/', { replace: true });
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border p-8 shadow-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold">{isLogin ? 'Log in' : 'Create your account'}</h1>
      <form onSubmit={submit} className="space-y-4">
        {!isLogin && <input className="input" placeholder="Full name" value={f.name} onChange={set('name')} required />}
        <input className="input" type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input className="input" type="password" placeholder="Password (min 6 characters)" value={f.password} onChange={set('password')} required minLength={6} />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-gray-600">
        {isLogin ? <>New here? <Link className="font-semibold underline" to="/signup">Sign up</Link></> : <>Have an account? <Link className="font-semibold underline" to="/login">Log in</Link></>}
      </p>
      {isLogin && <p className="mt-3 text-center text-xs text-gray-400">Demo: guest@demo.com / password123</p>}
    </div>
  );
}

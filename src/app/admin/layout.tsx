'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RoleCtx } from '@/components/AdminRole';
import { db } from '@/lib/admin';

const NAV: [string, string, string?][] = [['Dashboard', '/admin'], ['Orders', '/admin/orders'], ['Products', '/admin/products'], ['Collections', '/admin/collections'],
  ['Customers', '/admin/customers'], ['Coupons', '/admin/coupons', 'mgr'], ['Website', '/admin/settings', 'mgr'], ['Team', '/admin/team', 'mgr']];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'out' | 'denied' | 'in'>('loading');
  const [role, setRole] = useState('staff');
  const [menu, setMenu] = useState(false);
  const path = usePathname();

  const check = async () => {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return setState('out');
    const { data: ok } = await db.rpc('claim_owner');
    if (!ok) return setState('denied');
    const { data: r } = await db.rpc('my_role'); setRole(r || 'staff'); setState('in');
  };
  useEffect(() => { check(); const { data } = db.auth.onAuthStateChange(() => check()); return () => data.subscription.unsubscribe(); }, []);
  useEffect(() => setMenu(false), [path]);

  if (state === 'loading') return <div className="min-h-screen grid place-items-center meta">Loading…</div>;
  if (state === 'out') return <Login />;
  if (state === 'denied') return <div className="min-h-screen grid place-items-center text-center p-6"><div><p className="display text-5xl">No access</p><p className="mt-3 opacity-60">This account is not an admin. Ask the owner to add you from Team.</p><button className="btn mt-6" onClick={() => db.auth.signOut()}>Sign out</button></div></div>;

  const nav = NAV.filter(([, , r]) => !r || role !== 'staff');
  return (
    <RoleCtx.Provider value={role}>
      <div className="min-h-screen md:flex bg-paper">
        <aside className="md:w-56 md:min-h-screen bg-ink text-paper md:sticky md:top-0 md:self-start">
          <div className="flex items-center justify-between p-4 md:p-5">
            <Link href="/admin" className="display text-3xl">VEST <span className="meta text-lime align-middle">admin</span></Link>
            <button className="md:hidden meta" onClick={() => setMenu(!menu)}>{menu ? 'Close' : 'Menu'}</button>
          </div>
          <nav className={`${menu ? 'flex' : 'hidden'} md:flex flex-col px-3 pb-4 gap-1`}>
            {nav.map(([t, h]) => <Link key={h} href={h} className={`meta px-3 py-2.5 ${(h === '/admin' ? path === h : path.startsWith(h)) ? 'bg-lime text-ink' : 'hover:bg-paper/10'}`}>{t}</Link>)}
            <a href="/" target="_blank" className="meta px-3 py-2.5 opacity-60 hover:opacity-100">View site ↗</a>
            <button onClick={() => db.auth.signOut()} className="meta px-3 py-2.5 text-left opacity-60 hover:opacity-100">Sign out</button>
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8 min-w-0">{children}</main>
      </div>
    </RoleCtx.Provider>
  );
}

function Login() {
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in');
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const go = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('');
    const r = mode === 'in' ? await db.auth.signInWithPassword({ email, password: pw })
      : mode === 'up' ? await db.auth.signUp({ email, password: pw, options: { emailRedirectTo: location.origin + '/admin' } })
      : await db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/admin/team?reset=1' });
    setBusy(false);
    if (r.error) return setMsg(r.error.message);
    if (mode === 'up' && !(r.data as any)?.session) setMsg('Check your email to confirm the account, then sign in.');
    if (mode === 'reset') setMsg('Password reset link sent to your email.');
  };
  return (
    <div className="min-h-screen grid place-items-center bg-ink p-4">
      <form onSubmit={go} className="bg-paper p-6 md:p-8 w-full max-w-sm space-y-3">
        <p className="display text-5xl">VEST</p>
        <p className="meta opacity-60">{mode === 'in' ? 'Admin sign in' : mode === 'up' ? 'Create admin account' : 'Reset password'}</p>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" />
        {mode !== 'reset' && <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password (min 8)" className="input" />}
        <button disabled={busy} className="btn w-full">{busy ? '…' : mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Send link'}</button>
        {msg && <p className="text-sm text-signal">{msg}</p>}
        <div className="flex justify-between meta pt-2">
          <button type="button" onClick={() => setMode(mode === 'in' ? 'up' : 'in')} className="underline">{mode === 'in' ? 'Create account' : 'Sign in'}</button>
          <button type="button" onClick={() => setMode('reset')} className="underline opacity-60">Forgot?</button>
        </div>
      </form>
    </div>
  );
}

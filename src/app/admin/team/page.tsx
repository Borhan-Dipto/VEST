'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/admin';
import { useRole } from '@/components/AdminRole';
export default function Team() {
  const role = useRole();
  const [list, setList] = useState<any[]>([]); const [email, setEmail] = useState(''); const [r, setR] = useState('staff'); const [msg, setMsg] = useState(''); const [pw, setPw] = useState('');
  const load = () => db.rpc('list_admins').then(({ data }) => setList(data || []));
  useEffect(() => { load(); }, []);
  const setAdmin = async (e: string, role: string) => {
    const { error } = await db.rpc('set_admin', { p_email: e, p_role: role });
    setMsg(error ? (error.message.includes('USER_NOT_FOUND') ? 'No account with that email. Ask them to open /admin and create an account first.' : error.message.includes('ONLY_OWNER') ? 'Only the owner can change the team.' : error.message) : 'Done ✓');
    setEmail(''); load();
  };
  const changePw = async () => { const { error } = await db.auth.updateUser({ password: pw }); setMsg(error ? error.message : 'Password updated ✓'); setPw(''); };
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="display text-6xl">Team</h1>
      <div className="bg-card p-4 text-sm space-y-1"><p><b>Owner</b> — everything, incl. team. <b>Manager</b> — everything except team. <b>Staff</b> — orders, products, collections, customers.</p></div>
      <div className="bg-card divide-y divide-warm">{list.map((a) => (
        <div key={a.user_id} className="flex flex-wrap items-center gap-3 p-3"><span className="flex-1">{a.email}</span>
          {role === 'owner' ? <select value={a.role} onChange={(e) => setAdmin(a.email, e.target.value)} className="input !h-9 !w-36"><option>owner</option><option>manager</option><option>staff</option><option value="remove">remove</option></select> : <span className="meta">{a.role}</span>}
        </div>))}</div>
      {role === 'owner' && <div className="bg-card p-4 flex flex-wrap gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Team member email (must have created an account at /admin)" className="input flex-1 min-w-[220px]" />
        <select value={r} onChange={(e) => setR(e.target.value)} className="input !w-36"><option>manager</option><option>staff</option></select>
        <button onClick={() => email && setAdmin(email, r)} className="btn">Add</button></div>}
      <div className="bg-card p-4 flex flex-wrap gap-2"><input type="password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password for your account" className="input flex-1" /><button onClick={changePw} className="btn">Change password</button></div>
      {msg && <p className="meta">{msg}</p>}
    </div>
  );
}

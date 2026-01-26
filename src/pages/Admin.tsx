import React, { useState } from 'react';

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
  const [tab, setTab] = useState<'orders'|'payments'>('orders');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    // read token from URL fragment (after OAuth redirect)
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) {
      localStorage.setItem('admin_token', t);
      setToken(t);
      params.delete('token');
      const url = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState({}, '', url);
    }
  }, []);

  async function login() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      localStorage.setItem('admin_token', json.token);
      setToken(json.token);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`/api/admin/${tab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json.data || []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('admin_token');
    setToken(null);
  }

  async function exportCsv() {
    if (!token) return setError('Not authenticated');
    const res = await fetch(`/api/admin/orders.csv`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) return setError(await res.text());
    const csv = await res.text();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
          <div className="mb-4">
        <p className="text-sm text-slate-600">Authenticate with your admin credentials or use GitHub OAuth. The admin token is stored in localStorage for convenience.</p>
      </div>

      <div className="flex gap-2 mb-4">
        {!token ? (
          <>
            <input className="border p-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className="border p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={login} disabled={loading}>Login</button>
            <a className="px-3 py-2 rounded bg-gray-200" href="/api/auth/github/start">Login with GitHub</a>
          </>
        ) : (
          <>
            <button className={`px-3 py-2 rounded ${tab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setTab('orders')}>Orders</button>
            <button className={`px-3 py-2 rounded ${tab === 'payments' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setTab('payments')}>Payments</button>
            <button className="px-3 py-2 rounded bg-green-600 text-white ml-auto" onClick={fetchData} disabled={!token || loading}>Fetch</button>
            <button className="px-3 py-2 rounded bg-yellow-400" onClick={exportCsv} disabled={!token}>Export CSV</button>
            <button className="px-3 py-2 rounded bg-red-500 text-white" onClick={logout}>Logout</button>
          </>
        )}
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {loading && <div>Loading...</div>}

      {!loading && data && (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {tab === 'orders' ? (
                  <>
                    <th className="border p-2">ID</th>
                    <th className="border p-2">Customer</th>
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Service</th>
                    <th className="border p-2">Total</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Paystack Ref</th>                      <th className="border p-2">Yoco Charge</th>                    <th className="border p-2">Created</th>
                  </>
                ) : (
                  <>
                    <th className="border p-2">ID</th>
                    <th className="border p-2">Order ID</th>
                    <th className="border p-2">Amount</th>
                    <th className="border p-2">Currency</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Paystack Ref</th>
                    <th className="border p-2">Yoco Charge</th>
                    <th className="border p-2">Transaction ID</th>
                    <th className="border p-2">Created</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td className="p-4" colSpan={7}>No data</td></tr>
              )}
              {data.map((row: any) => (
                <tr key={row.id} className="odd:bg-white even:bg-gray-50">
                  {tab === 'orders' ? (
                    <>
                      <td className="border p-2">{row.id}</td>
                      <td className="border p-2">{row.customer_name}</td>
                      <td className="border p-2">{row.customer_email}</td>
                      <td className="border p-2">{row.service_name}</td>
                      <td className="border p-2">{(row.total_amount/100).toFixed(2)} {row.currency}</td>
                      <td className="border p-2">{row.status}</td>
                      <td className="border p-2">{row.paystack_reference ?? ''}</td>
                      <td className="border p-2">{row.yoco_charge_id ?? ''}</td>
                      <td className="border p-2">{new Date(row.created_at).toLocaleString()}</td>
                    </>
                  ) : (
                    <>
                      <td className="border p-2">{row.id}</td>
                      <td className="border p-2">{row.order_id}</td>
                      <td className="border p-2">{(row.amount/100).toFixed(2)}</td>
                      <td className="border p-2">{row.currency}</td>
                      <td className="border p-2">{row.status}</td>
                      <td className="border p-2">{row.paystack_reference ?? ''}</td>
                      <td className="border p-2">{row.yoco_charge_id ?? ''}</td>
                      <td className="border p-2">{row.yoco_transaction_id ?? row.paystack_transaction_id ?? ''}</td>
                      <td className="border p-2">{new Date(row.created_at).toLocaleString()}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

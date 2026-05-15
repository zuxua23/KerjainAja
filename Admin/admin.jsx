/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;

const fmtRp = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

const DEFAULT_PRICING = {
  master: 75000, transaksi: 100000, laporan: 50000, dashboard: 150000,
  attr: 10000,
  op_create: 15000, op_get: 10000, op_update: 20000, op_delete: 5000,
  op_filter: 10000, op_sum: 5000,
  op_exportPdf: 25000, op_exportExcel: 25000, op_print: 15000,
  dash_sum: 5000, dash_chart: 20000, dash_log: 15000,
  svc_uml: 200000, svc_landing: 500000, svc_revision: 100000, svc_consult: 100000,
  techDev: 25000,
};

const PRICING_GROUPS = [
  {
    title: 'Operasi CRUD (Master / Transaksi)',
    desc: 'Harga per operasi di setiap item master / transaksi',
    keys: [
      ['op_create', 'Create', 'Tambah data baru'],
      ['op_get', 'Get / List', 'Lihat data (read)'],
      ['op_update', 'Update', 'Edit data'],
      ['op_delete', 'Delete', 'Hapus data'],
      ['op_filter', 'Filter / Search', 'Cari + filter terindeks'],
      ['op_sum', 'Get Sum', 'Hitung total / agregasi'],
    ],
  },
  {
    title: 'Operasi Laporan',
    desc: 'Harga per operasi di setiap laporan',
    keys: [
      ['op_exportPdf', 'Export PDF', 'Cetak ke PDF'],
      ['op_exportExcel', 'Export Excel', 'Cetak ke .xlsx'],
      ['op_print', 'Print Langsung', 'Print ke printer'],
    ],
  },
  {
    title: 'Dashboard Widget',
    desc: 'Harga per widget dinamis di dashboard',
    keys: [
      ['dash_sum', 'Sum Widget', 'Statistik angka'],
      ['dash_chart', 'Chart Widget', 'Grafik (bar/line/pie/area)'],
      ['dash_log', 'Log Widget', 'Log activity'],
    ],
  },
  {
    title: 'Base Kategori',
    desc: 'Harga dasar per item kategori (sebelum atribut & operasi)',
    keys: [
      ['master', 'Master Data', 'Per item'],
      ['transaksi', 'Transaksi', 'Per item'],
      ['laporan', 'Laporan', 'Per item'],
      ['dashboard', 'Dashboard', 'Per item'],
    ],
  },
  {
    title: 'Jasa One-Time',
    desc: 'Harga flat per jenis jasa',
    keys: [
      ['svc_uml', 'Jasa UML & Database', 'Diagram UML, ERD, PDM'],
      ['svc_landing', 'Jasa Landing Page', 'Web landing page profesional'],
      ['svc_revision', 'Jasa Revisi', 'Perbaiki / improve app yang ada'],
      ['svc_consult', 'Jasa Konsultasi', 'Konsultasi requirement'],
    ],
  },
  {
    title: 'Lainnya',
    desc: 'Atribut & tech "Saran developer"',
    keys: [
      ['attr', 'Per Atribut', 'Harga per atribut/field'],
      ['techDev', 'Saran Developer', 'Per kategori bahasa/FE/BE/DB'],
    ],
  },
];

const DEFAULT_PAYMENT_METHODS = [
  { id: 'bca',       name: 'BCA',               norek: '1234567890',   atasNama: 'Muhammad Nur Fauzan', type: 'bank'    },
  { id: 'blu',       name: 'Blu by BCA Digital', norek: '08xxxxxxxxxx', atasNama: 'Muhammad Nur Fauzan', type: 'bank'    },
  { id: 'dana',      name: 'Dana',               norek: '08xxxxxxxxxx', atasNama: 'Muhammad Nur Fauzan', type: 'ewallet' },
  { id: 'shopeepay', name: 'ShopeePay',          norek: '08xxxxxxxxxx', atasNama: 'Muhammad Nur Fauzan', type: 'ewallet' },
];

const PM_LOGO_COLORS = {
  bca:       '#0060AF',
  blu:       '#5CB8E4',
  mandiri:   '#003D79',
  bri:       '#1566C0',
  bni:       '#FF6600',
  dana:      '#118EEA',
  ovo:       '#4C3494',
  gopay:     '#00AED6',
  shopeepay: '#EE4D2D',
  qris:      '#ED1C24',
};

// ============================================
// STORAGE HOOKS
// ============================================
function usePricing() {
  const [pricing, setPricing] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('devorder_pricing') || '{}');
      return { ...DEFAULT_PRICING, ...stored };
    } catch { return { ...DEFAULT_PRICING }; }
  });

  const update = (key, val) => {
    const next = { ...pricing, [key]: val };
    setPricing(next);
    localStorage.setItem('devorder_pricing', JSON.stringify(next));
  };

  const resetAll = () => {
    if (!confirm('Reset semua harga ke default?')) return;
    setPricing({ ...DEFAULT_PRICING });
    localStorage.removeItem('devorder_pricing');
  };

  return [pricing, update, resetAll];
}

function useOrders() {
  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('devorder_orders') || '[]'); }
    catch { return []; }
  });

  const refresh = () => {
    try { setOrders(JSON.parse(localStorage.getItem('devorder_orders') || '[]')); }
    catch { setOrders([]); }
  };

  const updateStatus = (code, status) => {
    const next = orders.map(o => o.code === code ? { ...o, status } : o);
    setOrders(next);
    localStorage.setItem('devorder_orders', JSON.stringify(next));
  };

  const remove = (code) => {
    if (!confirm(`Hapus order ${code}? Aksi ini gak bisa di-undo.`)) return;
    const next = orders.filter(o => o.code !== code);
    setOrders(next);
    localStorage.setItem('devorder_orders', JSON.stringify(next));
  };

  const clearAll = () => {
    if (!confirm('Hapus SEMUA order? Aksi ini gak bisa di-undo.')) return;
    setOrders([]);
    localStorage.removeItem('devorder_orders');
  };

  return { orders, refresh, updateStatus, remove, clearAll };
}

function usePaymentMethods() {
  const [methods, setMethods] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('devorder_payment_methods') || 'null');
      return stored || DEFAULT_PAYMENT_METHODS;
    } catch { return DEFAULT_PAYMENT_METHODS; }
  });

  const save = (next) => {
    setMethods(next);
    localStorage.setItem('devorder_payment_methods', JSON.stringify(next));
  };

  const add = (method) => save([...methods, method]);
  const update = (id, patch) => save(methods.map(m => m.id === id ? { ...m, ...patch } : m));
  const remove = (id) => {
    if (!confirm('Hapus metode pembayaran ini?')) return;
    save(methods.filter(m => m.id !== id));
  };
  const reset = () => {
    if (!confirm('Reset ke default?')) return;
    save(DEFAULT_PAYMENT_METHODS);
    localStorage.removeItem('devorder_payment_methods');
  };

  return { methods, add, update, remove, reset };
}

// ============================================
// SEED DEMO ORDERS
// ============================================
function maybeSeedOrders() {
  try {
    const existing = JSON.parse(localStorage.getItem('devorder_orders') || '[]');
    if (existing.length > 0) return;
    const demo = [
      {
        code: 'DV-DEMO01', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'pending', total: 1250000, dp: 312500,
        form: {
          name: 'Andi Pratama', wa: '81234567890', email: 'andi@email.com',
          services: ['build'], counts: { master: 2, transaksi: 1, laporan: 0, dashboard: 1 },
          items: {
            master: [
              { name: 'Produk', attrs: [{ name: 'nama', type: 'text' }, { name: 'harga', type: 'currency' }], ops: { create: true, get: true, update: true, delete: true }, notes: 'Perlu kategori produk' },
              { name: 'User', attrs: [{ name: 'email', type: 'email' }], ops: { create: true, get: true, update: true } },
            ],
            transaksi: [{ name: 'Penjualan', attrs: [{ name: 'tanggal', type: 'date' }, { name: 'total', type: 'currency' }], ops: { create: true, get: true, filter: true, sum: true } }],
            dashboard: [{ name: 'Dashboard Owner', widgets: { sums: [{ name: 'Total Penjualan Hari Ini' }, { name: 'Stok Habis' }], charts: [{ name: 'Tren 7 Hari', type: 'line' }], logs: [{ name: 'Log Login User' }] } }],
            laporan: [],
          },
          tech: ['php', 'blade', 'laravel', 'mysql'], notes: 'Ada referensi dari kompetitor', deadline: '2026-06-01',
          paymentMethod: 'bca', palette: 'corp',
        },
      },
      {
        code: 'DV-DEMO02', createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'paid', total: 700000, dp: 175000,
        form: {
          name: 'Bayu Saputra', wa: '8987654321', services: ['landing', 'uml-db'],
          counts: { master: 0, transaksi: 0, laporan: 0, dashboard: 0 }, items: { master: [], transaksi: [], laporan: [], dashboard: [] }, tech: [],
          extras: { landing: { notes: 'Brand sneakers lokal, vibe streetwear' }, 'uml-db': { notes: 'Buat dokumentasi skripsi' } },
          notes: '', deadline: '2026-05-30', paymentMethod: 'dana',
        },
      },
      {
        code: 'DV-DEMO03', createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'in-progress', total: 100000, dp: 25000,
        form: {
          name: 'Citra Dewi', wa: '85678901234', services: ['consult'],
          consult: { fields: '- login dgn google\n- manage product\n- laporan penjualan', pdm: true, usecase: true, activity: false, probis: 'Customer pesan via WA, admin input manual, kasir cetak struk.' },
          counts: { master: 0, transaksi: 0, laporan: 0, dashboard: 0 }, items: { master: [], transaksi: [], laporan: [], dashboard: [] }, tech: [],
          notes: '', deadline: '2026-05-25', paymentMethod: 'qris',
        },
      },
    ];
    localStorage.setItem('devorder_orders', JSON.stringify(demo));
  } catch (e) { /* ignore */ }
}

// ============================================
// APP
// ============================================
const PAGES = [
  { id: 'overview',  label: 'Overview',           icon: '◐' },
  { id: 'orders',    label: 'Order Masuk',         icon: '◉' },
  { id: 'pricing',   label: 'Harga & Operasi',     icon: '₹' },
  { id: 'payments',  label: 'Metode Pembayaran',   icon: '💳' },
  { id: 'settings',  label: 'Pengaturan',          icon: '⚙' },
];

function AdminApp() {
  const [page, setPage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pricing, updatePricing, resetPricing] = usePricing();
  const orderStore = useOrders();
  const paymentStore = usePaymentMethods();
  const [detailOrder, setDetailOrder] = useState(null);

  useEffect(() => { maybeSeedOrders(); orderStore.refresh(); }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="admin-shell">
      <aside className={'admin-sidebar' + (sidebarOpen ? ' open' : '')}>
        <div className="admin-brand">
          <div className="admin-brand-mark">{'</>'}</div>
          <div>
            <div className="admin-brand-title">DevOrder</div>
            <div className="admin-brand-sub">Admin Panel</div>
          </div>
        </div>
        <nav className="admin-nav">
          {PAGES.map(p => (
            <button
              key={p.id}
              className={'admin-nav-item' + (page === p.id ? ' active' : '')}
              onClick={() => { setPage(p.id); setSidebarOpen(false); }}
            >
              <span className="admin-nav-icon">{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <a href="index.html" className="admin-back-link">← Kembali ke Form</a>
        </div>
      </aside>

      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="admin-main">
        <div className="admin-topbar">
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="menu">☰</button>
          <div className="admin-topbar-title">{PAGES.find(p => p.id === page)?.label}</div>
          <div className="admin-topbar-meta">
            <span className="admin-meta-dot" />
            Synced
          </div>
        </div>

        <div className="admin-content">
          {page === 'overview'  && <PageOverview orders={orderStore.orders} pricing={pricing} setPage={setPage} setDetailOrder={setDetailOrder} />}
          {page === 'orders'    && <PageOrders store={orderStore} pricing={pricing} setDetailOrder={setDetailOrder} />}
          {page === 'pricing'   && <PagePricing pricing={pricing} update={updatePricing} reset={resetPricing} />}
          {page === 'payments'  && <PagePayments store={paymentStore} />}
          {page === 'settings'  && <PageSettings />}
        </div>
      </main>

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onStatusChange={(s) => { orderStore.updateStatus(detailOrder.code, s); setDetailOrder({ ...detailOrder, status: s }); }}
        />
      )}
    </div>
  );
}

// ============================================
// OVERVIEW
// ============================================
function PageOverview({ orders, pricing, setPage, setDetailOrder }) {
  const stats = useMemo(() => {
    const totalRev = orders.reduce((s, o) => s + (o.total || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const paidCount = orders.filter(o => o.status === 'paid' || o.status === 'in-progress' || o.status === 'done').length;
    const last7Rev = orders.filter(o => Date.now() - new Date(o.createdAt).getTime() < 7 * 86400000).reduce((s, o) => s + (o.total || 0), 0);
    return { totalRev, pendingCount, paidCount, last7Rev, total: orders.length };
  }, [orders]);

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const rev = orders
        .filter(o => { const t = new Date(o.createdAt).getTime(); return t >= d.getTime() && t < next.getTime(); })
        .reduce((s, o) => s + (o.total || 0), 0);
      days.push({ label: d.toLocaleDateString('id-ID', { weekday: 'short' }), value: rev });
    }
    return days;
  }, [orders]);

  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Total Order" val={stats.total} eyebrow="all-time" />
        <StatCard label="Pending" val={stats.pendingCount} eyebrow="butuh konfirmasi" tone="warning" />
        <StatCard label="Paid / In-progress" val={stats.paidCount} eyebrow="dalam pengerjaan" tone="accent" />
        <StatCard label="Revenue 7 Hari" val={fmtRp(stats.last7Rev)} eyebrow={`Total all: ${fmtRp(stats.totalRev)}`} tone="primary" />
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <div className="admin-card-title">Revenue 7 Hari Terakhir</div>
            <div className="admin-card-sub">Total order yang masuk per hari</div>
          </div>
        </div>
        <div className="bar-chart">
          {chartData.map((d, i) => (
            <div key={i} className="bar-col">
              <div className="bar-val">{d.value > 0 ? (d.value / 1000).toFixed(0) + 'k' : ''}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ height: (d.value / maxVal * 100) + '%' }} />
              </div>
              <div className="bar-label">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <div className="admin-card-title">Order Terbaru</div>
            <div className="admin-card-sub">5 order paling baru</div>
          </div>
          <button className="admin-btn-ghost" onClick={() => setPage('orders')}>Lihat semua →</button>
        </div>
        <OrderTable orders={orders.slice(0, 5)} onRowClick={setDetailOrder} compact />
      </div>
    </div>
  );
}

function StatCard({ label, val, eyebrow, tone }) {
  return (
    <div className={'stat-card' + (tone ? ' tone-' + tone : '')}>
      <div className="stat-label">{label}</div>
      <div className="stat-val">{val}</div>
      <div className="stat-eyebrow">{eyebrow}</div>
    </div>
  );
}

// ============================================
// ORDERS PAGE
// ============================================
const STATUS_OPTIONS = [
  { id: 'pending',     label: 'Pending',      tone: 'warning'  },
  { id: 'paid',        label: 'Paid',         tone: 'accent'   },
  { id: 'in-progress', label: 'In Progress',  tone: 'primary'  },
  { id: 'done',        label: 'Done',         tone: 'success'  },
  { id: 'cancelled',   label: 'Cancelled',    tone: 'muted'    },
];

function PageOrders({ store, pricing, setDetailOrder }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    return store.orders.filter(o => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (q && !(o.code.toLowerCase().includes(q.toLowerCase()) || (o.form?.name || '').toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [store.orders, filter, q]);

  return (
    <div>
      <div className="admin-card">
        <div className="admin-toolbar">
          <input
            className="admin-input"
            placeholder="🔍 Cari kode atau nama..."
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ flex: 1, minWidth: 180 }}
          />
          <div className="filter-tabs">
            {[{ id: 'all', label: 'Semua' }, ...STATUS_OPTIONS].map(f => (
              <button
                key={f.id}
                className={'filter-tab' + (filter === f.id ? ' active' : '')}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                {f.id !== 'all' && <span className="filter-count">{store.orders.filter(o => o.status === f.id).length}</span>}
              </button>
            ))}
          </div>
          <button className="admin-btn-danger-ghost" onClick={store.clearAll}>Hapus semua</button>
        </div>

        <OrderTable orders={filtered} onRowClick={setDetailOrder} onDelete={store.remove} />

        {filtered.length === 0 && (
          <div className="admin-empty">
            <div className="admin-empty-icon">∅</div>
            <div className="admin-empty-title">Belum ada order</div>
            <div className="admin-empty-sub">Order yang masuk dari form bakal muncul di sini.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderTable({ orders, onRowClick, onDelete, compact }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Customer</th>
            <th>Jasa</th>
            <th className="num">Total</th>
            <th>Status</th>
            <th>Tanggal</th>
            {onDelete && <th></th>}
          </tr>
        </thead>
        <tbody>
          {orders.map(o => {
            const status = STATUS_OPTIONS.find(s => s.id === o.status) || STATUS_OPTIONS[0];
            const services = (o.form?.services || []).map(sid => ({
              build: 'Build', 'uml-db': 'UML+DB', landing: 'Landing', revision: 'Revisi', consult: 'Konsul'
            })[sid] || sid);
            return (
              <tr key={o.code} onClick={() => onRowClick(o)} className="order-row">
                <td className="mono"><strong>{o.code}</strong></td>
                <td>
                  <div className="cell-stack">
                    <div className="cell-strong">{o.form?.name || '—'}</div>
                    <div className="cell-muted">+62{o.form?.wa}</div>
                  </div>
                </td>
                <td>
                  <div className="svc-chips">
                    {services.map((s, i) => <span key={i} className="svc-chip">{s}</span>)}
                  </div>
                </td>
                <td className="num mono">{fmtRp(o.total || 0)}</td>
                <td><span className={'status-pill tone-' + status.tone}>{status.label}</span></td>
                <td className="cell-muted mono">{new Date(o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                {onDelete && (
                  <td onClick={e => e.stopPropagation()}>
                    <button className="row-delete" onClick={() => onDelete(o.code)} title="Hapus">×</button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// ORDER DETAIL MODAL
// ============================================
function OrderDetailModal({ order, onClose, onStatusChange }) {
  const f = order.form || {};
  const services = (f.services || []).map(sid => ({
    build: 'Build dari 0', 'uml-db': 'UML & Database', landing: 'Landing Page', revision: 'Revisi', consult: 'Konsultasi'
  })[sid] || sid);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">Order Detail</div>
            <div className="modal-title">{order.code}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <div className="modal-section-title">Status</div>
            <div className="status-grid">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.id}
                  className={'status-btn tone-' + s.tone + (order.status === s.id ? ' active' : '')}
                  onClick={() => onStatusChange(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <div className="modal-section-title">Pelanggan</div>
            <DetailRow label="Nama" val={f.name || '—'} />
            <DetailRow label="WhatsApp" val={
              <a href={`https://wa.me/62${f.wa}`} target="_blank" rel="noopener" className="link">+62{f.wa} →</a>
            } />
            {f.email && <DetailRow label="Email" val={f.email} />}
            <DetailRow label="Tanggal Order" val={new Date(order.createdAt).toLocaleString('id-ID')} />
          </div>

          <div className="modal-section">
            <div className="modal-section-title">Jasa Dipilih</div>
            <div className="svc-chips">
              {services.map((s, i) => <span key={i} className="svc-chip lg">{s}</span>)}
            </div>
            {f.consult && (f.consult.fields || f.consult.probis) && (
              <div className="modal-paragraph">
                {f.consult.fields && <><strong>Kebutuhan:</strong><pre>{f.consult.fields}</pre></>}
                {f.consult.probis && <><strong>Proses Bisnis:</strong><pre>{f.consult.probis}</pre></>}
              </div>
            )}
          </div>

          {(f.counts && Object.values(f.counts).some(v => v > 0)) && (
            <div className="modal-section">
              <div className="modal-section-title">Scope Build</div>
              {['master', 'transaksi', 'laporan', 'dashboard'].map(k => {
                const items = f.items?.[k] || [];
                if (!items.length) return null;
                return (
                  <div key={k} className="scope-block">
                    <div className="scope-block-title">{k.charAt(0).toUpperCase() + k.slice(1)} ({items.length})</div>
                    {items.map((it, i) => (
                      <div key={i} className="scope-item">
                        <strong>{it.name || `(belum diisi #${i + 1})`}</strong>
                        {it.attrs && it.attrs.length > 0 && (
                          <div className="scope-meta">atribut: {it.attrs.map(a => `${a.name}:${a.type}`).join(', ')}</div>
                        )}
                        {it.ops && (
                          <div className="scope-meta">operasi: {Object.keys(it.ops).filter(o => it.ops[o]).join(', ') || '—'}</div>
                        )}
                        {it.widgets && (
                          <div className="scope-meta">widget: {it.widgets.sums.length} sum, {it.widgets.charts.length} chart, {it.widgets.logs.length} log</div>
                        )}
                        {it.notes && <div className="scope-meta italic">"{it.notes}"</div>}
                      </div>
                    ))}
                  </div>
                );
              })}
              {f.tech && f.tech.length > 0 && <DetailRow label="Tech" val={f.tech.join(', ')} />}
            </div>
          )}

          <div className="modal-section">
            <div className="modal-section-title">Timeline & Catatan</div>
            <DetailRow label="Deadline" val={f.deadline ? new Date(f.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
            {f.notes && <div className="modal-paragraph"><pre>{f.notes}</pre></div>}
          </div>

          <div className="modal-section modal-total">
            <DetailRow label="DP (25%)" val={fmtRp(order.dp || 0)} />
            <DetailRow label="Sisa (75%)" val={fmtRp((order.total || 0) - (order.dp || 0))} />
            <DetailRow label="Metode" val={(f.paymentMethod || '—').toUpperCase()} />
            <DetailRow label="TOTAL" val={fmtRp(order.total || 0)} big />
          </div>

          <a
            className="modal-wa-cta"
            href={`https://wa.me/62${f.wa}?text=${encodeURIComponent(`Halo ${f.name}, pesanan ${order.code} udah kami terima. `)}`}
            target="_blank" rel="noopener"
          >
            💬 Chat customer via WhatsApp →
          </a>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, val, big }) {
  return (
    <div className={'detail-row' + (big ? ' big' : '')}>
      <span className="detail-row-label">{label}</span>
      <span className="detail-row-val">{val}</span>
    </div>
  );
}

// ============================================
// PRICING PAGE
// ============================================
function PagePricing({ pricing, update, reset }) {
  return (
    <div>
      <div className="admin-card admin-info-card">
        <div className="admin-info-icon">i</div>
        <div style={{ flex: 1 }}>
          <strong>Harga di-manage dari sini.</strong> Perubahan langsung kepake di form customer. Klik nominal buat edit.
        </div>
        <button className="admin-btn-ghost" onClick={reset}>↺ Reset semua</button>
      </div>

      {PRICING_GROUPS.map(g => (
        <div key={g.title} className="admin-card">
          <div className="admin-card-head">
            <div>
              <div className="admin-card-title">{g.title}</div>
              <div className="admin-card-sub">{g.desc}</div>
            </div>
          </div>
          <div className="price-grid">
            {g.keys.map(([key, label, desc]) => (
              <PriceCell key={key} pkey={key} label={label} desc={desc} val={pricing[key]} onChange={(v) => update(key, v)} defaultVal={DEFAULT_PRICING[key]} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PriceCell({ pkey, label, desc, val, onChange, defaultVal }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(val));

  useEffect(() => { setDraft(String(val)); }, [val]);

  const save = () => {
    const n = parseInt(draft.replace(/\D/g, ''), 10);
    if (!isNaN(n) && n >= 0) onChange(n);
    setEditing(false);
  };

  return (
    <div className="price-cell">
      <div className="price-cell-body">
        <div className="price-cell-label">{label}</div>
        <div className="price-cell-desc">{desc}</div>
      </div>
      <div className="price-cell-action">
        {editing ? (
          <div className="price-edit-row">
            <span className="price-edit-prefix">Rp</span>
            <input
              autoFocus
              className="price-edit-input"
              value={draft}
              onChange={e => setDraft(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setDraft(String(val)); } }}
              onBlur={save}
            />
          </div>
        ) : (
          <button className="price-display" onClick={() => setEditing(true)}>
            {fmtRp(val)}
            <span className="price-edit-hint">✎</span>
          </button>
        )}
        {val !== defaultVal && (
          <div className="price-default-hint">default: {fmtRp(defaultVal)}</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PAYMENT METHODS PAGE
// ============================================
const EMPTY_METHOD = { id: '', name: '', norek: '', atasNama: '', type: 'bank' };

function PagePayments({ store }) {
  const [editing, setEditing] = useState(null); // id or 'new'
  const [form, setForm] = useState(EMPTY_METHOD);

  const startEdit = (m) => { setEditing(m.id); setForm({ ...m }); };
  const startNew = () => { setEditing('new'); setForm({ ...EMPTY_METHOD, id: 'pm_' + Date.now() }); };
  const cancel = () => { setEditing(null); setForm(EMPTY_METHOD); };

  const save = () => {
    if (!form.name.trim() || !form.norek.trim()) return alert('Nama dan nomor rekening wajib diisi.');
    if (editing === 'new') {
      store.add({ ...form });
    } else {
      store.update(editing, { ...form });
    }
    cancel();
  };

  const pmLogoColor = (id) => PM_LOGO_COLORS[id] || '#6B6B62';

  return (
    <div>
      <div className="admin-card admin-info-card">
        <div className="admin-info-icon">i</div>
        <div style={{ flex: 1 }}>
          Metode pembayaran yang ditampilkan ke customer saat checkout. Klik ✎ untuk edit.
        </div>
        <button className="admin-btn-ghost" onClick={store.reset}>↺ Reset default</button>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <div className="admin-card-title">Daftar Metode Pembayaran</div>
            <div className="admin-card-sub">{store.methods.length} metode aktif</div>
          </div>
          <button className="admin-btn-primary" onClick={startNew}>+ Tambah</button>
        </div>

        {editing === 'new' && (
          <div className="pm-edit-form">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--primary)' }}>➕ Metode Baru</div>
            <PMForm form={form} setForm={setForm} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="admin-btn-primary admin-btn-sm" onClick={save}>Simpan</button>
              <button className="admin-btn-ghost admin-btn-sm" onClick={cancel}>Batal</button>
            </div>
          </div>
        )}

        <div className="pm-list">
          {store.methods.map(m => (
            <div key={m.id}>
              {editing === m.id ? (
                <div className="pm-edit-form">
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--primary)' }}>✎ Edit: {m.name}</div>
                  <PMForm form={form} setForm={setForm} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="admin-btn-primary admin-btn-sm" onClick={save}>Simpan</button>
                    <button className="admin-btn-ghost admin-btn-sm" onClick={cancel}>Batal</button>
                  </div>
                </div>
              ) : (
                <div className="pm-item">
                  <div className="pm-logo" style={{ background: pmLogoColor(m.id) }}>
                    {m.name.substring(0, 4).toUpperCase()}
                  </div>
                  <div className="pm-body">
                    <div className="pm-name">{m.name} <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 400, background: 'var(--bg-subtle)', borderRadius: 4, padding: '1px 6px' }}>{m.type}</span></div>
                    <div className="pm-detail">{m.norek} · a.n. {m.atasNama}</div>
                  </div>
                  <div className="pm-actions">
                    <button className="admin-btn-ghost admin-btn-sm" onClick={() => startEdit(m)}>✎ Edit</button>
                    <button className="admin-btn-danger-sm" onClick={() => store.remove(m.id)}>× Hapus</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {store.methods.length === 0 && (
          <div className="pm-add-card" onClick={startNew}>
            + Belum ada metode pembayaran. Klik untuk tambah.
          </div>
        )}
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <div className="admin-card-title">Cara Kerja</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>📌 Data tersimpan di <code style={{ background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>localStorage</code> browser ini.</div>
          <div>📌 Customer melihat daftar ini saat memilih metode bayar di step pembayaran.</div>
          <div>📌 Untuk sync ke Google Sheets / backend, update <code style={{ background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>payment_methods</code> via <strong>saveConfig</strong> di Apps Script.</div>
        </div>
      </div>
    </div>
  );
}

function PMForm({ form, setForm }) {
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="pm-form-grid">
      <div className="pm-form-field">
        <label className="pm-form-label">Nama Metode *</label>
        <input className="admin-input" style={{ width: '100%' }} value={form.name} onChange={e => upd('name', e.target.value)} placeholder="cth: BCA, Dana, ShopeePay" />
      </div>
      <div className="pm-form-field">
        <label className="pm-form-label">Tipe</label>
        <select className="admin-input" style={{ width: '100%' }} value={form.type} onChange={e => upd('type', e.target.value)}>
          <option value="bank">Bank Transfer</option>
          <option value="ewallet">E-Wallet</option>
          <option value="qris">QRIS</option>
        </select>
      </div>
      <div className="pm-form-field">
        <label className="pm-form-label">Nomor Rekening / Nomor HP *</label>
        <input className="admin-input" style={{ width: '100%' }} value={form.norek} onChange={e => upd('norek', e.target.value)} placeholder="cth: 1234567890 atau 081234567890" />
      </div>
      <div className="pm-form-field">
        <label className="pm-form-label">Atas Nama</label>
        <input className="admin-input" style={{ width: '100%' }} value={form.atasNama} onChange={e => upd('atasNama', e.target.value)} placeholder="Nama pemilik rekening" />
      </div>
      <div className="pm-form-field pm-form-span">
        <label className="pm-form-label">ID (untuk internal, huruf kecil tanpa spasi)</label>
        <input className="admin-input" style={{ width: '100%' }} value={form.id} onChange={e => upd('id', e.target.value.toLowerCase().replace(/\s/g, '_'))} placeholder="cth: bca, dana, shopeepay" />
      </div>
    </div>
  );
}

// ============================================
// SETTINGS
// ============================================
function PageSettings() {
  const [wa, setWa] = useState(() => localStorage.getItem('devorder_admin_wa') || '6281234567890');
  const [studio, setStudio] = useState(() => localStorage.getItem('devorder_studio_name') || 'DevOrder Studio');

  const save = () => {
    localStorage.setItem('devorder_admin_wa', wa);
    localStorage.setItem('devorder_studio_name', studio);
    alert('Pengaturan tersimpan!');
  };

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <div className="admin-card-title">Pengaturan Studio</div>
            <div className="admin-card-sub">Info dasar yang muncul di form customer</div>
          </div>
        </div>
        <div className="settings-grid">
          <div>
            <label className="settings-label">Nama Studio</label>
            <input className="admin-input" style={{ width: '100%' }} value={studio} onChange={e => setStudio(e.target.value)} />
          </div>
          <div>
            <label className="settings-label">WhatsApp Admin (untuk konfirmasi customer)</label>
            <input className="admin-input" style={{ width: '100%' }} value={wa} onChange={e => setWa(e.target.value.replace(/\D/g, ''))} placeholder="6281234567890" />
            <div className="settings-hint">Format: 62xxxx (tanpa +/spasi). Muncul di success screen customer.</div>
          </div>
        </div>
        <button className="admin-btn-primary" onClick={save} style={{ marginTop: 16 }}>Simpan</button>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <div className="admin-card-title">Data Storage</div>
            <div className="admin-card-sub">Semua data tersimpan di browser (localStorage)</div>
          </div>
        </div>
        <div className="settings-grid">
          <button className="admin-btn-ghost" style={{ width: 'fit-content' }} onClick={() => {
            const data = {
              orders: JSON.parse(localStorage.getItem('devorder_orders') || '[]'),
              pricing: JSON.parse(localStorage.getItem('devorder_pricing') || '{}'),
              paymentMethods: JSON.parse(localStorage.getItem('devorder_payment_methods') || 'null'),
              settings: { wa, studio },
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `devorder-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}>↓ Export Backup (JSON)</button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('admin-root')).render(<AdminApp />);

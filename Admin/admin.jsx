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
    desc: 'Harga per widget di dashboard',
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
    title: 'Lainnya',
    desc: 'Atribut & tech "Saran developer"',
    keys: [
      ['attr', 'Per Atribut', 'Harga per atribut/field'],
      ['techDev', 'Saran Developer', 'Per kategori FE/BE/DB'],
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
  bca: '#0060AF', blu: '#5CB8E4', mandiri: '#003D79', bri: '#1566C0', bni: '#FF6600',
  dana: '#118EEA', ovo: '#4C3494', gopay: '#00AED6', shopeepay: '#EE4D2D', qris: '#ED1C24',
};

// ============================================
// DEFAULT KONTEN CONFIG
// ============================================
const DEFAULT_UML_DIAGRAMS = [
  { id: 'erd',      label: 'ERD (Entity Relationship Diagram)' },
  { id: 'pdm',      label: 'PDM (Physical Data Model)'         },
  { id: 'usecase',  label: 'Use Case Diagram'                  },
  { id: 'activity', label: 'Activity Diagram'                  },
  { id: 'sequence', label: 'Sequence Diagram'                  },
  { id: 'class',    label: 'Class Diagram'                     },
];

const DEFAULT_TECH_OPTIONS = {
  bahasa: [
    { id: 'php',    label: 'PHP'                    },
    { id: 'js',     label: 'JavaScript / TypeScript' },
    { id: 'python', label: 'Python'                 },
    { id: 'java',   label: 'Java'                   },
    { id: 'dart',   label: 'Dart'                   },
    { id: 'cs',     label: 'C#'                     },
    { id: 'bahasa_dev', label: 'Saran developer', auto: true },
  ],
  fe: [
    { id: 'react',       label: 'React'              },
    { id: 'next',        label: 'Next.js'            },
    { id: 'vue',         label: 'Vue / Nuxt'         },
    { id: 'svelte',      label: 'Svelte'             },
    { id: 'flutter',     label: 'Flutter (mobile)'   },
    { id: 'html_native', label: 'HTML/CSS/JS Native' },
    { id: 'blade',       label: 'Laravel Blade'      },
    { id: 'fe_dev',      label: 'Saran developer', auto: true },
  ],
  be: [
    { id: 'laravel',     label: 'Laravel'          },
    { id: 'codeigniter', label: 'CodeIgniter'       },
    { id: 'node',        label: 'Node.js + Express' },
    { id: 'django',      label: 'Django'            },
    { id: 'flask',       label: 'Flask'             },
    { id: 'spring',      label: 'Spring Boot'       },
    { id: 'dotnet',      label: '.NET'              },
    { id: 'be_dev',      label: 'Saran developer', auto: true },
  ],
  db: [
    { id: 'mysql',    label: 'MySQL'      },
    { id: 'pg',       label: 'PostgreSQL' },
    { id: 'sqlite',   label: 'SQLite'     },
    { id: 'mongo',    label: 'MongoDB'    },
    { id: 'firebase', label: 'Firebase'   },
    { id: 'supabase', label: 'Supabase'   },
    { id: 'db_dev',   label: 'Saran developer', auto: true },
  ],
};

const DEFAULT_OPS_CRUD = [
  { id: 'create', label: 'Create',         desc: 'Tambah data baru',          priceKey: 'op_create' },
  { id: 'get',    label: 'Get / List',     desc: 'Lihat data (read)',          priceKey: 'op_get'    },
  { id: 'update', label: 'Update',         desc: 'Edit data',                 priceKey: 'op_update' },
  { id: 'delete', label: 'Delete',         desc: 'Hapus data',                priceKey: 'op_delete' },
  { id: 'filter', label: 'Filter / Search',desc: 'Cari + filter terindeks',   priceKey: 'op_filter' },
  { id: 'sum',    label: 'Get Sum',        desc: 'Hitung total / agregasi',   priceKey: 'op_sum'    },
];

const DEFAULT_OPS_LAPORAN = [
  { id: 'get',         label: 'Get Data',        desc: 'Tampilkan laporan',      priceKey: 'op_get'         },
  { id: 'filter',      label: 'Filter Periode',  desc: 'Filter rentang tanggal', priceKey: 'op_filter'      },
  { id: 'sum',         label: 'Agregasi / Sum',  desc: 'Total, rata-rata, dll',  priceKey: 'op_sum'         },
  { id: 'exportPdf',   label: 'Export PDF',      desc: 'Cetak ke PDF',           priceKey: 'op_exportPdf'   },
  { id: 'exportExcel', label: 'Export Excel',    desc: 'Cetak ke .xlsx',         priceKey: 'op_exportExcel' },
  { id: 'print',       label: 'Print Langsung',  desc: 'Print ke printer',       priceKey: 'op_print'       },
];

const DEFAULT_ATTR_TYPES = [
  { id: 'text',     label: 'Text'         },
  { id: 'longtext', label: 'Long Text'    },
  { id: 'number',   label: 'Number'       },
  { id: 'currency', label: 'Currency'     },
  { id: 'date',     label: 'Date'         },
  { id: 'datetime', label: 'Datetime'     },
  { id: 'boolean',  label: 'Boolean'      },
  { id: 'email',    label: 'Email'        },
  { id: 'phone',    label: 'Phone'        },
  { id: 'image',    label: 'Image / File' },
  { id: 'relation', label: 'Relasi'       },
];

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
    if (!confirm(`Hapus order ${code}?`)) return;
    const next = orders.filter(o => o.code !== code);
    setOrders(next);
    localStorage.setItem('devorder_orders', JSON.stringify(next));
  };

  const clearAll = () => {
    if (!confirm('Hapus SEMUA order?')) return;
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

  const save = (next) => { setMethods(next); localStorage.setItem('devorder_payment_methods', JSON.stringify(next)); };
  const add    = (m)  => save([...methods, m]);
  const update = (id, patch) => save(methods.map(m => m.id === id ? { ...m, ...patch } : m));
  const remove = (id) => { if (!confirm('Hapus metode ini?')) return; save(methods.filter(m => m.id !== id)); };
  const reset  = ()  => { if (!confirm('Reset ke default?')) return; save(DEFAULT_PAYMENT_METHODS); localStorage.removeItem('devorder_payment_methods'); };

  return { methods, add, update, remove, reset };
}

// -- Konten hooks --
function useUmlDiagrams() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('devorder_uml_diagrams') || 'null') || DEFAULT_UML_DIAGRAMS; }
    catch { return DEFAULT_UML_DIAGRAMS; }
  });
  const save  = (next) => { setItems(next); localStorage.setItem('devorder_uml_diagrams', JSON.stringify(next)); };
  const add   = (item) => save([...items, item]);
  const remove = (id) => save(items.filter(x => x.id !== id));
  const reset  = ()    => { if (!confirm('Reset ke default?')) return; save(DEFAULT_UML_DIAGRAMS); localStorage.removeItem('devorder_uml_diagrams'); };
  return { items, add, remove, reset };
}

function useTechOptions() {
  const [opts, setOpts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('devorder_tech_groups') || 'null') || DEFAULT_TECH_OPTIONS; }
    catch { return DEFAULT_TECH_OPTIONS; }
  });
  const save     = (next) => { setOpts(next); localStorage.setItem('devorder_tech_groups', JSON.stringify(next)); };
  const addItem  = (group, item) => save({ ...opts, [group]: [...(opts[group] || []), item] });
  const removeItem = (group, id) => save({ ...opts, [group]: (opts[group] || []).filter(x => x.id !== id) });
  const reset    = ()            => { if (!confirm('Reset ke default?')) return; save(DEFAULT_TECH_OPTIONS); localStorage.removeItem('devorder_tech_groups'); };
  return { opts, addItem, removeItem, reset };
}

function useOpsCrud() {
  const [ops, setOps] = useState(() => {
    try { return JSON.parse(localStorage.getItem('devorder_ops_crud') || 'null') || DEFAULT_OPS_CRUD; }
    catch { return DEFAULT_OPS_CRUD; }
  });
  const save   = (next) => { setOps(next); localStorage.setItem('devorder_ops_crud', JSON.stringify(next)); };
  const add    = (item) => save([...ops, item]);
  const remove = (id)   => save(ops.filter(x => x.id !== id));
  const reset  = ()     => { if (!confirm('Reset ke default?')) return; save(DEFAULT_OPS_CRUD); localStorage.removeItem('devorder_ops_crud'); };
  return { ops, add, remove, reset };
}

function useOpsLaporan() {
  const [ops, setOps] = useState(() => {
    try { return JSON.parse(localStorage.getItem('devorder_ops_laporan') || 'null') || DEFAULT_OPS_LAPORAN; }
    catch { return DEFAULT_OPS_LAPORAN; }
  });
  const save   = (next) => { setOps(next); localStorage.setItem('devorder_ops_laporan', JSON.stringify(next)); };
  const add    = (item) => save([...ops, item]);
  const remove = (id)   => save(ops.filter(x => x.id !== id));
  const reset  = ()     => { if (!confirm('Reset ke default?')) return; save(DEFAULT_OPS_LAPORAN); localStorage.removeItem('devorder_ops_laporan'); };
  return { ops, add, remove, reset };
}

function useAttrTypes() {
  const [types, setTypes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('devorder_attr_types') || 'null') || DEFAULT_ATTR_TYPES; }
    catch { return DEFAULT_ATTR_TYPES; }
  });
  const save   = (next) => { setTypes(next); localStorage.setItem('devorder_attr_types', JSON.stringify(next)); };
  const add    = (item) => save([...types, item]);
  const remove = (id)   => save(types.filter(x => x.id !== id));
  const reset  = ()     => { if (!confirm('Reset ke default?')) return; save(DEFAULT_ATTR_TYPES); localStorage.removeItem('devorder_attr_types'); };
  return { types, add, remove, reset };
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
          services: ['build'],
          counts: { master: 2, transaksi: 1, laporan: 0, dashboard: 1 },
          items: {
            master: [
              { name: 'Produk', attrs: [{ name: 'nama', type: 'text' }, { name: 'harga', type: 'currency' }], ops: { create: true, get: true, update: true, delete: true }, notes: '' },
              { name: 'User',   attrs: [{ name: 'email', type: 'email' }], ops: { create: true, get: true, update: true }, notes: '' },
            ],
            transaksi: [{ name: 'Penjualan', attrs: [{ name: 'tanggal', type: 'date' }, { name: 'total', type: 'currency' }], ops: { create: true, get: true, filter: true, sum: true }, notes: '' }],
            dashboard: [{ name: 'Dashboard Owner', widgets: { sums: [{ name: 'Total Penjualan Hari Ini' }], charts: [{ name: 'Tren 7 Hari', type: 'line' }], logs: [{ name: 'Log Login User' }] }, notes: '' }],
            laporan: [],
          },
          buildProbis: 'Sistem kasir untuk toko retail kecil.',
          tech: ['php', 'blade', 'laravel', 'mysql'],
          notes: '', deadline: '2026-06-01', paymentMethod: 'bca', palette: 'corp',
        },
      },
      {
        code: 'DV-DEMO02', createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'pending', total: 0, dp: 0,
        form: {
          name: 'Bayu Saputra', wa: '8987654321', services: ['uml-db'],
          extras: { 'uml-db': { diagrams: ['erd', 'pdm'], notes: 'Untuk keperluan skripsi sistem manajemen inventori.' } },
          counts: { master: 0, transaksi: 0, laporan: 0, dashboard: 0 }, items: { master: [], transaksi: [], laporan: [], dashboard: [] }, tech: [],
          notes: '', deadline: '2026-05-30',
        },
      },
      {
        code: 'DV-DEMO03', createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'pending', total: 0, dp: 0,
        form: {
          name: 'Citra Dewi', wa: '85678901234', services: ['landing'],
          extras: { landing: { notes: 'Brand skincare lokal, vibe clean & modern.' } },
          counts: { master: 0, transaksi: 0, laporan: 0, dashboard: 0 }, items: { master: [], transaksi: [], laporan: [], dashboard: [] },
          tech: ['react'], notes: '', deadline: '2026-05-25',
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
  { id: 'overview', label: 'Overview',         icon: '◐'  },
  { id: 'orders',   label: 'Order Masuk',       icon: '◉'  },
  { id: 'pricing',  label: 'Harga & Operasi',   icon: '₹'  },
  { id: 'payments', label: 'Metode Pembayaran', icon: '💳' },
  { id: 'konten',   label: 'Konten Jasa',       icon: '✦'  },
  { id: 'settings', label: 'Pengaturan',        icon: '⚙'  },
];

function AdminApp() {
  const [page, setPage]               = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pricing, updatePricing, resetPricing] = usePricing();
  const orderStore   = useOrders();
  const paymentStore = usePaymentMethods();
  const umlStore     = useUmlDiagrams();
  const techStore    = useTechOptions();
  const opsCrudStore    = useOpsCrud();
  const opsLaporanStore = useOpsLaporan();
  const attrStore    = useAttrTypes();
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
            <span className="admin-meta-dot" />Synced
          </div>
        </div>

        <div className="admin-content">
          {page === 'overview' && <PageOverview orders={orderStore.orders} pricing={pricing} setPage={setPage} setDetailOrder={setDetailOrder} />}
          {page === 'orders'   && <PageOrders store={orderStore} pricing={pricing} setDetailOrder={setDetailOrder} />}
          {page === 'pricing'  && <PagePricing pricing={pricing} update={updatePricing} reset={resetPricing} />}
          {page === 'payments' && <PagePayments store={paymentStore} />}
          {page === 'konten'   && (
            <PageKonten
              umlStore={umlStore}
              techStore={techStore}
              opsCrudStore={opsCrudStore}
              opsLaporanStore={opsLaporanStore}
              attrStore={attrStore}
            />
          )}
          {page === 'settings' && <PageSettings />}
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
    const totalRev    = orders.reduce((s, o) => s + (o.total || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const paidCount   = orders.filter(o => ['paid','in-progress','done'].includes(o.status)).length;
    const last7Rev    = orders.filter(o => Date.now() - new Date(o.createdAt).getTime() < 7 * 86400000).reduce((s, o) => s + (o.total || 0), 0);
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
        <StatCard label="Total Order"        val={stats.total}            eyebrow="all-time"            />
        <StatCard label="Pending"            val={stats.pendingCount}     eyebrow="butuh konfirmasi"   tone="warning" />
        <StatCard label="Paid / In-progress" val={stats.paidCount}        eyebrow="dalam pengerjaan"   tone="accent"  />
        <StatCard label="Revenue 7 Hari"     val={fmtRp(stats.last7Rev)}  eyebrow={`Total all: ${fmtRp(stats.totalRev)}`} tone="primary" />
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <div className="admin-card-title">Revenue 7 Hari Terakhir</div>
            <div className="admin-card-sub">Total order build yang masuk per hari</div>
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
  { id: 'pending',     label: 'Pending',     tone: 'warning' },
  { id: 'paid',        label: 'Paid',        tone: 'accent'  },
  { id: 'in-progress', label: 'In Progress', tone: 'primary' },
  { id: 'done',        label: 'Done',        tone: 'success' },
  { id: 'cancelled',   label: 'Cancelled',   tone: 'muted'   },
];

function PageOrders({ store, pricing, setDetailOrder }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ]           = useState('');

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
            const status   = STATUS_OPTIONS.find(s => s.id === o.status) || STATUS_OPTIONS[0];
            const services = (o.form?.services || []).map(sid => ({
              build: 'Build', 'uml-db': 'UML+DB', landing: 'Landing', revision: 'Revisi',
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
                <td className="num mono">{o.total > 0 ? fmtRp(o.total) : <span style={{ color: 'var(--text-faint)' }}>Via chat</span>}</td>
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
  const f        = order.form || {};
  const services = (f.services || []).map(sid => ({
    build: 'Build dari 0', 'uml-db': 'UML & Database', landing: 'Landing Page', revision: 'Revisi/Bug Fix',
  })[sid] || sid);

  const umlDiagramLabels = (() => {
    const stored = JSON.parse(localStorage.getItem('devorder_uml_diagrams') || 'null') || DEFAULT_UML_DIAGRAMS;
    return (f.extras?.['uml-db']?.diagrams || []).map(id => stored.find(d => d.id === id)?.label || id);
  })();

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
            <DetailRow label="Nama"         val={f.name || '—'} />
            <DetailRow label="WhatsApp"     val={<a href={`https://wa.me/62${f.wa}`} target="_blank" rel="noopener" className="link">+62{f.wa} →</a>} />
            {f.email && <DetailRow label="Email" val={f.email} />}
            <DetailRow label="Tanggal Order" val={new Date(order.createdAt).toLocaleString('id-ID')} />
          </div>

          <div className="modal-section">
            <div className="modal-section-title">Jasa Dipilih</div>
            <div className="svc-chips">
              {services.map((s, i) => <span key={i} className="svc-chip lg">{s}</span>)}
            </div>

            {/* UML detail */}
            {f.services?.includes('uml-db') && (
              <div className="modal-paragraph">
                {umlDiagramLabels.length > 0 && (
                  <><strong>Diagram:</strong> {umlDiagramLabels.join(', ')}<br/></>
                )}
                {f.extras?.['uml-db']?.notes && (
                  <><strong>Latar belakang:</strong><pre>{f.extras['uml-db'].notes}</pre></>
                )}
              </div>
            )}

            {/* Landing detail */}
            {f.services?.includes('landing') && f.extras?.['landing']?.notes && (
              <div className="modal-paragraph">
                <strong>Catatan landing:</strong><pre>{f.extras['landing'].notes}</pre>
              </div>
            )}

            {/* Revision detail */}
            {f.services?.includes('revision') && f.extras?.['revision']?.notes && (
              <div className="modal-paragraph">
                <strong>Catatan revisi:</strong><pre>{f.extras['revision'].notes}</pre>
              </div>
            )}
          </div>

          {(f.counts && Object.values(f.counts).some(v => v > 0)) && (
            <div className="modal-section">
              <div className="modal-section-title">Scope Build</div>
              {f.buildProbis && (
                <div className="modal-paragraph">
                  <strong>Latar Belakang:</strong><pre>{f.buildProbis}</pre>
                </div>
              )}
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

          {/* Tech untuk landing */}
          {f.services?.includes('landing') && f.tech?.length > 0 && !f.services?.includes('build') && (
            <div className="modal-section">
              <div className="modal-section-title">Tech Stack</div>
              <DetailRow label="Frontend" val={f.tech.join(', ')} />
            </div>
          )}

          <div className="modal-section">
            <div className="modal-section-title">Timeline & Catatan</div>
            <DetailRow label="Deadline" val={f.deadline ? new Date(f.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
            {f.notes && <div className="modal-paragraph"><pre>{f.notes}</pre></div>}
          </div>

          {order.total > 0 && (
            <div className="modal-section modal-total">
              <DetailRow label="DP (25%)"  val={fmtRp(order.dp || 0)} />
              <DetailRow label="Sisa (75%)" val={fmtRp((order.total || 0) - (order.dp || 0))} />
              <DetailRow label="Metode"    val={(f.paymentMethod || '—').toUpperCase()} />
              <DetailRow label="TOTAL"     val={fmtRp(order.total || 0)} big />
            </div>
          )}

          <a
            className="modal-wa-cta"
            href={`https://wa.me/62${f.wa}?text=${encodeURIComponent(`Halo ${f.name}, kita mau diskusiin lebih lanjut soal ${order.code}. `)}`}
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
  const [draft,   setDraft]   = useState(String(val));

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
            {fmtRp(val)}<span className="price-edit-hint">✎</span>
          </button>
        )}
        {val !== defaultVal && <div className="price-default-hint">default: {fmtRp(defaultVal)}</div>}
      </div>
    </div>
  );
}

// ============================================
// PAYMENT METHODS PAGE
// ============================================
const EMPTY_METHOD = { id: '', name: '', norek: '', atasNama: '', type: 'bank' };

function PagePayments({ store }) {
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY_METHOD);

  const startEdit = (m) => { setEditing(m.id); setForm({ ...m }); };
  const startNew  = ()  => { setEditing('new'); setForm({ ...EMPTY_METHOD, id: 'pm_' + Date.now() }); };
  const cancel    = ()  => { setEditing(null); setForm(EMPTY_METHOD); };

  const save = () => {
    if (!form.name.trim() || !form.norek.trim()) return alert('Nama dan nomor rekening wajib diisi.');
    editing === 'new' ? store.add({ ...form }) : store.update(editing, { ...form });
    cancel();
  };

  return (
    <div>
      <div className="admin-card admin-info-card">
        <div className="admin-info-icon">i</div>
        <div style={{ flex: 1 }}>Metode pembayaran yang ditampilkan ke customer saat checkout (jasa Build).</div>
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
                  <div className="pm-logo" style={{ background: PM_LOGO_COLORS[m.id] || '#444' }}>
                    {m.name.substring(0, 4).toUpperCase()}
                  </div>
                  <div className="pm-body">
                    <div className="pm-name">{m.name} <span style={{ fontSize: 11, color: 'var(--text-faint)', background: 'var(--bg-subtle)', borderRadius: 4, padding: '1px 6px' }}>{m.type}</span></div>
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
          <div className="pm-add-card" onClick={startNew}>+ Belum ada metode pembayaran. Klik untuk tambah.</div>
        )}
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
        <label className="pm-form-label">Nomor Rekening / HP *</label>
        <input className="admin-input" style={{ width: '100%' }} value={form.norek} onChange={e => upd('norek', e.target.value)} placeholder="1234567890" />
      </div>
      <div className="pm-form-field">
        <label className="pm-form-label">Atas Nama</label>
        <input className="admin-input" style={{ width: '100%' }} value={form.atasNama} onChange={e => upd('atasNama', e.target.value)} />
      </div>
      <div className="pm-form-field pm-form-span">
        <label className="pm-form-label">ID (huruf kecil tanpa spasi)</label>
        <input className="admin-input" style={{ width: '100%' }} value={form.id} onChange={e => upd('id', e.target.value.toLowerCase().replace(/\s/g, '_'))} placeholder="cth: bca, dana" />
      </div>
    </div>
  );
}

// ============================================
// KONTEN JASA PAGE
// ============================================
function PageKonten({ umlStore, techStore, opsCrudStore, opsLaporanStore, attrStore }) {
  const [tab, setTab] = useState('uml');

  const tabs = [
    { id: 'uml',      label: '◫ Diagram UML'    },
    { id: 'tech',     label: '⊞ Tech Stack'      },
    { id: 'ops',      label: '⚙ Operasi Build'   },
    { id: 'attrtype', label: '≡ Tipe Atribut'    },
  ];

  return (
    <div>
      <div className="admin-card admin-info-card">
        <div className="admin-info-icon">i</div>
        <div style={{ flex: 1 }}>
          Kelola konten yang ditampilkan di form customer. Reload halaman form agar perubahan langsung terlihat.
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '12px 18px', fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {tab === 'uml'      && <TabUmlDiagrams store={umlStore} />}
          {tab === 'tech'     && <TabTechStack store={techStore} />}
          {tab === 'ops'      && <TabOpsConfig opsCrudStore={opsCrudStore} opsLaporanStore={opsLaporanStore} />}
          {tab === 'attrtype' && <TabAttrTypes store={attrStore} />}
        </div>
      </div>
    </div>
  );
}

// -- Tab: Diagram UML --
function TabUmlDiagrams({ store }) {
  const [label, setLabel] = useState('');

  const addNew = () => {
    const v = label.trim();
    if (!v) return;
    const id = v.toLowerCase().replace(/[^a-z0-9]/g, '_');
    store.add({ id: id + '_' + Date.now(), label: v });
    setLabel('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Daftar Diagram UML</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Customer wajib pilih minimal 1 dari daftar ini</div>
        </div>
        <button className="admin-btn-ghost" onClick={store.reset}>↺ Reset</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {store.items.map(d => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
            <span style={{ flex: 1, fontSize: 14 }}>◻ {d.label}</span>
            <button className="admin-btn-danger-sm" onClick={() => store.remove(d.id)}>× Hapus</button>
          </div>
        ))}
        {store.items.length === 0 && <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Belum ada diagram.</div>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="admin-input"
          style={{ flex: 1 }}
          placeholder="Nama diagram baru, cth: BPMN Diagram"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addNew(); }}
        />
        <button className="admin-btn-primary" onClick={addNew} disabled={!label.trim()}>+ Tambah</button>
      </div>
    </div>
  );
}

// -- Tab: Tech Stack --
function TabTechStack({ store }) {
  const GROUPS = [
    { key: 'bahasa', label: 'Bahasa Pemrograman' },
    { key: 'fe',     label: 'Frontend'           },
    { key: 'be',     label: 'Backend'            },
    { key: 'db',     label: 'Database'           },
  ];
  const [activeGroup, setActiveGroup] = useState('bahasa');
  const [newLabel, setNewLabel]       = useState('');

  const currentItems = store.opts[activeGroup] || [];

  const addNew = () => {
    const v = newLabel.trim();
    if (!v) return;
    const id = activeGroup + '_' + v.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now();
    store.addItem(activeGroup, { id, label: v });
    setNewLabel('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Tech Stack Options</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Kelola pilihan tech di tiap kategori</div>
        </div>
        <button className="admin-btn-ghost" onClick={store.reset}>↺ Reset semua</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {GROUPS.map(g => (
          <button
            key={g.key}
            onClick={() => setActiveGroup(g.key)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', border: '1.5px solid',
              borderColor: activeGroup === g.key ? 'var(--primary)' : 'var(--border)',
              background: activeGroup === g.key ? 'var(--primary-soft, #ede9ff)' : 'transparent',
              color: activeGroup === g.key ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeGroup === g.key ? 700 : 400,
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {currentItems.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
            <span style={{ flex: 1, fontSize: 14 }}>
              {item.auto && <span style={{ color: 'var(--primary)', marginRight: 4 }}>✦</span>}
              {item.label}
              {item.auto && <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 6 }}>(saran developer)</span>}
            </span>
            {!item.auto && (
              <button className="admin-btn-danger-sm" onClick={() => store.removeItem(activeGroup, item.id)}>× Hapus</button>
            )}
          </div>
        ))}
        {currentItems.length === 0 && <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Belum ada opsi.</div>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="admin-input"
          style={{ flex: 1 }}
          placeholder={`Tambah opsi ${GROUPS.find(g => g.key === activeGroup)?.label}, cth: Remix`}
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addNew(); }}
        />
        <button className="admin-btn-primary" onClick={addNew} disabled={!newLabel.trim()}>+ Tambah</button>
      </div>
    </div>
  );
}

// -- Tab: Operasi Build --
function TabOpsConfig({ opsCrudStore, opsLaporanStore }) {
  const [activeTab, setActiveTab] = useState('crud');
  const [label, setLabel]         = useState('');
  const [desc,  setDesc]          = useState('');
  const [priceKey, setPriceKey]   = useState('op_get');

  const store = activeTab === 'crud' ? opsCrudStore : opsLaporanStore;

  const PRICE_KEY_OPTIONS = [
    'op_create','op_get','op_update','op_delete','op_filter','op_sum',
    'op_exportPdf','op_exportExcel','op_print',
  ];

  const addNew = () => {
    const v = label.trim();
    if (!v) return;
    const id = v.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    store.add({ id, label: v, desc: desc.trim() || v, priceKey });
    setLabel(''); setDesc('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Operasi Build</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Kelola operasi yang tersedia di scope master/transaksi/laporan</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ id: 'crud', label: 'CRUD (Master / Transaksi)' }, { id: 'laporan', label: 'Laporan' }].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', border: '1.5px solid',
              borderColor: activeTab === t.id ? 'var(--primary)' : 'var(--border)',
              background: activeTab === t.id ? 'var(--primary-soft, #ede9ff)' : 'transparent',
              color: activeTab === t.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === t.id ? 700 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {store.ops.map(op => (
          <div key={op.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{op.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{op.desc} · {op.priceKey}</div>
            </div>
            <button className="admin-btn-danger-sm" onClick={() => store.remove(op.id)}>× Hapus</button>
          </div>
        ))}
        {store.ops.length === 0 && <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Belum ada operasi.</div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Tambah Operasi Baru</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="admin-input"
            style={{ flex: 2, minWidth: 140 }}
            placeholder="Nama operasi, cth: Approve"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
          <input
            className="admin-input"
            style={{ flex: 2, minWidth: 140 }}
            placeholder="Deskripsi singkat"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <select className="admin-input" style={{ flex: 1, minWidth: 120 }} value={priceKey} onChange={e => setPriceKey(e.target.value)}>
            {PRICE_KEY_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <button className="admin-btn-primary" onClick={addNew} disabled={!label.trim()}>+ Tambah</button>
        </div>
        <div className="admin-btn-ghost" style={{ width: 'fit-content', cursor: 'pointer' }} onClick={store.reset}>↺ Reset ke default</div>
      </div>
    </div>
  );
}

// -- Tab: Tipe Atribut --
function TabAttrTypes({ store }) {
  const [label, setLabel] = useState('');

  const addNew = () => {
    const v = label.trim();
    if (!v) return;
    const id = v.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now();
    store.add({ id, label: v });
    setLabel('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Tipe Data Atribut</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Tipe data yang tersedia saat customer input atribut</div>
        </div>
        <button className="admin-btn-ghost" onClick={store.reset}>↺ Reset</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {store.types.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-subtle)', borderRadius: 20, fontSize: 13 }}>
            <span>{t.label}</span>
            <button
              onClick={() => store.remove(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 14, lineHeight: 1, padding: 0 }}
            >×</button>
          </div>
        ))}
        {store.types.length === 0 && <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Belum ada tipe.</div>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="admin-input"
          style={{ flex: 1 }}
          placeholder="Nama tipe baru, cth: JSON"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addNew(); }}
        />
        <button className="admin-btn-primary" onClick={addNew} disabled={!label.trim()}>+ Tambah</button>
      </div>
    </div>
  );
}

// ============================================
// SETTINGS
// ============================================
function PageSettings() {
  const [wa,     setWa]     = useState(() => localStorage.getItem('devorder_admin_wa')     || '6281234567890');
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
            <div className="settings-hint">Format: 62xxxx (tanpa +/spasi). Muncul di halaman WA redirect dan success screen.</div>
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
              orders:         JSON.parse(localStorage.getItem('devorder_orders')          || '[]'),
              pricing:        JSON.parse(localStorage.getItem('devorder_pricing')         || '{}'),
              paymentMethods: JSON.parse(localStorage.getItem('devorder_payment_methods') || 'null'),
              umlDiagrams:    JSON.parse(localStorage.getItem('devorder_uml_diagrams')    || 'null'),
              techGroups:     JSON.parse(localStorage.getItem('devorder_tech_groups')     || 'null'),
              opsCrud:        JSON.parse(localStorage.getItem('devorder_ops_crud')        || 'null'),
              opsLaporan:     JSON.parse(localStorage.getItem('devorder_ops_laporan')     || 'null'),
              attrTypes:      JSON.parse(localStorage.getItem('devorder_attr_types')      || 'null'),
              settings: { wa, studio },
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
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

/* global React */
const { useState, useRef, useEffect } = React;

// ============================================
// SHARED HELPERS
// ============================================
const fmtRp = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

// Default pricing — admin can override via localStorage('devorder_pricing')
const DEFAULT_PRICING = {
  // Category base prices (per item)
  master: 75000,
  transaksi: 100000,
  laporan: 50000,
  dashboard: 150000,
  // Per attribute
  attr: 10000,
  // Operations (CRUD)
  op_create: 15000,
  op_get: 10000,
  op_update: 20000,
  op_delete: 5000,
  op_filter: 10000,
  op_sum: 5000,
  // Laporan specific
  op_exportPdf: 25000,
  op_exportExcel: 25000,
  op_print: 15000,
  // Dashboard widgets
  dash_sum: 5000,
  dash_chart: 20000,
  dash_log: 15000,
  // Services (one-time)
  svc_uml: 200000,
  svc_landing: 500000,
  svc_revision: 100000,
  svc_consult: 100000,
  // Tech "Saran developer" (per kategori bahasa/fe/be/db)
  techDev: 25000,
};

function loadPricing() {
  try {
    const stored = JSON.parse(localStorage.getItem('devorder_pricing') || '{}');
    return { ...DEFAULT_PRICING, ...stored };
  } catch {
    return { ...DEFAULT_PRICING };
  }
}
const PRICING = loadPricing();

// ============================================
// SERVICES
// ============================================
const SERVICES = [
  {
    id: 'uml-db',
    label: 'Diagram UML & Desain Database',
    desc: 'UML, ERD, PDM, lengkap dengan dokumentasinya',
    priceKey: 'svc_uml',
    icon: '◫',
  },
  {
    id: 'landing',
    label: 'Landing Page',
    desc: 'Website landing page profesional, responsive',
    priceKey: 'svc_landing',
    icon: '◧',
  },
  {
    id: 'revision',
    label: 'Revisi / Bug Fix',
    desc: 'Perbaiki / improve aplikasi yang udah ada',
    priceKey: 'svc_revision',
    icon: '↻',
  },
  {
    id: 'build',
    label: 'Build dari 0',
    desc: 'Bikin aplikasi full-stack dari nol, harga sesuai scope',
    priceKey: null,
    icon: '⊞',
    highlight: true,
  },
  {
    id: 'consult',
    label: 'Konsultasi Requirement',
    desc: 'Rumusin kebutuhan, diagram, proses bisnis',
    priceKey: 'svc_consult',
    icon: '◉',
  },
];

// ============================================
// CATEGORIES (Scope)
// ============================================
const OPS_CRUD = [
  { id: 'create', label: 'Create', desc: 'Tambah data baru', priceKey: 'op_create' },
  { id: 'get', label: 'Get / List', desc: 'Lihat data (read)', priceKey: 'op_get' },
  { id: 'update', label: 'Update', desc: 'Edit data', priceKey: 'op_update' },
  { id: 'delete', label: 'Delete', desc: 'Hapus data', priceKey: 'op_delete' },
  { id: 'filter', label: 'Filter / Search', desc: 'Cari + filter terindeks', priceKey: 'op_filter' },
  { id: 'sum', label: 'Get Sum', desc: 'Hitung total / agregasi', priceKey: 'op_sum' },
];

const OPS_LAPORAN = [
  { id: 'get', label: 'Get Data', desc: 'Tampilkan laporan', priceKey: 'op_get' },
  { id: 'filter', label: 'Filter Periode', desc: 'Filter rentang tanggal', priceKey: 'op_filter' },
  { id: 'sum', label: 'Agregasi / Sum', desc: 'Total, rata-rata, dll', priceKey: 'op_sum' },
  { id: 'exportPdf', label: 'Export PDF', desc: 'Cetak ke PDF', priceKey: 'op_exportPdf' },
  { id: 'exportExcel', label: 'Export Excel', desc: 'Cetak ke .xlsx', priceKey: 'op_exportExcel' },
  { id: 'print', label: 'Print Langsung', desc: 'Print ke printer', priceKey: 'op_print' },
];

const CATEGORIES = [
  { key: 'master', label: 'Master Data', desc: 'Tabel data utama (user, produk, kategori)', priceKey: 'master', namePh: 'cth: Produk', ops: OPS_CRUD },
  { key: 'transaksi', label: 'Transaksi', desc: 'Modul pencatatan transaksi & alurnya', priceKey: 'transaksi', namePh: 'cth: Penjualan', ops: OPS_CRUD },
  { key: 'laporan', label: 'Laporan', desc: 'Output laporan (PDF, Excel, cetak)', priceKey: 'laporan', namePh: 'cth: Laporan harian', ops: OPS_LAPORAN },
  { key: 'dashboard', label: 'Dashboard', desc: 'Widget statis: sum, chart, log activity', priceKey: 'dashboard', namePh: 'cth: Dashboard Admin', ops: null /* uses widgets */ },
];

// ============================================
// ATTRIBUTE DATA TYPES
// ============================================
const ATTR_TYPES = [
  { id: 'text', label: 'Text' },
  { id: 'longtext', label: 'Long Text' },
  { id: 'number', label: 'Number' },
  { id: 'currency', label: 'Currency' },
  { id: 'date', label: 'Date' },
  { id: 'datetime', label: 'Datetime' },
  { id: 'boolean', label: 'Boolean' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'image', label: 'Image / File' },
  { id: 'relation', label: 'Relasi' },
];

// ============================================
// TECH GROUPS
// ============================================
const TECH_GROUPS = [
  {
    key: 'bahasa', label: 'Bahasa Pemrograman', hint: 'Pilih satu atau lebih',
    options: [
      { id: 'php', label: 'PHP' },
      { id: 'js', label: 'JavaScript / TypeScript' },
      { id: 'python', label: 'Python' },
      { id: 'java', label: 'Java' },
      { id: 'dart', label: 'Dart' },
      { id: 'cs', label: 'C#' },
      { id: 'bahasa_dev', label: 'Saran developer', auto: true },
    ],
  },
  {
    key: 'fe', label: 'Frontend', hint: 'Framework / library untuk tampilan',
    options: [
      { id: 'react', label: 'React' },
      { id: 'next', label: 'Next.js' },
      { id: 'vue', label: 'Vue / Nuxt' },
      { id: 'svelte', label: 'Svelte' },
      { id: 'flutter', label: 'Flutter (mobile)' },
      { id: 'html_native', label: 'HTML/CSS/JS Native' },
      { id: 'blade', label: 'Laravel Blade' },
      { id: 'fe_dev', label: 'Saran developer', auto: true },
    ],
  },
  {
    key: 'be', label: 'Backend', hint: 'Framework server-side',
    options: [
      { id: 'laravel', label: 'Laravel' },
      { id: 'codeigniter', label: 'CodeIgniter' },
      { id: 'node', label: 'Node.js + Express' },
      { id: 'django', label: 'Django' },
      { id: 'flask', label: 'Flask' },
      { id: 'spring', label: 'Spring Boot' },
      { id: 'dotnet', label: '.NET' },
      { id: 'be_dev', label: 'Saran developer', auto: true },
    ],
  },
  {
    key: 'db', label: 'Database', hint: 'Tempat data disimpan',
    options: [
      { id: 'mysql', label: 'MySQL' },
      { id: 'pg', label: 'PostgreSQL' },
      { id: 'sqlite', label: 'SQLite' },
      { id: 'mongo', label: 'MongoDB' },
      { id: 'firebase', label: 'Firebase' },
      { id: 'supabase', label: 'Supabase' },
      { id: 'db_dev', label: 'Saran developer', auto: true },
    ],
  },
];

const TECH_FLAT = TECH_GROUPS.flatMap(g => g.options.map(o => ({ ...o, group: g.key, groupLabel: g.label })));

// Reduced color palette options (only 3 + custom note fallback)
const COLOR_PALETTES = [
  { id: 'corp', label: 'Corporate', colors: ['#1E3A8A', '#3B82F6', '#DBEAFE'] },
  { id: 'mono', label: 'Mono Pro', colors: ['#0A0A0A', '#525252', '#E5E5E5'] },
  { id: 'fresh', label: 'Fresh', colors: ['#15803D', '#22C55E', '#DCFCE7'] },
];

// ============================================
// STEP 1 — DATA DIRI
// ============================================
function StepIdentity({ form, setForm, errors }) {
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="step-content" data-screen-label="01 Data Diri">
      <div className="step-header">
        <div className="step-eyebrow">Step 01 / Data Diri</div>
        <h1 className="step-title">Halo, kenalan dulu yuk</h1>
        <p className="step-subtitle">Datamu cuma dipake buat keperluan koordinasi project ini aja.</p>
      </div>

      <div className="card">
        <div className="field">
          <label className="label">Nama Lengkap</label>
          <input
            className={'input' + (errors.name ? ' error' : '')}
            placeholder="cth: Andi Pratama"
            value={form.name}
            onChange={e => upd('name', e.target.value)}
          />
          {errors.name && <div className="error-msg">Nama wajib diisi</div>}
        </div>
        <div className="field">
          <label className="label">Nomor WhatsApp <span className="label-hint">— buat koordinasi project</span></label>
          <div className="input-wrap">
            <div className="input-prefix">+62</div>
            <input
              className={'input has-prefix' + (errors.wa ? ' error' : '')}
              placeholder="81234567890"
              value={form.wa}
              onChange={e => upd('wa', e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
            />
          </div>
          {errors.wa && <div className="error-msg">Nomor WA tidak valid (min. 9 digit)</div>}
          {!errors.wa && form.wa && <div className="helper">+62{form.wa}</div>}
        </div>
        <div className="field">
          <label className="label">Email <span className="label-hint">— opsional, buat invoice</span></label>
          <input
            className="input"
            placeholder="kamu@email.com"
            value={form.email}
            onChange={e => upd('email', e.target.value)}
            type="email"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// STEP 2 — JENIS JASA
// ============================================
function StepService({ form, setForm, errors }) {
  const toggle = (id) => {
    setForm(f => ({
      ...f,
      services: f.services.includes(id) ? f.services.filter(x => x !== id) : [...f.services, id],
    }));
  };

  const updConsult = (patch) => setForm(f => ({ ...f, consult: { ...f.consult, ...patch } }));
  const updExtra = (svcId, patch) => setForm(f => ({
    ...f, extras: { ...f.extras, [svcId]: { ...(f.extras?.[svcId] || {}), ...patch } }
  }));

  return (
    <div className="step-content" data-screen-label="02 Jenis Jasa">
      <div className="step-header">
        <div className="step-eyebrow">Step 02 / Jenis Jasa</div>
        <h1 className="step-title">Mau jasa apa, {form.name?.split(' ')[0] || 'kak'}?</h1>
        <p className="step-subtitle">Bisa pilih lebih dari satu. Kalau pilih "Build dari 0" nanti ada step buat ngisi scope-nya.</p>
      </div>

      <div className="card">
        <div className="service-grid">
          {SERVICES.map(s => {
            const checked = form.services.includes(s.id);
            const price = s.priceKey ? PRICING[s.priceKey] : null;
            return (
              <div
                key={s.id}
                className={'service-card' + (checked ? ' selected' : '') + (s.highlight ? ' highlight' : '')}
                onClick={() => toggle(s.id)}
              >
                <div className="service-check">
                  <div className="checkbox-box">{checked && '✓'}</div>
                </div>
                <div className="service-icon" aria-hidden>{s.icon}</div>
                <div className="service-body">
                  <div className="service-title">{s.label}</div>
                  <div className="service-desc">{s.desc}</div>
                </div>
                <div className="service-price">
                  {s.id === 'build' ? <span className="svc-dynamic">Sesuai scope</span> : <span>+{fmtRp(price)}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {errors.services && (
          <div className="error-msg" style={{ marginTop: 12 }}>⚠ Pilih minimal 1 jenis jasa</div>
        )}
      </div>

      {/* Konsultasi — detail input */}
      {form.services.includes('consult') && (
        <div className="card service-detail-card">
          <div className="detail-header">
            <div className="detail-icon">◉</div>
            <div>
              <div className="detail-title">Konsultasi Requirement</div>
              <div className="detail-sub">Semua field di bawah opsional — isi yang relevan aja</div>
            </div>
          </div>

          <div className="field">
            <label className="label">Kebutuhan (field-field yang kepikiran)</label>
            <textarea
              className="textarea"
              placeholder="Sebutin field/fitur yang udah kebayang, satu baris satu item. Cth:&#10;- login user&#10;- manage produk (nama, harga, stok)&#10;- laporan penjualan harian"
              value={form.consult?.fields || ''}
              onChange={e => updConsult({ fields: e.target.value })}
              rows={5}
            />
          </div>

          <div className="field">
            <label className="label">Diagram yang dibutuhkan <span className="label-hint">— opsional</span></label>
            <div className="checkbox-grid">
              {[
                { id: 'pdm', label: 'PDM (Physical Data Model)' },
                { id: 'activity', label: 'Activity Diagram' },
                { id: 'usecase', label: 'Use Case Diagram' },
              ].map(d => {
                const ck = form.consult?.[d.id];
                return (
                  <div
                    key={d.id}
                    className={'checkbox-row' + (ck ? ' checked' : '')}
                    onClick={() => updConsult({ [d.id]: !ck })}
                  >
                    <div className="checkbox-box">{ck && '✓'}</div>
                    <span>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="field">
            <label className="label">Proses Bisnis (probis) <span className="label-hint">— opsional, paragraf</span></label>
            <textarea
              className="textarea"
              placeholder="Jelasin alur bisnis kamu kalau ada. Cth: customer pesan → kasir input → bayar → otomatis kurangi stok → kasir cetak struk."
              value={form.consult?.probis || ''}
              onChange={e => updConsult({ probis: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Generic catatan for other services */}
      {['uml-db', 'landing', 'revision'].map(svcId => {
        if (!form.services.includes(svcId)) return null;
        const svc = SERVICES.find(s => s.id === svcId);
        return (
          <div key={svcId} className="card service-detail-card">
            <div className="detail-header">
              <div className="detail-icon">{svc.icon}</div>
              <div>
                <div className="detail-title">{svc.label}</div>
                <div className="detail-sub">Catatan tambahan, opsional</div>
              </div>
            </div>
            <textarea
              className="textarea"
              placeholder={
                svcId === 'uml-db' ? 'Aplikasi apa? Mau diagram apa aja? Ada referensi?' :
                svcId === 'landing' ? 'Produk/jasa apa yang dijual? Warna brand? Ada referensi landing page yang disuka?' :
                'Aplikasi mana yang mau direvisi? Bug-nya apa? Fitur baru yang mau ditambahin?'
              }
              value={form.extras?.[svcId]?.notes || ''}
              onChange={e => updExtra(svcId, { notes: e.target.value })}
              rows={4}
            />
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// STEP 5 — CATATAN AKHIR (gabungan timeline + catatan)
// ============================================
function StepTimeline({ form, setForm, errors }) {
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date();
  const suggestedDate = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0];
  const minDate = new Date(today.getTime() + 86400000).toISOString().split('T')[0];
  const daysUntil = form.deadline ? Math.max(0, Math.ceil((new Date(form.deadline) - today) / 86400000)) : 0;

  return (
    <div className="step-content" data-screen-label="05 Timeline & Catatan">
      <div className="step-header">
        <div className="step-eyebrow">Step / Timeline & Catatan</div>
        <h1 className="step-title">Deadline & catatan akhir</h1>
        <p className="step-subtitle">Tentukan deadline yang realistis. Project urgent (&lt; 7 hari) kena biaya rush, kita diskusiin dulu via WA.</p>
      </div>

      <div className="card">
        <div className="field">
          <label className="label">Deadline Pengerjaan</label>
          <input
            className={'input' + (errors.deadline ? ' error' : '')}
            type="date"
            min={minDate}
            value={form.deadline}
            onChange={e => upd('deadline', e.target.value)}
          />
          {errors.deadline && <div className="error-msg">Pilih tanggal deadline</div>}
          {!errors.deadline && form.deadline && (
            <div className="helper">
              {daysUntil} hari dari sekarang
              {daysUntil < 7 && daysUntil > 0 && <span style={{ color: 'var(--danger)' }}> · ⚡ rush — perlu konfirmasi</span>}
            </div>
          )}
          {!form.deadline && (
            <div className="helper">Saran: {new Date(suggestedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (~2 minggu)</div>
          )}
        </div>

        <div className="field">
          <label className="label">Warna / Mood Desain <span className="label-hint">— opsional</span></label>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, marginTop: -2 }}>
            Pilih palette siap pakai atau tulis catatan warna sendiri.
          </p>
          <div className="palette-row">
            {COLOR_PALETTES.map(p => (
              <div
                key={p.id}
                className={'palette-card' + (form.palette === p.id ? ' selected' : '')}
                onClick={() => upd('palette', form.palette === p.id ? '' : p.id)}
                title={p.label}
              >
                <div className="palette-card-colors">
                  {p.colors.map((c, i) => (
                    <div key={i} className="palette-color" style={{ background: c }} />
                  ))}
                </div>
                <div className="palette-label">{p.label}</div>
              </div>
            ))}
          </div>
          <input
            className="input"
            style={{ marginTop: 10 }}
            placeholder="Atau tulis sendiri: 'biru navy + putih', '#FF6B35', dll"
            value={form.customColor || ''}
            onChange={e => upd('customColor', e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label">Catatan Tambahan <span className="label-hint">— opsional</span></label>
          <textarea
            className="textarea"
            placeholder="Ada referensi aplikasi mirip? Punya struktur database existing? Mau hosting tertentu? Tulis di sini."
            value={form.notes}
            onChange={e => upd('notes', e.target.value)}
            rows={5}
            maxLength={1000}
          />
          <div className="helper">{form.notes.length} / 1000 karakter</div>
        </div>
      </div>
    </div>
  );
}

// Export to window
Object.assign(window, {
  StepIdentity, StepService, StepTimeline,
  PRICING, DEFAULT_PRICING, SERVICES, CATEGORIES, OPS_CRUD, OPS_LAPORAN,
  ATTR_TYPES, TECH_GROUPS, TECH_FLAT, COLOR_PALETTES, fmtRp,
});

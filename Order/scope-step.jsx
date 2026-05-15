/* global React, PRICING, CATEGORIES, OPS_CRUD, OPS_LAPORAN, ATTR_TYPES, fmtRp */
const { useState: useScS, useEffect: useScE } = React;

// ============================================
// STEP 3 — SCOPE & REQUIREMENT
// ============================================
function StepScope({ form, setForm, errors }) {
  const hasBuild = form.services.includes('build');
  const hasConsult = form.services.includes('consult');
  const hasOther = form.services.some(s => ['uml-db', 'landing', 'revision'].includes(s));

  // If only non-build services, scope step is informational
  if (!hasBuild && !hasConsult && hasOther) {
    return (
      <div className="step-content" data-screen-label="03 Scope">
        <div className="step-header">
          <div className="step-eyebrow">Step 03 / Scope</div>
          <h1 className="step-title">Scope udah ditangkep</h1>
          <p className="step-subtitle">Detail jasa kamu udah keisi di step sebelumnya. Lanjut aja ke step berikutnya.</p>
        </div>
        <div className="card empty-card">
          <div className="empty-icon">✓</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Semua siap</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nggak ada scope tambahan yang perlu kamu isi.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="step-content" data-screen-label="03 Scope">
      <div className="step-header">
        <div className="step-eyebrow">Step 03 / Scope & Requirement</div>
        <h1 className="step-title">{hasBuild ? 'Apa aja yang mau dibikin?' : 'Detail requirement kamu'}</h1>
        <p className="step-subtitle">
          {hasBuild
            ? 'Pilih jumlah tiap kategori, tentuin operasinya (CRUD, sum, dll), trus kasih atribut yang dibutuhin.'
            : 'Isi kebutuhan kamu di bawah. Konsultasi cukup di step sebelumnya kalau udah lengkap.'}
        </p>
      </div>

      {hasBuild && <BuildScope form={form} setForm={setForm} errors={errors} />}
    </div>
  );
}

// ============================================
// BUILD-FROM-0 SCOPE
// ============================================
function BuildScope({ form, setForm, errors }) {
  const upd = (key, count) => {
    const c = Math.max(0, Math.min(20, count));
    setForm(f => {
      const items = [...(f.items[key] || [])];
      while (items.length < c) {
        items.push(makeEmptyItem(key));
      }
      while (items.length > c) items.pop();
      return { ...f, counts: { ...f.counts, [key]: c }, items: { ...f.items, [key]: items } };
    });
  };

  const updItem = (key, idx, patch) => {
    setForm(f => {
      const arr = f.items[key].map((it, i) => i === idx ? { ...it, ...patch } : it);
      return { ...f, items: { ...f.items, [key]: arr } };
    });
  };

  return (
    <>
      <div className="card">
        <div className="category-grid">
          {CATEGORIES.map(cat => (
            <CategoryCard
              key={cat.key}
              cat={cat}
              count={form.counts[cat.key] || 0}
              items={form.items[cat.key] || []}
              onCount={(c) => upd(cat.key, c)}
              onUpdItem={(idx, patch) => updItem(cat.key, idx, patch)}
            />
          ))}
        </div>

        {errors.scope && (
          <div className="error-msg" style={{ marginTop: 14, fontSize: 13 }}>
            ⚠ Minimal pilih 1 kategori, dan kalau pilih Dashboard wajib ada minimal 1 widget
          </div>
        )}
      </div>
    </>
  );
}

function makeEmptyItem(catKey) {
  const base = { name: '', attrs: [], decideAttrs: false, notes: '' };
  if (catKey === 'dashboard') {
    return { ...base, widgets: { sums: [], charts: [], logs: [] } };
  }
  // Default ops: get is always on
  return { ...base, ops: { get: true } };
}

// ============================================
// CATEGORY CARD
// ============================================
function CategoryCard({ cat, count, items, onCount, onUpdItem }) {
  return (
    <div className={'category-card' + (count > 0 ? ' active' : '')}>
      <div className="category-head">
        <div className="category-title-block">
          <div className="category-title">{cat.label}</div>
          <div className="category-price">{fmtRp(PRICING[cat.priceKey])} / item</div>
        </div>
        <div className="counter">
          <button className="counter-btn" onClick={() => onCount(count - 1)} disabled={count <= 0} aria-label="kurangi">−</button>
          <div className="counter-val">{count}</div>
          <button className="counter-btn" onClick={() => onCount(count + 1)} aria-label="tambah">+</button>
        </div>
      </div>
      <div className="category-desc">{cat.desc}</div>

      {count > 0 && (
        <div className="subitems-wrap">
          {items.map((it, idx) => (
            <SubItem
              key={idx}
              idx={idx}
              cat={cat}
              item={it}
              onUpd={(patch) => onUpdItem(idx, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// SUB ITEM
// ============================================
function SubItem({ idx, cat, item, onUpd }) {
  return (
    <div className="subitem">
      <div className="subitem-head">{cat.label} #{idx + 1}</div>

      <input
        className="subitem-input"
        placeholder={`Nama ${cat.label.toLowerCase()} — ${cat.namePh}`}
        value={item.name}
        onChange={e => onUpd({ name: e.target.value })}
      />

      {/* Atribut — for master / transaksi / laporan (not dashboard) */}
      {cat.key !== 'dashboard' && (
        <AttrSection cat={cat} item={item} onUpd={onUpd} />
      )}

      {/* Operations — for master / transaksi / laporan */}
      {cat.ops && (
        <OpsSection cat={cat} item={item} onUpd={onUpd} />
      )}

      {/* Dashboard widgets */}
      {cat.key === 'dashboard' && (
        <DashboardWidgets item={item} onUpd={onUpd} />
      )}

      {/* Catatan per item */}
      <div className="subitem-section">
        <div className="subitem-section-label">
          Catatan <span className="muted-hint">— opsional, khusus buat {cat.label.toLowerCase()} #{idx + 1}</span>
        </div>
        <textarea
          className="subitem-input"
          style={{ minHeight: 52, resize: 'vertical', lineHeight: 1.4 }}
          placeholder={`Catatan khusus (cth: ${cat.key === 'dashboard' ? 'urutan widget, layout 2 kolom' : 'butuh approval, filter by user, dll'})`}
          value={item.notes || ''}
          onChange={e => onUpd({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}

// ============================================
// ATTR SECTION (with data type)
// ============================================
function AttrSection({ cat, item, onUpd }) {
  const [name, setName] = useScS('');
  const [type, setType] = useScS('text');

  const add = () => {
    const v = name.trim();
    if (!v) return;
    onUpd({ attrs: [...item.attrs, { name: v, type }] });
    setName('');
    setType('text');
  };

  const rm = (i) => onUpd({ attrs: item.attrs.filter((_, ix) => ix !== i) });

  return (
    <div className="subitem-section">
      <div className="subitem-section-head">
        <div className="subitem-section-label">
          Atribut / Field
          <span className="muted-hint"> · +{fmtRp(PRICING.attr)}/atribut</span>
        </div>
        <div
          className={'decide-toggle' + (item.decideAttrs ? ' active' : '')}
          onClick={() => onUpd({ decideAttrs: !item.decideAttrs })}
        >
          {item.decideAttrs ? '✓' : '○'} Developer aja
        </div>
      </div>

      {!item.decideAttrs ? (
        <>
          <div className="attr-list">
            {item.attrs.map((a, i) => {
              const typeLabel = ATTR_TYPES.find(t => t.id === a.type)?.label || 'Text';
              return (
                <div key={i} className="attr-chip-typed">
                  <span className="attr-chip-name">{a.name}</span>
                  <span className="attr-chip-type">{typeLabel}</span>
                  <button className="attr-chip-remove" onClick={() => rm(i)} aria-label="hapus">×</button>
                </div>
              );
            })}
          </div>
          <div className="attr-add-row">
            <input
              className="attr-name-input"
              placeholder="+ nama atribut (cth: harga)"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            />
            <select
              className="attr-type-select"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              {ATTR_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <button className="attr-add-btn" onClick={add} disabled={!name.trim()}>+ Add</button>
          </div>
        </>
      ) : (
        <div className="decide-hint">→ Developer akan menentukan atribut yang sesuai</div>
      )}
    </div>
  );
}

// ============================================
// OPS SECTION
// ============================================
function OpsSection({ cat, item, onUpd }) {
  const ops = cat.ops;
  const selected = item.ops || {};

  const toggle = (opId) => {
    onUpd({ ops: { ...selected, [opId]: !selected[opId] } });
  };

  return (
    <div className="subitem-section">
      <div className="subitem-section-label">
        Operasi yang dibutuhin
        <span className="muted-hint"> — harga per operasi, manageable di admin</span>
      </div>
      <div className="ops-grid">
        {ops.map(op => {
          const isOn = selected[op.id];
          return (
            <div
              key={op.id}
              className={'op-chip' + (isOn ? ' active' : '')}
              onClick={() => toggle(op.id)}
            >
              <div className="op-chip-check">{isOn ? '✓' : ''}</div>
              <div className="op-chip-body">
                <div className="op-chip-label">{op.label}</div>
                <div className="op-chip-desc">{op.desc}</div>
              </div>
              <div className="op-chip-price">{fmtRp(PRICING[op.priceKey])}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD WIDGETS
// ============================================
const CHART_TYPES = [
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
  { id: 'pie', label: 'Pie / Donut' },
  { id: 'area', label: 'Area' },
];

function DashboardWidgets({ item, onUpd }) {
  const widgets = item.widgets || { sums: [], charts: [], logs: [] };

  const updWidgets = (patch) => onUpd({ widgets: { ...widgets, ...patch } });

  const addSum = () => updWidgets({ sums: [...widgets.sums, { name: '', desc: '' }] });
  const rmSum = (i) => updWidgets({ sums: widgets.sums.filter((_, ix) => ix !== i) });
  const updSum = (i, patch) => updWidgets({ sums: widgets.sums.map((s, ix) => ix === i ? { ...s, ...patch } : s) });

  const addChart = () => updWidgets({ charts: [...widgets.charts, { name: '', type: 'bar', desc: '' }] });
  const rmChart = (i) => updWidgets({ charts: widgets.charts.filter((_, ix) => ix !== i) });
  const updChart = (i, patch) => updWidgets({ charts: widgets.charts.map((c, ix) => ix === i ? { ...c, ...patch } : c) });

  const addLog = () => updWidgets({ logs: [...widgets.logs, { name: '', desc: '' }] });
  const rmLog = (i) => updWidgets({ logs: widgets.logs.filter((_, ix) => ix !== i) });
  const updLog = (i, patch) => updWidgets({ logs: widgets.logs.map((l, ix) => ix === i ? { ...l, ...patch } : l) });

  return (
    <div className="subitem-section">
      <div className="subitem-section-label">
        Widget Dashboard <span className="muted-hint">— statis, tinggal nambah aja kalau perlu</span>
      </div>

      {/* SUM */}
      <div className="widget-group">
        <div className="widget-group-head">
          <span className="widget-group-title">📊 Sum / Statistik</span>
          <span className="widget-group-price">{fmtRp(PRICING.dash_sum)}/widget</span>
          <button className="widget-add-btn" onClick={addSum}>+ Tambah Sum</button>
        </div>
        {widgets.sums.length === 0 && <div className="widget-empty">Belum ada. Klik "+ Tambah Sum" untuk menambahkan.</div>}
        {widgets.sums.map((s, i) => (
          <div key={i} className="widget-row">
            <input
              className="subitem-input compact"
              placeholder={`Sum #${i + 1} — cth: Total Penjualan Hari Ini`}
              value={s.name}
              onChange={e => updSum(i, { name: e.target.value })}
            />
            <button className="widget-remove" onClick={() => rmSum(i)} aria-label="hapus">×</button>
          </div>
        ))}
      </div>

      {/* CHART */}
      <div className="widget-group">
        <div className="widget-group-head">
          <span className="widget-group-title">📈 Chart</span>
          <span className="widget-group-price">{fmtRp(PRICING.dash_chart)}/widget</span>
          <button className="widget-add-btn" onClick={addChart}>+ Tambah Chart</button>
        </div>
        {widgets.charts.length === 0 && <div className="widget-empty">Belum ada chart.</div>}
        {widgets.charts.map((c, i) => (
          <div key={i} className="widget-row">
            <input
              className="subitem-input compact"
              style={{ flex: 2 }}
              placeholder={`Chart #${i + 1} — cth: Penjualan 7 Hari`}
              value={c.name}
              onChange={e => updChart(i, { name: e.target.value })}
            />
            <select
              className="attr-type-select"
              style={{ flex: 1, maxWidth: 110 }}
              value={c.type}
              onChange={e => updChart(i, { type: e.target.value })}
            >
              {CHART_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <button className="widget-remove" onClick={() => rmChart(i)} aria-label="hapus">×</button>
          </div>
        ))}
      </div>

      {/* LOG */}
      <div className="widget-group">
        <div className="widget-group-head">
          <span className="widget-group-title">📋 Log Activity</span>
          <span className="widget-group-price">{fmtRp(PRICING.dash_log)}/widget</span>
          <button className="widget-add-btn" onClick={addLog}>+ Tambah Log</button>
        </div>
        {widgets.logs.length === 0 && <div className="widget-empty">Belum ada log.</div>}
        {widgets.logs.map((l, i) => (
          <div key={i} className="widget-row">
            <input
              className="subitem-input compact"
              placeholder={`Log #${i + 1} — cth: Log login user`}
              value={l.name}
              onChange={e => updLog(i, { name: e.target.value })}
            />
            <button className="widget-remove" onClick={() => rmLog(i)} aria-label="hapus">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// STEP 4 — TECH (build only)
// ============================================
function StepTechDesign({ form, setForm, errors }) {
  const toggleTech = (id) => {
    setForm(f => ({
      ...f,
      tech: f.tech.includes(id) ? f.tech.filter(x => x !== id) : [...f.tech, id]
    }));
  };

  return (
    <div className="step-content" data-screen-label="04 Tech Stack">
      <div className="step-header">
        <div className="step-eyebrow">Step 04 / Tech Stack</div>
        <h1 className="step-title">Tech stack untuk Build</h1>
        <p className="step-subtitle">Pilih bahasa, FE/BE, sama database-nya. Bingung? Pilih "Saran developer" — gw yang nentuin sesuai kebutuhan.</p>
      </div>

      <div className="card">
        {window.TECH_GROUPS.map((g, gi) => (
          <div key={g.key} style={{ marginBottom: gi === window.TECH_GROUPS.length - 1 ? 0 : 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
              <label className="label" style={{ marginBottom: 0 }}>{g.label}</label>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{g.hint}</span>
            </div>
            <div className="pill-grid">
              {g.options.map(t => {
                const selected = form.tech.includes(t.id);
                return (
                  <button
                    key={t.id}
                    className={'pill' + (selected ? ' selected' : '') + (t.auto ? ' pill-dev' : '')}
                    onClick={() => toggleTech(t.id)}
                    type="button"
                  >
                    {t.auto && '✦ '}{t.label}
                    {t.auto && <span className="pill-price">+{fmtRp(PRICING.techDev)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {errors.tech && <div className="error-msg" style={{ marginTop: 12 }}>Minimal pilih 1 dari tiap kategori, atau pilih "Saran developer"</div>}
      </div>
    </div>
  );
}

Object.assign(window, {
  StepScope, StepTechDesign, CHART_TYPES, makeEmptyItem,
});

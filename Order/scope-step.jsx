/* global React, PRICING, CATEGORIES, OPS_CRUD, OPS_LAPORAN, ATTR_TYPES, UML_DIAGRAMS, fmtRp */
const { useState: useScS, useRef: useScRef } = React;

// ============================================
// STEP 3 — SCOPE & REQUIREMENT
// ============================================
function StepScope({ form, setForm, errors }) {
  const hasBuild = form.services.includes('build');
  const hasUml   = form.services.includes('uml-db');

  return (
    <div className="step-content" data-screen-label="03 Scope">
      <div className="step-header">
        <div className="step-eyebrow">Step 03 / Scope</div>
        <h1 className="step-title">
          {hasBuild ? 'Apa aja yang mau dibikin?' : 'Pilih diagram yang dibutuhkan'}
        </h1>
        <p className="step-subtitle">
          {hasBuild
            ? 'Pilih jumlah tiap kategori, tentuin operasinya, trus kasih atribut yang dibutuhin.'
            : 'Pilih minimal 1 diagram. Ceritain juga latar belakang atau tujuan project kamu.'}
        </p>
      </div>

      {hasUml && <DiagramPicker form={form} setForm={setForm} errors={errors} />}
      {hasBuild && <BuildScope form={form} setForm={setForm} errors={errors} />}
    </div>
  );
}

// ============================================
// DIAGRAM PICKER (UML service)
// ============================================
function DiagramPicker({ form, setForm, errors }) {
  const diagrams   = window.UML_DIAGRAMS || [];
  const selected   = form.extras?.['uml-db']?.diagrams || [];
  const notes      = form.extras?.['uml-db']?.notes    || '';
  const probisFile = form.extras?.['uml-db']?.probisFile || null;
  const fileRef    = useScRef(null);

  const updUml = (patch) => setForm(f => ({
    ...f,
    extras: { ...f.extras, 'uml-db': { ...(f.extras?.['uml-db'] || {}), ...patch } },
  }));

  const toggleDiagram = (id) => {
    const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
    updUml({ diagrams: next });
  };

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran file maksimal 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => updUml({ probisFile: { name: file.name, size: file.size, dataUrl: e.target.result, type: file.type } });
    reader.readAsDataURL(file);
  };

  return (
    <div className="card">
      {/* Diagram selection */}
      <div className="field">
        <label className="label">Pilih Diagram yang Dibutuhkan <span style={{ color: 'var(--danger)' }}>*</span></label>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, marginTop: -4 }}>Wajib pilih minimal 1</p>
        <div className="checkbox-grid">
          {diagrams.map(d => {
            const ck = selected.includes(d.id);
            return (
              <div
                key={d.id}
                className={'checkbox-row' + (ck ? ' checked' : '')}
                onClick={() => toggleDiagram(d.id)}
              >
                <div className="checkbox-box">{ck && '✓'}</div>
                <span>{d.label}</span>
              </div>
            );
          })}
        </div>
        {errors.diagrams && (
          <div className="error-msg" style={{ marginTop: 8 }}>⚠ Pilih minimal 1 diagram</div>
        )}
      </div>

      {/* Notes / probis */}
      <div className="field" style={{ marginTop: 20 }}>
        <label className="label">Latar Belakang / Proses Bisnis <span className="label-hint">— opsional</span></label>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, marginTop: -4 }}>
          Ceritain tujuan project, alur bisnis, atau konteks aplikasinya. Bisa tulis di sini atau upload file.
        </p>
        <textarea
          className="textarea"
          placeholder="Cth: Sistem kasir untuk toko retail. Kasir input transaksi → stok otomatis berkurang → cetak struk. Butuh PDM untuk skripsi."
          value={notes}
          onChange={e => updUml({ notes: e.target.value })}
          rows={4}
        />
      </div>

      {/* File upload */}
      <div className="field" style={{ marginTop: 12 }}>
        <label className="label">Upload File <span className="label-hint">— opsional (PDF, Word, gambar)</span></label>
        {!probisFile ? (
          <div
            className="upload-zone"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            style={{ padding: '20px 16px' }}
          >
            <div className="upload-icon">↑</div>
            <div className="upload-title">Tap atau drop file di sini</div>
            <div className="upload-hint">PDF, Word, PNG, JPG · max 5MB</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              hidden
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="upload-preview">
            <div className="upload-thumb">
              {probisFile.type?.startsWith('image/') ? <img src={probisFile.dataUrl} alt="preview" /> : '📄'}
            </div>
            <div className="upload-info">
              <div className="upload-name">{probisFile.name}</div>
              <div className="upload-meta">{(probisFile.size / 1024).toFixed(1)} KB</div>
            </div>
            <button className="upload-remove" onClick={() => updUml({ probisFile: null })}>✕</button>
          </div>
        )}
      </div>
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
      while (items.length < c) items.push(makeEmptyItem(key));
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

  const updBuildProbis = (v) => setForm(f => ({ ...f, buildProbis: v }));

  return (
    <>
      {/* Probis / latar belakang sebelum isi item */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Latar Belakang / Proses Bisnis <span className="label-hint">— opsional, tapi sangat membantu</span></label>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, marginTop: -4 }}>
            Ceritain konteks bisnis, alur kerja, atau tujuan aplikasinya sebelum ngisi scope di bawah.
          </p>
          <textarea
            className="textarea"
            placeholder="Cth: Toko retail butuh sistem kasir. Kasir input penjualan → stok otomatis berkurang → owner bisa lihat laporan harian dan dashboard."
            value={form.buildProbis || ''}
            onChange={e => updBuildProbis(e.target.value)}
            rows={4}
          />
        </div>
      </div>

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
  const nameEmpty = !item.name || !item.name.trim();

  return (
    <div className="subitem">
      <div className="subitem-head">{cat.label} #{idx + 1}</div>

      <input
        className={'subitem-input' + (nameEmpty ? ' error' : '')}
        placeholder={`Nama ${cat.label.toLowerCase()} — ${cat.namePh} (wajib)`}
        value={item.name}
        onChange={e => onUpd({ name: e.target.value })}
        style={nameEmpty ? { borderColor: 'var(--danger)' } : {}}
      />
      {nameEmpty && (
        <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3, marginBottom: 4 }}>
          Nama wajib diisi
        </div>
      )}

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
  const attrTypes = window.ATTR_TYPES || [];

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
              const typeLabel = attrTypes.find(t => t.id === a.type)?.label || 'Text';
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
              {attrTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
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
  const ops      = cat.ops;
  const selected = item.ops || {};

  const toggle = (opId) => {
    onUpd({ ops: { ...selected, [opId]: !selected[opId] } });
  };

  return (
    <div className="subitem-section">
      <div className="subitem-section-label">
        Operasi yang dibutuhin
        <span className="muted-hint"> — diatur di admin</span>
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
  { id: 'bar',  label: 'Bar'          },
  { id: 'line', label: 'Line'         },
  { id: 'pie',  label: 'Pie / Donut'  },
  { id: 'area', label: 'Area'         },
];

function DashboardWidgets({ item, onUpd }) {
  const widgets = item.widgets || { sums: [], charts: [], logs: [] };

  const updWidgets = (patch) => onUpd({ widgets: { ...widgets, ...patch } });

  const addSum   = () => updWidgets({ sums:   [...widgets.sums,   { name: '', desc: '' }] });
  const rmSum    = (i) => updWidgets({ sums:   widgets.sums.filter((_,ix)=>ix!==i) });
  const updSum   = (i, patch) => updWidgets({ sums:   widgets.sums.map((s,ix)=>ix===i?{...s,...patch}:s) });

  const addChart = () => updWidgets({ charts: [...widgets.charts, { name: '', type: 'bar', desc: '' }] });
  const rmChart  = (i) => updWidgets({ charts: widgets.charts.filter((_,ix)=>ix!==i) });
  const updChart = (i, patch) => updWidgets({ charts: widgets.charts.map((c,ix)=>ix===i?{...c,...patch}:c) });

  const addLog   = () => updWidgets({ logs:   [...widgets.logs,   { name: '', desc: '' }] });
  const rmLog    = (i) => updWidgets({ logs:   widgets.logs.filter((_,ix)=>ix!==i) });
  const updLog   = (i, patch) => updWidgets({ logs:   widgets.logs.map((l,ix)=>ix===i?{...l,...patch}:l) });

  return (
    <div className="subitem-section">
      <div className="subitem-section-label">
        Widget Dashboard <span className="muted-hint">— statis</span>
      </div>

      {/* SUM */}
      <div className="widget-group">
        <div className="widget-group-head">
          <span className="widget-group-title">📊 Sum / Statistik</span>
          <span className="widget-group-price">{fmtRp(PRICING.dash_sum)}/widget</span>
          <button className="widget-add-btn" onClick={addSum}>+ Tambah Sum</button>
        </div>
        {widgets.sums.length === 0 && <div className="widget-empty">Belum ada. Klik "+ Tambah Sum".</div>}
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
// STEP 4 — TECH STACK
// landingOnly = true  → hanya tampilkan FE (untuk landing page)
// landingOnly = false → tampilkan semua grup (untuk build)
// ============================================
function StepTechDesign({ form, setForm, errors, landingOnly }) {
  const techGroups = window.TECH_GROUPS || [];
  const groups     = landingOnly ? techGroups.filter(g => g.key === 'fe') : techGroups;

  const toggleTech = (id) => {
    setForm(f => ({
      ...f,
      tech: f.tech.includes(id) ? f.tech.filter(x => x !== id) : [...f.tech, id],
    }));
  };

  return (
    <div className="step-content" data-screen-label="04 Tech Stack">
      <div className="step-header">
        <div className="step-eyebrow">Step / Tech Stack</div>
        <h1 className="step-title">
          {landingOnly ? 'Framework Frontend' : 'Tech stack untuk Build'}
        </h1>
        <p className="step-subtitle">
          {landingOnly
            ? 'Pilih framework frontend yang mau dipakai untuk landing page kamu. (wajib)'
            : 'Pilih bahasa, FE/BE, sama database-nya. Bingung? Pilih "Saran developer".'}
        </p>
      </div>

      <div className="card">
        {groups.map((g, gi) => (
          <div key={g.key} style={{ marginBottom: gi === groups.length - 1 ? 0 : 22 }}>
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
                    {t.auto && !landingOnly && <span className="pill-price">+{fmtRp(PRICING.techDev)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {errors.tech && (
          <div className="error-msg" style={{ marginTop: 12 }}>
            {landingOnly ? 'Pilih minimal 1 framework frontend' : 'Minimal pilih 1 dari tiap kategori, atau pilih "Saran developer"'}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  StepScope, StepTechDesign, CHART_TYPES, makeEmptyItem, DiagramPicker,
});

/* global React, fmtRp, PRICING, CATEGORIES, OPS_CRUD, OPS_LAPORAN, TECH_GROUPS, TECH_FLAT, COLOR_PALETTES, SERVICES, ATTR_TYPES, CHART_TYPES */
const { useState: usePS, useRef: useRefPS, useEffect: useEffectPS } = React;

// ============================================
// PRICING CALCULATOR
// ============================================
function calcTotal(form) {
  let total = 0;
  const lines = [];

  // Services (one-time)
  (form.services || []).forEach(sid => {
    const svc = SERVICES.find(s => s.id === sid);
    if (!svc || !svc.priceKey) return;
    const p = PRICING[svc.priceKey];
    total += p;
    lines.push({ label: `Jasa: ${svc.label}`, val: p });
  });

  // Build scope
  if ((form.services || []).includes('build')) {
    CATEGORIES.forEach(cat => {
      const count = form.counts[cat.key] || 0;
      if (count > 0) {
        const base = count * PRICING[cat.priceKey];
        total += base;
        lines.push({ label: `${cat.label} × ${count}`, val: base });

        const items = form.items[cat.key] || [];

        // Attributes
        const attrCount = items.reduce((s, it) => s + (it.decideAttrs ? 0 : (it.attrs?.length || 0)), 0);
        if (attrCount > 0) {
          const attrCost = attrCount * PRICING.attr;
          total += attrCost;
          lines.push({ label: `↳ ${attrCount} atribut × ${fmtRp(PRICING.attr)}`, val: attrCost, sub: true });
        }

        // Operations (for non-dashboard)
        if (cat.ops) {
          let opCost = 0;
          let opCount = 0;
          items.forEach(it => {
            const ops = it.ops || {};
            cat.ops.forEach(op => {
              if (ops[op.id]) {
                opCost += PRICING[op.priceKey];
                opCount += 1;
              }
            });
          });
          if (opCost > 0) {
            total += opCost;
            lines.push({ label: `↳ ${opCount} operasi`, val: opCost, sub: true });
          }
        }

        // Dashboard widgets
        if (cat.key === 'dashboard') {
          let sumN = 0, chartN = 0, logN = 0;
          items.forEach(it => {
            const w = it.widgets || { sums: [], charts: [], logs: [] };
            sumN += w.sums.length;
            chartN += w.charts.length;
            logN += w.logs.length;
          });
          if (sumN > 0) {
            const c = sumN * PRICING.dash_sum;
            total += c;
            lines.push({ label: `↳ ${sumN} sum widget`, val: c, sub: true });
          }
          if (chartN > 0) {
            const c = chartN * PRICING.dash_chart;
            total += c;
            lines.push({ label: `↳ ${chartN} chart widget`, val: c, sub: true });
          }
          if (logN > 0) {
            const c = logN * PRICING.dash_log;
            total += c;
            lines.push({ label: `↳ ${logN} log widget`, val: c, sub: true });
          }
        }
      }
    });

    // Tech "Saran developer"
    const devTech = (form.tech || []).filter(id => id.endsWith('_dev'));
    if (devTech.length > 0) {
      const c = devTech.length * PRICING.techDev;
      total += c;
      lines.push({ label: `Saran developer × ${devTech.length}`, val: c });
    }
  }

  return { total, lines, dp: total * 0.25, sisa: total * 0.75 };
}

// ============================================
// STEP — RINGKASAN
// ============================================
function StepSummary({ form }) {
  const { total, lines, dp, sisa } = calcTotal(form);
  const paletteLabel = form.palette ? COLOR_PALETTES.find(p => p.id === form.palette)?.label : null;

  return (
    <div className="step-content" data-screen-label="06 Ringkasan">
      <div className="step-header">
        <div className="step-eyebrow">Step / Ringkasan</div>
        <h1 className="step-title">Cek pesanan kamu</h1>
        <p className="step-subtitle">Pastikan udah bener sebelum lanjut ke pembayaran.</p>
      </div>

      <div className="summary-card">
        <div className="summary-section">
          <div className="summary-section-title">Pelanggan</div>
          <SumRow label="Nama" val={form.name || '—'} />
          <SumRow label="WhatsApp" val={'+62' + (form.wa || '—')} />
          {form.email && <SumRow label="Email" val={form.email} />}
        </div>

        <div className="summary-section">
          <div className="summary-section-title">Jasa Dipilih</div>
          {(form.services || []).map(sid => {
            const svc = SERVICES.find(s => s.id === sid);
            if (!svc) return null;
            return (
              <SumRow
                key={sid}
                label={svc.label}
                val={svc.priceKey ? fmtRp(PRICING[svc.priceKey]) : 'Sesuai scope'}
              />
            );
          })}
          {form.services.includes('consult') && form.consult && (
            <div className="sum-block">
              {form.consult.fields && (
                <div className="sum-paragraph">
                  <div className="sum-paragraph-label">Kebutuhan</div>
                  <pre>{form.consult.fields}</pre>
                </div>
              )}
              {(form.consult.pdm || form.consult.activity || form.consult.usecase) && (
                <SumRow
                  label="Diagram"
                  val={[
                    form.consult.pdm && 'PDM',
                    form.consult.activity && 'Activity',
                    form.consult.usecase && 'Use Case',
                  ].filter(Boolean).join(', ')}
                />
              )}
              {form.consult.probis && (
                <div className="sum-paragraph">
                  <div className="sum-paragraph-label">Proses Bisnis</div>
                  <pre>{form.consult.probis}</pre>
                </div>
              )}
            </div>
          )}
          {['uml-db', 'landing', 'revision'].map(sid => {
            const notes = form.extras?.[sid]?.notes;
            if (!form.services.includes(sid) || !notes) return null;
            const svc = SERVICES.find(s => s.id === sid);
            return (
              <div key={sid} className="sum-paragraph">
                <div className="sum-paragraph-label">{svc.label} — Catatan</div>
                <pre>{notes}</pre>
              </div>
            );
          })}
        </div>

        {form.services.includes('build') && (
          <div className="summary-section">
            <div className="summary-section-title">Scope Build</div>
            {CATEGORIES.map(cat => {
              const count = form.counts[cat.key] || 0;
              if (!count) return null;
              const items = form.items[cat.key] || [];
              return (
                <div key={cat.key} style={{ marginBottom: 14 }}>
                  <SumRow label={cat.label} val={`${count} item`} bold />
                  {items.map((it, i) => (
                    <ItemSummary key={i} idx={i} cat={cat} item={it} />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {form.services.includes('build') && form.tech.length > 0 && (
          <div className="summary-section">
            <div className="summary-section-title">Tech Stack</div>
            {TECH_GROUPS.map(g => {
              const selected = form.tech.filter(id => g.options.some(o => o.id === id));
              const labels = selected.map(id => g.options.find(o => o.id === id)?.label).filter(Boolean);
              return (
                <SumRow
                  key={g.key}
                  label={g.label}
                  val={labels.length > 0 ? labels.join(', ') : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                />
              );
            })}
          </div>
        )}

        <div className="summary-section">
          <div className="summary-section-title">Timeline</div>
          <SumRow
            label="Deadline"
            val={form.deadline ? new Date(form.deadline).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          />
          {paletteLabel && <SumRow label="Palette" val={paletteLabel} />}
          {form.customColor && <SumRow label="Catatan warna" val={form.customColor} />}
          {form.notes && (
            <div className="sum-paragraph">
              <div className="sum-paragraph-label">Catatan</div>
              <pre>{form.notes}</pre>
            </div>
          )}
        </div>

        <div className="summary-section">
          <div className="summary-section-title">Rincian Biaya</div>
          {lines.map((l, i) => (
            <SumRow key={i} label={l.label} val={fmtRp(l.val)} sub={l.sub} />
          ))}
          {lines.length === 0 && (
            <div style={{ color: 'var(--text-faint)', fontSize: 13, padding: '4px 0' }}>Belum ada item</div>
          )}
        </div>

        <div className="summary-total">
          <div>
            <div className="summary-total-label">Total Pesanan</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              DP 25% = {fmtRp(dp)} · Sisa {fmtRp(sisa)} saat selesai
            </div>
          </div>
          <div className="summary-total-amount">{fmtRp(total)}</div>
        </div>
      </div>
    </div>
  );
}

function SumRow({ label, val, sub, bold }) {
  return (
    <div className="summary-row" style={sub ? { paddingLeft: 14, fontSize: 12, color: 'var(--text-muted)' } : {}}>
      <span className="label" style={{ ...(sub ? { fontWeight: 400 } : {}), ...(bold ? { color: 'var(--text)', fontWeight: 700 } : {}) }}>{label}</span>
      <span className="val" style={sub ? { fontWeight: 500 } : {}}>{val}</span>
    </div>
  );
}

function ItemSummary({ idx, cat, item }) {
  const typeLabel = (t) => ATTR_TYPES.find(x => x.id === t)?.label || 'Text';
  const opsList = cat.ops ? cat.ops.filter(o => item.ops?.[o.id]).map(o => o.label) : [];

  return (
    <div className="sum-item">
      <div className="sum-item-name">
        ↳ <strong>{item.name || <span style={{ color: 'var(--text-faint)' }}>{`(belum diisi #${idx + 1})`}</span>}</strong>
      </div>
      {cat.key !== 'dashboard' && (
        item.decideAttrs ? (
          <div className="sum-item-detail">· atribut ditentukan developer</div>
        ) : item.attrs.length > 0 && (
          <div className="sum-item-detail">
            · atribut: {item.attrs.map(a => `${a.name} (${typeLabel(a.type)})`).join(', ')}
          </div>
        )
      )}
      {opsList.length > 0 && (
        <div className="sum-item-detail">· operasi: {opsList.join(', ')}</div>
      )}
      {cat.key === 'dashboard' && item.widgets && (
        <>
          {item.widgets.sums.length > 0 && (
            <div className="sum-item-detail">· {item.widgets.sums.length} sum: {item.widgets.sums.map(s => s.name || '(tanpa nama)').join(', ')}</div>
          )}
          {item.widgets.charts.length > 0 && (
            <div className="sum-item-detail">· {item.widgets.charts.length} chart: {item.widgets.charts.map(c => `${c.name || '(tanpa nama)'} [${c.type}]`).join(', ')}</div>
          )}
          {item.widgets.logs.length > 0 && (
            <div className="sum-item-detail">· {item.widgets.logs.length} log: {item.widgets.logs.map(l => l.name || '(tanpa nama)').join(', ')}</div>
          )}
        </>
      )}
      {item.notes && <div className="sum-item-detail italic">· catatan: "{item.notes}"</div>}
    </div>
  );
}

// ============================================
// STEP — PEMBAYARAN
// ============================================
const PAYMENT_METHODS = [
  { id: 'bca', name: 'BCA Transfer', logo: 'BCA', detail: '8290-456-789 · a.n. DevOrder Studio' },
  { id: 'mandiri', name: 'Mandiri Transfer', logo: 'MNDR', detail: '1410-0098-7654 · a.n. DevOrder Studio' },
  { id: 'dana', name: 'DANA', logo: 'DANA', detail: '0812-3456-7890' },
  { id: 'gopay', name: 'GoPay', logo: 'GO', detail: '0812-3456-7890' },
  { id: 'qris', name: 'QRIS', logo: 'QR', detail: 'Scan dari semua e-wallet' },
];

function StepPayment({ form, setForm, errors }) {
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const { dp, total } = calcTotal(form);
  const [copied, setCopied] = usePS(null);
  const [dragOver, setDragOver] = usePS(false);
  const fileRef = useRefPS(null);

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === form.paymentMethod);

  const copyAccount = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran file maksimal 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => upd('proof', { name: file.name, size: file.size, dataUrl: e.target.result, type: file.type });
    reader.readAsDataURL(file);
  };

  return (
    <div className="step-content" data-screen-label="07 Pembayaran">
      <div className="step-header">
        <div className="step-eyebrow">Step / Pembayaran</div>
        <h1 className="step-title">Bayar DP & upload bukti</h1>
        <p className="step-subtitle">Pesanan diproses setelah DP 25% masuk. Sisa 75% saat selesai.</p>
      </div>

      <div className="payment-banner">
        <div className="payment-banner-icon">₹</div>
        <div className="payment-banner-text">
          DP yang harus dibayar sekarang: <strong>{fmtRp(dp)}</strong> dari total {fmtRp(total)}
        </div>
      </div>

      <div className="card">
        <label className="label" style={{ marginBottom: 12 }}>Pilih Metode Pembayaran</label>
        <div className="method-grid">
          {PAYMENT_METHODS.map(m => (
            <div
              key={m.id}
              className={'method-card' + (form.paymentMethod === m.id ? ' selected' : '')}
              onClick={() => upd('paymentMethod', m.id)}
            >
              <div className="method-logo" style={getLogoStyle(m.id)}>{m.logo}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="method-name">{m.name}</div>
                <div className="method-detail">{m.id === 'qris' ? 'Universal' : 'Tap untuk lihat detail'}</div>
              </div>
              <div className="method-radio" />
            </div>
          ))}
        </div>

        {errors.paymentMethod && <div className="error-msg" style={{ marginTop: 10 }}>Pilih dulu metode pembayarannya</div>}

        {selectedMethod && (
          <div className="account-card">
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Detail {selectedMethod.name}
            </div>
            {selectedMethod.id === 'qris' ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                <div style={{ width: 180, height: 180, background: 'white', borderRadius: 12, padding: 12, border: '1.5px solid var(--border)' }}>
                  <FakeQR />
                </div>
              </div>
            ) : (
              <>
                <div className="account-row">
                  <span className="account-label">No. Rekening</span>
                  <span className="account-val">
                    {selectedMethod.detail.split(' · ')[0]}
                    <button
                      className={'copy-btn' + (copied === selectedMethod.detail.split(' · ')[0] ? ' copied' : '')}
                      onClick={() => copyAccount(selectedMethod.detail.split(' · ')[0])}
                    >
                      {copied === selectedMethod.detail.split(' · ')[0] ? '✓ Tersalin' : 'Salin'}
                    </button>
                  </span>
                </div>
                {selectedMethod.detail.includes(' · ') && (
                  <div className="account-row">
                    <span className="account-label">Atas nama</span>
                    <span className="account-val">{selectedMethod.detail.split(' · ')[1].replace('a.n. ', '')}</span>
                  </div>
                )}
              </>
            )}
            <div className="account-row" style={{ borderTop: '1px dashed var(--border)', marginTop: 8, paddingTop: 12 }}>
              <span className="account-label">Nominal DP</span>
              <span className="account-val" style={{ color: 'var(--primary)', fontSize: 16 }}>{fmtRp(dp)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <label className="label" style={{ marginBottom: 12 }}>Upload Bukti Transfer</label>

        {!form.proof ? (
          <div
            className={'upload-zone' + (dragOver ? ' dragging' : '')}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <div className="upload-icon">↑</div>
            <div className="upload-title">Tap atau drop bukti transfer di sini</div>
            <div className="upload-hint">JPG, PNG, atau PDF · max 5MB</div>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={e => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div className="upload-preview">
            <div className="upload-thumb">
              {form.proof.type?.startsWith('image/') ? <img src={form.proof.dataUrl} alt="preview" /> : '📄'}
            </div>
            <div className="upload-info">
              <div className="upload-name">{form.proof.name}</div>
              <div className="upload-meta">{(form.proof.size / 1024).toFixed(1)} KB · Siap dikirim</div>
            </div>
            <button className="upload-remove" onClick={() => upd('proof', null)}>✕</button>
          </div>
        )}

        {errors.proof && <div className="error-msg" style={{ marginTop: 10 }}>Bukti transfer wajib diupload</div>}
      </div>
    </div>
  );
}

function getLogoStyle(id) {
  const map = {
    bca: { background: '#0060AF', color: 'white', border: 'none' },
    mandiri: { background: '#003D79', color: '#FFD700', border: 'none', fontSize: 10 },
    dana: { background: '#118EEA', color: 'white', border: 'none' },
    gopay: { background: '#00AED6', color: 'white', border: 'none' },
    qris: { background: '#ED1C24', color: 'white', border: 'none' },
  };
  return map[id] || {};
}

function FakeQR() {
  const cells = [];
  const seed = 7;
  for (let i = 0; i < 21; i++) {
    for (let j = 0; j < 21; j++) {
      const isFinder = (i < 7 && j < 7) || (i < 7 && j > 13) || (i > 13 && j < 7);
      const isFinderInner =
        ((i >= 2 && i <= 4) && (j >= 2 && j <= 4)) ||
        ((i >= 2 && i <= 4) && (j >= 16 && j <= 18)) ||
        ((i >= 16 && i <= 18) && (j >= 2 && j <= 4));
      const hash = ((i * 31 + j * seed + i * j) % 5) === 0;
      const fill = isFinderInner || (isFinder && (i === 0 || i === 6 || j === 0 || j === 6 || i === 14 || j === 14)) || (!isFinder && hash);
      cells.push(<rect key={`${i}-${j}`} x={j * 7} y={i * 7} width={7} height={7} fill={fill ? '#0A0A0A' : 'transparent'} />);
    }
  }
  return <svg viewBox="0 0 147 147" width="100%" height="100%"><rect width="147" height="147" fill="white" />{cells}</svg>;
}

// ============================================
// SUCCESS SCREEN — with prominent WA link
// ============================================
const ADMIN_WA = '6281234567890';

function SuccessScreen({ form, onReset }) {
  const { dp, total } = calcTotal(form);
  const orderCode = 'DV-' + Date.now().toString(36).toUpperCase().slice(-7);

  // Save order to localStorage for admin
  useEffectPS(() => {
    try {
      const orders = JSON.parse(localStorage.getItem('devorder_orders') || '[]');
      orders.unshift({
        code: orderCode,
        createdAt: new Date().toISOString(),
        status: 'pending',
        form: { ...form, proof: form.proof ? { name: form.proof.name, size: form.proof.size, type: form.proof.type } : null },
        total, dp,
      });
      localStorage.setItem('devorder_orders', JSON.stringify(orders.slice(0, 100)));
    } catch (e) { /* ignore */ }
  }, []);

  const waMsg = encodeURIComponent(
    `Halo Admin DevOrder! 👋\n\nSaya baru order dengan kode: *${orderCode}*\nNama: ${form.name}\nTotal: ${fmtRp(total)} (DP ${fmtRp(dp)})\n\nMohon konfirmasi ya, makasih!`
  );
  const waUrl = `https://wa.me/${ADMIN_WA}?text=${waMsg}`;

  return (
    <div className="success-shell step-content" data-screen-label="08 Success">
      <div className="success-badge">✓</div>
      <h1 className="success-title">Pesanan berhasil dikirim!</h1>
      <p className="success-sub">
        Datamu udah masuk ke sistem. <strong>Klik tombol WA di bawah</strong> buat konfirmasi langsung ke admin biar lebih cepat diproses.
      </p>
      <div className="success-code">#{orderCode}</div>

      {/* PROMINENT WHATSAPP CARD */}
      <a className="wa-cta" href={waUrl} target="_blank" rel="noopener">
        <div className="wa-cta-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <div className="wa-cta-body">
          <div className="wa-cta-eyebrow">Konfirmasi Pesanan</div>
          <div className="wa-cta-title">Chat Admin di WhatsApp</div>
          <div className="wa-cta-sub">+{ADMIN_WA.replace(/(\d{2})(\d{3})(\d{4})(\d{4})/, '$1 $2-$3-$4')}</div>
        </div>
        <div className="wa-cta-arrow">→</div>
      </a>

      <div className="next-steps-card">
        <div className="next-steps-title">Apa Selanjutnya?</div>
        <NextStep n={1} title="Konfirmasi via WhatsApp" desc="Klik tombol di atas, kirim pesannya — admin auto-tahu order kamu." />
        <NextStep n={2} title="Verifikasi pembayaran" desc="DP yang udah kamu transfer dicek admin dalam beberapa jam." />
        <NextStep n={3} title="Diskusi spek & timeline" desc="Diskusi detail spek, kasih timeline pasti, progress update reguler." />
        <NextStep n={4} title="Delivery & pelunasan" desc={`Aplikasi siap sesuai deadline. Pelunasan ${fmtRp(total - dp)} pas selesai.`} />
      </div>

      <div className="success-actions">
        <button className="btn btn-ghost" onClick={onReset}>+ Pesan project lain</button>
      </div>
    </div>
  );
}

function NextStep({ n, title, desc }) {
  return (
    <div className="next-step-row">
      <div className="next-step-num">{n}</div>
      <div>
        <div className="next-step-title">{title}</div>
        <div className="next-step-desc">{desc}</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  StepSummary, StepPayment, SuccessScreen, calcTotal, PAYMENT_METHODS, ADMIN_WA,
});

/* global React, ReactDOM, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakColor, TweakToggle,
   StepIdentity, StepService, StepScope, StepTechDesign, StepTimeline, StepSummary, StepPayment, SuccessScreen,
   calcTotal, fmtRp, CATEGORIES, SERVICES */
const { useState, useEffect, useMemo } = React;

const INITIAL_FORM = {
  name: '',
  wa: '',
  email: '',
  services: [],        // ['build', 'consult', ...]
  consult: { fields: '', pdm: false, activity: false, usecase: false, probis: '' },
  extras: {},          // { 'uml-db': { notes }, 'landing': { notes }, 'revision': { notes } }
  counts: { master: 0, transaksi: 0, laporan: 0, dashboard: 0 },
  items: { master: [], transaksi: [], laporan: [], dashboard: [] },
  tech: [],
  palette: '',
  customColor: '',
  deadline: '',
  notes: '',
  paymentMethod: '',
  proof: null,
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "primaryColor": "#5B3FE5",
  "fontPair": "jakarta",
  "showEstimate": true
}/*EDITMODE-END*/;

// Compute step list based on services
function getSteps(services) {
  const steps = [
    { id: 'identity', label: 'Data Diri' },
    { id: 'service', label: 'Jasa' },
  ];
  const needsScope = services.includes('build') || services.includes('consult')
    || services.some(s => ['uml-db', 'landing', 'revision'].includes(s));
  if (needsScope) steps.push({ id: 'scope', label: 'Scope' });
  if (services.includes('build')) steps.push({ id: 'tech', label: 'Tech' });
  steps.push(
    { id: 'timeline', label: 'Catatan' },
    { id: 'summary', label: 'Ringkasan' },
    { id: 'payment', label: 'Bayar' },
  );
  return steps;
}

function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const STEPS = useMemo(() => getSteps(form.services), [form.services]);
  const currentStep = STEPS[step];

  // Apply theme + primary color
  useEffect(() => {
    const themeMap = { light: '', cream: 'cream', dark: 'dark' };
    document.documentElement.setAttribute('data-theme', themeMap[t.theme] || '');
  }, [t.theme]);

  useEffect(() => {
    if (t.theme === 'light' && t.primaryColor) {
      document.documentElement.style.setProperty('--primary', t.primaryColor);
      document.documentElement.style.setProperty('--primary-hover', adjust(t.primaryColor, -15));
      document.documentElement.style.setProperty('--primary-soft', hexToRgba(t.primaryColor, 0.12));
    } else {
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--primary-hover');
      document.documentElement.style.removeProperty('--primary-soft');
    }
  }, [t.primaryColor, t.theme]);

  useEffect(() => {
    const fontMap = {
      jakarta: "'Plus Jakarta Sans', sans-serif",
      inter: "'Inter', sans-serif",
      manrope: "'Manrope', sans-serif",
    };
    document.documentElement.style.setProperty('--font-sans', fontMap[t.fontPair] || fontMap.jakarta);
  }, [t.fontPair]);

  // Validation
  const validateStep = (s) => {
    const e = {};
    const stepId = STEPS[s]?.id;
    if (stepId === 'identity') {
      if (!form.name.trim()) e.name = true;
      if (!form.wa || form.wa.length < 9) e.wa = true;
    }
    if (stepId === 'service') {
      if (form.services.length === 0) e.services = true;
    }
    if (stepId === 'scope') {
      if (form.services.includes('build')) {
        const total = Object.values(form.counts).reduce((a, b) => a + b, 0);
        if (total === 0) e.scope = true;
        // Dashboard widget required if dashboard count > 0
        const dashItems = form.items.dashboard || [];
        if ((form.counts.dashboard || 0) > 0) {
          const anyWidget = dashItems.some(it => {
            const w = it.widgets || { sums: [], charts: [], logs: [] };
            return w.sums.length + w.charts.length + w.logs.length > 0;
          });
          if (!anyWidget) e.scope = true;
        }
      }
    }
    if (stepId === 'tech') {
      if (form.tech.length === 0) e.tech = true;
    }
    if (stepId === 'timeline') {
      if (!form.deadline) e.deadline = true;
    }
    if (stepId === 'payment') {
      if (!form.paymentMethod) e.paymentMethod = true;
      if (!form.proof) e.proof = true;
    }
    return e;
  };

  const next = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // scroll to first error after render
      setTimeout(() => {
        const errEl = document.querySelector('.error-msg, .input.error');
        errEl?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      }, 50);
      return;
    }
    if (step === STEPS.length - 1) {
      setDone(true);
      return;
    }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prev = () => {
    setErrors({});
    setStep(s => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setStep(0);
    setDone(false);
    setErrors({});
  };

  const { total } = calcTotal(form);

  if (done) {
    return (
      <>
        <Topbar />
        <div className="main">
          <SuccessScreen form={form} onReset={reset} />
        </div>
        <TweaksUI t={t} setTweak={setTweak} />
      </>
    );
  }

  return (
    <div className="app">
      <Topbar />
      <Stepper steps={STEPS} step={step} />

      <div className="main">
        {currentStep?.id === 'identity' && <StepIdentity form={form} setForm={setForm} errors={errors} />}
        {currentStep?.id === 'service' && <StepService form={form} setForm={setForm} errors={errors} />}
        {currentStep?.id === 'scope' && <StepScope form={form} setForm={setForm} errors={errors} />}
        {currentStep?.id === 'tech' && <StepTechDesign form={form} setForm={setForm} errors={errors} />}
        {currentStep?.id === 'timeline' && <StepTimeline form={form} setForm={setForm} errors={errors} />}
        {currentStep?.id === 'summary' && <StepSummary form={form} />}
        {currentStep?.id === 'payment' && <StepPayment form={form} setForm={setForm} errors={errors} />}

        <div className="nav-bar">
          <button className="btn btn-ghost" onClick={prev} disabled={step === 0} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
            ← Kembali
          </button>
          <div className="right">
            {step < STEPS.length - 1 && (
              <button className="btn btn-primary btn-lg" onClick={next}>
                {currentStep?.id === 'summary' ? 'Lanjut ke Pembayaran' : 'Lanjut'} →
              </button>
            )}
            {step === STEPS.length - 1 && (
              <button className="btn btn-primary btn-lg" onClick={next}>
                Kirim Pesanan ✓
              </button>
            )}
          </div>
        </div>
      </div>

      {t.showEstimate && total > 0 && currentStep?.id !== 'summary' && currentStep?.id !== 'payment' && (
        <div className="estimate-pill">
          <span className="ep-dot" />
          <span style={{ color: 'var(--text-muted)' }}>Estimasi total:</span>
          <span className="ep-val">{fmtRp(total)}</span>
        </div>
      )}

      {total > 0 && currentStep?.id !== 'summary' && currentStep?.id !== 'payment' && (
        <div className="mobile-total">
          <div>
            <div className="label">Estimasi Total</div>
            <div className="val">{fmtRp(total)}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
            DP {fmtRp(total * 0.25)}
          </div>
        </div>
      )}

      <TweaksUI t={t} setTweak={setTweak} />
    </div>
  );
}

function Topbar() {
  return (
    <div className="topbar">
      <div className="logo">
        <div className="logo-mark">{'</>'}</div>
        DevOrder
      </div>
      <div className="topbar-meta">
        <a href="admin.html" className="admin-link" title="Admin Dashboard">⚙</a>
        <span className="topbar-secure-text">Aman & terenkripsi</span>
        <span className="dot-secure" />
      </div>
    </div>
  );
}

function Stepper({ steps, step }) {
  return (
    <div className="stepper-wrap">
      <div className="stepper">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={'step-item ' + (i === step ? 'active' : i < step ? 'done' : '')}>
              <div className="step-num">{i < step ? '✓' : String(i + 1).padStart(2, '0')}</div>
              <span className="step-label-text">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={'step-line' + (i < step ? ' done' : '')} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="Tema Visual" />
      <TweakRadio
        label="Theme"
        value={t.theme}
        onChange={v => setTweak('theme', v)}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'cream', label: 'Cream' },
          { value: 'dark', label: 'Dark' },
        ]}
      />

      {t.theme === 'light' && (
        <TweakColor
          label="Aksen"
          value={t.primaryColor}
          onChange={v => setTweak('primaryColor', v)}
          options={['#5B3FE5', '#0891B2', '#16A34A', '#DC2626', '#EA580C']}
        />
      )}

      <TweakSection label="Typography" />
      <TweakRadio
        label="Font"
        value={t.fontPair}
        onChange={v => setTweak('fontPair', v)}
        options={[
          { value: 'jakarta', label: 'Jakarta' },
          { value: 'inter', label: 'Inter' },
          { value: 'manrope', label: 'Manrope' },
        ]}
      />

      <TweakSection label="Tampilan" />
      <TweakToggle
        label="Pill estimasi total"
        value={t.showEstimate}
        onChange={v => setTweak('showEstimate', v)}
      />
    </TweaksPanel>
  );
}

// ============== color utils ==============
function hexToRgba(hex, a) {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function adjust(hex, amt) {
  const m = hex.replace('#', '');
  let r = parseInt(m.slice(0, 2), 16);
  let g = parseInt(m.slice(2, 4), 16);
  let b = parseInt(m.slice(4, 6), 16);
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

(function loadExtraFonts() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
})();

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

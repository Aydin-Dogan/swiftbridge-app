import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TaalKiezer from '../components/TaalKiezer';
import { useTaal } from '../i18n';
import { apiFetch, haalProfiel } from '../services/api';
import { Mail, Lock, Zap, AlertTriangle, Eye, EyeOff } from '../components/icons/Icons';
import DeviceLogin from './DeviceLogin';
import InlogWachtOpApp from './InlogWachtOpApp';

// Alleen paden binnen de app mogen als ?next= terugkeerdoel dienen (geen open redirect).
// Niet geëxporteerd: dit bestand exporteert alleen de Login-component (fast refresh).
function veiligNext(pad) {
  if (typeof pad !== 'string') return null;
  if (!/^\/app(\/[A-Za-z0-9._~\-/]*)?(\?[A-Za-z0-9._~\-=&%]*)?$/.test(pad)) return null;
  if (pad.includes('//') || pad.includes('\\')) return null;
  // Geen '.'/'..'-segmenten: '/app/../admin' zou anders buiten /app uitkomen.
  if (pad.split('?')[0].split('/').some((seg) => seg === '.' || seg === '..')) return null;
  return pad;
}

export default function Login({ onLogin }) {
  const [params] = useSearchParams();
  const { t } = useTaal();
  // KYB: ?type=zakelijk opent direct het registratietabblad met accounttype zakelijk
  const typeZakelijk = params.get('type') === 'zakelijk';
  const [tab, setTab] = useState(params.get('tab') === 'register' || typeZakelijk ? 'register' : 'login');
  const navigate = useNavigate();
  // ?next= (alleen /app-paden): na inloggen/registreren daarheen i.p.v. /app
  const next = veiligNext(params.get('next'));

  // Auto-vul referralCode uit URL ?ref=ABCD1234 (gedeeld via WhatsApp/email)
  const initialRef = params.get('ref') || params.get('r') || '';
  const [form, setForm] = useState({ email: '', password: '', naam: '', telefoon: '', referralCode: initialRef.toUpperCase(), accountType: typeZakelijk ? 'zakelijk' : 'particulier', bedrijfsnaam: '', kvkNummer: '' });
  // Referral validatie state
  const [refValidatie, setRefValidatie] = useState({ status: 'idle', uitnodigerNaam: '' }); // idle | bezig | geldig | ongeldig
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');
  // Juridisch akkoord bij registratie (Voorwaarden + Privacyverklaring): verplicht vinkje.
  // De API legt bij voorwaardenAkkoord:true de versie + tijdstempel vast.
  const [akkoord, setAkkoord] = useState(false);
  const [akkoordFout, setAkkoordFout] = useState(false);
  const [toonVergeten, setToonVergeten] = useState(false);
  const [vergetenEmail, setVergetenEmail] = useState('');
  const [vergetenBericht, setVergetenBericht] = useState('');
  const [vergetenOk, setVergetenOk] = useState(false); // succes-state ipv emoji-prefix check
  const [vergetenLaden, setVergetenLaden] = useState(false);
  const [vergetenOefenLink, setVergetenOefenLink] = useState(''); // alleen gevuld in lokale oefenversie
  const [vergetenOefenOnbekend, setVergetenOefenOnbekend] = useState(false); // oefenversie: adres heeft hier geen account

  // 2FA state
  const [twofaUserId, setTwofaUserId] = useState(null);
  // F7 fix (Cursor review): pendingToken is nieuwe primaire identifier
  const [twofaPendingToken, setTwofaPendingToken] = useState(null);
  const [twofaCode, setTwofaCode ] = useState('');
  const [twofaOefenCode, setTwofaOefenCode] = useState(null); // SB LOKAAL: geen mail — code op scherm
  const [twofaLaden, setTwofaLaden ] = useState(false);
  const [twofaFout, setTwofaFout ] = useState('');
  const [herverzendBericht, setHerverzendBericht] = useState('');
  const [herverzendBezig, setHerverzendBezig] = useState(false);
  const [herverzendCooldown, setHerverzendCooldown] = useState(0);

  // Wachtwoord reset via link (?reset=TOKEN)
  const resetToken = params.get('reset');
  const [toonReset, setToonReset] = useState(!!resetToken);
  const [nieuwWachtwoord, setNieuwWachtwoord] = useState('');
  // Op verzoek Aydin (16-9): wachtwoord kunnen tonen tijdens het typen.
  const [toonWachtwoord, setToonWachtwoord] = useState(false);
  const [resetBericht, setResetBericht] = useState('');
  const [resetOk, setResetOk] = useState(false);
  const [resetLaden, setResetLaden] = useState(false);

  // ING-model: website-login wacht op bevestiging in de app (push → app → code)
  const [bevestigingToken, setBevestigingToken] = useState(null);

  // ING-stijl device-login: is dit toestel gekoppeld?
  const [apparaatStatus, setApparaatStatus] = useState('onbekend'); // onbekend | gekoppeld | nee
  const [apparaatNaam, setApparaatNaam] = useState(null);
  const [metWachtwoord, setMetWachtwoord] = useState(false); // forceer volledig e-mail/wachtwoord-scherm
  const [toonKoppel, setToonKoppel] = useState(false);       // koppel-aanbod ná volledige login
  const [naProfiel, setNaProfiel] = useState(null);          // profiel om mee door te gaan na koppel
  const [naDoel, setNaDoel] = useState('/app');              // waarheen na koppelen/annuleren

  useEffect(() => { setFout(''); }, [tab]);

  // Bij binnenkomst: is dit toestel al gekoppeld? (bepaalt snel-inlog-scherm)
  // Gekoppeld toestel + openstaande inlogpoging elders → direct naar het
  // bevestig-scherm (voor wie de app zelf opent i.p.v. op de melding te tikken).
  useEffect(() => {
    if (resetToken) return;
    let weg = false;
    apiFetch('/auth/apparaat/status')
      .then((d) => {
        if (weg) return;
        setApparaatStatus(d?.gekoppeld ? 'gekoppeld' : 'nee');
        setApparaatNaam(d?.apparaatNaam || null);
        if (d?.gekoppeld) {
          apiFetch('/auth/inlog-bevestiging/openstaand')
            .then((o) => { if (!weg && o?.openstaand) navigate('/bevestig-inlog'); })
            .catch(() => {});
        }
      })
      .catch(() => { if (!weg) setApparaatStatus('nee'); });
    return () => { weg = true; };
  }, [resetToken, navigate]);

  // Bestemming na inloggen: ?next= (alleen /app-paden) wint; een nieuw
  // zakelijk account landt op "Zakelijk profiel aanvragen"; anders /app.
  function bepaalDoel(profiel, geregistreerd) {
    if (next) return next;
    if (geregistreerd && (profiel?.accountType === 'zakelijk' || form.accountType === 'zakelijk')) return '/app/zakelijk-aanvraag';
    return '/app';
  }

  // Na een geslaagde volledige login: als dit toestel nog niet gekoppeld is,
  // bied aan het te onthouden (6-cijferige code) — anders meteen door.
  function naSuccesLogin(profiel, geregistreerd = false) {
    const doel = bepaalDoel(profiel, geregistreerd);
    if (apparaatStatus !== 'gekoppeld') { setNaProfiel(profiel); setNaDoel(doel); setToonKoppel(true); return; }
    onLogin(null, profiel);
    navigate(doel);
  }

  // Live validatie van referral code — debounced 400ms
  useEffect(() => {
    if (tab !== 'register') return;
    const code = (form.referralCode || '').trim().toUpperCase();
    if (!code) { setRefValidatie({ status: 'idle', uitnodigerNaam: '' }); return; }
    if (code.length < 6) { setRefValidatie({ status: 'idle', uitnodigerNaam: '' }); return; }
    let geannuleerd = false;
    setRefValidatie({ status: 'bezig', uitnodigerNaam: '' });
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch('/referral/valideer', { method: 'POST', body: { code } });
        if (geannuleerd) return;
        if (data?.geldig) {
          setRefValidatie({ status: 'geldig', uitnodigerNaam: data.uitnodigerNaam || '' });
        } else {
          setRefValidatie({ status: 'ongeldig', uitnodigerNaam: '' });
        }
      } catch {
        if (!geannuleerd) setRefValidatie({ status: 'ongeldig', uitnodigerNaam: '' });
      }
    }, 400);
    return () => { geannuleerd = true; clearTimeout(timer); };
  }, [form.referralCode, tab]);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  // Wachtwoord-sterktemeter (P1-prototype): indicatie vooraf; de echte controle
  // (zxcvbn, ≥10 tekens, geen naam/e-mail erin) doet de server bij registratie.
  function wachtwoordSterkte(pw) {
    let score = 0;
    if (pw.length >= 10) score += 2; else if (pw.length >= 8) score += 1;
    if (pw.length >= 14) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/\d/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    if (score >= 5) return { label: 'Sterk wachtwoord', kleur: 'bg-success-500', tekst: 'text-success-700', pct: 100 };
    if (score >= 3) return { label: 'Redelijk — maak hem langer of voeg een teken toe', kleur: 'bg-amber-500', tekst: 'text-amber-700', pct: 60 };
    return { label: 'Zwak — gebruik hoofdletter, cijfer en 10+ tekens', kleur: 'bg-red-500', tekst: 'text-red-600', pct: 25 };
  }

  async function submit(e) {
    e.preventDefault();
    // Zonder akkoord met Voorwaarden + Privacyverklaring geen account aanmaken
    if (tab === 'register' && !akkoord) {
      setFout('');
      setAkkoordFout(true);
      return;
    }
    setLaden(true);
    setFout('');
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const body = tab === 'login'
        ? { email: form.email, password: form.password }
        : {
            email: form.email,
            password: form.password,
            naam: form.naam,
            telefoon: form.telefoon,
            accountType: form.accountType,
            ...(form.accountType === 'zakelijk' ? { bedrijfsnaam: form.bedrijfsnaam, kvkNummer: form.kvkNummer } : {}),
            ...(form.referralCode ? { referralCode: form.referralCode.trim().toUpperCase() } : {}),
            voorwaardenAkkoord: true,
          };

      // apiFetch zet `credentials: 'include'` — backend zet sb_token cookie.
      const data = await apiFetch(endpoint, { method: 'POST', body });

      // App-bevestiging (ING-model): wachten tot de gebruiker in de app bevestigt
      if (data.appBevestiging) {
        setBevestigingToken(data.bevestigingToken);
        return;
      }

      // 2FA tussenstap
      if (data.tweeFactor) {
        setTwofaUserId(data.userId);
        setTwofaPendingToken(data.pendingToken || null); // F7: primaire identifier
        setTwofaOefenCode(data.codeOefen || null); // SB LOKAAL: code op het scherm
        return;
      }

      // Cookie is gezet door server. Haal profiel op via /auth/me i.p.v. body te vertrouwen.
      const profiel = await haalProfiel();
      naSuccesLogin(profiel || data.gebruiker, tab === 'register');
    } catch (e) {
      setFout(e.message);
    } finally {
      setLaden(false);
    }
  }

  async function stuurResetLink(e) {
    e.preventDefault();
    setVergetenLaden(true);
    setVergetenBericht('');
    try {
      const data = await apiFetch('/auth/wachtwoord-vergeten', {
        method: 'POST',
        body: { email: vergetenEmail },
      });
      // Oefenversie: toon dan alleen de oefen-kaart (directe link of uitleg) —
      // de "je ontvangt een mail"-belofte ernaast is daar tegenstrijdig.
      const oefen = !!(data.resetLinkOefen || data.oefenOnbekend);
      setVergetenBericht(oefen ? '' : (data.bericht || 'Reset link verstuurd! Check je inbox én spam folder.'));
      setVergetenOk(true);
      setVergetenOefenLink(data.resetLinkOefen || '');
      setVergetenOefenOnbekend(!!data.oefenOnbekend);
    } catch (e) {
      setVergetenBericht(e.message || 'Geen verbinding met server. Probeer opnieuw.');
      setVergetenOk(false);
      setVergetenOefenLink('');
      setVergetenOefenOnbekend(false);
    } finally {
      setVergetenLaden(false);
    }
  }

  async function resetWachtwoord(e) {
    e.preventDefault();
    if (nieuwWachtwoord.length < 8) return setResetBericht('Wachtwoord moet minimaal 8 tekens bevatten.');
    setResetLaden(true);
    try {
      await apiFetch('/auth/wachtwoord-reset', {
        method: 'POST',
        body: { token: resetToken, nieuwWachtwoord },
      });
      setResetBericht('Wachtwoord gewijzigd! Je kunt nu inloggen.');
      setResetOk(true);
      setTimeout(() => setToonReset(false), 2000);
    } catch (e) {
      setResetBericht(e.message);
      setResetOk(false);
    } finally {
      setResetLaden(false);
    }
  }

  async function verifieer2FA(e) {
    e.preventDefault();
    setTwofaLaden(true);
    setTwofaFout('');
    try {
      // F7 fix (Cursor review): primair pendingToken sturen — userId blijft
      // mee voor backward-compat tijdens transitie (backend prefereert token).
      await apiFetch('/auth/2fa-verifieer', {
        method: 'POST',
        body: {
          ...(twofaPendingToken ? { pendingToken: twofaPendingToken } : {}),
          userId: twofaUserId,
          code: twofaCode,
        },
      });
      // Cookie is gezet — haal profiel op via /auth/me
      const profiel = await haalProfiel();
      naSuccesLogin(profiel);
    } catch (e) {
      setTwofaFout(e.message);
    } finally {
      setTwofaLaden(false);
    }
  }

  // ── 2FA code opnieuw laten sturen (dead-end-fix: code kwam niet aan / verliep) ──
  async function herverzendCode() {
    if (herverzendBezig || herverzendCooldown > 0) return;
    setHerverzendBezig(true);
    setHerverzendBericht('');
    setTwofaFout('');
    try {
      const data = await apiFetch('/auth/2fa-herverzend', {
        method: 'POST',
        body: { pendingToken: twofaPendingToken },
      });
      if (data?.pendingToken) setTwofaPendingToken(data.pendingToken);
      if (data?.codeOefen) setTwofaOefenCode(data.codeOefen); // SB LOKAAL
      setHerverzendBericht('Nieuwe code verstuurd. Check ook je spam-map.');
      // 30s cooldown tegen spam
      setHerverzendCooldown(30);
      const timer = setInterval(() => {
        setHerverzendCooldown((s) => {
          if (s <= 1) { clearInterval(timer); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      // Verlopen sessie → terug naar login i.p.v. dead-end
      if (e.errorCode === 'PENDING_TOKEN_INVALID') {
        setTwofaUserId(null);
        setTwofaPendingToken(null);
        setTwofaCode('');
        setFout('Je sessie is verlopen. Log opnieuw in.');
      } else {
        setTwofaFout(e.message);
      }
    } finally {
      setHerverzendBezig(false);
    }
  }

  // Wachten op bevestiging in de app (ING-model) ná de wachtwoordstap.
  if (bevestigingToken) {
    return (
      <InlogWachtOpApp
        bevestigingToken={bevestigingToken}
        onIngelogd={(profiel) => { setBevestigingToken(null); naSuccesLogin(profiel); }}
        onFallback={(d) => {
          setBevestigingToken(null);
          setTwofaUserId(d.userId);
          setTwofaPendingToken(d.pendingToken || null);
          setTwofaOefenCode(d.codeOefen || null); // SB LOKAAL
        }}
        onTerug={() => setBevestigingToken(null)}
      />
    );
  }

  // ── 2FA code invoeren ──
  // Koppel-aanbod ná een geslaagde volledige login (dit toestel onthouden).
  if (toonKoppel) {
    return (
      <DeviceLogin
        modus="koppelen"
        onGelukt={() => { onLogin(null, naProfiel); navigate(naDoel); }}
        onAnnuleer={() => { onLogin(null, naProfiel); navigate(naDoel); }}
      />
    );
  }

  // Snelle login op een gekoppeld toestel: 5-cijferige toegangscode (ING-stijl).
  if (apparaatStatus === 'gekoppeld' && !metWachtwoord && tab === 'login'
      && !twofaUserId && !toonReset && !toonVergeten) {
    return (
      <DeviceLogin
        modus="inloggen"
        apparaatNaam={apparaatNaam}
        onGelukt={(p) => { onLogin(null, p); navigate(next || '/app'); }}
        onAnderAccount={() => setMetWachtwoord(true)}
      />
    );
  }

  if (twofaUserId) {
    // Plak code uit klembord (Clipboard API)
    async function plakUitKlembord() {
      try {
        const tekst = await navigator.clipboard.readText();
        const cijfers = tekst.replace(/\D/g, '').slice(0, 6);
        if (cijfers.length >= 4) {
          setTwofaCode(cijfers);
          // Auto-submit als 6 cijfers
          if (cijfers.length === 6) {
            setTimeout(() => document.getElementById('twofa-form')?.requestSubmit(), 200);
          }
        } else {
          setTwofaFout('Geen geldige code in klembord (verwacht 6 cijfers)');
        }
      } catch (err) {
        setTwofaFout('Klembord lezen niet toegestaan. Plak handmatig met Ctrl+V.');
      }
    }

    return (
      <div className="min-h-screen bg-brand-hero flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-surface border border-border rounded-md shadow-soft p-6 space-y-4 animate-fade-up">
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-3">
              <Mail className="w-7 h-7 text-brand-600" />
            </div>
            <h2 className="font-display text-xl font-medium text-ink-1">Inlogcode</h2>
            <p className="text-ink-2 text-sm">We hebben een 6-cijferige code naar je e-mail gestuurd. Check ook spam folder.</p>
            {twofaOefenCode && (
              <div className="mt-3 text-sm rounded-md p-3 border text-ink-1 bg-surface-2 border-border">
                <p className="font-semibold mb-1">Oefenversie</p>
                <p>Er wordt hier geen echte e-mail verstuurd. Je code is: <strong className="font-mono tracking-widest">{twofaOefenCode}</strong></p>
              </div>
            )}
          </div>
          <form id="twofa-form" onSubmit={verifieer2FA} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              name="otp"
              value={twofaCode}
              onChange={(e) => {
                const code = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTwofaCode(code);
                // Auto-submit bij paste van 6 cijfers
                if (code.length === 6 && twofaCode.length < 6) {
                  setTimeout(() => document.getElementById('twofa-form')?.requestSubmit(), 100);
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const tekst = (e.clipboardData || window.clipboardData).getData('text');
                const cijfers = tekst.replace(/\D/g, '').slice(0, 6);
                setTwofaCode(cijfers);
                if (cijfers.length === 6) {
                  setTimeout(() => document.getElementById('twofa-form')?.requestSubmit(), 100);
                }
              }}
              placeholder="123456"
              required
              autoFocus
              className="w-full border border-border rounded-md px-4 py-4 text-center font-display text-3xl font-medium tabular-nums tracking-[0.5em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface"
            />
            <button
              type="button"
              onClick={plakUitKlembord}
              className="w-full bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold py-2.5 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
            >
              Plak code uit klembord
            </button>
            {twofaFout && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{twofaFout}</p>
            )}
            {herverzendBericht && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">{herverzendBericht}</p>
            )}
            <button type="submit" disabled={twofaLaden || twofaCode.length !== 6}
              className="btn-inst w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              {twofaLaden ? 'Bezig...' : 'Verifieer & inloggen'}
            </button>
            <button type="button" onClick={herverzendCode} disabled={herverzendBezig || herverzendCooldown > 0}
              className="w-full text-sm font-semibold text-brand-700 hover:underline underline-offset-4 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed">
              {herverzendBezig ? 'Bezig met versturen…'
                : herverzendCooldown > 0 ? `Opnieuw sturen kan over ${herverzendCooldown}s`
                : 'Geen code ontvangen? Stuur opnieuw'}
            </button>
            <button type="button" onClick={() => { setTwofaUserId(null); setTwofaPendingToken(null); setTwofaCode(''); setTwofaFout(''); setHerverzendBericht(''); }}
              className="w-full text-sm font-semibold text-brand-700 hover:underline underline-offset-4">
              ← Terug naar inloggen
            </button>
          </form>
          <div className="bg-brand-50 border border-brand-100 rounded-md p-2.5 text-[10px] text-brand-800 leading-snug">
            <strong>Tip:</strong> Op iPhone (iOS 12+) verschijnt de code automatisch boven het toetsenbord wanneer je deze in Mail ziet. Tap erop om in te vullen.
          </div>
        </div>
      </div>
    );
  }

  // ── Wachtwoord reset scherm ──
  if (toonReset) {
    return (
      <div className="min-h-screen bg-brand-hero flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-surface border border-border rounded-md shadow-soft p-6 space-y-4 animate-fade-up">
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-brand-600" />
            </div>
            <h2 className="font-display text-xl font-medium text-ink-1">Nieuw wachtwoord</h2>
            <p className="text-ink-2 text-sm">Kies een nieuw wachtwoord voor je account</p>
          </div>
          <form onSubmit={resetWachtwoord} className="space-y-4">
            <div className="relative">
              <input
                type={toonWachtwoord ? 'text' : 'password'} value={nieuwWachtwoord}
                onChange={e => setNieuwWachtwoord(e.target.value)}
                placeholder="Nieuw wachtwoord (min. 8 tekens)"
                minLength={8} required autoComplete="new-password"
                className="w-full border border-border rounded-md pl-4 pr-12 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface"
              />
              <button type="button" onClick={() => setToonWachtwoord(v => !v)} aria-pressed={toonWachtwoord}
                aria-label={toonWachtwoord ? t('wachtwoord_verbergen') : t('wachtwoord_tonen')}
                className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-ink-2 hover:text-brand-700">
                {toonWachtwoord ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
            {resetBericht && (
              <p className={`text-sm ${resetOk ? 'text-success-700' : 'text-red-500'}`}>{resetBericht}</p>
            )}
            <button type="submit" disabled={resetLaden}
              className="btn-inst w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              {resetLaden ? 'Bezig...' : 'Wachtwoord opslaan'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Wachtwoord vergeten scherm ──
  if (toonVergeten) {
    return (
      <div className="min-h-screen bg-brand-hero flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-surface border border-border rounded-md shadow-soft p-6 space-y-4 animate-fade-up">
          <button onClick={() => setToonVergeten(false)} className="text-sm font-semibold text-brand-700 hover:underline underline-offset-4">← Terug</button>
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-3">
              <Mail className="w-7 h-7 text-brand-600" />
            </div>
            <h2 className="font-display text-xl font-medium text-ink-1">Wachtwoord vergeten</h2>
            <p className="text-ink-2 text-sm">Voer je e-mailadres in — je ontvangt een reset link</p>
          </div>
          <form onSubmit={stuurResetLink} className="space-y-4">
            <input
              type="email" value={vergetenEmail}
              onChange={e => setVergetenEmail(e.target.value)}
              placeholder="jouw@email.nl" required
              className="w-full border border-border rounded-md px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface"
            />
            {vergetenBericht && (
              <p className={`text-sm rounded-md p-3 border ${
                vergetenOk
                  ? 'text-success-700 bg-success-50 border-success-100'
                  : 'text-red-600 bg-red-50 border-red-200'
              }`}>{vergetenBericht}</p>
            )}
            {vergetenOefenLink && (
              <div className="text-sm rounded-md p-3 border text-ink-1 bg-surface-2 border-border">
                <p className="font-semibold mb-1">Oefenversie</p>
                <p className="mb-2">Er wordt hier geen echte e-mail verstuurd. Stel je wachtwoord direct opnieuw in:</p>
                <a href={vergetenOefenLink}
                  className="inline-block font-semibold text-brand-700 underline underline-offset-4">
                  Wachtwoord opnieuw instellen
                </a>
              </div>
            )}
            {vergetenOefenOnbekend && (
              <div className="text-sm rounded-md p-3 border text-ink-1 bg-surface-2 border-border">
                <p className="font-semibold mb-1">Oefenversie</p>
                <p>Dit e-mailadres heeft in deze oefenomgeving nog geen account, dus er komt geen mail. Maak eerst een account aan via Registreren — dat werkt hier direct, zonder e-mailcode.</p>
              </div>
            )}
            <button type="submit" disabled={vergetenLaden}
              className="btn-inst w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              {vergetenLaden ? 'Bezig...' : 'Stuur reset link'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-hero flex items-center justify-center px-4 py-10 relative">
      <div className="absolute top-4 right-4"><TaalKiezer donker /></div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-white">
            <Zap className="w-10 h-10 text-accent-400" />
            <div className="text-left">
              <div className="font-display text-2xl font-medium">
                SwiftBridge{form.accountType === 'zakelijk' && <span className="text-accent-400"> {t('login_portaal_zakelijk')}</span>}
              </div>
              <div className="text-blue-200 text-xs">{t('slogan')}</div>
            </div>
          </button>
        </div>

        {/* Portaalkeuze (verzoek Aydin 16-9): één duidelijke ingang voor particulier en
            voor zakelijk, bij inloggen én registreren. Het account bepaalt daarna
            zelf wat je ziet; de keuze stuurt registratie en de zakelijke aanvraag. */}
        <div className="flex mb-3 rounded-md bg-white/10 p-1" role="group" aria-label={t('login_portaal_keuze')}>
          {[['particulier', t('login_portaal_particulier')], ['zakelijk', t('login_portaal_zakelijk')]].map(([waarde, label]) => (
            <button key={waarde} type="button" onClick={() => update('accountType', waarde)}
              aria-pressed={form.accountType === waarde}
              className={`flex-1 min-h-[44px] rounded text-sm font-semibold transition-colors
                ${form.accountType === waarde ? 'bg-white text-brand-700' : 'text-white/80 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-md shadow-soft overflow-hidden">
          <div className="flex">
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setAkkoordFout(false); }}
                className={`flex-1 py-4 text-[0.7rem] font-medium uppercase tracking-[0.2em] transition
                  ${tab === t ? 'text-brand-700 border-b-2 border-brand-600' : 'text-gray-500 hover:text-ink-2'}`}>
                {t === 'login' ? 'Inloggen' : 'Registreren'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            {tab === 'register' && (
              <>
                {/* P1 (plan Aydin): de Particulier/Zakelijk-keuze staat nu bovenaan (portaalkeuze) */}
                {form.accountType === 'zakelijk' && (
                  <>
                    <div>
                      <label htmlFor="reg-bedrijf" className="block text-xs font-semibold text-ink-2 mb-1">Bedrijfsnaam</label>
                      <input id="reg-bedrijf" name="bedrijfsnaam" autoComplete="organization" value={form.bedrijfsnaam}
                        onChange={e => update('bedrijfsnaam', e.target.value)} placeholder="Voorbeeld B.V." required
                        className="w-full border border-border rounded-md px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface" />
                    </div>
                    <div>
                      <label htmlFor="reg-kvk" className="block text-xs font-semibold text-ink-2 mb-1">KvK-nummer</label>
                      <input id="reg-kvk" name="kvkNummer" inputMode="numeric" value={form.kvkNummer}
                        onChange={e => update('kvkNummer', e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="12345678" required minLength={8} maxLength={8}
                        className="w-full border border-border rounded-md px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface font-mono tracking-widest" />
                      <p className="text-[11px] text-gray-500 mt-1">8 cijfers — we controleren dit later bij de bedrijfsverificatie (KvK-uittreksel + ID van de tekenbevoegde).</p>
                    </div>
                  </>
                )}
                <div>
                  <label htmlFor="reg-naam" className="block text-xs font-semibold text-ink-2 mb-1">
                    {form.accountType === 'zakelijk' ? 'Naam contactpersoon' : 'Volledige naam'}
                  </label>
                  <input id="reg-naam" name="naam" autoComplete="name" value={form.naam} onChange={e => update('naam', e.target.value)}
                    placeholder="Naam" required
                    className="w-full border border-border rounded-md px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface" />
                </div>
                <div>
                  <label htmlFor="reg-telefoon" className="block text-xs font-semibold text-ink-2 mb-1">Telefoonnummer</label>
                  <input id="reg-telefoon" name="telefoon" autoComplete="tel" value={form.telefoon} onChange={e => update('telefoon', e.target.value)}
                    placeholder="+31 6 12345678" type="tel"
                    className="w-full border border-border rounded-md px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface" />
                </div>
                <div>
                  <label htmlFor="reg-ref" className="block text-xs font-semibold text-ink-2 mb-1">
                    {t('registreer_referral_label')}
                  </label>
                  <input
                    id="reg-ref"
                    name="referralCode"
                    autoComplete="off"
                    value={form.referralCode}
                    onChange={e => update('referralCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
                    placeholder={t('registreer_referral_placeholder')}
                    maxLength={12}
                    className={`w-full border rounded-md px-4 py-3 text-sm outline-none font-mono tracking-widest bg-surface focus:ring-2 focus:ring-brand-100 ${
                      refValidatie.status === 'geldig'
                        ? 'border-success-500 bg-success-50'
                        : refValidatie.status === 'ongeldig'
                        ? 'border-red-300 bg-red-50'
                        : 'border-border focus:border-brand-500'
                    }`}
                  />
                  {refValidatie.status === 'bezig' && (
                    <p className="text-[11px] text-gray-500 mt-1">{t('registreer_referral_check')}</p>
                  )}
                  {refValidatie.status === 'geldig' && (
                    <p className="text-[11px] text-success-700 mt-1 font-semibold">
                      {t('registreer_referral_geldig', { naam: refValidatie.uitnodigerNaam })}
                    </p>
                  )}
                  {refValidatie.status === 'ongeldig' && form.referralCode && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {t('registreer_referral_ongeldig')}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-ink-2 mb-1">E-mailadres</label>
              <input id="auth-email" name="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="naam@email.nl" type="email" required
                className="w-full border border-border rounded-md px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface" />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-ink-2 mb-1">Wachtwoord</label>
              <div className="relative">
                <input id="auth-password" name="password" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={e => update('password', e.target.value)}
                  placeholder="••••••••" type={toonWachtwoord ? 'text' : 'password'} required minLength={8}
                  aria-describedby={tab === 'register' ? 'pw-hint' : undefined}
                  className="w-full border border-border rounded-md pl-4 pr-12 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface" />
                <button type="button" onClick={() => setToonWachtwoord(v => !v)} aria-pressed={toonWachtwoord}
                  aria-label={toonWachtwoord ? t('wachtwoord_verbergen') : t('wachtwoord_tonen')}
                  aria-controls="auth-password"
                  className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-ink-2 hover:text-brand-700">
                  {toonWachtwoord ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
              {tab === 'register' && form.password && (() => {
                const s = wachtwoordSterkte(form.password);
                return (
                  <div id="pw-hint" className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${s.kleur}`} style={{ width: `${s.pct}%` }} />
                    </div>
                    <p className={`text-[11px] mt-1 font-medium ${s.tekst}`}>{s.label}</p>
                  </div>
                );
              })()}
              {tab === 'register' && !form.password && (
                <p id="pw-hint" className="text-xs text-gray-500 mt-1">Hoofdletter, cijfer en 10+ tekens</p>
              )}
            </div>

            {tab === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => setToonVergeten(true)}
                  className="text-sm font-semibold text-brand-700 hover:underline underline-offset-4">
                  Wachtwoord vergeten?
                </button>
              </div>
            )}

            {tab === 'register' && (() => {
              // Talen met leesteken aan het eind (EN/RU: ".") zonder spatie ervoor
              const na = t('register_akkoord_na');
              return (
                <div>
                  <div className="flex items-start gap-3 min-h-[44px] py-1">
                    <input id="reg-akkoord" name="voorwaardenAkkoord" type="checkbox" checked={akkoord}
                      onChange={e => { setAkkoord(e.target.checked); if (e.target.checked) setAkkoordFout(false); }}
                      aria-invalid={akkoordFout || undefined}
                      aria-describedby={akkoordFout ? 'reg-akkoord-fout' : undefined}
                      className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded cursor-pointer accent-brand-600 ${akkoordFout ? 'outline outline-2 outline-offset-2 outline-red-500' : ''}`} />
                    <label htmlFor="reg-akkoord" className="text-sm text-ink-1 leading-snug cursor-pointer">
                      {t('register_akkoord_voor')}{' '}
                      <Link to="/voorwaarden" target="_blank" rel="noopener noreferrer"
                        className="font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-600">
                        {t('link_voorwaarden')}
                      </Link>{' '}
                      {t('register_akkoord_en')}{' '}
                      <Link to="/privacy" target="_blank" rel="noopener noreferrer"
                        className="font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-600">
                        {t('link_privacy')}
                      </Link>
                      {/^[.,;:!?]/.test(na) ? '' : ' '}{na}
                    </label>
                  </div>
                  {akkoordFout && (
                    <p id="reg-akkoord-fout" role="alert" className="text-xs font-semibold text-red-600 mt-1">
                      {t('register_akkoord_verplicht')}
                    </p>
                  )}
                </div>
              );
            })()}

            {fout && (
              <div role="alert" aria-live="assertive" className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-md flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /><span>{fout}</span>
              </div>
            )}

            <button type="submit" disabled={laden}
              className="btn-inst w-full py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {laden ? 'Bezig...' : tab === 'login' ? 'Inloggen' : 'Account aanmaken'}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          {t('beveiligd_via_jwt')}
        </p>
      </div>
    </div>
  );
}

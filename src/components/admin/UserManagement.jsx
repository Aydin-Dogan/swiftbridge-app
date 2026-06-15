/**
 * UserManagement.jsx — Admin user management tab
 *
 * Functionaliteit:
 * - Zoek users op email / naam / telefoon (300ms debounce)
 * - Paginatie via offset/limit
 * - Klik op user → details drawer (rechts) met tabs: Profiel / Transacties / KYC / Audit / Acties
 * - Acties: KYC status wijzigen, account suspenderen/heractiveren, wachtwoord reset triggeren
 * - Bevestigings-modals voor destructieve acties
 *
 * Backend endpoints:
 * GET /admin/users?q=&limit=&offset=
 * GET /admin/users/:id
 * PATCH /admin/users/:id/kyc-status
 * PATCH /admin/users/:id/status
 * POST /admin/users/:id/wachtwoord-reset
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, parseError } from '../../services/api';
import { useTaal } from '../../i18n';
import {
  User, Banknote, IdCard, Clipboard, Settings, XCircle, CheckCircle, Lock, Search, X, Check,
} from '../icons/Icons';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function fmtDatum(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function shortId(id) {
  if (!id) return '—';
  return String(id).slice(0, 8) + '…';
}

// ── Status badges ─────────────────────────────────────────────────────────────
function KycBadge({ status }) {
  const map = {
    goedgekeurd: 'bg-success-50 border-success-100 text-success-700',
    afgekeurd: 'bg-red-100 border-red-200 text-red-700',
    in_behandeling: 'bg-accent-400/15 border-accent-400/30 text-accent-600',
    niet_ingediend: 'bg-surface-3 border-border text-ink-2',
  };
  const cls = map[status] || map.niet_ingediend;
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${cls}`}>
      {status || 'niet_ingediend'}
    </span>
  );
}

function AccountBadge({ status }) {
  const map = {
    actief: 'bg-success-50 border-success-100 text-success-700',
    gesuspendeerd: 'bg-red-100 border-red-200 text-red-700',
    verwijderd: 'bg-surface-3 border-border text-ink-2',
  };
  const cls = map[status] || map.actief;
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${cls}`}>
      {status || 'actief'}
    </span>
  );
}

// ── BevestigingsModal ────────────────────────────────────────────────────────
function BevestigingsModal({ titel, beschrijving, knopLabel, knopKleur = 'bg-red-600 hover:bg-red-700', velden = [], onBevestig, onAnnuleer, bezig }) {
  const [values, setValues] = useState({});

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-md p-6 max-w-md w-full shadow-soft-xl">
        <h3 className="font-display text-lg font-medium text-ink-1 mb-2">{titel}</h3>
        <p className="text-sm text-ink-2 mb-4">{beschrijving}</p>

        {velden.map((v) => (
          <div key={v.naam} className="mb-3">
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">{v.label}</label>
            {v.type === 'select' ? (
              <select
                value={values[v.naam] || v.default || ''}
                onChange={(e) => setValues({ ...values, [v.naam]: e.target.value })}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
              >
                {v.opties.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={v.type || 'text'}
                value={values[v.naam] || ''}
                placeholder={v.placeholder || ''}
                onChange={(e) => setValues({ ...values, [v.naam]: e.target.value })}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
              />
            )}
          </div>
        ))}

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onAnnuleer}
            disabled={bezig}
            className="px-4 py-2 rounded-md bg-surface border border-border text-sm text-ink-1 hover:bg-surface-3 transition disabled:opacity-40"
          >
            Annuleer
          </button>
          <button
            onClick={() => {
              const final = {};
              for (const v of velden) {
                final[v.naam] = values[v.naam] || v.default || '';
              }
              onBevestig(final);
            }}
            disabled={bezig}
            className={`px-4 py-2 rounded-md text-sm text-white font-semibold transition disabled:opacity-40 ${knopKleur}`}
          >
            {bezig ? 'Bezig…' : knopLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User Detail Drawer ───────────────────────────────────────────────────────
function UserDetailDrawer({ userId, onClose, onUserUpdated }) {
  const { t } = useTaal();
  const [data, setData] = useState(null);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [tab, setTab] = useState('profiel');
  const [modal, setModal] = useState(null); // { soort: 'kyc'|'status'|'reset' }
  const [actieBezig, setActieBezig] = useState(false);
  const [actieMelding, setActieMelding] = useState(null); // {soort:'ok'|'fout', tekst}

  const laad = useCallback(async () => {
    if (!userId) return;
    setLaden(true); setFout('');
    try {
      const d = await apiFetch(`/admin/users/${userId}`);
      setData(d);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [userId, t]);

  useEffect(() => { laad(); }, [laad]);

  if (!userId) return null;

  const u = data?.user;

  async function bevestigKyc(vals) {
    setActieBezig(true);
    try {
      await apiFetch(`/admin/users/${userId}/kyc-status`, {
        method: 'PATCH',
        body: { status: vals.status, reden: vals.reden },
      });
      setActieMelding({ soort: 'ok', tekst: `KYC status gewijzigd naar ${vals.status}` });
      setModal(null);
      await laad();
      onUserUpdated?.();
    } catch (e) {
      setActieMelding({ soort: 'fout', tekst: parseError(e, t) });
    } finally {
      setActieBezig(false);
    }
  }

  async function bevestigStatus(vals) {
    setActieBezig(true);
    try {
      await apiFetch(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: { status: vals.status, reden: vals.reden },
      });
      setActieMelding({ soort: 'ok', tekst: `Account ${vals.status === 'gesuspendeerd' ? 'gesuspendeerd' : 'geactiveerd'}` });
      setModal(null);
      await laad();
      onUserUpdated?.();
    } catch (e) {
      setActieMelding({ soort: 'fout', tekst: parseError(e, t) });
    } finally {
      setActieBezig(false);
    }
  }

  async function bevestigReset() {
    setActieBezig(true);
    try {
      await apiFetch(`/admin/users/${userId}/wachtwoord-reset`, { method: 'POST', body: {} });
      setActieMelding({ soort: 'ok', tekst: 'Reset e-mail verstuurd (1u geldig)' });
      setModal(null);
    } catch (e) {
      setActieMelding({ soort: 'fout', tekst: parseError(e, t) });
    } finally {
      setActieBezig(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-surface border-l border-border shadow-soft-xl overflow-y-auto">
        <div className="sticky top-0 bg-surface/95 backdrop-blur-lg border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500">User detail</div>
            <div className="font-display font-medium text-ink-1">{u?.naam || 'Laden…'}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-ink-1"><X className="w-6 h-6" /></button>
        </div>

        {laden && <div className="p-8 text-center text-ink-2">Laden…</div>}
        {fout && <div className="m-5 bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{fout}</div>}

        {!laden && !fout && u && (
          <>
            {actieMelding && (
              <div className={`m-5 rounded-md p-3 text-sm border ${
                actieMelding.soort === 'ok'
                  ? 'bg-success-50 border-success-100 text-success-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {actieMelding.tekst}
              </div>
            )}

            <div className="px-5 pt-4 flex gap-1 overflow-x-auto border-b border-border">
              {[
                { id: 'profiel', label: 'Profiel', icoon: User },
                { id: 'transacties',label: 'Transacties', icoon: Banknote },
                { id: 'kyc', label: 'KYC', icoon: IdCard },
                { id: 'audit', label: 'Audit', icoon: Clipboard },
                { id: 'acties', label: 'Acties', icoon: Settings },
              ].map((tt) => (
                <button
                  key={tt.id}
                  onClick={() => setTab(tt.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 text-[0.7rem] font-medium uppercase tracking-[0.16em] whitespace-nowrap transition border-b-2 -mb-px ${
                    tab === tt.id ? 'text-brand-700 border-brand-500' : 'text-gray-500 border-transparent hover:text-ink-1'
                  }`}
                >
                  {tt.icoon && <tt.icoon className="w-4 h-4" />}<span>{tt.label}</span>
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {tab === 'profiel' && (
                <div className="space-y-3 text-sm text-ink-1">
                  <div className="grid grid-cols-2 gap-3">
                    <Veld label="Naam" waarde={u.naam} />
                    <Veld label="Email" waarde={u.email} mono />
                    <Veld label="Telefoon" waarde={u.telefoon || '—'} mono />
                    <Veld label="Taal" waarde={u.taal || '—'} />
                    <Veld label="KYC status" waarde={<KycBadge status={u.kycStatus} />} />
                    <Veld label="Account status" waarde={<AccountBadge status={u.accountStatus} />} />
                    <Veld label="2FA" waarde={u.twofaIngeschakeld ? 'Ingeschakeld' : 'Uitgeschakeld'} />
                    <Veld label="WhatsApp opt-in" waarde={u.whatsappOptIn ? 'Ja' : 'Nee'} />
                    <Veld label="Aangemeld" waarde={fmtDatum(u.aangemeldOp)} />
                    <Veld label="Eerste login" waarde={fmtDatum(u.eersteLogin)} />
                    <Veld label="Laatste login" waarde={fmtDatum(u.laatsteLogin)} />
                    <Veld label="Push subs" waarde={String(data.pushSubscriptions || 0)} />
                  </div>

                  <div className="bg-surface-3 border border-border rounded-md p-3">
                    <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-2">Adres</div>
                    <div className="text-sm text-ink-2">
                      {[u.adres?.straat, u.adres?.huisnummer].filter(Boolean).join(' ') || '—'}<br />
                      {[u.adres?.postcode, u.adres?.stad].filter(Boolean).join(' ') || '—'}<br />
                      {u.adres?.land || '—'}
                    </div>
                  </div>

                  <div className="bg-surface-3 border border-border rounded-md p-3">
                    <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-2">iDIN</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-ink-2">
                      <div>Status: <span className="font-mono">{u.idin?.status || '—'}</span></div>
                      <div>Bank: <span className="font-mono">{u.idin?.bank || '—'}</span></div>
                      <div>Geverifieerd: {fmtDatum(u.idin?.geverifieerdOp)}</div>
                      <div>Geboortedatum: <span className="font-mono">{u.idin?.geboortedatum || '—'}</span></div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 font-mono">ID: {u.id}</div>
                </div>
              )}

              {tab === 'transacties' && (
                <div>
                  {data.transacties.length === 0 ? (
                    <div className="text-center text-ink-2 py-8">Geen transacties</div>
                  ) : (
                    <div className="bg-surface border border-border rounded-md overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-surface-3 border-b border-border">
                          <tr className="text-left text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500">
                            <th className="px-3 py-2">Ref</th>
                            <th className="px-3 py-2 text-right">EUR</th>
                            <th className="px-3 py-2 text-right">TRY</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Datum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {data.transacties.map((tr) => (
                            <tr key={tr.id} className="hover:bg-surface-3">
                              <td className="px-3 py-2 font-mono text-ink-2">{tr.referentieNr || shortId(tr.id)}</td>
                              <td className="px-3 py-2 text-right text-ink-1 tabular-nums">{fmtEur(tr.eurBedrag)}</td>
                              <td className="px-3 py-2 text-right text-ink-2 tabular-nums">{new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(tr.tryBedrag)}</td>
                              <td className="px-3 py-2">
                                <span className="inline-block bg-surface-3 text-ink-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border">{tr.status}</span>
                              </td>
                              <td className="px-3 py-2 text-ink-2">{fmtDatum(tr.aangemaaktOp)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'kyc' && (
                <div>
                  {data.kycRecords.length === 0 ? (
                    <div className="text-center text-ink-2 py-8">Geen KYC records</div>
                  ) : (
                    <div className="space-y-3">
                      {data.kycRecords.map((k) => (
                        <div key={k.id} className="bg-surface-3 border border-border rounded-md p-3 text-sm text-ink-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold">{k.documentType} · <span className="font-mono text-xs">{k.documentNummer}</span></div>
                              <div className="text-xs text-ink-2 mt-0.5">Geboortedatum: {k.geboortedatum} · {k.nationaliteit}</div>
                            </div>
                            <KycBadge status={k.status} />
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Ingediend: {fmtDatum(k.ingediendOp)}
                            {k.beoordeeldOp && <> · Beoordeeld: {fmtDatum(k.beoordeeldOp)}</>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'audit' && (
                <div>
                  {data.auditLogs.length === 0 ? (
                    <div className="text-center text-ink-2 py-8">Geen audit logs</div>
                  ) : (
                    <div className="space-y-2">
                      {data.auditLogs.map((l) => (
                        <div key={l.id} className="bg-surface-3 border border-border rounded-md p-3 text-xs text-ink-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-block bg-surface text-ink-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border">{l.actie}</span>
                            <span className="text-gray-500">{fmtDatum(l.aangemaaktOp)}</span>
                          </div>
                          {l.ipAdres && <div className="text-gray-500 font-mono text-[10px] mt-1">IP: {l.ipAdres}</div>}
                          {Object.keys(l.details || {}).length > 0 && (
                            <pre className="text-[10px] text-ink-2 mt-2 bg-surface rounded p-2 overflow-x-auto">
                              {JSON.stringify(l.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'acties' && (
                <div className="space-y-3">
                  <ActieKaart
                    icoon={IdCard}
                    titel="KYC status wijzigen"
                    beschrijving="Manueel goedkeuren, afkeuren of terugzetten naar in behandeling. Genereert een email naar de gebruiker."
                    knop="KYC wijzigen"
                    onClick={() => setModal({ soort: 'kyc' })}
                  />
                  {u.accountStatus !== 'gesuspendeerd' ? (
                    <ActieKaart
                      icoon={XCircle}
                      titel="Account suspenderen"
                      beschrijving="Blokkeer toegang. Refresh tokens worden ingetrokken, gebruiker wordt geforceerd uitgelogd."
                      knop="Suspenderen"
                      knopKleur="bg-red-600 hover:bg-red-700"
                      onClick={() => setModal({ soort: 'suspend' })}
                    />
                  ) : (
                    <ActieKaart
                      icoon={CheckCircle}
                      titel="Account heractiveren"
                      beschrijving="Hef de blokkade op. Gebruiker kan weer inloggen."
                      knop="Activeren"
                      knopKleur="bg-success-600 hover:bg-success-700"
                      onClick={() => setModal({ soort: 'activate' })}
                    />
                  )}
                  <ActieKaart
                    icoon={Lock}
                    titel="Wachtwoord reset forceren"
                    beschrijving="Stuur een 1-uur geldige reset link naar het e-mailadres van de gebruiker."
                    knop="Reset triggeren"
                    knopKleur="bg-brand-600 hover:bg-brand-700"
                    onClick={() => setModal({ soort: 'reset' })}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {modal?.soort === 'kyc' && (
        <BevestigingsModal
          titel="KYC status wijzigen"
          beschrijving="Selecteer een nieuwe status. De gebruiker krijgt een notificatie e-mail."
          knopLabel="Bevestigen"
          knopKleur="bg-accent-600 hover:bg-accent-500"
          velden={[
            {
              naam: 'status', label: 'Nieuwe status', type: 'select',
              default: 'goedgekeurd',
              opties: [
                { id: 'goedgekeurd', label: 'Goedgekeurd' },
                { id: 'afgekeurd', label: 'Afgekeurd' },
                { id: 'in_behandeling', label: 'In behandeling' },
              ],
            },
            { naam: 'reden', label: 'Reden (optioneel)', placeholder: 'Bijv. document onleesbaar' },
          ]}
          onBevestig={bevestigKyc}
          onAnnuleer={() => setModal(null)}
          bezig={actieBezig}
        />
      )}

      {modal?.soort === 'suspend' && (
        <BevestigingsModal
          titel="Account suspenderen"
          beschrijving={`Weet je zeker dat je het account van ${u?.naam || u?.email} wilt suspenderen? De gebruiker wordt uitgelogd en kan niet meer inloggen.`}
          knopLabel="Ja, suspenderen"
          knopKleur="bg-red-600 hover:bg-red-700"
          velden={[
            { naam: 'reden', label: 'Reden', placeholder: 'Bijv. verdachte activiteit' },
          ]}
          onBevestig={(vals) => bevestigStatus({ status: 'gesuspendeerd', reden: vals.reden })}
          onAnnuleer={() => setModal(null)}
          bezig={actieBezig}
        />
      )}

      {modal?.soort === 'activate' && (
        <BevestigingsModal
          titel="Account heractiveren"
          beschrijving={`Account van ${u?.naam || u?.email} weer activeren?`}
          knopLabel="Ja, activeren"
          knopKleur="bg-success-600 hover:bg-success-700"
          velden={[
            { naam: 'reden', label: 'Reden (optioneel)', placeholder: 'Bijv. probleem opgelost' },
          ]}
          onBevestig={(vals) => bevestigStatus({ status: 'actief', reden: vals.reden })}
          onAnnuleer={() => setModal(null)}
          bezig={actieBezig}
        />
      )}

      {modal?.soort === 'reset' && (
        <BevestigingsModal
          titel="Wachtwoord reset forceren"
          beschrijving={`Stuur een reset e-mail naar ${u?.email}? De gebruiker kan zijn wachtwoord wijzigen via de link (1 uur geldig).`}
          knopLabel="Ja, verstuur reset link"
          knopKleur="bg-brand-600 hover:bg-brand-700"
          velden={[]}
          onBevestig={bevestigReset}
          onAnnuleer={() => setModal(null)}
          bezig={actieBezig}
        />
      )}
    </>
  );
}

function Veld({ label, waarde, mono }) {
  return (
    <div>
      <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500">{label}</div>
      <div className={`text-sm text-ink-1 ${mono ? 'font-mono' : ''}`}>{waarde}</div>
    </div>
  );
}

function ActieKaart({ icoon: Icoon, titel, beschrijving, knop, knopKleur = 'bg-accent-600 hover:bg-accent-500', onClick }) {
  return (
    <div className="bg-surface-3 border border-border rounded-md p-4">
      <div className="flex items-start gap-3">
        {Icoon && <Icoon className="w-7 h-7 text-gray-500 flex-shrink-0" />}
        <div className="flex-1">
          <div className="font-display font-medium text-ink-1">{titel}</div>
          <div className="text-xs text-ink-2 mt-1">{beschrijving}</div>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`mt-3 ${knopKleur} text-white text-sm font-semibold px-4 py-2 rounded-md transition`}
      >
        {knop}
      </button>
    </div>
  );
}

// ── Hoofdcomponent ───────────────────────────────────────────────────────────
export default function UserManagement() {
  const { t } = useTaal();
  const [zoekterm, setZoekterm] = useState('');
  const [users, setUsers] = useState([]);
  const [totaal, setTotaal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');
  const [actieveUser, setActieveUser] = useState(null);
  const limit = 20;
  const debounceRef = useRef(null);

  const laad = useCallback(async (q, off) => {
    setLaden(true); setFout('');
    try {
      const qs = new URLSearchParams({ limit: String(limit), offset: String(off) });
      if (q) qs.set('q', q);
      const data = await apiFetch(`/admin/users?${qs.toString()}`);
      setUsers(data.users || []);
      setTotaal(data.totaal || 0);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [t]);

  // Debounce zoekterm (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      laad(zoekterm, offset);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [zoekterm, offset, laad]);

  const pagina = Math.floor(offset / limit) + 1;
  const aantalPaginas = Math.max(1, Math.ceil(totaal / limit));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <input
            type="text"
            value={zoekterm}
            onChange={(e) => { setZoekterm(e.target.value); setOffset(0); }}
            placeholder="Zoek op email, naam of telefoon…"
            className="w-full bg-surface border border-border rounded-md pl-10 pr-3 py-2.5 text-sm text-ink-1 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search className="w-4 h-4" /></span>
        </div>
        <div className="text-xs text-ink-2 tabular-nums">
          {totaal} resultaten · pagina {pagina} / {aantalPaginas}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0 || laden}
          className="px-3 py-2 rounded-md bg-surface border border-border text-sm text-ink-1 disabled:opacity-40 hover:bg-surface-3 transition"
        >
          ← Vorige
        </button>
        <button
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= totaal || laden}
          className="px-3 py-2 rounded-md bg-surface border border-border text-sm text-ink-1 disabled:opacity-40 hover:bg-surface-3 transition"
        >
          Volgende →
        </button>
      </div>

      {fout && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{fout}</div>}

      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-3 border-b border-border">
              <tr className="text-left text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Naam</th>
                <th className="px-4 py-3">Telefoon</th>
                <th className="px-4 py-3">KYC</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3 text-right">TX</th>
                <th className="px-4 py-3">2FA</th>
                <th className="px-4 py-3">Aangemeld</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {laden ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-ink-2">Laden…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-ink-2">Geen gebruikers gevonden</td></tr>
              ) : users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setActieveUser(u.id)}
                  className="hover:bg-surface-3 transition cursor-pointer"
                >
                  <td className="px-4 py-3 text-xs text-ink-1 font-mono">{u.email}</td>
                  <td className="px-4 py-3 text-ink-1">{u.naam}</td>
                  <td className="px-4 py-3 text-xs text-ink-2 font-mono">{u.telefoon || '—'}</td>
                  <td className="px-4 py-3"><KycBadge status={u.kycStatus} /></td>
                  <td className="px-4 py-3"><AccountBadge status={u.accountStatus} /></td>
                  <td className="px-4 py-3 text-right text-ink-2 tabular-nums">{u.aantalTransacties}</td>
                  <td className="px-4 py-3 text-xs text-ink-2">{u.twofaIngeschakeld ? <Check className="w-4 h-4 text-success-600" /> : '—'}</td>
                  <td className="px-4 py-3 text-xs text-ink-2">{fmtDatum(u.aangemeldOp)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-gray-500 hover:text-ink-1 text-sm">→</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Klik op een rij om alle gegevens van die gebruiker te bekijken en beheeracties uit te voeren.
      </div>

      {actieveUser && (
        <UserDetailDrawer
          userId={actieveUser}
          onClose={() => setActieveUser(null)}
          onUserUpdated={() => laad(zoekterm, offset)}
        />
      )}
    </div>
  );
}

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
    goedgekeurd: 'bg-green-500/20 border-green-300/30 text-green-200',
    afgekeurd: 'bg-red-500/20 border-red-300/30 text-red-200',
    in_behandeling: 'bg-amber-500/20 border-amber-300/30 text-amber-200',
    niet_ingediend: 'bg-white/10 border-white/20 text-white/60',
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
    actief: 'bg-green-500/20 border-green-300/30 text-green-200',
    gesuspendeerd: 'bg-red-500/20 border-red-300/30 text-red-200',
    verwijderd: 'bg-gray-500/20 border-gray-300/30 text-gray-200',
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
      <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">{titel}</h3>
        <p className="text-sm text-white/70 mb-4">{beschrijving}</p>

        {velden.map((v) => (
          <div key={v.naam} className="mb-3">
            <label className="block text-xs font-semibold text-white/80 mb-1">{v.label}</label>
            {v.type === 'select' ? (
              <select
                value={values[v.naam] || v.default || ''}
                onChange={(e) => setValues({ ...values, [v.naam]: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {v.opties.map((o) => (
                  <option key={o.id} value={o.id} className="text-gray-900">{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={v.type || 'text'}
                value={values[v.naam] || ''}
                placeholder={v.placeholder || ''}
                onChange={(e) => setValues({ ...values, [v.naam]: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            )}
          </div>
        ))}

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onAnnuleer}
            disabled={bezig}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white hover:bg-white/20 transition disabled:opacity-40"
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
            className={`px-4 py-2 rounded-xl text-sm text-white font-semibold transition disabled:opacity-40 ${knopKleur}`}
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
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-slate-900 border-l border-white/10 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-lg border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50">User detail</div>
            <div className="font-bold text-white">{u?.naam || 'Laden…'}</div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        {laden && <div className="p-8 text-center text-white/60">Laden…</div>}
        {fout && <div className="m-5 bg-red-500/10 border border-red-300/30 text-red-100 rounded-2xl p-3 text-sm">{fout}</div>}

        {!laden && !fout && u && (
          <>
            {actieMelding && (
              <div className={`m-5 rounded-2xl p-3 text-sm border ${
                actieMelding.soort === 'ok'
                  ? 'bg-green-500/10 border-green-300/30 text-green-100'
                  : 'bg-red-500/10 border-red-300/30 text-red-100'
              }`}>
                {actieMelding.tekst}
              </div>
            )}

            <div className="px-5 pt-4 flex gap-1 overflow-x-auto border-b border-white/10">
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
                  className={`relative flex items-center gap-2 px-3 py-2 text-sm font-semibold whitespace-nowrap transition rounded-t-xl ${
                    tab === tt.id ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tt.icoon && <tt.icoon className="w-4 h-4" />}<span>{tt.label}</span>
                  {tab === tt.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {tab === 'profiel' && (
                <div className="space-y-3 text-sm text-white/90">
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

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-xs font-semibold text-white/60 mb-2">Adres</div>
                    <div className="text-sm text-white/80">
                      {[u.adres?.straat, u.adres?.huisnummer].filter(Boolean).join(' ') || '—'}<br />
                      {[u.adres?.postcode, u.adres?.stad].filter(Boolean).join(' ') || '—'}<br />
                      {u.adres?.land || '—'}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-xs font-semibold text-white/60 mb-2">iDIN</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-white/80">
                      <div>Status: <span className="font-mono">{u.idin?.status || '—'}</span></div>
                      <div>Bank: <span className="font-mono">{u.idin?.bank || '—'}</span></div>
                      <div>Geverifieerd: {fmtDatum(u.idin?.geverifieerdOp)}</div>
                      <div>Geboortedatum: <span className="font-mono">{u.idin?.geboortedatum || '—'}</span></div>
                    </div>
                  </div>

                  <div className="text-xs text-white/40 font-mono">ID: {u.id}</div>
                </div>
              )}

              {tab === 'transacties' && (
                <div>
                  {data.transacties.length === 0 ? (
                    <div className="text-center text-white/50 py-8">Geen transacties</div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-white/10">
                          <tr className="text-left text-white/80">
                            <th className="px-3 py-2">Ref</th>
                            <th className="px-3 py-2 text-right">EUR</th>
                            <th className="px-3 py-2 text-right">TRY</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Datum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {data.transacties.map((tr) => (
                            <tr key={tr.id} className="hover:bg-white/5">
                              <td className="px-3 py-2 font-mono text-white/80">{tr.referentieNr || shortId(tr.id)}</td>
                              <td className="px-3 py-2 text-right text-white">{fmtEur(tr.eurBedrag)}</td>
                              <td className="px-3 py-2 text-right text-white/70">{new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(tr.tryBedrag)}</td>
                              <td className="px-3 py-2">
                                <span className="inline-block bg-white/10 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/20">{tr.status}</span>
                              </td>
                              <td className="px-3 py-2 text-white/60">{fmtDatum(tr.aangemaaktOp)}</td>
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
                    <div className="text-center text-white/50 py-8">Geen KYC records</div>
                  ) : (
                    <div className="space-y-3">
                      {data.kycRecords.map((k) => (
                        <div key={k.id} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/90">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold">{k.documentType} · <span className="font-mono text-xs">{k.documentNummer}</span></div>
                              <div className="text-xs text-white/60 mt-0.5">Geboortedatum: {k.geboortedatum} · {k.nationaliteit}</div>
                            </div>
                            <KycBadge status={k.status} />
                          </div>
                          <div className="text-xs text-white/50 mt-2">
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
                    <div className="text-center text-white/50 py-8">Geen audit logs</div>
                  ) : (
                    <div className="space-y-2">
                      {data.auditLogs.map((l) => (
                        <div key={l.id} className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/80">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-block bg-white/10 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/20">{l.actie}</span>
                            <span className="text-white/50">{fmtDatum(l.aangemaaktOp)}</span>
                          </div>
                          {l.ipAdres && <div className="text-white/40 font-mono text-[10px] mt-1">IP: {l.ipAdres}</div>}
                          {Object.keys(l.details || {}).length > 0 && (
                            <pre className="text-[10px] text-white/60 mt-2 bg-black/30 rounded p-2 overflow-x-auto">
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
                      knopKleur="bg-green-600 hover:bg-green-700"
                      onClick={() => setModal({ soort: 'activate' })}
                    />
                  )}
                  <ActieKaart
                    icoon={Lock}
                    titel="Wachtwoord reset forceren"
                    beschrijving="Stuur een 1-uur geldige reset link naar het e-mailadres van de gebruiker."
                    knop="Reset triggeren"
                    knopKleur="bg-blue-600 hover:bg-blue-700"
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
          knopKleur="bg-amber-600 hover:bg-amber-700"
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
          knopKleur="bg-green-600 hover:bg-green-700"
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
          knopKleur="bg-blue-600 hover:bg-blue-700"
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
      <div className="text-xs text-white/50">{label}</div>
      <div className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>{waarde}</div>
    </div>
  );
}

function ActieKaart({ icoon: Icoon, titel, beschrijving, knop, knopKleur = 'bg-amber-600 hover:bg-amber-700', onClick }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        {Icoon && <Icoon className="w-7 h-7 text-white/70 flex-shrink-0" />}
        <div className="flex-1">
          <div className="font-bold text-white">{titel}</div>
          <div className="text-xs text-white/60 mt-1">{beschrijving}</div>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`mt-3 ${knopKleur} text-white text-sm font-semibold px-4 py-2 rounded-xl transition`}
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
            className="w-full bg-white/10 border border-white/20 backdrop-blur-lg rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"><Search className="w-4 h-4" /></span>
        </div>
        <div className="text-xs text-white/60">
          {totaal} resultaten · pagina {pagina} / {aantalPaginas}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0 || laden}
          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white disabled:opacity-40 hover:bg-white/20 transition"
        >
          ← Vorige
        </button>
        <button
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= totaal || laden}
          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white disabled:opacity-40 hover:bg-white/20 transition"
        >
          Volgende →
        </button>
      </div>

      {fout && <div className="bg-red-500/10 border border-red-300/30 text-red-100 rounded-2xl p-3 text-sm">{fout}</div>}

      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/10">
              <tr className="text-left text-white/80">
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Naam</th>
                <th className="px-4 py-3 font-semibold">Telefoon</th>
                <th className="px-4 py-3 font-semibold">KYC</th>
                <th className="px-4 py-3 font-semibold">Account</th>
                <th className="px-4 py-3 font-semibold text-right">TX</th>
                <th className="px-4 py-3 font-semibold">2FA</th>
                <th className="px-4 py-3 font-semibold">Aangemeld</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {laden ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-white/60">Laden…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-white/60">Geen gebruikers gevonden</td></tr>
              ) : users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setActieveUser(u.id)}
                  className="hover:bg-white/5 transition cursor-pointer"
                >
                  <td className="px-4 py-3 text-xs text-white/90 font-mono">{u.email}</td>
                  <td className="px-4 py-3 text-white/90">{u.naam}</td>
                  <td className="px-4 py-3 text-xs text-white/70 font-mono">{u.telefoon || '—'}</td>
                  <td className="px-4 py-3"><KycBadge status={u.kycStatus} /></td>
                  <td className="px-4 py-3"><AccountBadge status={u.accountStatus} /></td>
                  <td className="px-4 py-3 text-right text-white/80">{u.aantalTransacties}</td>
                  <td className="px-4 py-3 text-xs text-white/70">{u.twofaIngeschakeld ? <Check className="w-4 h-4 text-green-400" /> : '—'}</td>
                  <td className="px-4 py-3 text-xs text-white/60">{fmtDatum(u.aangemeldOp)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-white/60 hover:text-white text-sm">→</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-white/40">
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

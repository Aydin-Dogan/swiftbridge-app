/**
 * KybSamenvatting.jsx — overzicht van alle stappen met een "Wijzig"-link per stap.
 *
 * Props: aanvraag (genormaliseerd), onWijzig(nr)
 */
import { useTaal } from '../../i18n';
import { STAPPEN, optieTKey } from './kybOpties';
import { landNaam } from './landNaam';

function Rij({ label, waarde }) {
  if (waarde == null || waarde === '') return null;
  return (
    <div className="flex justify-between gap-3 text-sm py-1">
      <span className="text-ink-3">{label}</span>
      <span className="text-ink-1 text-right">{waarde}</span>
    </div>
  );
}

export default function KybSamenvatting({ aanvraag, onWijzig }) {
  const { t } = useTaal();
  const a = aanvraag || {};
  const voltooid = new Set((a.stappenVoltooid || []).map(Number));
  const b = a.bedrijf || {};
  const p = a.persoon || {};
  const g = a.gebruik || {};
  const av = a.aanvullend || {};
  const id = a.identiteit || {};
  const ts = a.toestel || {};
  const lbl = (groep, w) => (w ? t(optieTKey(groep, w)) : '');
  const lijst = (groep, arr) => (Array.isArray(arr) && arr.length ? arr.map((w) => t(optieTKey(groep, w))).join(', ') : '');
  const naam = [p.voornamen, p.tussenvoegsel, p.achternaam].filter(Boolean).join(' ');

  const inhoud = {
    1: (
      <>
        <Rij label={t('kyb_bedrijf_naam')} waarde={b.bedrijfsnaam} />
        <Rij label={t('kyb_bedrijf_kvk')} waarde={b.kvkNummer} />
        <Rij label={t('kyb_rechtsvorm_vraag')} waarde={lbl('RECHTSVORM', b.rechtsvorm)} />
        <Rij label={t('kyb_structuur_vraag')} waarde={lijst('STRUCTUUR', b.structuur)} />
        <Rij label={t('kyb_handelsnaam_label')} waarde={b.handelsnaam} />
        <Rij label={t('kyb_website_label')} waarde={b.geenWebsite ? t('kyb_website_geen') : b.website} />
        <Rij label={t('kyb_ubo_kop')} waarde={(a.ubos || []).length ? String((a.ubos || []).length) : ''} />
      </>
    ),
    2: (
      <>
        <Rij label={t('kyb_roepnaam_label')} waarde={p.roepnaam} />
        <Rij label={t('kyb_achternaam_label')} waarde={naam} />
        <Rij label={t('kyb_geboortedatum_label')} waarde={p.geboortedatum} />
        <Rij label={t('kyb_nationaliteit_label')} waarde={p.nationaliteit ? landNaam(p.nationaliteit) : ''} />
        <Rij label={t('kyb_mobiel_label')} waarde={p.telefoonMobiel} />
        <Rij label={t('kyb_adres_kop')} waarde={p.adres ? [[p.adres.straat, p.adres.huisnummer, p.adres.toevoeging].filter(Boolean).join(' '), [p.adres.postcode, p.adres.plaats].filter(Boolean).join(' ')].filter(Boolean).join(', ') : ''} />
        <Rij label={t('kyb_pep_vraag')} waarde={p.pep == null ? '' : (p.pep ? t('kyb_ja') : t('kyb_nee'))} />
      </>
    ),
    3: (
      <Rij label={t('kyb_stap3_label')} waarde={ts.gekoppeld ? t('kyb_toestel_al_gekoppeld') : (ts.overgeslagen ? t('kyb_toestel_overslaan') : '')} />
    ),
    4: (
      <>
        <Rij label={t('kyb_tx_jaar_vraag')} waarde={lbl('TX_PER_JAAR', g.txPerJaar)} />
        <Rij label={t('kyb_omvang_vraag')} waarde={lbl('OMVANG_PER_TX', g.omvangPerTx)} />
        <Rij label={t('kyb_internationaal_vraag')} waarde={g.internationaal == null ? '' : (g.internationaal ? `${t('kyb_ja')}${(g.landen || []).length ? `: ${(g.landen || []).map(landNaam).join(', ')}` : ''}` : t('kyb_nee'))} />
        <Rij label={t('kyb_volume_vraag')} waarde={lbl('VOLUME_KWARTAAL', g.volumeKwartaal)} />
        <Rij label={t('kyb_herkomst_vraag')} waarde={lijst('HERKOMST', g.herkomstMiddelen)} />
      </>
    ),
    5: (
      <Rij label={t('kyb_stap5_label')} waarde={id.bevestigdOp || id.bron ? t('kyb_stap_voltooid') : ''} />
    ),
    6: (
      <>
        <Rij label={t('kyb_omzet_vraag')} waarde={lbl('JAAROMZET', av.jaaromzet)} />
        <Rij label={t('kyb_deelnemingen_vraag')} waarde={av.deelnemingen == null ? '' : (av.deelnemingen ? t('kyb_ja') : t('kyb_nee'))} />
        <Rij label={t('kyb_buiten_nl_vraag')} waarde={av.actiefBuitenNl == null ? '' : (av.actiefBuitenNl ? `${t('kyb_ja')}${(av.actiefLanden || []).length ? `: ${(av.actiefLanden || []).map(landNaam).join(', ')}` : ''}` : t('kyb_nee'))} />
      </>
    ),
  };

  return (
    <section aria-label={t('kyb_samenvatting_kop')} className="space-y-3">
      <h2 className="font-display text-xl text-ink-1">{t('kyb_samenvatting_kop')}</h2>
      {STAPPEN.filter((s) => s.nr <= 6).map((s) => (
        <div key={s.nr} className="rounded-md border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2">{s.nr}. {t(s.labelKey)}</span>
              <span className={voltooid.has(s.nr) ? 'pill-success' : 'pill-warning'}>
                {voltooid.has(s.nr) ? t('kyb_stap_voltooid') : t('kyb_stap_open')}
              </span>
            </div>
            <button type="button" onClick={() => onWijzig?.(s.nr)}
              className="text-sm font-semibold text-brand-700 hover:underline underline-offset-4 min-h-[44px] px-2">
              {t('kyb_wijzig')}
            </button>
          </div>
          <div className="divide-y divide-border-subtle">{inhoud[s.nr]}</div>
        </div>
      ))}
    </section>
  );
}

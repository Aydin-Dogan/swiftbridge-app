/**
 * pricingConsistency.test.js — bewaakt scripts/pricing-consistency.mjs zelf.
 *
 * AANLEIDING (14-10-2026)
 * Het script stamde uit de tijd van het oude flat-fee-model en keurde elke
 * tekst af waarin "vaste fee", "sabit ücret" of "%1,2 kur" stond. Dat is
 * precies hoe het huidige model in de teksten staat (4,95 euro vaste fee plus
 * een transparante koersmarge van 1,2 / 1,0 / 0,8 / 0,6 procent), dus het
 * script stond in CI rood op twaalf correcte teksten en bewaakte daardoor
 * niets meer.
 *
 * Nu kijkt het naar de bedragen en percentages zelf, met het model uit
 * src/services/kosten.js als maatstaf. Deze test bewijst met echte zinnen dat
 * het afkeurt wat fout is en doorlaat wat goed is. Een vangnet dat de goede
 * tekst tegenhoudt, wordt uitgezet; een vangnet dat de foute mist, geeft een
 * vals gevoel van veiligheid.
 */
import { describe, test, expect } from 'vitest';
import { nl } from '../i18n/nl';
import { en } from '../i18n/en';
import { tr } from '../i18n/tr';
import { ru } from '../i18n/ru';
import { az } from '../i18n/az';
import { controleerTekst, controleerWoordenboek } from '../../scripts/pricing-consistency.mjs';

const TALEN = { nl, en, tr, ru, az };

function regels(tekst) {
  return controleerTekst(tekst).map((t) => t.regel);
}

describe('pricing-consistency: wat fout is, wordt afgekeurd', () => {
  const MOET_AFKEUREN = [
    // Een ander bedrag dan 4,95 als vaste fee — het oude model en verzinsels.
    ['nl oude flat fee', 'Eén vaste fee van €1,99 per overboeking.', 'vaste-fee-bedrag'],
    ['en ander bedrag', 'One fixed fee of €2.50 per transfer.', 'vaste-fee-bedrag'],
    ['en bedrag ervoor', 'Just a €3.95 fixed fee.', 'vaste-fee-bedrag'],
    ['tr ander bedrag', 'Transfer başına sabit €3,99 işlem ücreti.', 'vaste-fee-bedrag'],
    ['ru ander bedrag', 'Одна фиксированная комиссия €1,99 за перевод.', 'vaste-fee-bedrag'],
    ['az ander bedrag', 'Hər köçürmə üçün sabit €5,95 komissiya.', 'vaste-fee-bedrag'],
    ['nl minimum fee bestaat niet meer', 'Minimum fee €1,99.', 'vaste-fee-bedrag'],
    ['nl bedrag per overboeking zonder het woord fee', 'Je betaalt €1,99 per overboeking.', 'bedrag-per-overboeking'],

    // Een andere marge dan 1,2 / 1,0 / 0,8 / 0,6 procent.
    ['nl marge', 'Plus een transparante koersmarge van 1,5%.', 'marge-percentage'],
    ['en marge', 'FX margin from 0.5% for Black members.', 'marge-percentage'],
    ['tr marge, procentteken ervoor', 'Artı şeffaf %2 kur marjı.', 'marge-percentage'],
    ['ru marge', 'Курсовая маржа 0,9% за перевод.', 'marge-percentage'],
    ['az marge', '1,1% kurs marjası tətbiq olunur.', 'marge-percentage'],
    ['nl lijst per ledenniveau', 'Een transparante koersmarge:\n• Basis: 1,2%\n• Black: 0,5%', 'marge-percentage'],

    // Een verborgen marge — het model is juist dat de marge getoond wordt.
    ['nl marge verborgen', 'De marge zit verborgen in de koers.', 'verborgen-marge'],
    ['en hidden margin', 'A small hidden margin is included in the rate.', 'verborgen-marge'],
    ['tr gizli marj', 'Kura gizli bir marj eklenir.', 'verborgen-marge'],
    ['ru скрытая наценка', 'В курс заложена скрытая наценка.', 'verborgen-marge'],
    ['az gizli marja', 'Məzənnəyə gizli marja əlavə olunur.', 'verborgen-marge'],
    ['nl ontkenning die niet over de kosten gaat', 'Geen abonnement, maar wel verborgen kosten.', 'verborgen-marge'],

    // Gratis — er wordt altijd marge ingehouden.
    ['nl gratis', 'Je eerste overboeking is gratis.', 'gratis'],
    ['nl zonder kosten', 'Overboeken zonder kosten.', 'gratis'],
    ['en free', 'Send money for free.', 'gratis'],
    ['en no fees', 'No fees on your first transfer.', 'gratis'],
    ['tr ücretsiz', 'İlk transferin ücretsiz.', 'gratis'],
    ['ru бесплатно', 'Первый перевод бесплатно.', 'gratis'],
    ['az pulsuz', 'İlk köçürmə pulsuz.', 'gratis'],

    // Welkomstactie met een andere grens dan 800 euro.
    ['nl welkomstgrens', 'Je eerste overboeking t/m €1.000 zonder vaste kosten.', 'welkomst-bedrag'],
    ['en welkomstgrens', 'No fixed fee on your first transfer up to €500.', 'welkomst-bedrag'],
    // De Turkse hoofdletter İ valt onder /i niet samen met i; deze twee zinnen
    // beginnen er allebei mee.
    ['tr welkomstgrens, zin begint met İ', 'İlk transferini sabit ücret ödemeden gönder (en çok €1.000)', 'welkomst-bedrag'],
    ['az welkomstgrens, zin begint met İ', 'İlk köçürmənizdə sabit komissiya yoxdur (ən çox €1.000)', 'welkomst-bedrag'],
  ];

  test.each(MOET_AFKEUREN)('%s', (_naam, zin, regel) => {
    expect(
      regels(zin),
      `"${zin}" hoort af te keuren op ${regel}; deze bewering mag niet in de app staan.`
    ).toContain(regel);
  });
});

describe('pricing-consistency: wat goed is, gaat erdoor', () => {
  const MOET_DOORLATEN = [
    ['nl vaste fee', 'Eén vaste fee van €4,95 en een transparante koersmarge vanaf 1,2% die per ledenniveau daalt tot 0,6%.'],
    ['en vaste fee', 'One fixed €4.95 fee and a transparent FX margin from 1.2%, decreasing to 0.6% per membership level.'],
    ['tr vaste fee', 'Transfer başına sabit €4,95 işlem ücreti, artı şeffaf %1,2 kur marjı (Basis).'],
    ['ru vaste fee', 'Одна фиксированная комиссия €4,95 за перевод плюс прозрачная курсовая маржа 1,2% (Basis).'],
    ['az vaste fee', 'Hər köçürmə üçün sabit €4,95 əməliyyat haqqı, üstəgəl şəffaf 1,2% kurs marjası (Basis).'],
    ['nl lijst per ledenniveau', 'Een transparante koersmarge:\n• Basis: 1,2%\n• Plus: 1,0%\n• Premium: 0,8%\n• Black: 0,6%\n\nMinimum overboekbedrag €50.'],
    ['nl geen verborgen kosten', 'Geen abonnement, geen verborgen kosten — je ziet alles vóór bevestiging.'],
    ['en no hidden fees', 'No hidden fees like Western Union.'],
    ['tr gizli maliyet yok', 'Abonelik yok, gizli maliyet yok.'],
    ['ru без скрытых расходов', 'Без подписки и скрытых расходов.'],
    ['az gizli xərc yoxdur', 'Abunə yoxdur, gizli xərc yoxdur.'],
    ['nl verborgen in een andere betekenis', 'IP-adres laatste octet is verborgen om je privacy te beschermen.'],
    ['tr gizlilik is privacy', 'Gizlilik politikası (GDPR)'],
    ['nl percentage dat geen marge is', 'na 2,2% kosten'],
    ['nl bonus is geen fee', 'Krijg €5 per vriend die zijn eerste overboeking doet.'],
    ['nl limiet per overboeking', 'Het maximum is €5.000 per overboeking.'],
    ['ru limiet per overboeking', 'Минимум €50 · Максимум €5 000 за перевод'],
    ['nl welkomstactie', 'Verstuur je eerste overboeking zonder vaste kosten (t/m €800)'],
    ['nl welkomstactie met fee', 'Bij je eerste overboeking t/m €800 vervallen de vaste kosten van €4,95; de koersmarge blijft gelden.'],
    ['tr welkomstactie', 'En çok €800 olan ilk transferinde €4,95 sabit ücret alınmaz; kur marjı yine de geçerli.'],
    ['en feel free', 'Feel free to contact us in your own language.'],
  ];

  test.each(MOET_DOORLATEN)('%s', (_naam, zin) => {
    expect(
      controleerTekst(zin),
      `"${zin}" is juist goed, maar wordt afgekeurd.`
    ).toEqual([]);
  });

  test.each(Object.keys(TALEN))('alle huidige teksten in %s zijn in orde', (code) => {
    const treffers = controleerWoordenboek(TALEN[code]);
    expect(
      treffers.map((t) => `${code}.${t.sleutel}: ${t.regel}`),
      'Een tekst wijkt af van het prijsmodel in src/services/kosten.js.'
    ).toEqual([]);
  });
});

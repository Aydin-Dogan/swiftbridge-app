/**
 * entryCsp.test.js — het beveiligingsbeleid van de twee voordeuren.
 *
 * AANLEIDING (1-10-2026)
 * Op het KYC-reviewscherm bleven de fotovakken leeg. De backend bleek in orde:
 * de bestanden stonden in de bucket, ontsleutelden goed en waren geldige JPEG's,
 * en de route gaf keurig 200 met image/jpeg. De browser weigerde ze alleen te
 * tonen:
 *
 *   Loading the image 'blob:...' violates the following Content Security Policy
 *   directive: "img-src 'self' data: https:". The action has been blocked.
 *
 * KYCReviewQueue.jsx haalt een document op met fetch (want de sessiecookie moet
 * mee), maakt er met URL.createObjectURL een blob:-adres van en zet dat in een
 * <img>. Zonder blob: in img-src blokkeert de browser dat — zonder netwerkfout,
 * dus zonder zichtbare foutmelding. Je ziet alleen een leeg vak.
 *
 * Deze test bewaakt dat blob: in img-src blijft staan zolang compliance
 * documenten op die manier bekijkt. Haal je het weg, dan vallen de foto's
 * opnieuw stil op een manier die niemand aan het scherm kan aflezen.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function imgSrcVan(bestand) {
  const html = readFileSync(resolve(process.cwd(), bestand), 'utf8');
  const meta = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
  expect(meta).not.toBeNull();
  const richtlijn = meta[1].split(';').map((d) => d.trim()).find((d) => d.startsWith('img-src'));
  expect(richtlijn).toBeDefined();
  return richtlijn;
}

describe('Content-Security-Policy van de voordeuren', () => {
  test('intern.html staat blob: toe, anders blijven de KYC-fotos leeg', () => {
    expect(imgSrcVan('intern.html')).toContain('blob:');
  });

  test('index.html staat blob: toe', () => {
    expect(imgSrcVan('index.html')).toContain('blob:');
  });

  test('intern.html laadt nog steeds geen externe afbeeldingen', () => {
    // blob: is lokaal en kortstondig; het mag de bestaande strengheid van de
    // compliance-omgeving niet oprekken naar het open web.
    const richtlijn = imgSrcVan('intern.html');
    expect(richtlijn).not.toContain('https:');
    expect(richtlijn).not.toContain('*');
  });
});

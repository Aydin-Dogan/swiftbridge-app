/**
 * kybFoutContext.js — gedeelde staat voor "wat is nog niet ingevuld" in een KYB-stap.
 *
 * KybStapKader zet { toon, ontbrekend } zodra de klant op "Opslaan en verder"
 * drukt terwijl er nog vragen open staan. KybVraag leest dit en kleurt de
 * betreffende vraag rood (verzoek Aydin 16-9).
 */
import { createContext, useContext } from 'react';

export const KybFoutContext = createContext({ toon: false, ontbrekend: [] });

/** true als veld `veld` nu rood gemarkeerd moet worden. */
export function useKybVeldMist(veld) {
  const { toon, ontbrekend } = useContext(KybFoutContext);
  if (!toon || !veld) return false;
  const velden = Array.isArray(veld) ? veld : [veld];
  return velden.some((v) => ontbrekend.includes(v));
}

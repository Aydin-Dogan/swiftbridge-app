/**
 * Inzicht.jsx — "Inzicht"-tab (bank-concept): inkomsten/uitgaven in beeld.
 * Combineert de bestaande statistiek-widgets met de cashflow-grafiek.
 */
import { useEffect, useState } from 'react';
import { useTaal } from '../i18n';
import StatistiekCards from '../components/dashboard/StatistiekCards';
import MaandOverzicht from '../components/dashboard/MaandOverzicht';
import CashflowCard from '../components/dashboard/CashflowCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Inzicht() {
  const { t } = useTaal();
  const [transacties, setTransacties] = useState([]);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    let weg = false;
    fetch(`${API}/transactions`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { transacties: [] })
      .then(json => { if (!weg) setTransacties(json.transacties || []); })
      .catch(() => {})
      .finally(() => { if (!weg) setLaden(false); });
    return () => { weg = true; };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink-1">{t('inzicht_titel')}</h1>
      <p className="text-sm text-ink-2 -mt-2">{t('inzicht_uitleg')}</p>
      <StatistiekCards transacties={transacties} laden={laden} />
      <CashflowCard transacties={transacties} laden={laden} />
      <MaandOverzicht transacties={transacties} />
    </div>
  );
}

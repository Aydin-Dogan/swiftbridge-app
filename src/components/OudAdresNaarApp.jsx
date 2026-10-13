import { Navigate, useLocation } from 'react-router-dom';

// Stuurt de oude adressen uit src/lib/oudeAppPaden.js door naar /app, met behoud
// van de zoekparameters (?payment=… na iDEAL). Al verstuurde mails blijven zo werken.

export default function OudAdresNaarApp() {
  const { search } = useLocation();
  return <Navigate to={`/app${search}`} replace />;
}

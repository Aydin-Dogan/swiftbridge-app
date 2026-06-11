/**
 * ReferralLeaderboard.jsx — top-10 uitnodigers (Verbetering JJJ).
 *
 * Toont top 10 met geanonimiseerde namen. Eigen entry highlighted.
 * Backend: GET /referral/leaderboard.
 */
import { useState, useEffect } from 'react';
import { apiFetch, parseError } from '../../services/api';
import { useTaal } from '../../i18n';
import Avatar from '../Avatar';
import { Star } from '../icons/Icons';

export default function ReferralLeaderboard() {
  const { t } = useTaal();
  const [items, setItems] = useState([]);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/referral/leaderboard')
      .then(d => { if (!cancelled) setItems(d.leaderboard || []); })
      .catch(() => {/* fail-silent — leaderboard niet kritiek */})
      .finally(() => { if (!cancelled) setLaden(false); });
    return () => { cancelled = true; };
  }, []);

  if (laden) {
    return (
      <div className="card-glass p-4 animate-fade-up space-y-2">
        <div className="h-3 w-1/2 rounded animate-shimmer" />
        <div className="space-y-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-8 rounded animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return null; // Verberg sectie als niemand uitgenodigd heeft
  }

  return (
    <div className="card-glass p-4 animate-fade-up border-l-4 border-amber-400">
      <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-1">
        <Star className="w-4 h-4 text-amber-500" aria-hidden="true" />
        {t('referral_leaderboard_titel')}
      </h4>
      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
        {t('referral_leaderboard_uitleg')}
      </p>

      <ul className="space-y-1.5">
        {items.map(item => (
          <li
            key={item.rang}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
              item.jij
                ? 'bg-amber-100 border border-amber-300'
                : 'bg-white border border-gray-100'
            }`}
          >
            <span className={`w-6 text-center text-xs font-bold ${
              item.rang === 1 ? 'text-amber-600' :
              item.rang === 2 ? 'text-gray-500' :
              item.rang === 3 ? 'text-orange-600' :
              'text-gray-400'
            }`}>
              {item.rang === 1 ? '1e' : item.rang === 2 ? '2e' : item.rang === 3 ? '3e' : `#${item.rang}`}
            </span>
            <Avatar naam={item.naam} size="xs" />
            <span className="flex-1 text-sm font-medium text-gray-800 truncate">
              {item.naam}
              {item.jij && (
                <span className="ml-1.5 text-xs font-bold text-amber-700">
                  ({t('referral_leaderboard_jij')})
                </span>
              )}
            </span>
            <span className="text-xs font-bold text-gray-600">
              {item.aantal} {t('referral_leaderboard_aantal')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
      <div className="bg-surface border border-border rounded-md shadow-soft p-4 animate-fade-up space-y-2">
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
    <div className="bg-surface border border-border rounded-md shadow-soft p-4 animate-fade-up border-l-4 border-l-accent-400">
      <h4 className="font-display font-medium text-ink-1 text-sm flex items-center gap-2 mb-1">
        <Star className="w-4 h-4 text-accent-500" aria-hidden="true" />
        {t('referral_leaderboard_titel')}
      </h4>
      <p className="text-xs text-ink-2 mb-3 leading-relaxed">
        {t('referral_leaderboard_uitleg')}
      </p>

      <ul className="space-y-1.5">
        {items.map(item => (
          <li
            key={item.rang}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
              item.jij
                ? 'bg-accent-400/15 border border-accent-400/40'
                : 'bg-surface border border-border'
            }`}
          >
            <span className={`w-6 text-center text-xs font-bold tabular-nums ${
              item.rang === 1 ? 'text-accent-600' :
              item.rang === 2 ? 'text-ink-3' :
              item.rang === 3 ? 'text-accent-500' :
              'text-ink-3'
            }`}>
              {item.rang === 1 ? '1e' : item.rang === 2 ? '2e' : item.rang === 3 ? '3e' : `#${item.rang}`}
            </span>
            <Avatar naam={item.naam} size="xs" />
            <span className="flex-1 text-sm font-medium text-ink-1 truncate">
              {item.naam}
              {item.jij && (
                <span className="ml-1.5 text-xs font-bold text-accent-600">
                  ({t('referral_leaderboard_jij')})
                </span>
              )}
            </span>
            <span className="text-xs font-bold text-ink-2 tabular-nums">
              {item.aantal} {t('referral_leaderboard_aantal')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

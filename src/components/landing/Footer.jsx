/**
 * Footer.jsx — Premium landing footer with compliance badges & socials.
 *
 * TrustRow (Verbetering T): expliciete trust-signalen boven de columns —
 * DNB EMI-partner, Wwft, AVG/GDPR, Mollie payments, 256-bit SSL.
 * Geen fake claims (we hebben GEEN eigen DNB-licentie — via EMI-partner).
 */
import { useTaal } from '../../i18n';
import { Mail, Shield, ShieldCheck, Lock, Zap } from '../icons/Icons';

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
      {children}
    </span>
  );
}

function TrustItem({ Icon, label, sub }) {
  return (
    <div className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
      <Icon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-white font-bold text-xs">{label}</div>
        <div className="text-gray-400 text-[11px] leading-relaxed">{sub}</div>
      </div>
    </div>
  );
}

export default function Footer() {
  const { t } = useTaal();
  const jaar = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-400 pt-14 pb-8 px-4 text-sm">
      <div className="max-w-7xl mx-auto">
        {/* TrustRow — concrete signalen voor de fold (Verbetering T). */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <TrustItem
            Icon={ShieldCheck}
            label={t('footer_trust_dnb_label')}
            sub={t('footer_trust_dnb_sub')}
          />
          <TrustItem
            Icon={Shield}
            label={t('footer_trust_wwft_label')}
            sub={t('footer_trust_wwft_sub')}
          />
          <TrustItem
            Icon={Lock}
            label={t('footer_trust_ssl_label')}
            sub={t('footer_trust_ssl_sub')}
          />
          <TrustItem
            Icon={Zap}
            label={t('footer_trust_mollie_label')}
            sub={t('footer_trust_mollie_sub')}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Branding */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl" aria-hidden="true">⚡</span>
              <span className="font-extrabold text-white text-lg tracking-tight">
                SwiftBridge
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              {t('landing_footer_slogan')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>DNB</Badge>
              <Badge>Wwft</Badge>
              <Badge>AVG / GDPR</Badge>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-bold mb-3 text-sm">
              {t('landing_footer_product')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#hoe-werkt-het" className="hover:text-white transition">
                  {t('landing_nav_how')}
                </a>
              </li>
              <li>
                <a href="#kosten" className="hover:text-white transition">
                  {t('landing_nav_kosten')}
                </a>
              </li>
              <li>
                <a href="#landen" className="hover:text-white transition">
                  {t('landing_nav_landen')}
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition">
                  {t('landing_nav_faq')}
                </a>
              </li>
            </ul>
          </div>

          {/* Juridisch */}
          <div>
            <h4 className="text-white font-bold mb-3 text-sm">
              {t('landing_footer_juridisch')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/algemene-voorwaarden" className="hover:text-white transition">
                  {t('landing_footer_voorwaarden')}
                </a>
              </li>
              <li>
                <a href="/privacybeleid" className="hover:text-white transition">
                  {t('landing_footer_privacy')}
                </a>
              </li>
              <li>
                <a href="/aml-beleid" className="hover:text-white transition">
                  {t('landing_footer_aml')}
                </a>
              </li>
              <li>
                <a href="/status" className="hover:text-white transition">
                  {t('status_page_title')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-3 text-sm">
              {t('landing_footer_contact')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@swiftbridge.tr" className="hover:text-white transition inline-flex items-center gap-2">
                  <Mail className="w-4 h-4" /> support@swiftbridge.tr
                </a>
              </li>
              {/* WhatsApp-support pas tonen wanneer er een echt nummer is.
                  Tot dan: link verwijderd om misleidende UX te voorkomen. */}
              <li>
                <a href="mailto:compliance@swiftbridge.tr" className="hover:text-white transition inline-flex items-center gap-2">
                  <Shield className="w-4 h-4" /> compliance@swiftbridge.tr
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {jaar} SwiftBridge B.V. · {t('landing_footer_rechten')}
          </p>
          <p className="text-[11px] text-gray-600 max-w-xl text-center md:text-right leading-relaxed">
            {t('landing_footer_dnb_disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  );
}

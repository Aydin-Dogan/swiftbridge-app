/**
 * landing-chat.js — AI-supportchat voor de statische marketing-landing.
 *
 * Zelfstandige vanilla-JS widget (de React-app heeft zijn eigen SupportChat):
 * anonieme bezoekers praten direct met de AI via POST /api/support/chat.
 * Sluit aan op de leer-lus (gesprekId + logId + feedbackknopjes) en op het
 * taalsysteem van de landing (volgt document.documentElement.lang, incl. RTL).
 *
 * Veiligheid: alle gebruikers-/AI-tekst via textContent (geen innerHTML),
 * same-origin /api (CSP connect-src 'self'), geen cookies of PII behalve het
 * e-mailadres dat de bezoeker zelf invult bij "Medewerker spreken".
 */
(function () {
  'use strict';

  var TEKSTEN = {
    nl: {
      open: 'Chat openen', sluit: 'Sluiten', titel: 'SwiftBridge Support', online: 'Digitale assistent',
      welkom: 'Hallo! Ik ben de digitale assistent van SwiftBridge. Stel je vraag over kosten, veiligheid of hoe het werkt — ik help je direct.',
      placeholder: 'Typ je vraag...', verstuur: 'Versturen',
      medewerker: 'Medewerker spreken',
      email_vraag: 'Laat je e-mailadres achter, dan mailt een medewerker je zo snel mogelijk.',
      email_placeholder: 'jouw@email.nl', doorsturen: 'Doorsturen',
      escalatie_ok: 'Je gesprek is doorgestuurd. Een medewerker mailt je zo snel mogelijk.',
      fout: 'Er ging iets mis. Probeer het opnieuw of mail support@swiftbridge.nl.',
      niet_beschikbaar: 'Onze digitale assistent is op dit moment niet beschikbaar. Klik op "Medewerker spreken" of mail support@swiftbridge.nl — we reageren zo snel mogelijk.',
      nuttig: 'Nuttig', niet_nuttig: 'Niet nuttig', dank: 'Bedankt voor je feedback.',
    },
    en: {
      open: 'Open chat', sluit: 'Close', titel: 'SwiftBridge Support', online: 'Digital assistant',
      welkom: 'Hello! I am the SwiftBridge digital assistant. Ask me about costs, safety or how it works — I will help you right away.',
      placeholder: 'Type your question...', verstuur: 'Send',
      medewerker: 'Talk to an agent',
      email_vraag: 'Leave your email address and one of our agents will get back to you as soon as possible.',
      email_placeholder: 'you@email.com', doorsturen: 'Forward',
      escalatie_ok: 'Your conversation has been forwarded. An agent will email you shortly.',
      fout: 'Something went wrong. Please try again or email support@swiftbridge.nl.',
      niet_beschikbaar: 'Our digital assistant is currently unavailable. Click "Talk to an agent" or email support@swiftbridge.nl — we will get back to you as soon as possible.',
      nuttig: 'Helpful', niet_nuttig: 'Not helpful', dank: 'Thanks for your feedback.',
    },
    tr: {
      open: 'Sohbeti aç', sluit: 'Kapat', titel: 'SwiftBridge Destek', online: 'Dijital asistan',
      welkom: 'Merhaba! Ben SwiftBridge dijital asistanıyım. Maliyetler, güvenlik veya nasıl çalıştığı hakkında sorun — hemen yardımcı olayım.',
      placeholder: 'Sorunuzu yazın...', verstuur: 'Gönder',
      medewerker: 'Temsilciyle görüş',
      email_vraag: 'E-posta adresinizi bırakın, temsilcimiz en kısa sürede size yazısın.',
      email_placeholder: 'siz@eposta.com', doorsturen: 'İlet',
      escalatie_ok: 'Görüşmeniz iletildi. Temsilcimiz en kısa sürede e-posta gönderecek.',
      fout: 'Bir şeyler ters gitti. Tekrar deneyin veya support@swiftbridge.nl adresine yazın.',
      niet_beschikbaar: 'Dijital asistanımız şu anda kullanılamıyor. "Temsilciyle görüş" düğmesine tıklayın veya support@swiftbridge.nl adresine yazın — en kısa sürede dönüş yaparız.',
      nuttig: 'Faydalı', niet_nuttig: 'Faydalı değil', dank: 'Geri bildiriminiz için teşekkürler.',
    },
    ar: {
      open: 'فتح المحادثة', sluit: 'إغلاق', titel: 'دعم SwiftBridge', online: 'مساعد رقمي',
      welkom: 'مرحباً! أنا المساعد الرقمي لـ SwiftBridge. اسألني عن التكاليف أو الأمان أو طريقة العمل — سأساعدك فوراً.',
      placeholder: 'اكتب سؤالك...', verstuur: 'إرسال',
      medewerker: 'التحدث مع موظف',
      email_vraag: 'اترك بريدك الإلكتروني وسيراسلك موظف في أقرب وقت.',
      email_placeholder: 'you@email.com', doorsturen: 'إرسال',
      escalatie_ok: 'تم تحويل محادثتك. سيراسلك موظف قريباً.',
      fout: 'حدث خطأ ما. حاول مجدداً أو راسل support@swiftbridge.nl.',
      niet_beschikbaar: 'المساعد الرقمي غير متاح حالياً. اضغط على «التحدث مع موظف» أو راسل support@swiftbridge.nl — سنرد عليك في أقرب وقت.',
      nuttig: 'مفيد', niet_nuttig: 'غير مفيد', dank: 'شكراً على ملاحظتك.',
    },
    de: {
      open: 'Chat öffnen', sluit: 'Schließen', titel: 'SwiftBridge Support', online: 'Digitaler Assistent',
      welkom: 'Hallo! Ich bin der digitale Assistent von SwiftBridge. Fragen Sie mich zu Kosten, Sicherheit oder Funktionsweise — ich helfe sofort.',
      placeholder: 'Ihre Frage eingeben...', verstuur: 'Senden',
      medewerker: 'Mit Mitarbeiter sprechen',
      email_vraag: 'Hinterlassen Sie Ihre E-Mail-Adresse, ein Mitarbeiter meldet sich schnellstmöglich.',
      email_placeholder: 'sie@email.de', doorsturen: 'Weiterleiten',
      escalatie_ok: 'Ihr Gespräch wurde weitergeleitet. Ein Mitarbeiter meldet sich per E-Mail.',
      fout: 'Etwas ist schiefgelaufen. Versuchen Sie es erneut oder mailen Sie an support@swiftbridge.nl.',
      niet_beschikbaar: 'Unser digitaler Assistent ist derzeit nicht verfügbar. Klicken Sie auf "Mit Mitarbeiter sprechen" oder mailen Sie an support@swiftbridge.nl — wir melden uns schnellstmöglich.',
      nuttig: 'Hilfreich', niet_nuttig: 'Nicht hilfreich', dank: 'Danke für Ihr Feedback.',
    },
    fr: {
      open: 'Ouvrir le chat', sluit: 'Fermer', titel: 'Support SwiftBridge', online: 'Assistant numérique',
      welkom: 'Bonjour ! Je suis l’assistant numérique de SwiftBridge. Posez votre question sur les coûts, la sécurité ou le fonctionnement — je vous aide tout de suite.',
      placeholder: 'Tapez votre question...', verstuur: 'Envoyer',
      medewerker: 'Parler à un agent',
      email_vraag: 'Laissez votre adresse e-mail et un agent vous répondra au plus vite.',
      email_placeholder: 'vous@email.fr', doorsturen: 'Transférer',
      escalatie_ok: 'Votre conversation a été transmise. Un agent vous écrira rapidement.',
      fout: 'Une erreur est survenue. Réessayez ou écrivez à support@swiftbridge.nl.',
      niet_beschikbaar: 'Notre assistant numérique est momentanément indisponible. Cliquez sur « Parler à un agent » ou écrivez à support@swiftbridge.nl — nous vous répondrons au plus vite.',
      nuttig: 'Utile', niet_nuttig: 'Pas utile', dank: 'Merci pour votre retour.',
    },
  };

  function taal() {
    var lang = (document.documentElement.lang || 'nl').slice(0, 2);
    return TEKSTEN[lang] ? lang : 'nl';
  }
  function t(key) { return (TEKSTEN[taal()] || TEKSTEN.nl)[key] || TEKSTEN.nl[key] || key; }

  function gesprekId() {
    try {
      var id = localStorage.getItem('sb_chat_gesprek_id');
      if (!id) {
        id = 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('sb_chat_gesprek_id', id);
      }
      return id;
    } catch (e) { return null; }
  }

  // Gespreksgeschiedenis alleen in het geheugen van deze paginaweergave —
  // bewust geen opslag: de landing is een kennismaking, geen sessie.
  var geschiedenis = []; // {rol: 'user'|'assistent', tekst}
  var bezig = false;

  // ── Styles (huisstijl navy #1B3252; geen externe assets) ─────────────────
  var css = [
    '#sb-lchat-knop{position:fixed;bottom:24px;right:24px;z-index:9990;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1B3252 0%,#1A7F5E 100%);box-shadow:0 6px 20px -4px rgba(27,50,82,.5);transition:transform .15s}',
    '#sb-lchat-knop:hover{transform:scale(1.08)}',
    '#sb-lchat-knop svg{width:26px;height:26px;stroke:#fff;fill:none;stroke-width:2}',
    '#sb-lchat-paneel{position:fixed;bottom:24px;right:24px;z-index:9991;width:min(380px,calc(100vw - 32px));height:min(540px,calc(100vh - 48px));display:flex;flex-direction:column;background:#fff;border-radius:16px;box-shadow:0 24px 60px -12px rgba(15,23,42,.35);border:1px solid #e2e8f0;overflow:hidden;font-family:inherit}',
    '[dir="rtl"] #sb-lchat-knop,[dir="rtl"] #sb-lchat-paneel{right:auto;left:24px}',
    '#sb-lchat-kop{background:linear-gradient(135deg,#22416B 0%,#1B3252 60%,#142641 100%);color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px}',
    '#sb-lchat-kop .sb-avatar{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}',
    '#sb-lchat-kop .sb-titel{font-weight:700;font-size:14px;line-height:1.2}',
    '#sb-lchat-kop .sb-sub{font-size:11px;opacity:.75}',
    '#sb-lchat-sluit{margin-inline-start:auto;background:none;border:none;color:rgba(255,255,255,.8);cursor:pointer;font-size:20px;line-height:1;padding:4px 8px;border-radius:8px}',
    '#sb-lchat-sluit:hover{background:rgba(255,255,255,.15);color:#fff}',
    '#sb-lchat-lijst{flex:1;overflow-y:auto;background:#f8fafc;padding:12px}',
    '.sb-lchat-rij{margin-bottom:10px;display:flex}',
    '.sb-lchat-rij.sb-user{justify-content:flex-end}',
    '.sb-lchat-ballon{max-width:85%;padding:9px 12px;border-radius:14px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-break:break-word}',
    '.sb-user .sb-lchat-ballon{background:#1B3252;color:#fff;border-bottom-right-radius:4px}',
    '.sb-ai .sb-lchat-ballon{background:#fff;border:1px solid #e2e8f0;color:#1e293b;border-bottom-left-radius:4px}',
    '.sb-lchat-feedback{display:flex;gap:6px;margin:-4px 0 10px 4px}',
    '.sb-lchat-feedback button{font-size:10.5px;color:#94a3b8;background:none;border:1px solid #e2e8f0;border-radius:999px;padding:2px 9px;cursor:pointer}',
    '.sb-lchat-feedback button:hover{color:#1B3252;border-color:#1B3252}',
    '.sb-lchat-dank{font-size:10.5px;color:#94a3b8;margin:-4px 0 10px 4px}',
    '#sb-lchat-typt{display:none;color:#94a3b8;font-size:12px;padding:0 4px 8px}',
    '#sb-lchat-voet{border-top:1px solid #e2e8f0;background:#fff;padding:10px 12px}',
    '#sb-lchat-form{display:flex;gap:8px;align-items:flex-end}',
    '#sb-lchat-invoer{flex:1;resize:none;border:1px solid #e2e8f0;background:#f1f5f9;border-radius:12px;padding:9px 12px;font-size:13.5px;font-family:inherit;outline:none;max-height:110px;min-height:40px}',
    '#sb-lchat-invoer:focus{background:#fff;border-color:#1B3252}',
    '#sb-lchat-verstuur{width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(135deg,#22416B,#1B3252);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '#sb-lchat-verstuur:disabled{opacity:.4;cursor:not-allowed}',
    '#sb-lchat-onder{text-align:center;font-size:10.5px;color:#94a3b8;margin-top:7px}',
    '#sb-lchat-medewerker{background:none;border:none;color:#E8632A;font-weight:600;cursor:pointer;font-size:10.5px;padding:0}',
    '#sb-lchat-medewerker:hover{text-decoration:underline}',
    '#sb-lchat-escalatie{display:none;gap:6px;margin-top:8px}',
    '#sb-lchat-email{flex:1;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;font-size:12.5px;font-family:inherit;outline:none}',
    '#sb-lchat-doorsturen{border:none;border-radius:10px;background:#1B3252;color:#fff;font-size:12px;font-weight:600;padding:8px 12px;cursor:pointer}',
    // Mobiel: dvh volgt het toetsenbord (kop + invoer blijven zichtbaar) en
    // 16px op invoervelden voorkomt de automatische inzoom van iOS Safari
    // (die duwde de verstuur- en sluitknop buiten beeld — bevinding Aydin).
    '@media (max-width:640px){#sb-lchat-paneel{top:0;bottom:0;right:0;left:0;width:100%;height:100dvh;max-height:100dvh;border-radius:0}[dir="rtl"] #sb-lchat-paneel{left:0}#sb-lchat-invoer{font-size:16px}#sb-lchat-email{font-size:16px}}',
  ].join('\n');

  var stijl = document.createElement('style');
  stijl.textContent = css;
  document.head.appendChild(stijl);

  // ── DOM ───────────────────────────────────────────────────────────────────
  var knop = document.createElement('button');
  knop.id = 'sb-lchat-knop';
  knop.type = 'button';
  knop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>';
  document.body.appendChild(knop);

  var paneel = null;

  function maakPaneel() {
    paneel = document.createElement('div');
    paneel.id = 'sb-lchat-paneel';
    paneel.setAttribute('role', 'dialog');
    paneel.setAttribute('aria-modal', 'false');
    paneel.setAttribute('aria-label', t('titel'));
    paneel.innerHTML =
      '<div id="sb-lchat-kop">' +
        '<div class="sb-avatar" aria-hidden="true">SB</div>' +
        '<div><div class="sb-titel"></div><div class="sb-sub"></div></div>' +
        '<button id="sb-lchat-sluit" type="button" aria-label="">×</button>' +
      '</div>' +
      '<div id="sb-lchat-lijst" aria-live="polite"></div>' +
      '<div id="sb-lchat-voet">' +
        '<div id="sb-lchat-typt">• • •</div>' +
        '<form id="sb-lchat-form">' +
          '<textarea id="sb-lchat-invoer" rows="1"></textarea>' +
          '<button id="sb-lchat-verstuur" type="submit" aria-label=""><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12l14-7-7 14-2-5-5-2z"/></svg></button>' +
        '</form>' +
        '<div id="sb-lchat-escalatie">' +
          '<input id="sb-lchat-email" type="email" autocomplete="email" />' +
          '<button id="sb-lchat-doorsturen" type="button"></button>' +
        '</div>' +
        '<div id="sb-lchat-onder"><button id="sb-lchat-medewerker" type="button"></button> · support@swiftbridge.nl</div>' +
      '</div>';
    document.body.appendChild(paneel);
    vertaalPaneel();

    paneel.querySelector('#sb-lchat-sluit').addEventListener('click', sluit);
    paneel.querySelector('#sb-lchat-form').addEventListener('submit', verstuur);
    paneel.querySelector('#sb-lchat-medewerker').addEventListener('click', toonEscalatie);
    paneel.querySelector('#sb-lchat-doorsturen').addEventListener('click', escaleer);
    var invoer = paneel.querySelector('#sb-lchat-invoer');
    invoer.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); verstuur(e); }
    });
    // Mobiel toetsenbord: na focus het gesprek weer in beeld scrollen.
    invoer.addEventListener('focus', function () { setTimeout(scrollOnder, 350); });
    document.addEventListener('keydown', escSluit);

    voegBericht('assistent', t('welkom'), null);
  }

  // Mobiel: het paneel meebewegen met het zichtbare deel van het scherm
  // wanneer het toetsenbord open is (iOS/Android visual viewport).
  function isMobiel() { return window.matchMedia('(max-width: 640px)').matches; }
  function pasHoogteAan() {
    if (!paneel) return;
    if (isMobiel() && window.visualViewport) {
      paneel.style.height = window.visualViewport.height + 'px';
      scrollOnder();
    } else {
      paneel.style.height = '';
    }
  }

  function vertaalPaneel() {
    if (!paneel) return;
    paneel.querySelector('.sb-titel').textContent = t('titel');
    paneel.querySelector('.sb-sub').textContent = t('online');
    paneel.querySelector('#sb-lchat-sluit').setAttribute('aria-label', t('sluit'));
    paneel.querySelector('#sb-lchat-invoer').setAttribute('placeholder', t('placeholder'));
    paneel.querySelector('#sb-lchat-verstuur').setAttribute('aria-label', t('verstuur'));
    paneel.querySelector('#sb-lchat-medewerker').textContent = t('medewerker');
    paneel.querySelector('#sb-lchat-email').setAttribute('placeholder', t('email_placeholder'));
    paneel.querySelector('#sb-lchat-doorsturen').textContent = t('doorsturen');
  }

  function escSluit(e) { if (e.key === 'Escape' && paneel && paneel.style.display !== 'none') sluit(); }

  function open() {
    if (!paneel) maakPaneel(); else { paneel.style.display = 'flex'; vertaalPaneel(); }
    knop.style.display = 'none';
    if (isMobiel()) document.documentElement.style.overflow = 'hidden';
    pasHoogteAan();
    if (window.visualViewport) window.visualViewport.addEventListener('resize', pasHoogteAan);
    setTimeout(function () { paneel.querySelector('#sb-lchat-invoer').focus(); }, 60);
  }
  function sluit() {
    if (paneel) paneel.style.display = 'none';
    knop.style.display = 'flex';
    document.documentElement.style.overflow = '';
    if (window.visualViewport) window.visualViewport.removeEventListener('resize', pasHoogteAan);
    knop.focus();
  }
  knop.setAttribute('aria-label', TEKSTEN.nl.open);
  knop.addEventListener('click', open);

  function scrollOnder() {
    var lijst = paneel.querySelector('#sb-lchat-lijst');
    lijst.scrollTop = lijst.scrollHeight;
  }

  function voegBericht(rol, tekst, logId) {
    geschiedenis.push({ rol: rol, tekst: tekst });
    var lijst = paneel.querySelector('#sb-lchat-lijst');
    var rij = document.createElement('div');
    rij.className = 'sb-lchat-rij ' + (rol === 'user' ? 'sb-user' : 'sb-ai');
    var ballon = document.createElement('div');
    ballon.className = 'sb-lchat-ballon';
    ballon.textContent = tekst; // textContent — nooit HTML uit invoer/AI renderen
    rij.appendChild(ballon);
    lijst.appendChild(rij);
    if (rol === 'assistent' && logId) {
      lijst.appendChild(maakFeedback(logId));
    }
    scrollOnder();
  }

  function maakFeedback(logId) {
    var wrap = document.createElement('div');
    wrap.className = 'sb-lchat-feedback';
    ['goed', 'slecht'].forEach(function (keuze) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = keuze === 'goed' ? t('nuttig') : t('niet_nuttig');
      b.addEventListener('click', function () {
        var dank = document.createElement('div');
        dank.className = 'sb-lchat-dank';
        dank.textContent = t('dank');
        wrap.replaceWith(dank);
        fetch('/api/support/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logId: logId, feedback: keuze }),
        }).catch(function () {});
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function zetBezig(aan) {
    bezig = aan;
    paneel.querySelector('#sb-lchat-typt').style.display = aan ? 'block' : 'none';
    paneel.querySelector('#sb-lchat-verstuur').disabled = aan;
  }

  function verstuur(e) {
    if (e) e.preventDefault();
    if (bezig) return;
    var invoer = paneel.querySelector('#sb-lchat-invoer');
    var tekst = invoer.value.trim();
    if (!tekst) return;
    invoer.value = '';
    voegBericht('user', tekst, null);
    zetBezig(true);
    fetch('/api/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ berichten: geschiedenis.slice(-12), gesprekId: gesprekId() }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        // mock=true: AI niet beschikbaar — toon de melding in de taal van de
        // bezoeker (de server-fallback is Nederlands).
        var tekst = data && data.mock ? t('niet_beschikbaar')
          : (data && data.antwoord) || t('fout');
        voegBericht('assistent', tekst, (data && data.logId) || null);
      })
      .catch(function () { voegBericht('assistent', t('fout'), null); })
      .then(function () { zetBezig(false); invoer.focus(); });
  }

  function toonEscalatie() {
    var blok = paneel.querySelector('#sb-lchat-escalatie');
    var zichtbaar = blok.style.display === 'flex';
    blok.style.display = zichtbaar ? 'none' : 'flex';
    if (!zichtbaar) {
      var info = document.createElement('div');
      info.className = 'sb-lchat-dank';
      info.textContent = t('email_vraag');
      var lijst = paneel.querySelector('#sb-lchat-lijst');
      lijst.appendChild(info);
      scrollOnder();
      paneel.querySelector('#sb-lchat-email').focus();
    }
  }

  function escaleer() {
    var email = paneel.querySelector('#sb-lchat-email').value.trim();
    if (!email || email.indexOf('@') < 1) { paneel.querySelector('#sb-lchat-email').focus(); return; }
    fetch('/api/support/escalatie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ berichten: geschiedenis.slice(-12), gebruikerEmail: email, gebruikerNaam: null }),
    })
      .then(function () {
        paneel.querySelector('#sb-lchat-escalatie').style.display = 'none';
        voegBericht('assistent', t('escalatie_ok'), null);
      })
      .catch(function () { voegBericht('assistent', t('fout'), null); });
  }
})();

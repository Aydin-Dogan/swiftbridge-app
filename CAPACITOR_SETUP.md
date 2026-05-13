# 📱 Capacitor Setup — Native iOS & Android apps

> **Doel:** SwiftBridge PWA verpakken als native iOS en Android app voor App Store en Google Play.
>
> **Tijd:** ~2-3 uur eerste setup. Daarna kunnen we elke release in 10 min uitrollen.

---

## Vooraf — wat heb je nodig?

### Op de Mac (voor iOS):
- ✅ macOS 13+ (Ventura of nieuwer)
- ✅ **Xcode** (gratis, ~15GB download via App Store)
- ✅ **Apple Developer account** ($99/jaar) — kan later als we klaar zijn met dev/testen
- ✅ **CocoaPods** (`sudo gem install cocoapods` of `brew install cocoapods`)
- ✅ Node.js 20+ (via [nodejs.org](https://nodejs.org) of `brew install node`)
- ✅ Git (al geïnstalleerd op Mac)

### Voor Android (kan ook op Mac):
- ✅ **Android Studio** (gratis, [developer.android.com/studio](https://developer.android.com/studio))
- ✅ Java JDK 17+ (komt mee met Android Studio)
- ✅ **Google Play Developer account** ($25 eenmalig) — kan later

---

## Stap 1: Repo clonen op de Mac

```bash
cd ~/Desktop
git clone https://github.com/Aydin-Dogan/swiftbridge-app.git
cd swiftbridge-app
npm install
```

---

## Stap 2: Capacitor installeren

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npm install @capacitor/push-notifications @capacitor/splash-screen @capacitor/status-bar @capacitor/app
```

---

## Stap 3: Capacitor configureren

Maak een nieuw bestand `capacitor.config.json`:

```json
{
  "appId": "nl.swiftbridge.app",
  "appName": "SwiftBridge",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#2563eb",
      "showSpinner": false
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#2563eb"
    },
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

---

## Stap 4: Build & sync

```bash
# Build de web app
npm run build

# Voeg iOS en Android platforms toe
npx cap add ios
npx cap add android

# Sync web build naar native platforms
npx cap sync
```

---

## Stap 5: iOS openen in Xcode

```bash
npx cap open ios
```

In Xcode:
1. Selecteer het project in de linker sidebar
2. Bij **Signing & Capabilities**: kies je team (Apple Developer account)
3. Bundle Identifier: `nl.swiftbridge.app` (al ingesteld)
4. Verbind je iPhone via USB en kies deze als target
5. Klik **Run** (▶) — app draait op je iPhone!

---

## Stap 6: Android openen in Android Studio

```bash
npx cap open android
```

In Android Studio:
1. Wacht tot Gradle klaar is met syncen (~2-5 min)
2. Verbind Android telefoon via USB (developer mode aan)
3. Kies device in de dropdown bovenaan
4. Klik **Run** (▶) — app draait!

---

## Stap 7: App icons + splash screens genereren

```bash
# Plaats source icoon op 1024x1024px in:
# public/icon-source.svg  ✅ (al klaar!)

# Installeer asset generator
npm install -g @capacitor/assets

# Genereer alle iOS + Android icon sizes + splash screens
npx capacitor-assets generate --iconBackgroundColor "#2563eb" --splashBackgroundColor "#2563eb"
```

---

## Stap 8: Test op TestFlight (iOS) / Internal Testing (Android)

### iOS (TestFlight):
1. In Xcode: **Product → Archive**
2. Distribute App → App Store Connect → Upload
3. Wacht ~30 min op email van Apple
4. In App Store Connect → TestFlight → Test users toevoegen
5. Testers krijgen email met installatie link

### Android (Play Console):
1. Android Studio: **Build → Generate Signed Bundle/APK** → AAB
2. Upload .aab naar Play Console → Internal testing
3. Testers krijgen download link

---

## Stap 9: Submit voor review

Beide stores hebben **app review** nodig:
- iOS: 1-7 dagen
- Android: 1-3 dagen

**Wat ze checken (voor finance app):**
1. Privacy policy zichtbaar
2. Terms of service zichtbaar
3. Klantenservice contactinfo (e-mail + Nederlands adres)
4. Geen misleidende claims ("we are a bank" — niet zeggen!)
5. Werkende KYC flow
6. Sandbox account voor reviewers (we leveren login)

---

## Productie checklist (vóór live submission)

- [ ] Eigen domein gekoppeld (swiftbridge.nl)
- [ ] HTTPS overal (Vercel doet dit automatisch)
- [ ] Privacy policy URL: https://swiftbridge.nl/privacybeleid
- [ ] Terms of service URL: https://swiftbridge.nl/algemene-voorwaarden
- [ ] AML beleid URL: https://swiftbridge.nl/aml-beleid
- [ ] Support email: support@swiftbridge.nl
- [ ] Test account voor reviewers (Apple + Google verlangen dit)
- [ ] Screenshots in alle vereiste resoluties
  - iOS: 6.7" iPhone, 6.5" iPhone, 5.5" iPhone, iPad Pro 12.9"
  - Android: Phone (1080x1920), Tablet (1200x1920)
- [ ] App store beschrijvingen in 3 talen (NL, TR, EN)
- [ ] Privacy nutrition label (App Store) ingevuld
- [ ] Data safety form (Play Store) ingevuld
- [ ] Agent partner contract ondertekend
- [ ] Bedrijfsbankrekening klaar
- [ ] KvK + UBO documentatie

---

## Bij problemen tijdens setup

Veelvoorkomende fouten:

**"Pod install failed"** → `cd ios/App && pod install` handmatig draaien

**"Gradle sync failed"** → in Android Studio: File → Invalidate Caches → Restart

**"Build failed: code signing"** → in Xcode bij Signing: zet "Automatically manage signing" aan en kies je team

**App crash bij opstarten** → check Safari (iOS) of Chrome (Android) DevTools — kan een JavaScript error zijn

---

## Volgende stappen na morgen

1. **Push notifications** koppelen aan APNs (Apple) en FCM (Google) — moet apart van web push
2. **Deep links** (swiftbridge://) voor in-app navigatie vanuit emails
3. **Biometrische unlock** (Face ID / fingerprint) bij app open
4. **App rating prompt** na 3-5 succesvolle transacties
5. **Crash reporting** (Sentry of Bugsnag)

---

*Klaar voor morgen! Zorg dat Xcode + Android Studio al gedownload zijn — dat scheelt veel tijd.*

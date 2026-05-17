export const en = {
  // Algemeen
  app_naam: 'SwiftBridge',
  slogan: 'NL → TR in <5 min',
  laden: 'Loading...',
  opslaan: 'Save',
  annuleren: 'Cancel',
  bevestigen: 'Confirm',
  volgende: 'Next →',
  terug: '← Back',
  sluiten: 'Close',
  ja: 'Yes',
  nee: 'No',
  fout: 'Something went wrong',
  succes: 'Success!',
  vernieuwen: 'Refresh',

  // Navigatie / tabs
  tab_dashboard: 'Dashboard',
  tab_overmaken: 'Send',
  tab_verificatie: 'Verification',
  tab_alerts:      'Alerts',
  tab_profiel:     'Profile',

  // Landing page
  landing_titel: 'Money to Turkey',
  landing_ondertitel: 'in less than 5 minutes',
  landing_uitleg: 'Cheaper than your bank. Lightning fast. 24/7 available. With Turkish kimlik.',
  gratis_starten: 'Get started for free →',
  download_app: '📲 Download the app',
  inloggen: 'Log in',
  registreren: 'Register',

  // Login
  login_email: 'Email',
  login_wachtwoord: 'Password',
  login_naam: 'Full name',
  login_telefoon: 'Phone number',
  login_wachtwoord_vergeten: 'Forgot password?',
  login_min_8_tekens: 'Minimum 8 characters',
  login_account_aanmaken: '🚀 Create account',
  login_knop: '🔑 Log in',
  login_fout: 'Invalid email or password',

  // Dashboard
  dashboard_hallo: 'Hi {naam} 👋',
  dashboard_subtitel: 'Send money to Turkey',
  dashboard_kyc_vereist: 'KYC verification required',
  dashboard_kyc_uitleg: 'Verify your identity to send money. Takes less than 5 minutes.',
  dashboard_live_koers: 'Live exchange rate',
  dashboard_swiftbridge_koers: 'SwiftBridge rate',
  dashboard_na_kosten: 'after 2.2% fees',
  dashboard_500_ontvangt: '€500 recipient gets →',

  // Weeklimiet
  weeklimiet: 'Weekly limit',
  weeklimiet_resets: 'Resets every 7 days',
  weeklimiet_gebruikt: 'Used: {bedrag}',
  weeklimiet_beschikbaar: 'Remaining: {bedrag}',
  weeklimiet_limiet: 'Limit: {bedrag} per week',

  // Statistieken
  stats_totaal_verstuurd: 'Total sent',
  stats_ontvangen_try: 'Received in TRY',
  stats_transacties: 'Transactions',
  stats_gemiddeld: 'Average amount',

  // Transacties
  transacties: 'Transactions',
  transacties_geen: 'No transactions yet',
  transacties_eerste: 'Make your first transfer to Turkey',
  transactiedetails: 'Transaction details',
  status_voltooid: 'Completed',
  status_in_behandeling: 'In progress',
  status_mislukt: 'Failed',
  status_geannuleerd: 'Cancelled',
  filter_alle: 'All',
  filter_voltooid: '✅ Completed',
  filter_in_behandeling: '⏳ In progress',
  alle_tonen: 'Show all {n} transactions ↓',
  minder_tonen: 'Show less ↑',

  // KYC
  kyc_titel: 'KYC verification',
  kyc_persoonlijk: 'Personal',
  kyc_document: 'Document',
  kyc_selfie: 'Selfie',
  kyc_klaar: 'Done',
  kyc_goedgekeurd_titel: 'Verification complete!',
  kyc_goedgekeurd_uitleg: 'Hi {naam}, your identity is confirmed. You can now send money to Turkey.',
  kyc_in_behandeling_titel: 'Request being processed',
  kyc_in_behandeling_uitleg: 'Hi {naam}, we\'re checking your documents. Usually takes less than 5 minutes.',
  kyc_afgewezen_titel: 'Verification rejected',
  kyc_afgewezen_uitleg: 'Sorry {naam}, we couldn\'t confirm your identity. You can try again.',
  kyc_geblokkeerd_titel: 'Account blocked',
  kyc_geblokkeerd_uitleg: 'Your account is temporarily blocked. Please contact customer service.',
  kyc_opnieuw_proberen: '🔄 Try again',

  // Overmaken / Betalingen
  overmaken_titel: '💸 Send money',
  bedrag_eur: 'Amount (EUR)',
  wisselkoers: 'Exchange rate',
  transactiekosten: 'Transaction fee',
  ontvanger_krijgt: 'Recipient gets',
  naam_ontvanger: 'Recipient name',
  iban_ontvanger: 'Recipient IBAN',
  iban_geldig: '✅ Valid IBAN',
  iban_ongeldig: '❌ Invalid IBAN',
  betaalmethode_kiezen: 'Choose payment method →',
  controleren: 'Review →',
  bevestig_overmaken: '✅ Confirm transfer',
  bevestigen_betalen: '✓ Confirm & pay',
  geld_onderweg: 'Money on the way!',
  nieuwe_overschrijving: 'New transfer',

  // Uitloggen
  uitloggen: '🚪 Log out',

  // Voettekst
  beveiligd_via_jwt: '🔒 Secured by JWT · Rate limited · End-to-end encrypted',

  // ── API error messages (errorCode → text) ────────────────────────────────
  errors: {
    // General
    INVALID_INPUT: 'Invalid input. Please check the fields and try again.',
    NOT_FOUND: 'Not found.',
    UNAUTHORIZED: 'Your session expired. Please log in again.',
    FORBIDDEN: 'Access denied.',
    RATE_LIMITED: 'Too many requests. Please try again in a moment.',
    SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable.',
    CONFLICT: 'This action could not be completed.',

    // Transaction
    TX_INVALID_AMOUNT: 'Amount must be between €10 and €5,000.',
    TX_INVALID_IBAN: 'Invalid IBAN. Please check the recipient\'s IBAN.',
    TX_INSUFFICIENT_KYC: 'KYC verification is required before you can send money.',
    TX_VALUTA_NIET_BESCHIKBAAR: 'This currency is currently unavailable.',
    TX_BANK_NIET_BESCHIKBAAR: 'This bank is currently unavailable.',
    TX_WEEKLIMIET_BEREIKT: 'You\'ve reached your weekly limit. Please try again next week.',
    TX_NOT_FOUND: 'Transaction not found.',
    TX_PAPARA_INVALID: 'Papara details are invalid.',
    TX_SANCTIONED_RECIPIENT: 'This recipient cannot be paid. Please contact customer service.',
    TX_MISSING_FIELDS: 'Some required fields are missing.',

    // Payment
    PAY_MOLLIE_FOUT: 'The payment could not be created. Please try again.',
    PAY_WEBHOOK_INVALID: 'Invalid payment notification.',
    PAY_REEDS_VOLTOOID: 'A payment has already been started for this transaction.',
    PAY_NIET_GECONFIGUREERD: 'Payments are temporarily unavailable.',
    PAY_MISSING_FIELDS: 'transactieId and methode are required.',

    // KYC
    KYC_BEELD_FOUT: 'There\'s an issue with the photo. Try a clearer image.',
    KYC_DOCUMENT_AFGEWEZEN: 'Your document could not be approved. Please try again with a different document.',
    KYC_REEDS_INGEDIEND: 'Your KYC has already been approved.',
    KYC_GEBLOKKEERD: 'Your account is blocked. Please contact support.',
    KYC_NOT_FOUND: 'No KYC request found.',
    KYC_MISSING_FIELDS: 'Document type, document number and date of birth are required.',
    KYC_INVALID_DECISION: 'Invalid decision.',

    // iDIN
    IDIN_INIT_FOUT: 'iDIN could not be started. Please try again later.',
    IDIN_VERIFICATIE_AFGEWEZEN: 'iDIN verification failed or was cancelled.',
    IDIN_NOT_FOUND: 'iDIN result not found.',
    IDIN_MISSING_FIELDS: 'transactionId is required.',

    // Push
    PUSH_INVALID_SUBSCRIPTION: 'Push subscription is invalid.',
    PUSH_ENDPOINT_HIJACK: 'This device is already linked to another account.',
    PUSH_NIET_GECONFIGUREERD: 'Push notifications are not available.',
    PUSH_MISSING_ENDPOINT: 'Endpoint required.',
  },
};

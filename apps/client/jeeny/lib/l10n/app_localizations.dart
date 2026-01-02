import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static final Map<String, Map<String, String>> _localizedValues = {
    'ar': {
      // App
      'appName': 'جيني',
      'version': 'الإصدار: 1.0',
      
      // Onboarding
      'onboarding1Title': 'اختر المسار',
      'onboarding1Desc': 'بسهولة',
      'onboarding2Title': 'اطلب رحلة',
      'onboarding2Desc': 'بسرعة',
      'onboarding3Title': 'احصل على سيارتك',
      'onboarding3Desc': 'ببساطة',
      'onboarding4Title': 'وفر وقتك',
      'onboarding4Desc': 'معنا',
      'skip': 'تخطي',
      'next': 'التالي',
      'getStarted': 'ابدأ الآن',
      
      // Auth
      'welcome': 'مرحباً بك',
      'enterPhone': 'أدخل رقم هاتفك للمتابعة',
      'phoneNumber': 'رقم الهاتف',
      'sendOtp': 'إرسال الرمز',
      'verifyPhone': 'تأكيد رقم الهاتف',
      'verificationCode': 'رمز التحقق',
      'codeSentTo': 'تم إرسال رمز التحقق إلى',
      'resendCode': 'إعادة إرسال الرمز',
      'verify': 'تأكيد',
      'login': 'تسجيل الدخول',
      'signup': 'إنشاء حساب',
      'logout': 'تسجيل الخروج',
      
      // Profile
      'profile': 'الملف الشخصي',
      'editProfile': 'تعديل الملف',
      'fullName': 'الاسم الكامل',
      'email': 'البريد الإلكتروني',
      'save': 'حفظ',
      
      // Home
      'whereToGo': 'إلى أين؟',
      'customize': 'تخصيص',
      'newTrip': 'رحلة جديدة',
      'tapForLocation': 'اضغط للموقع',
      'home': 'المنزل',
      'work': 'العمل',
      
      // Booking
      'bookRide': 'حجز رحلة',
      'whereAreYou': 'أين أنت؟',
      'pickOff': 'نقطة الوصول',
      'whereToGoQuestion': 'إلى أين تريد الذهاب؟',
      'selectAddress': 'اختر العنوان',
      'favoritePlace': 'الأماكن المفضلة',
      'bookingDetails': 'تفاصيل الحجز',
      'findingDriver': 'جاري البحث عن سائق...',
      'driverArriving': 'السائق في الطريق',
      'rateDriver': 'قيم السائق',
      'cancelTrip': 'إلغاء الرحلة',
      
      // Services
      'intercityTravel': 'السفر بين المدن',
      'delivery': 'التوصيل',
      'foodDelivery': 'توصيل الطعام',
      'contracts': 'العقود',
      
      // Payment
      'wallet': 'المحفظة',
      'balance': 'الرصيد',
      'addMoney': 'إضافة رصيد',
      'paymentMethods': 'طرق الدفع',
      'cash': 'نقداً',
      'bankily': 'بنكيلي',
      'sedad': 'سداد',
      'masrvi': 'مصرفي',
      
      // History
      'history': 'السجل',
      'rideHistory': 'سجل الرحلات',
      'paymentHistory': 'سجل المدفوعات',
      
      // Notifications
      'notifications': 'الإشعارات',
      
      // Settings
      'settings': 'الإعدادات',
      'accountSettings': 'إعدادات الحساب',
      'language': 'اللغة',
      'arabic': 'العربية',
      'french': 'الفرنسية',
      'english': 'الإنجليزية',
      'faq': 'الأسئلة الشائعة',
      'support': 'الدعم',
      'about': 'حول التطبيق',
      
      // Chat
      'chat': 'المحادثة',
      'typeMessage': 'اكتب رسالة...',
      'call': 'اتصال',
      
      // Common
      'cancel': 'إلغاء',
      'confirm': 'تأكيد',
      'ok': 'موافق',
      'error': 'خطأ',
      'success': 'نجاح',
      'loading': 'جاري التحميل...',
      'retry': 'إعادة المحاولة',
      'noData': 'لا توجد بيانات',
      'search': 'بحث',
    },
    'fr': {
      'appName': 'Jeeny',
      'version': 'Version: 1.0',
      'onboarding1Title': 'Choisissez l\'itinéraire',
      'onboarding1Desc': 'Facilement',
      'onboarding2Title': 'Demandez un trajet',
      'onboarding2Desc': 'Rapidement',
      'onboarding3Title': 'Obtenez votre taxi',
      'onboarding3Desc': 'Simplement',
      'onboarding4Title': 'Gagnez du temps',
      'onboarding4Desc': 'Avec nous',
      'skip': 'Passer',
      'next': 'Suivant',
      'getStarted': 'Commencer',
      'welcome': 'Bienvenue',
      'enterPhone': 'Entrez votre numéro de téléphone',
      'phoneNumber': 'Numéro de téléphone',
      'sendOtp': 'Envoyer le code',
      'verifyPhone': 'Vérifier le téléphone',
      'verificationCode': 'Code de vérification',
      'codeSentTo': 'Code envoyé à',
      'resendCode': 'Renvoyer le code',
      'verify': 'Vérifier',
      'login': 'Connexion',
      'signup': 'Inscription',
      'logout': 'Déconnexion',
      'profile': 'Profil',
      'editProfile': 'Modifier le profil',
      'fullName': 'Nom complet',
      'email': 'Email',
      'save': 'Enregistrer',
      'whereToGo': 'Où aller?',
      'customize': 'Personnaliser',
      'newTrip': 'Nouveau trajet',
      'tapForLocation': 'Appuyez pour localiser',
      'home': 'Maison',
      'work': 'Travail',
      'bookRide': 'Réserver',
      'whereAreYou': 'Où êtes-vous?',
      'pickOff': 'Destination',
      'whereToGoQuestion': 'Où voulez-vous aller?',
      'selectAddress': 'Sélectionner l\'adresse',
      'favoritePlace': 'Lieux favoris',
      'bookingDetails': 'Détails de la réservation',
      'findingDriver': 'Recherche d\'un chauffeur...',
      'driverArriving': 'Le chauffeur arrive',
      'rateDriver': 'Noter le chauffeur',
      'cancelTrip': 'Annuler le trajet',
      'intercityTravel': 'Voyage interurbain',
      'delivery': 'Livraison',
      'foodDelivery': 'Livraison de nourriture',
      'contracts': 'Contrats',
      'wallet': 'Portefeuille',
      'balance': 'Solde',
      'addMoney': 'Ajouter de l\'argent',
      'paymentMethods': 'Méthodes de paiement',
      'cash': 'Espèces',
      'bankily': 'Bankily',
      'sedad': 'Sedad',
      'masrvi': 'Masrvi',
      'history': 'Historique',
      'rideHistory': 'Historique des trajets',
      'paymentHistory': 'Historique des paiements',
      'notifications': 'Notifications',
      'settings': 'Paramètres',
      'accountSettings': 'Paramètres du compte',
      'language': 'Langue',
      'arabic': 'Arabe',
      'french': 'Français',
      'english': 'Anglais',
      'faq': 'FAQ',
      'support': 'Support',
      'about': 'À propos',
      'chat': 'Chat',
      'typeMessage': 'Tapez un message...',
      'call': 'Appeler',
      'cancel': 'Annuler',
      'confirm': 'Confirmer',
      'ok': 'OK',
      'error': 'Erreur',
      'success': 'Succès',
      'loading': 'Chargement...',
      'retry': 'Réessayer',
      'noData': 'Aucune donnée',
      'search': 'Rechercher',
    },
    'en': {
      'appName': 'Jeeny',
      'version': 'Version: 1.0',
      'onboarding1Title': 'Choose The Route',
      'onboarding1Desc': 'Easily',
      'onboarding2Title': 'Request Ride',
      'onboarding2Desc': 'Quickly',
      'onboarding3Title': 'Get Your Taxi',
      'onboarding3Desc': 'Simply',
      'onboarding4Title': 'Save Your Time',
      'onboarding4Desc': 'With Us',
      'skip': 'Skip',
      'next': 'Next',
      'getStarted': 'Get Started',
      'welcome': 'Welcome',
      'enterPhone': 'Enter your phone number',
      'phoneNumber': 'Phone Number',
      'sendOtp': 'Send Code',
      'verifyPhone': 'Verify Phone',
      'verificationCode': 'Verification Code',
      'codeSentTo': 'Code sent to',
      'resendCode': 'Resend Code',
      'verify': 'Verify',
      'login': 'Login',
      'signup': 'Sign Up',
      'logout': 'Logout',
      'profile': 'Profile',
      'editProfile': 'Edit Profile',
      'fullName': 'Full Name',
      'email': 'Email',
      'save': 'Save',
      'whereToGo': 'Where to?',
      'customize': 'Customize',
      'newTrip': 'New Trip',
      'tapForLocation': 'Tap for location',
      'home': 'Home',
      'work': 'Work',
      'bookRide': 'Book Ride',
      'whereAreYou': 'Where are you?',
      'pickOff': 'Pick Off',
      'whereToGoQuestion': 'Where do you want to go?',
      'selectAddress': 'Select Address',
      'favoritePlace': 'Favorite Places',
      'bookingDetails': 'Booking Details',
      'findingDriver': 'Finding driver...',
      'driverArriving': 'Driver arriving',
      'rateDriver': 'Rate Driver',
      'cancelTrip': 'Cancel Trip',
      'intercityTravel': 'Intercity Travel',
      'delivery': 'Delivery',
      'foodDelivery': 'Food Delivery',
      'contracts': 'Contracts',
      'wallet': 'Wallet',
      'balance': 'Balance',
      'addMoney': 'Add Money',
      'paymentMethods': 'Payment Methods',
      'cash': 'Cash',
      'bankily': 'Bankily',
      'sedad': 'Sedad',
      'masrvi': 'Masrvi',
      'history': 'History',
      'rideHistory': 'Ride History',
      'paymentHistory': 'Payment History',
      'notifications': 'Notifications',
      'settings': 'Settings',
      'accountSettings': 'Account Settings',
      'language': 'Language',
      'arabic': 'Arabic',
      'french': 'French',
      'english': 'English',
      'faq': 'FAQ',
      'support': 'Support',
      'about': 'About',
      'chat': 'Chat',
      'typeMessage': 'Type a message...',
      'call': 'Call',
      'cancel': 'Cancel',
      'confirm': 'Confirm',
      'ok': 'OK',
      'error': 'Error',
      'success': 'Success',
      'loading': 'Loading...',
      'retry': 'Retry',
      'noData': 'No data',
      'search': 'Search',
    },
  };

  String _translate(String key) {
    return _localizedValues[locale.languageCode]?[key] ?? 
           _localizedValues['ar']?[key] ?? 
           key;
  }

  // App
  String get appName => _translate('appName');
  String get version => _translate('version');
  
  // Onboarding
  String get onboarding1Title => _translate('onboarding1Title');
  String get onboarding1Desc => _translate('onboarding1Desc');
  String get onboarding2Title => _translate('onboarding2Title');
  String get onboarding2Desc => _translate('onboarding2Desc');
  String get onboarding3Title => _translate('onboarding3Title');
  String get onboarding3Desc => _translate('onboarding3Desc');
  String get skip => _translate('skip');
  String get next => _translate('next');
  String get getStarted => _translate('getStarted');
  
  // Auth
  String get welcome => _translate('welcome');
  String get enterPhone => _translate('enterPhone');
  String get phoneNumber => _translate('phoneNumber');
  String get sendOtp => _translate('sendOtp');
  String get verifyPhone => _translate('verifyPhone');
  String get verificationCode => _translate('verificationCode');
  String get codeSentTo => _translate('codeSentTo');
  String get resendCode => _translate('resendCode');
  String get verify => _translate('verify');
  String get login => _translate('login');
  String get signup => _translate('signup');
  String get logout => _translate('logout');
  
  // Profile
  String get profile => _translate('profile');
  String get editProfile => _translate('editProfile');
  String get fullName => _translate('fullName');
  String get email => _translate('email');
  String get save => _translate('save');
  
  // Home
  String get whereToGo => _translate('whereToGo');
  String get customize => _translate('customize');
  String get newTrip => _translate('newTrip');
  String get tapForLocation => _translate('tapForLocation');
  String get home => _translate('home');
  String get work => _translate('work');
  
  // Booking
  String get bookRide => _translate('bookRide');
  String get whereAreYou => _translate('whereAreYou');
  String get pickOff => _translate('pickOff');
  String get whereToGoQuestion => _translate('whereToGoQuestion');
  String get selectAddress => _translate('selectAddress');
  String get favoritePlace => _translate('favoritePlace');
  String get bookingDetails => _translate('bookingDetails');
  String get findingDriver => _translate('findingDriver');
  String get driverArriving => _translate('driverArriving');
  String get rateDriver => _translate('rateDriver');
  String get cancelTrip => _translate('cancelTrip');
  
  // Services
  String get intercityTravel => _translate('intercityTravel');
  String get delivery => _translate('delivery');
  String get foodDelivery => _translate('foodDelivery');
  String get contracts => _translate('contracts');
  
  // Payment
  String get wallet => _translate('wallet');
  String get balance => _translate('balance');
  String get addMoney => _translate('addMoney');
  String get paymentMethods => _translate('paymentMethods');
  String get cash => _translate('cash');
  String get bankily => _translate('bankily');
  String get sedad => _translate('sedad');
  String get masrvi => _translate('masrvi');
  
  // History
  String get history => _translate('history');
  String get rideHistory => _translate('rideHistory');
  String get paymentHistory => _translate('paymentHistory');
  
  // Notifications
  String get notifications => _translate('notifications');
  
  // Settings
  String get settings => _translate('settings');
  String get accountSettings => _translate('accountSettings');
  String get language => _translate('language');
  String get arabic => _translate('arabic');
  String get french => _translate('french');
  String get english => _translate('english');
  String get faq => _translate('faq');
  String get support => _translate('support');
  String get about => _translate('about');
  
  // Chat
  String get chat => _translate('chat');
  String get typeMessage => _translate('typeMessage');
  String get call => _translate('call');
  
  // Common
  String get cancel => _translate('cancel');
  String get confirm => _translate('confirm');
  String get ok => _translate('ok');
  String get error => _translate('error');
  String get success => _translate('success');
  String get loading => _translate('loading');
  String get retry => _translate('retry');
  String get noData => _translate('noData');
  String get search => _translate('search');
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['ar', 'fr', 'en'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

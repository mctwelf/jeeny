import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'config/theme.dart';
import 'config/routes.dart';
import 'l10n/app_localizations.dart';
import 'providers/user_provider.dart';
import 'screens/splash/splash_screen.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<UserProvider>(
      builder: (context, userProvider, _) {
        return MaterialApp(
          title: 'جيني',
          debugShowCheckedModeBanner: false,
          
          // Theme
          theme: AppTheme.lightTheme,
          
          // Localization - Arabic as default
          locale: userProvider.locale,
          supportedLocales: const [
            Locale('ar'), // Arabic - default
            Locale('fr'), // French
            Locale('en'), // English
          ],
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          
          // Routes
          onGenerateRoute: AppRoutes.onGenerateRoute,
          home: const SplashScreen(),
        );
      },
    );
  }
}

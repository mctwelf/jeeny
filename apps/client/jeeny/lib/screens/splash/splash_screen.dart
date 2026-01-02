import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_text.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Timer(
      const Duration(seconds: 3),
      () => _checkAuth(),
    );
  }

  Future<void> _checkAuth() async {
    if (!mounted) return;
    
    final authProvider = context.read<AuthProvider>();
    await authProvider.checkAuthStatus();
    
    if (!mounted) return;
    
    if (authProvider.isAuthenticated) {
      Navigator.pushReplacementNamed(context, Routes.home);
    } else {
      Navigator.pushReplacementNamed(context, Routes.onboarding);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          Container(
            height: double.infinity,
            width: double.infinity,
            decoration: const BoxDecoration(
              color: AppTheme.primaryColor,
              image: DecorationImage(
                image: AssetImage('assets/images/splichpic.png'),
                fit: BoxFit.fill,
              ),
            ),
          ),
          Positioned(
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(),
                Column(
                  children: [
                    Image.asset('assets/images/logo.png'),
                    const SizedBox(height: 16),
                    const CustomText(
                      text: 'جيني',
                      size: 32,
                      weight: FontWeight.w700,
                    ),
                  ],
                ),
                const CustomText(
                  text: 'الإصدار: 1.0',
                  size: 14,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

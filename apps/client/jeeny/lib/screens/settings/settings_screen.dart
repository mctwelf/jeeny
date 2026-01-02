import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/user_provider.dart';
import '../../widgets/widgets.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userProvider = context.watch<UserProvider>();

    return Scaffold(
      backgroundColor: const Color(0xfff5f6fa),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 58),
            _buildHeader(context),
            const SizedBox(height: 42),
            CustomContainer(
              height: 400,
              width: 319,
              circular: 33,
              color: AppTheme.backgroundColor,
              child: Padding(
                padding: const EdgeInsets.all(15.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const CustomText(
                      text: '    الإعدادات العامة',
                      color: Colors.grey,
                    ),
                    const SizedBox(height: 20),

                    // Language selection
                    _buildSettingItem(
                      title: 'اللغة',
                      trailing: DropdownButton<Locale>(
                        value: userProvider.locale,
                        underline: const SizedBox(),
                        items: const [
                          DropdownMenuItem(
                            value: Locale('ar'),
                            child: Text('العربية'),
                          ),
                          DropdownMenuItem(
                            value: Locale('fr'),
                            child: Text('Français'),
                          ),
                          DropdownMenuItem(
                            value: Locale('en'),
                            child: Text('English'),
                          ),
                        ],
                        onChanged: (locale) {
                          if (locale != null) {
                            userProvider.setLocale(locale);
                          }
                        },
                      ),
                    ),
                    const Divider(),

                    // Notifications
                    _buildSettingItem(
                      title: 'الإشعارات',
                      trailing: Switch(
                        value: true, // TODO: Get from user preferences
                        onChanged: (value) {
                          // TODO: Update notification preference
                        },
                        activeColor: Colors.white,
                        activeTrackColor: AppTheme.primaryColor,
                      ),
                    ),
                    const Divider(),

                    // SMS Notifications
                    _buildSettingItem(
                      title: 'إشعارات الرسائل',
                      trailing: Switch(
                        value: true, // TODO: Get from user preferences
                        onChanged: (value) {
                          // TODO: Update SMS notification preference
                        },
                        activeColor: Colors.white,
                        activeTrackColor: AppTheme.primaryColor,
                      ),
                    ),
                    const Divider(),

                    // About
                    ListTile(
                      onTap: () {
                        _showAboutDialog(context);
                      },
                      title: const CustomText(
                        text: 'حول التطبيق',
                        size: 16,
                        weight: FontWeight.w400,
                      ),
                      trailing: const Icon(
                        Icons.arrow_forward_ios,
                        size: 12,
                        color: Colors.grey,
                      ),
                    ),
                    const Divider(),

                    // Privacy Policy
                    ListTile(
                      onTap: () {
                        // TODO: Navigate to privacy policy
                      },
                      title: const CustomText(
                        text: 'سياسة الخصوصية',
                        size: 16,
                        weight: FontWeight.w400,
                      ),
                      trailing: const Icon(
                        Icons.arrow_forward_ios,
                        size: 12,
                        color: Colors.grey,
                      ),
                    ),
                    const Divider(),

                    // Terms of Service
                    ListTile(
                      onTap: () {
                        // TODO: Navigate to terms
                      },
                      title: const CustomText(
                        text: 'شروط الاستخدام',
                        size: 16,
                        weight: FontWeight.w400,
                      ),
                      trailing: const Icon(
                        Icons.arrow_forward_ios,
                        size: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // App version
            const CustomText(
              text: 'الإصدار 1.0.0',
              color: Colors.grey,
              size: 12,
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_ios),
          ),
          const Expanded(
            child: Center(
              child: CustomText(
                text: 'الإعدادات',
                size: 18,
                weight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 48),
        ],
      ),
    );
  }

  Widget _buildSettingItem({
    required String title,
    required Widget trailing,
  }) {
    return ListTile(
      title: CustomText(
        text: title,
        size: 16,
        weight: FontWeight.w400,
      ),
      trailing: trailing,
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Image.asset(
              'assets/images/logo.png',
              width: 40,
              height: 40,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.local_taxi,
                size: 40,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(width: 10),
            const CustomText(
              text: 'جيني',
              size: 20,
              weight: FontWeight.w700,
            ),
          ],
        ),
        content: const CustomText(
          text: 'تطبيق جيني للنقل والتوصيل\nالإصدار 1.0.0\n\n© 2024 جيني. جميع الحقوق محفوظة.',
          align: TextAlign.center,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const CustomText(text: 'حسناً'),
          ),
        ],
      ),
    );
  }
}

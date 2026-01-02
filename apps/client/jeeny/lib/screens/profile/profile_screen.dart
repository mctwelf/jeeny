import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/user_provider.dart';
import '../../widgets/widgets.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userProvider = context.watch<UserProvider>();
    final authProvider = context.watch<AuthProvider>();
    final user = userProvider.user;

    return Scaffold(
      backgroundColor: const Color(0xfff5f6fa),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 58),
            _buildHeader(context),
            const SizedBox(height: 42),
            CustomContainer(
              height: 520,
              width: 319,
              circular: 33,
              color: AppTheme.backgroundColor,
              child: Padding(
                padding: const EdgeInsets.all(15.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Profile header
                    ListTile(
                      onTap: () {
                        Navigator.pushNamed(context, Routes.editAccount);
                      },
                      leading: Container(
                        height: 60,
                        width: 60,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.white),
                          color: AppTheme.offButtonColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: user?.photoUrl != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(20),
                                child: Image.network(
                                  user!.photoUrl!,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : const Icon(Icons.person, size: 30),
                      ),
                      title: CustomText(
                        text: user?.fullName ?? 'المستخدم',
                        size: 18,
                        weight: FontWeight.w700,
                      ),
                      subtitle: CustomText(
                        text: authProvider.phoneNumber ?? '',
                      ),
                    ),
                    const SizedBox(height: 10),
                    const CustomText(
                      text: '    المعلومات الشخصية',
                      color: Colors.grey,
                    ),
                    const SizedBox(height: 10),

                    // Menu items
                    _buildMenuItem(
                      context,
                      icon: 'images/Wallet-Icon.png',
                      title: 'محفظتي',
                      onTap: () => Navigator.pushNamed(context, Routes.myWallet),
                    ),
                    _buildMenuItem(
                      context,
                      icon: 'images/History-Icon.png',
                      title: 'سجل الرحلات',
                      onTap: () => Navigator.pushNamed(context, Routes.rideHistory),
                    ),
                    _buildMenuItem(
                      context,
                      icon: 'images/Payment-Icon.png',
                      title: 'طرق الدفع',
                      onTap: () => Navigator.pushNamed(context, Routes.paymentAccount),
                    ),
                    _buildMenuItem(
                      context,
                      icon: 'images/Location-Icon.png',
                      title: 'العناوين المحفوظة',
                      onTap: () => Navigator.pushNamed(context, '/saved-addresses'),
                    ),
                    _buildMenuItem(
                      context,
                      icon: 'images/Settings-Icon.png',
                      title: 'الإعدادات',
                      onTap: () => Navigator.pushNamed(context, Routes.accountSetting),
                    ),

                    const Divider(),

                    // Notifications toggle
                    ListTile(
                      leading: CustomContainer(
                        height: 30,
                        width: 30,
                        circular: 10,
                        color: Colors.pink.shade50,
                        child: const Icon(
                          Icons.notifications_outlined,
                          size: 20,
                          color: Colors.pink,
                        ),
                      ),
                      title: const CustomText(
                        text: 'إشعارات العروض',
                        size: 16,
                        weight: FontWeight.w400,
                      ),
                      trailing: Switch(
                        value: user?.preferences?.notificationsEnabled ?? true,
                        onChanged: (value) {
                          // TODO: Update notification preference
                        },
                        activeColor: Colors.white,
                        activeTrackColor: AppTheme.primaryColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Logout button
            TextButton.icon(
              onPressed: () => _showLogoutDialog(context),
              icon: const Icon(Icons.logout, color: Colors.red),
              label: const CustomText(
                text: 'تسجيل الخروج',
                color: Colors.red,
                weight: FontWeight.w600,
              ),
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
                text: 'الحساب',
                size: 18,
                weight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 48), // Balance the back button
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required String icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Column(
      children: [
        ListTile(
          onTap: onTap,
          leading: CustomContainer(
            height: 30,
            width: 30,
            circular: 10,
            color: Colors.pink.shade50,
            child: Image.asset(
              icon,
              width: 20,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.circle,
                size: 20,
                color: Colors.pink,
              ),
            ),
          ),
          title: CustomText(
            text: title,
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
      ],
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const CustomText(
          text: 'تسجيل الخروج',
          weight: FontWeight.w700,
        ),
        content: const CustomText(
          text: 'هل أنت متأكد من تسجيل الخروج؟',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const CustomText(text: 'إلغاء'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await context.read<AuthProvider>().signOut();
              context.read<UserProvider>().clearUser();
              if (context.mounted) {
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  Routes.login,
                  (route) => false,
                );
              }
            },
            child: const CustomText(
              text: 'تسجيل الخروج',
              color: Colors.red,
            ),
          ),
        ],
      ),
    );
  }
}

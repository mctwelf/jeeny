import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/user.dart';
import '../../providers/user_provider.dart';
import '../../widgets/widgets.dart';

class SavedAddressesScreen extends StatelessWidget {
  const SavedAddressesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userProvider = context.watch<UserProvider>();
    final savedPlaces = userProvider.user?.savedPlaces ?? [];

    return Scaffold(
      backgroundColor: const Color(0xfff5f6fa),
      body: Column(
        children: [
          const SizedBox(height: 58),
          _buildHeader(context),
          const SizedBox(height: 20),
          Expanded(
            child: savedPlaces.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: savedPlaces.length,
                    itemBuilder: (context, index) {
                      return _buildAddressCard(
                        context,
                        savedPlaces[index],
                        userProvider,
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddAddressDialog(context),
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
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
                text: 'العناوين المحفوظة',
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

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.location_off_outlined,
            size: 80,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 20),
          const CustomText(
            text: 'لا توجد عناوين محفوظة',
            size: 18,
            color: Colors.grey,
          ),
          const SizedBox(height: 10),
          const CustomText(
            text: 'أضف عناوينك المفضلة للوصول السريع',
            size: 14,
            color: Colors.grey,
          ),
        ],
      ),
    );
  }

  Widget _buildAddressCard(
    BuildContext context,
    SavedAddress address,
    UserProvider userProvider,
  ) {
    IconData icon;
    Color iconColor;

    switch (address.type) {
      case 'home':
        icon = Icons.home;
        iconColor = Colors.blue;
        break;
      case 'work':
        icon = Icons.work;
        iconColor = Colors.orange;
        break;
      default:
        icon = Icons.location_on;
        iconColor = Colors.pink;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: CustomContainer(
          height: 45,
          width: 45,
          circular: 12,
          color: iconColor.withOpacity(0.1),
          child: Icon(icon, color: iconColor),
        ),
        title: CustomText(
          text: address.label,
          size: 16,
          weight: FontWeight.w600,
        ),
        subtitle: CustomText(
          text: address.address.formattedAddress ?? '',
          size: 12,
          color: Colors.grey,
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline, color: Colors.red),
          onPressed: () => _confirmDelete(context, address, userProvider),
        ),
      ),
    );
  }

  void _confirmDelete(
    BuildContext context,
    SavedAddress address,
    UserProvider userProvider,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const CustomText(
          text: 'حذف العنوان',
          weight: FontWeight.w700,
        ),
        content: CustomText(
          text: 'هل تريد حذف "${address.label}"؟',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const CustomText(text: 'إلغاء'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await userProvider.removeSavedAddress(address.id);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(e.toString()),
                      backgroundColor: AppTheme.errorColor,
                    ),
                  );
                }
              }
            },
            child: const CustomText(
              text: 'حذف',
              color: Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  void _showAddAddressDialog(BuildContext context) {
    // TODO: Implement add address dialog with map picker
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const CustomText(
          text: 'إضافة عنوان',
          weight: FontWeight.w700,
        ),
        content: const CustomText(
          text: 'سيتم إضافة هذه الميزة قريباً',
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

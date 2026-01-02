import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/payment.dart';
import '../../models/enums.dart' as enums;
import '../../providers/payment_provider.dart';

class PaymentMethodsScreen extends StatefulWidget {
  const PaymentMethodsScreen({super.key});

  @override
  State<PaymentMethodsScreen> createState() => _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends State<PaymentMethodsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PaymentProvider>().loadPaymentMethods();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('طرق الدفع'),
      ),
      body: Consumer<PaymentProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.paymentMethods.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildCashOption(),
              const SizedBox(height: 16),
              Text(
                'المحافظ الإلكترونية',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              ...provider.paymentMethods.map((method) => _buildPaymentMethodCard(method)),
              const SizedBox(height: 16),
              _buildAddMethodButton(),
            ],
          );
        },
      ),
    );
  }


  Widget _buildCashOption() {
    return Card(
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.successColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.money, color: AppTheme.successColor),
        ),
        title: const Text('نقداً'),
        subtitle: const Text('الدفع للسائق مباشرة'),
        trailing: const Icon(Icons.check_circle, color: AppTheme.successColor),
      ),
    );
  }

  Widget _buildPaymentMethodCard(PaymentMethod method) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: _getProviderIcon(method.provider),
        ),
        title: Text(_getProviderName(method.provider)),
        subtitle: Text(method.maskedNumber ?? method.accountNumber ?? ''),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (method.isDefault)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'افتراضي',
                  style: TextStyle(
                    fontSize: 10,
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            PopupMenuButton<String>(
              onSelected: (value) => _handleMethodAction(value, method),
              itemBuilder: (context) => [
                if (!method.isDefault)
                  const PopupMenuItem(
                    value: 'default',
                    child: Row(
                      children: [
                        Icon(Icons.check_circle_outline, size: 20),
                        SizedBox(width: 8),
                        Text('تعيين كافتراضي'),
                      ],
                    ),
                  ),
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, size: 20, color: AppTheme.errorColor),
                      SizedBox(width: 8),
                      Text('حذف', style: TextStyle(color: AppTheme.errorColor)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddMethodButton() {
    return OutlinedButton.icon(
      onPressed: () => _showAddMethodDialog(),
      icon: const Icon(Icons.add),
      label: const Text('إضافة طريقة دفع'),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.all(16),
      ),
    );
  }

  void _handleMethodAction(String action, PaymentMethod method) {
    final provider = context.read<PaymentProvider>();
    
    switch (action) {
      case 'default':
        provider.setDefaultPaymentMethod(method.id);
        break;
      case 'delete':
        _showDeleteConfirmation(method);
        break;
    }
  }

  void _showDeleteConfirmation(PaymentMethod method) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('حذف طريقة الدفع'),
        content: Text('هل أنت متأكد من حذف ${_getProviderName(method.provider)}؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorColor),
            onPressed: () {
              Navigator.pop(context);
              context.read<PaymentProvider>().removePaymentMethod(method.id);
            },
            child: const Text('حذف'),
          ),
        ],
      ),
    );
  }

  void _showAddMethodDialog() {
    enums.PaymentProvider? selectedProvider;
    final accountController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Container(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: AppTheme.lineContainer()),
                const SizedBox(height: 16),
                Text(
                  'إضافة طريقة دفع',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                Text(
                  'اختر مزود الخدمة',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    enums.PaymentProvider.bankily,
                    enums.PaymentProvider.sedad,
                    enums.PaymentProvider.masrvi,
                  ].map((provider) {
                    final isSelected = selectedProvider == provider;
                    return ChoiceChip(
                      label: Text(_getProviderName(provider)),
                      selected: isSelected,
                      onSelected: (selected) {
                        setModalState(() => selectedProvider = selected ? provider : null);
                      },
                      avatar: _getProviderIcon(provider),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: accountController,
                  decoration: const InputDecoration(
                    labelText: 'رقم الحساب',
                    hintText: 'أدخل رقم الحساب',
                    prefixIcon: Icon(Icons.phone),
                  ),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: selectedProvider != null && accountController.text.isNotEmpty
                        ? () {
                            Navigator.pop(context);
                            context.read<PaymentProvider>().addPaymentMethod(
                                  provider: selectedProvider!,
                                  accountNumber: accountController.text,
                                );
                          }
                        : null,
                    child: const Text('إضافة'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _getProviderIcon(enums.PaymentProvider provider) {
    IconData icon;
    Color color;

    switch (provider) {
      case enums.PaymentProvider.bankily:
        icon = Icons.account_balance;
        color = Colors.green;
        break;
      case enums.PaymentProvider.sedad:
        icon = Icons.payment;
        color = Colors.blue;
        break;
      case enums.PaymentProvider.masrvi:
        icon = Icons.credit_card;
        color = Colors.orange;
        break;
      case enums.PaymentProvider.cash:
        icon = Icons.money;
        color = AppTheme.successColor;
        break;
    }

    return Icon(icon, color: color);
  }

  String _getProviderName(enums.PaymentProvider provider) {
    switch (provider) {
      case enums.PaymentProvider.bankily:
        return 'بنكيلي';
      case enums.PaymentProvider.sedad:
        return 'سداد';
      case enums.PaymentProvider.masrvi:
        return 'مصرفي';
      case enums.PaymentProvider.cash:
        return 'نقداً';
    }
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/enums.dart' as enums;
import '../../providers/payment_provider.dart';

class PaymentScreen extends StatefulWidget {
  final String rideId;
  final double amount;
  final String? description;

  const PaymentScreen({
    super.key,
    required this.rideId,
    required this.amount,
    this.description,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  enums.PaymentProvider _selectedProvider = enums.PaymentProvider.cash;
  final _promoController = TextEditingController();
  double _discount = 0;
  bool _promoApplied = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PaymentProvider>().loadPaymentMethods();
    });
  }

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  double get _finalAmount => widget.amount - _discount;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الدفع'),
      ),
      body: Consumer<PaymentProvider>(
        builder: (context, provider, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildAmountCard(),
                const SizedBox(height: 16),
                _buildPromoSection(provider),
                const SizedBox(height: 24),
                Text(
                  'طريقة الدفع',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                _buildPaymentOptions(provider),
                const SizedBox(height: 24),
                _buildPayButton(provider),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildAmountCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            if (widget.description != null) ...[
              Text(
                widget.description!,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
            ],
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('المبلغ'),
                Text(AppTheme.formatCurrency(widget.amount)),
              ],
            ),
            if (_discount > 0) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('الخصم', style: TextStyle(color: AppTheme.successColor)),
                  Text(
                    '- ${AppTheme.formatCurrency(_discount)}',
                    style: const TextStyle(color: AppTheme.successColor),
                  ),
                ],
              ),
            ],
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'الإجمالي',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  AppTheme.formatCurrency(_finalAmount),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPromoSection(PaymentProvider provider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'كود الخصم',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _promoController,
                    enabled: !_promoApplied,
                    decoration: InputDecoration(
                      hintText: 'أدخل كود الخصم',
                      prefixIcon: const Icon(Icons.local_offer),
                      suffixIcon: _promoApplied
                          ? const Icon(Icons.check_circle, color: AppTheme.successColor)
                          : null,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: _promoApplied
                      ? null
                      : () => _applyPromoCode(provider),
                  child: provider.isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(_promoApplied ? 'تم' : 'تطبيق'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentOptions(PaymentProvider provider) {
    return Column(
      children: [
        _buildPaymentOption(
          enums.PaymentProvider.cash,
          'نقداً',
          'الدفع للسائق مباشرة',
          Icons.money,
          Colors.green,
        ),
        const SizedBox(height: 8),
        _buildPaymentOption(
          enums.PaymentProvider.bankily,
          'بنكيلي',
          'الدفع عبر بنكيلي',
          Icons.account_balance,
          Colors.green.shade700,
        ),
        const SizedBox(height: 8),
        _buildPaymentOption(
          enums.PaymentProvider.sedad,
          'سداد',
          'الدفع عبر سداد',
          Icons.payment,
          Colors.blue,
        ),
        const SizedBox(height: 8),
        _buildPaymentOption(
          enums.PaymentProvider.masrvi,
          'مصرفي',
          'الدفع عبر مصرفي',
          Icons.credit_card,
          Colors.orange,
        ),
      ],
    );
  }

  Widget _buildPaymentOption(
    enums.PaymentProvider provider,
    String title,
    String subtitle,
    IconData icon,
    Color color,
  ) {
    final isSelected = _selectedProvider == provider;

    return InkWell(
      onTap: () => setState(() => _selectedProvider = provider),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
          color: isSelected ? AppTheme.primaryColor.withOpacity(0.05) : null,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: isSelected ? FontWeight.bold : null,
                        ),
                  ),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppTheme.primaryColor),
          ],
        ),
      ),
    );
  }

  Widget _buildPayButton(PaymentProvider provider) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: provider.isLoading ? null : () => _processPayment(provider),
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.all(16),
        ),
        child: provider.isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Text(
                _selectedProvider == enums.PaymentProvider.cash
                    ? 'تأكيد الدفع نقداً'
                    : 'الدفع ${AppTheme.formatCurrency(_finalAmount)}',
              ),
      ),
    );
  }

  Future<void> _applyPromoCode(PaymentProvider provider) async {
    if (_promoController.text.isEmpty) return;

    final result = await provider.applyPromoCode(
      _promoController.text,
      rideId: widget.rideId,
      amount: widget.amount,
    );

    if (result != null && mounted) {
      setState(() {
        _discount = (result['discount'] as num?)?.toDouble() ?? 0;
        _promoApplied = true;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تطبيق كود الخصم بنجاح')),
      );
    } else if (provider.error != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error!)),
      );
      provider.clearError();
    }
  }

  Future<void> _processPayment(PaymentProvider provider) async {
    if (_selectedProvider == enums.PaymentProvider.cash) {
      // Cash payment - just confirm
      Navigator.pop(context, {'success': true, 'method': 'cash'});
      return;
    }

    // Mobile money payment
    final transaction = await provider.initiatePayment(
      rideId: widget.rideId,
      provider: _selectedProvider,
      amount: _finalAmount,
    );

    if (transaction != null && mounted) {
      // Show confirmation dialog for mobile money
      _showMobileMoneyConfirmation(provider, transaction.id);
    } else if (provider.error != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error!)),
      );
      provider.clearError();
    }
  }

  void _showMobileMoneyConfirmation(PaymentProvider provider, String transactionId) {
    final codeController = TextEditingController();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('تأكيد الدفع'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'تم إرسال طلب الدفع إلى ${_getProviderName(_selectedProvider)}. '
              'يرجى تأكيد الدفع من تطبيق ${_getProviderName(_selectedProvider)} '
              'ثم إدخال رمز التأكيد.',
            ),
            const SizedBox(height: 16),
            TextField(
              controller: codeController,
              decoration: const InputDecoration(
                labelText: 'رمز التأكيد',
                hintText: 'أدخل رمز التأكيد',
              ),
              keyboardType: TextInputType.number,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              provider.clearCurrentTransaction();
            },
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final confirmed = await provider.confirmPayment(
                transactionId,
                confirmationCode: codeController.text,
              );
              if (confirmed != null && mounted) {
                Navigator.pop(context, {'success': true, 'transaction': confirmed});
              }
            },
            child: const Text('تأكيد'),
          ),
        ],
      ),
    );
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

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../models/payment.dart';
import '../../models/enums.dart' as enums;
import '../../providers/payment_provider.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<PaymentProvider>();
      provider.loadWallet();
      provider.loadTransactions(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('محفظتي'),
      ),
      body: Consumer<PaymentProvider>(
        builder: (context, provider, _) {
          return RefreshIndicator(
            onRefresh: () async {
              await provider.loadWallet();
              await provider.loadTransactions(refresh: true);
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildBalanceCard(provider),
                const SizedBox(height: 16),
                _buildActionButtons(provider),
                const SizedBox(height: 24),
                Text(
                  'سجل المعاملات',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                _buildTransactionsList(provider),
              ],
            ),
          );
        },
      ),
    );
  }


  Widget _buildBalanceCard(PaymentProvider provider) {
    final wallet = provider.wallet;
    final balance = wallet?.balance.amount ?? 0.0;

    return Card(
      color: AppTheme.primaryColor,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text(
              'الرصيد المتاح',
              style: TextStyle(
                color: Colors.black54,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              AppTheme.formatCurrency(balance),
              style: const TextStyle(
                color: Colors.black,
                fontSize: 32,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (wallet != null && !wallet.isActive) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'المحفظة غير نشطة',
                  style: TextStyle(color: Colors.red, fontSize: 12),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(PaymentProvider provider) {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => _showTopUpDialog(provider),
            icon: const Icon(Icons.add),
            label: const Text('شحن'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.all(16),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => _showWithdrawDialog(provider),
            icon: const Icon(Icons.arrow_downward),
            label: const Text('سحب'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.all(16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTransactionsList(PaymentProvider provider) {
    if (provider.isLoading && provider.transactions.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (provider.transactions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(Icons.receipt_long, size: 64, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              Text(
                'لا توجد معاملات',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        ...provider.transactions.map((t) => _buildTransactionCard(t)),
        if (provider.hasMoreTransactions)
          TextButton(
            onPressed: () => provider.loadTransactions(),
            child: provider.isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('تحميل المزيد'),
          ),
      ],
    );
  }

  Widget _buildTransactionCard(Transaction transaction) {
    final isCredit = transaction.type == enums.TransactionType.topUp ||
        transaction.type == enums.TransactionType.refund;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: (isCredit ? AppTheme.successColor : AppTheme.errorColor)
                .withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            isCredit ? Icons.arrow_downward : Icons.arrow_upward,
            color: isCredit ? AppTheme.successColor : AppTheme.errorColor,
          ),
        ),
        title: Text(_getTransactionTypeLabel(transaction.type)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              DateFormat('dd/MM/yyyy HH:mm', 'ar').format(transaction.createdAt),
              style: Theme.of(context).textTheme.bodySmall,
            ),
            _buildStatusChip(transaction.status),
          ],
        ),
        trailing: Text(
          '${isCredit ? '+' : '-'} ${AppTheme.formatCurrency(transaction.amount.amount)}',
          style: TextStyle(
            color: isCredit ? AppTheme.successColor : AppTheme.errorColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        isThreeLine: true,
      ),
    );
  }

  Widget _buildStatusChip(enums.TransactionStatus status) {
    Color color;
    String label;

    switch (status) {
      case enums.TransactionStatus.pending:
        color = Colors.orange;
        label = 'قيد الانتظار';
        break;
      case enums.TransactionStatus.completed:
        color = AppTheme.successColor;
        label = 'مكتمل';
        break;
      case enums.TransactionStatus.failed:
        color = AppTheme.errorColor;
        label = 'فشل';
        break;
      case enums.TransactionStatus.refunded:
        color = Colors.blue;
        label = 'مسترد';
        break;
    }

    return Container(
      margin: const EdgeInsets.only(top: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 10),
      ),
    );
  }

  void _showTopUpDialog(PaymentProvider provider) {
    enums.PaymentProvider? selectedProvider;
    final amountController = TextEditingController();

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
                  'شحن المحفظة',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: amountController,
                  decoration: const InputDecoration(
                    labelText: 'المبلغ',
                    suffixText: 'MRU',
                    prefixIcon: Icon(Icons.money),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                Text(
                  'طريقة الدفع',
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
                  ].map((p) {
                    final isSelected = selectedProvider == p;
                    return ChoiceChip(
                      label: Text(_getProviderName(p)),
                      selected: isSelected,
                      onSelected: (selected) {
                        setModalState(() => selectedProvider = selected ? p : null);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: selectedProvider != null &&
                            amountController.text.isNotEmpty
                        ? () {
                            Navigator.pop(context);
                            provider.topUpWallet(
                              provider: selectedProvider!,
                              amount: double.tryParse(amountController.text) ?? 0,
                            );
                          }
                        : null,
                    child: const Text('شحن'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showWithdrawDialog(PaymentProvider provider) {
    enums.PaymentProvider? selectedProvider;
    final amountController = TextEditingController();
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
                  'سحب من المحفظة',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: amountController,
                  decoration: const InputDecoration(
                    labelText: 'المبلغ',
                    suffixText: 'MRU',
                    prefixIcon: Icon(Icons.money),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: accountController,
                  decoration: const InputDecoration(
                    labelText: 'رقم الحساب',
                    prefixIcon: Icon(Icons.phone),
                  ),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                Text(
                  'طريقة السحب',
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
                  ].map((p) {
                    final isSelected = selectedProvider == p;
                    return ChoiceChip(
                      label: Text(_getProviderName(p)),
                      selected: isSelected,
                      onSelected: (selected) {
                        setModalState(() => selectedProvider = selected ? p : null);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: selectedProvider != null &&
                            amountController.text.isNotEmpty &&
                            accountController.text.isNotEmpty
                        ? () {
                            Navigator.pop(context);
                            provider.withdrawFromWallet(
                              provider: selectedProvider!,
                              amount: double.tryParse(amountController.text) ?? 0,
                              accountNumber: accountController.text,
                            );
                          }
                        : null,
                    child: const Text('سحب'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getTransactionTypeLabel(enums.TransactionType type) {
    switch (type) {
      case enums.TransactionType.payment:
        return 'دفع';
      case enums.TransactionType.topUp:
        return 'شحن';
      case enums.TransactionType.withdrawal:
        return 'سحب';
      case enums.TransactionType.refund:
        return 'استرداد';
    }
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

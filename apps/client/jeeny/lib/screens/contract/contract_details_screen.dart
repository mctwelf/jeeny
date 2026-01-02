import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../models/contract.dart';
import '../../models/enums.dart';
import '../../providers/contract_provider.dart';

class ContractDetailsScreen extends StatelessWidget {
  const ContractDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تفاصيل العقد'),
        actions: [
          Consumer<ContractProvider>(
            builder: (context, provider, _) {
              final contract = provider.selectedContract;
              if (contract == null) return const SizedBox.shrink();
              
              return PopupMenuButton<String>(
                onSelected: (value) => _handleMenuAction(context, value, contract),
                itemBuilder: (context) => [
                  if (contract.status == ContractStatus.active)
                    const PopupMenuItem(
                      value: 'pause',
                      child: Row(
                        children: [
                          Icon(Icons.pause, size: 20),
                          SizedBox(width: 8),
                          Text('إيقاف مؤقت'),
                        ],
                      ),
                    ),
                  if (contract.status == ContractStatus.paused)
                    const PopupMenuItem(
                      value: 'resume',
                      child: Row(
                        children: [
                          Icon(Icons.play_arrow, size: 20),
                          SizedBox(width: 8),
                          Text('استئناف'),
                        ],
                      ),
                    ),
                  if (contract.status == ContractStatus.active ||
                      contract.status == ContractStatus.paused)
                    const PopupMenuItem(
                      value: 'cancel',
                      child: Row(
                        children: [
                          Icon(Icons.cancel, size: 20, color: AppTheme.errorColor),
                          SizedBox(width: 8),
                          Text('إلغاء العقد', style: TextStyle(color: AppTheme.errorColor)),
                        ],
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
      body: Consumer<ContractProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final contract = provider.selectedContract;
          if (contract == null) {
            return const Center(child: Text('لم يتم العثور على العقد'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildStatusCard(context, contract),
                const SizedBox(height: 16),
                if (provider.selectedContractUsage != null)
                  _buildUsageCard(context, provider.selectedContractUsage!),
                const SizedBox(height: 16),
                _buildDetailsCard(context, contract),
                const SizedBox(height: 16),
                _buildScheduleCard(context, contract),
                const SizedBox(height: 16),
                if (contract is SchoolContract)
                  _buildStudentsCard(context, contract),
                const SizedBox(height: 16),
                _buildPaymentCard(context, contract),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusCard(BuildContext context, Contract contract) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                contract is SchoolContract ? Icons.school : Icons.repeat,
                color: AppTheme.primaryColor,
                size: 32,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getContractTypeLabel(contract.type),
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getStatusLabel(contract.status),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: _getStatusColor(contract.status),
                        ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  AppTheme.formatCurrency(contract.monthlyPrice.amount),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                Text(
                  'شهرياً',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUsageCard(BuildContext context, ContractUsage usage) {
    final completionRate = usage.totalTrips > 0
        ? (usage.completedTrips / usage.totalTrips * 100).toInt()
        : 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'إحصائيات الاستخدام',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    context,
                    'إجمالي الرحلات',
                    usage.totalTrips.toString(),
                    Icons.directions_car,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    context,
                    'رحلات مكتملة',
                    usage.completedTrips.toString(),
                    Icons.check_circle,
                    color: AppTheme.successColor,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    context,
                    'رحلات فائتة',
                    usage.missedTrips.toString(),
                    Icons.cancel,
                    color: AppTheme.errorColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: completionRate / 100,
                backgroundColor: Colors.grey.shade200,
                valueColor: const AlwaysStoppedAnimation(AppTheme.successColor),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'نسبة الإنجاز: $completionRate%',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context,
    String label,
    String value,
    IconData icon, {
    Color? color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color ?? AppTheme.primaryColor, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildDetailsCard(BuildContext context, Contract contract) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'تفاصيل المسار',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            _buildLocationRow(
              context,
              'نقطة الانطلاق',
              contract.pickup.name ?? contract.pickup.formattedAddress ?? '',
              Icons.trip_origin,
              AppTheme.successColor,
            ),
            const SizedBox(height: 12),
            _buildLocationRow(
              context,
              'الوجهة',
              contract.dropoff.name ?? contract.dropoff.formattedAddress ?? '',
              Icons.location_on,
              AppTheme.errorColor,
            ),
            const Divider(height: 32),
            Row(
              children: [
                Expanded(
                  child: _buildInfoItem(
                    context,
                    'تاريخ البدء',
                    DateFormat('dd/MM/yyyy', 'ar').format(contract.startDate),
                  ),
                ),
                Expanded(
                  child: _buildInfoItem(
                    context,
                    'تاريخ الانتهاء',
                    contract.endDate != null
                        ? DateFormat('dd/MM/yyyy', 'ar').format(contract.endDate!)
                        : 'غير محدد',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationRow(
    BuildContext context,
    String label,
    String address,
    IconData icon,
    Color color,
  ) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              Text(
                address,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoItem(BuildContext context, String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }

  Widget _buildScheduleCard(BuildContext context, Contract contract) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'جدول الرحلات',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            ...contract.schedule.map((day) => _buildScheduleDayRow(context, day)),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleDayRow(BuildContext context, ContractScheduleDay day) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 80,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: day.isActive
                  ? AppTheme.primaryColor.withOpacity(0.1)
                  : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              _getDayName(day.day),
              style: TextStyle(
                color: day.isActive ? AppTheme.primaryColor : AppTheme.textSecondary,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Wrap(
              spacing: 8,
              runSpacing: 4,
              children: day.trips.map((trip) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: trip.isReturn ? Colors.blue.shade50 : Colors.green.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        trip.isReturn ? Icons.home : Icons.directions_car,
                        size: 14,
                        color: trip.isReturn ? Colors.blue : Colors.green,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        trip.pickupTime,
                        style: TextStyle(
                          fontSize: 12,
                          color: trip.isReturn ? Colors.blue : Colors.green,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentsCard(BuildContext context, SchoolContract contract) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.school, color: AppTheme.primaryColor),
                const SizedBox(width: 8),
                Text(
                  contract.schoolName,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'الطلاب',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            ...contract.students.map((student) => _buildStudentRow(context, student)),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentRow(BuildContext context, StudentInfo student) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 16,
            backgroundColor: AppTheme.primaryColor,
            child: Icon(Icons.person, size: 18, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student.name,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (student.grade != null)
                  Text(
                    student.grade!,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentCard(BuildContext context, Contract contract) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'معلومات الدفع',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Icon(
                  _getPaymentIcon(contract.paymentMethod),
                  color: AppTheme.primaryColor,
                ),
                const SizedBox(width: 12),
                Text(
                  _getPaymentLabel(contract.paymentMethod),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _handleMenuAction(BuildContext context, String action, Contract contract) {
    final provider = context.read<ContractProvider>();

    switch (action) {
      case 'pause':
        _showConfirmDialog(
          context,
          'إيقاف العقد مؤقتاً',
          'هل أنت متأكد من إيقاف هذا العقد مؤقتاً؟',
          () => provider.pauseContract(contract.id),
        );
        break;
      case 'resume':
        provider.resumeContract(contract.id);
        break;
      case 'cancel':
        _showCancelDialog(context, contract.id);
        break;
    }
  }

  void _showConfirmDialog(
    BuildContext context,
    String title,
    String message,
    VoidCallback onConfirm,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              onConfirm();
            },
            child: const Text('تأكيد'),
          ),
        ],
      ),
    );
  }

  void _showCancelDialog(BuildContext context, String contractId) {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إلغاء العقد'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('هل أنت متأكد من إلغاء هذا العقد؟ هذا الإجراء لا يمكن التراجع عنه.'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                labelText: 'سبب الإلغاء (اختياري)',
                hintText: 'أدخل سبب الإلغاء',
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('تراجع'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            onPressed: () {
              Navigator.pop(context);
              context.read<ContractProvider>().cancelContract(
                    contractId,
                    reason: reasonController.text.isNotEmpty
                        ? reasonController.text
                        : null,
                  );
            },
            child: const Text('إلغاء العقد'),
          ),
        ],
      ),
    );
  }

  String _getContractTypeLabel(ContractType type) {
    switch (type) {
      case ContractType.monthly:
        return 'عقد شهري';
      case ContractType.school:
        return 'عقد مدرسي';
      case ContractType.corporate:
        return 'عقد شركات';
    }
  }

  String _getStatusLabel(ContractStatus status) {
    switch (status) {
      case ContractStatus.active:
        return 'نشط';
      case ContractStatus.pending:
        return 'قيد الانتظار';
      case ContractStatus.paused:
        return 'معلق';
      case ContractStatus.completed:
        return 'منتهي';
      case ContractStatus.cancelled:
        return 'ملغي';
    }
  }

  Color _getStatusColor(ContractStatus status) {
    switch (status) {
      case ContractStatus.active:
        return AppTheme.successColor;
      case ContractStatus.pending:
        return Colors.orange;
      case ContractStatus.paused:
        return Colors.blue;
      case ContractStatus.completed:
        return AppTheme.textSecondary;
      case ContractStatus.cancelled:
        return AppTheme.errorColor;
    }
  }

  String _getDayName(DayOfWeek day) {
    switch (day) {
      case DayOfWeek.sunday:
        return 'الأحد';
      case DayOfWeek.monday:
        return 'الإثنين';
      case DayOfWeek.tuesday:
        return 'الثلاثاء';
      case DayOfWeek.wednesday:
        return 'الأربعاء';
      case DayOfWeek.thursday:
        return 'الخميس';
      case DayOfWeek.friday:
        return 'الجمعة';
      case DayOfWeek.saturday:
        return 'السبت';
    }
  }

  IconData _getPaymentIcon(PaymentProvider provider) {
    switch (provider) {
      case PaymentProvider.bankily:
        return Icons.account_balance;
      case PaymentProvider.sedad:
        return Icons.payment;
      case PaymentProvider.masrvi:
        return Icons.credit_card;
      case PaymentProvider.cash:
        return Icons.money;
    }
  }

  String _getPaymentLabel(PaymentProvider provider) {
    switch (provider) {
      case PaymentProvider.bankily:
        return 'بنكيلي';
      case PaymentProvider.sedad:
        return 'سداد';
      case PaymentProvider.masrvi:
        return 'مصرفي';
      case PaymentProvider.cash:
        return 'نقداً';
    }
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../models/enums.dart';
import '../../models/base_models.dart';
import '../../models/contract.dart';
import '../../providers/contract_provider.dart';

class CreateContractScreen extends StatefulWidget {
  const CreateContractScreen({super.key});

  @override
  State<CreateContractScreen> createState() => _CreateContractScreenState();
}

class _CreateContractScreenState extends State<CreateContractScreen> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('إنشاء عقد جديد'),
      ),
      body: Consumer<ContractProvider>(
        builder: (context, provider, _) {
          return Form(
            key: _formKey,
            child: Stepper(
              currentStep: _currentStep,
              onStepContinue: () => _onStepContinue(provider),
              onStepCancel: _onStepCancel,
              controlsBuilder: (context, details) {
                return Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: provider.isLoading
                              ? null
                              : details.onStepContinue,
                          child: provider.isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Text(_currentStep == 3 ? 'إنشاء العقد' : 'التالي'),
                        ),
                      ),
                      if (_currentStep > 0) ...[
                        const SizedBox(width: 12),
                        TextButton(
                          onPressed: details.onStepCancel,
                          child: const Text('السابق'),
                        ),
                      ],
                    ],
                  ),
                );
              },
              steps: [
                Step(
                  title: const Text('نوع العقد'),
                  content: _buildContractTypeStep(provider),
                  isActive: _currentStep >= 0,
                  state: _currentStep > 0 ? StepState.complete : StepState.indexed,
                ),
                Step(
                  title: const Text('المسار'),
                  content: _buildRouteStep(provider),
                  isActive: _currentStep >= 1,
                  state: _currentStep > 1 ? StepState.complete : StepState.indexed,
                ),
                Step(
                  title: const Text('الجدول'),
                  content: _buildScheduleStep(provider),
                  isActive: _currentStep >= 2,
                  state: _currentStep > 2 ? StepState.complete : StepState.indexed,
                ),
                Step(
                  title: const Text('الدفع'),
                  content: _buildPaymentStep(provider),
                  isActive: _currentStep >= 3,
                  state: StepState.indexed,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildContractTypeStep(ContractProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('اختر نوع العقد المناسب لاحتياجاتك'),
        const SizedBox(height: 16),
        _buildContractTypeCard(
          provider,
          ContractType.monthly,
          'عقد شهري',
          'رحلات يومية منتظمة للعمل أو أي وجهة ثابتة',
          Icons.repeat,
        ),
        const SizedBox(height: 12),
        _buildContractTypeCard(
          provider,
          ContractType.school,
          'عقد مدرسي',
          'توصيل الأطفال من وإلى المدرسة',
          Icons.school,
        ),
        const SizedBox(height: 12),
        _buildContractTypeCard(
          provider,
          ContractType.corporate,
          'عقد شركات',
          'خدمات نقل للموظفين والشركات',
          Icons.business,
        ),
      ],
    );
  }

  Widget _buildContractTypeCard(
    ContractProvider provider,
    ContractType type,
    String title,
    String description,
    IconData icon,
  ) {
    final isSelected = provider.selectedType == type;

    return InkWell(
      onTap: () => provider.setContractType(type),
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
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppTheme.primaryColor.withOpacity(0.2)
                    : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
              ),
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
                    description,
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

  Widget _buildRouteStep(ContractProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('حدد نقطة الانطلاق والوجهة'),
        const SizedBox(height: 16),
        _buildAddressSelector(
          label: 'نقطة الانطلاق',
          address: provider.pickup,
          icon: Icons.trip_origin,
          color: AppTheme.successColor,
          onTap: () => _selectAddress(context, true),
        ),
        const SizedBox(height: 12),
        _buildAddressSelector(
          label: provider.selectedType == ContractType.school ? 'المدرسة' : 'الوجهة',
          address: provider.dropoff,
          icon: Icons.location_on,
          color: AppTheme.errorColor,
          onTap: () => _selectAddress(context, false),
        ),
        if (provider.selectedType == ContractType.school) ...[
          const SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'اسم المدرسة',
              prefixIcon: Icon(Icons.school),
            ),
            onChanged: provider.setSchoolName,
            validator: (value) {
              if (provider.selectedType == ContractType.school &&
                  (value == null || value.isEmpty)) {
                return 'يرجى إدخال اسم المدرسة';
              }
              return null;
            },
          ),
        ],
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildDateSelector(
                label: 'تاريخ البدء',
                date: provider.startDate,
                onTap: () => _selectDate(context, true),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildDateSelector(
                label: 'تاريخ الانتهاء',
                date: provider.endDate,
                onTap: () => _selectDate(context, false),
                isOptional: true,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAddressSelector({
    required String label,
    required Address? address,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
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
                    address?.name ?? address?.formattedAddress ?? 'اختر الموقع',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: address != null ? null : AppTheme.textHint,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_left, color: AppTheme.textSecondary),
          ],
        ),
      ),
    );
  }

  Widget _buildDateSelector({
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
    bool isOptional = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (isOptional)
                  Text(
                    ' (اختياري)',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textHint,
                        ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 16, color: AppTheme.textSecondary),
                const SizedBox(width: 8),
                Text(
                  date != null
                      ? '${date.day}/${date.month}/${date.year}'
                      : 'اختر التاريخ',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: date != null ? null : AppTheme.textHint,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleStep(ContractProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('حدد أيام وأوقات الرحلات'),
        const SizedBox(height: 16),
        ...DayOfWeek.values.map((day) => _buildDaySchedule(provider, day)),
        if (provider.estimatedPrice != null) ...[
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('السعر الشهري المقدر'),
                Text(
                  AppTheme.formatCurrency(provider.estimatedPrice!),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildDaySchedule(ContractProvider provider, DayOfWeek day) {
    final scheduleDay = provider.schedule.firstWhere(
      (d) => d.day == day,
      orElse: () => ContractScheduleDay(day: day, trips: [], isActive: false),
    );
    final isActive = scheduleDay.isActive && scheduleDay.trips.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => _showDayScheduleDialog(context, provider, day, scheduleDay),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            border: Border.all(
              color: isActive ? AppTheme.primaryColor : Colors.grey.shade300,
            ),
            borderRadius: BorderRadius.circular(12),
            color: isActive ? AppTheme.primaryColor.withOpacity(0.05) : null,
          ),
          child: Row(
            children: [
              Container(
                width: 70,
                child: Text(
                  _getDayName(day),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: isActive ? FontWeight.bold : null,
                      ),
                ),
              ),
              Expanded(
                child: isActive
                    ? Wrap(
                        spacing: 8,
                        children: scheduleDay.trips.map((trip) {
                          return Chip(
                            label: Text(
                              '${trip.pickupTime} ${trip.isReturn ? "(عودة)" : ""}',
                              style: const TextStyle(fontSize: 12),
                            ),
                            backgroundColor: trip.isReturn
                                ? Colors.blue.shade50
                                : Colors.green.shade50,
                            padding: EdgeInsets.zero,
                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          );
                        }).toList(),
                      )
                    : Text(
                        'لا توجد رحلات',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
              ),
              Icon(
                isActive ? Icons.edit : Icons.add,
                color: AppTheme.textSecondary,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentStep(ContractProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('اختر طريقة الدفع'),
        const SizedBox(height: 16),
        ...PaymentProvider.values.map((method) => _buildPaymentMethodCard(
              provider,
              method,
            )),
        const SizedBox(height: 16),
        TextFormField(
          decoration: const InputDecoration(
            labelText: 'ملاحظات (اختياري)',
            prefixIcon: Icon(Icons.note),
          ),
          maxLines: 3,
          onChanged: provider.setNotes,
        ),
        if (provider.error != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.errorColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.error, color: AppTheme.errorColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    provider.error!,
                    style: const TextStyle(color: AppTheme.errorColor),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPaymentMethodCard(ContractProvider provider, PaymentProvider method) {
    final isSelected = provider.paymentMethod == method;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => provider.setPaymentMethod(method),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(
              color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300,
              width: isSelected ? 2 : 1,
            ),
            borderRadius: BorderRadius.circular(12),
            color: isSelected ? AppTheme.primaryColor.withOpacity(0.05) : null,
          ),
          child: Row(
            children: [
              Icon(
                _getPaymentIcon(method),
                color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
              ),
              const SizedBox(width: 12),
              Text(
                _getPaymentLabel(method),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: isSelected ? FontWeight.bold : null,
                    ),
              ),
              const Spacer(),
              if (isSelected)
                const Icon(Icons.check_circle, color: AppTheme.primaryColor),
            ],
          ),
        ),
      ),
    );
  }

  void _onStepContinue(ContractProvider provider) async {
    if (_currentStep < 3) {
      // Validate current step
      if (_currentStep == 1) {
        if (provider.pickup == null || provider.dropoff == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('يرجى تحديد نقطة الانطلاق والوجهة')),
          );
          return;
        }
        if (provider.startDate == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('يرجى تحديد تاريخ البدء')),
          );
          return;
        }
      }
      if (_currentStep == 2 && provider.schedule.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('يرجى إضافة جدول الرحلات')),
        );
        return;
      }

      setState(() => _currentStep++);
    } else {
      // Create contract
      final contract = provider.selectedType == ContractType.school
          ? await provider.createSchoolContract()
          : await provider.createContract();

      if (contract != null && mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم إنشاء العقد بنجاح')),
        );
      }
    }
  }

  void _onStepCancel() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  void _selectAddress(BuildContext context, bool isPickup) async {
    // Navigate to address selection screen
    final result = await Navigator.pushNamed(context, Routes.addressSelection);
    if (result != null && result is Address) {
      final provider = context.read<ContractProvider>();
      if (isPickup) {
        provider.setPickup(result);
      } else {
        provider.setDropoff(result);
        if (provider.selectedType == ContractType.school) {
          provider.setSchoolAddress(result);
        }
      }
    }
  }

  void _selectDate(BuildContext context, bool isStartDate) async {
    final provider = context.read<ContractProvider>();
    final initialDate = isStartDate
        ? provider.startDate ?? DateTime.now()
        : provider.endDate ?? DateTime.now().add(const Duration(days: 30));

    final date = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      locale: const Locale('ar'),
    );

    if (date != null) {
      if (isStartDate) {
        provider.setStartDate(date);
      } else {
        provider.setEndDate(date);
      }
    }
  }

  void _showDayScheduleDialog(
    BuildContext context,
    ContractProvider provider,
    DayOfWeek day,
    ContractScheduleDay scheduleDay,
  ) {
    final trips = List<ContractScheduleTrip>.from(scheduleDay.trips);

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
                  'جدول ${_getDayName(day)}',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                ...trips.asMap().entries.map((entry) {
                  final index = entry.key;
                  final trip = entry.value;
                  return ListTile(
                    leading: Icon(
                      trip.isReturn ? Icons.home : Icons.directions_car,
                      color: trip.isReturn ? Colors.blue : Colors.green,
                    ),
                    title: Text(trip.pickupTime),
                    subtitle: Text(trip.isReturn ? 'رحلة العودة' : 'رحلة الذهاب'),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete, color: AppTheme.errorColor),
                      onPressed: () {
                        setModalState(() => trips.removeAt(index));
                      },
                    ),
                  );
                }),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _addTrip(context, setModalState, trips, false),
                        icon: const Icon(Icons.directions_car),
                        label: const Text('إضافة ذهاب'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _addTrip(context, setModalState, trips, true),
                        icon: const Icon(Icons.home),
                        label: const Text('إضافة عودة'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      if (trips.isEmpty) {
                        provider.removeScheduleDay(day);
                      } else {
                        provider.updateScheduleDay(
                          day,
                          ContractScheduleDay(day: day, trips: trips, isActive: true),
                        );
                        if (!provider.schedule.any((d) => d.day == day)) {
                          provider.addScheduleDay(
                            ContractScheduleDay(day: day, trips: trips, isActive: true),
                          );
                        }
                      }
                      Navigator.pop(context);
                    },
                    child: const Text('حفظ'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _addTrip(
    BuildContext context,
    StateSetter setModalState,
    List<ContractScheduleTrip> trips,
    bool isReturn,
  ) async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );

    if (time != null) {
      final timeStr = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
      setModalState(() {
        trips.add(ContractScheduleTrip(pickupTime: timeStr, isReturn: isReturn));
      });
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

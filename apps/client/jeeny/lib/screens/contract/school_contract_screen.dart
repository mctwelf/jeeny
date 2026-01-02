import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../models/enums.dart';
import '../../models/base_models.dart';
import '../../models/contract.dart';
import '../../providers/contract_provider.dart';

class SchoolContractScreen extends StatefulWidget {
  const SchoolContractScreen({super.key});

  @override
  State<SchoolContractScreen> createState() => _SchoolContractScreenState();
}

class _SchoolContractScreenState extends State<SchoolContractScreen> {
  final _formKey = GlobalKey<FormState>();
  final _schoolNameController = TextEditingController();
  int _currentStep = 0;

  @override
  void dispose() {
    _schoolNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('عقد مدرسي'),
      ),
      body: Consumer<ContractProvider>(
        builder: (context, provider, _) {
          return Form(
            key: _formKey,
            child: Stepper(
              currentStep: _currentStep,
              onStepContinue: () => _onStepContinue(provider),
              onStepCancel: _onStepCancel,
              controlsBuilder: _buildControls,
              steps: [
                _buildSchoolInfoStep(provider),
                _buildStudentsStep(provider),
                _buildScheduleStep(provider),
                _buildPaymentStep(provider),
              ],
            ),
          );
        },
      ),
    );
  }


  Widget _buildControls(BuildContext context, ControlsDetails details) {
    final provider = context.read<ContractProvider>();
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: provider.isLoading ? null : details.onStepContinue,
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
  }

  Step _buildSchoolInfoStep(ContractProvider provider) {
    return Step(
      title: const Text('معلومات المدرسة'),
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _schoolNameController,
            decoration: const InputDecoration(
              labelText: 'اسم المدرسة',
              prefixIcon: Icon(Icons.school),
            ),
            onChanged: provider.setSchoolName,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'يرجى إدخال اسم المدرسة';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildAddressSelector(
            label: 'عنوان المنزل',
            address: provider.pickup,
            icon: Icons.home,
            color: AppTheme.successColor,
            onTap: () => _selectAddress(context, true),
          ),
          const SizedBox(height: 12),
          _buildAddressSelector(
            label: 'عنوان المدرسة',
            address: provider.schoolAddress,
            icon: Icons.school,
            color: AppTheme.primaryColor,
            onTap: () => _selectAddress(context, false),
          ),
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
      ),
      isActive: _currentStep >= 0,
      state: _currentStep > 0 ? StepState.complete : StepState.indexed,
    );
  }

  Step _buildStudentsStep(ContractProvider provider) {
    return Step(
      title: const Text('الطلاب'),
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('أضف معلومات الطلاب الذين سيتم توصيلهم'),
          const SizedBox(height: 16),
          ...provider.students.asMap().entries.map((entry) {
            final index = entry.key;
            final student = entry.value;
            return _buildStudentCard(provider, index, student);
          }),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => _showAddStudentDialog(context, provider),
            icon: const Icon(Icons.add),
            label: const Text('إضافة طالب'),
          ),
        ],
      ),
      isActive: _currentStep >= 1,
      state: _currentStep > 1 ? StepState.complete : StepState.indexed,
    );
  }

  Widget _buildStudentCard(ContractProvider provider, int index, StudentInfo student) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.primaryColor,
          child: Text(
            student.name.isNotEmpty ? student.name[0] : '?',
            style: const TextStyle(color: Colors.white),
          ),
        ),
        title: Text(student.name),
        subtitle: student.grade != null ? Text(student.grade!) : null,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit, size: 20),
              onPressed: () => _showEditStudentDialog(context, provider, index, student),
            ),
            IconButton(
              icon: const Icon(Icons.delete, size: 20, color: AppTheme.errorColor),
              onPressed: () => provider.removeStudent(index),
            ),
          ],
        ),
      ),
    );
  }


  Step _buildScheduleStep(ContractProvider provider) {
    return Step(
      title: const Text('الجدول'),
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('حدد أيام وأوقات التوصيل'),
          const SizedBox(height: 16),
          ...DayOfWeek.values.where((d) => d != DayOfWeek.friday && d != DayOfWeek.saturday)
              .map((day) => _buildDaySchedule(provider, day)),
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
      ),
      isActive: _currentStep >= 2,
      state: _currentStep > 2 ? StepState.complete : StepState.indexed,
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
              SizedBox(
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

  Step _buildPaymentStep(ContractProvider provider) {
    return Step(
      title: const Text('الدفع'),
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('اختر طريقة الدفع'),
          const SizedBox(height: 16),
          ...PaymentProvider.values.map((method) => _buildPaymentMethodCard(provider, method)),
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
      ),
      isActive: _currentStep >= 3,
      state: StepState.indexed,
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
                  Text(label, style: Theme.of(context).textTheme.bodySmall),
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
                Text(label, style: Theme.of(context).textTheme.bodySmall),
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

  void _onStepContinue(ContractProvider provider) async {
    if (_currentStep < 3) {
      if (_currentStep == 0) {
        if (_schoolNameController.text.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('يرجى إدخال اسم المدرسة')),
          );
          return;
        }
        if (provider.pickup == null || provider.schoolAddress == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('يرجى تحديد عنوان المنزل والمدرسة')),
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
      if (_currentStep == 1 && provider.students.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('يرجى إضافة طالب واحد على الأقل')),
        );
        return;
      }
      if (_currentStep == 2 && provider.schedule.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('يرجى إضافة جدول الرحلات')),
        );
        return;
      }
      setState(() => _currentStep++);
    } else {
      final contract = await provider.createSchoolContract();
      if (contract != null && mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم إنشاء العقد المدرسي بنجاح')),
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
    final result = await Navigator.pushNamed(context, Routes.addressSelection);
    if (result != null && result is Address) {
      final provider = context.read<ContractProvider>();
      if (isPickup) {
        provider.setPickup(result);
      } else {
        provider.setSchoolAddress(result);
      }
    }
  }

  void _selectDate(BuildContext context, bool isStartDate) async {
    final provider = context.read<ContractProvider>();
    final initialDate = isStartDate
        ? provider.startDate ?? DateTime.now()
        : provider.endDate ?? DateTime.now().add(const Duration(days: 180));

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


  void _showAddStudentDialog(BuildContext context, ContractProvider provider) {
    final nameController = TextEditingController();
    final gradeController = TextEditingController();
    final emergencyController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
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
              Text('إضافة طالب', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'اسم الطالب',
                  prefixIcon: Icon(Icons.person),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: gradeController,
                decoration: const InputDecoration(
                  labelText: 'الصف (اختياري)',
                  prefixIcon: Icon(Icons.class_),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emergencyController,
                decoration: const InputDecoration(
                  labelText: 'رقم الطوارئ (اختياري)',
                  prefixIcon: Icon(Icons.phone),
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (nameController.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('يرجى إدخال اسم الطالب')),
                      );
                      return;
                    }
                    provider.addStudent(StudentInfo(
                      name: nameController.text,
                      grade: gradeController.text.isNotEmpty ? gradeController.text : null,
                      emergencyContact: emergencyController.text.isNotEmpty
                          ? emergencyController.text
                          : null,
                    ));
                    Navigator.pop(context);
                  },
                  child: const Text('إضافة'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEditStudentDialog(
    BuildContext context,
    ContractProvider provider,
    int index,
    StudentInfo student,
  ) {
    final nameController = TextEditingController(text: student.name);
    final gradeController = TextEditingController(text: student.grade ?? '');
    final emergencyController = TextEditingController(text: student.emergencyContact ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
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
              Text('تعديل بيانات الطالب', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'اسم الطالب',
                  prefixIcon: Icon(Icons.person),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: gradeController,
                decoration: const InputDecoration(
                  labelText: 'الصف (اختياري)',
                  prefixIcon: Icon(Icons.class_),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emergencyController,
                decoration: const InputDecoration(
                  labelText: 'رقم الطوارئ (اختياري)',
                  prefixIcon: Icon(Icons.phone),
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (nameController.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('يرجى إدخال اسم الطالب')),
                      );
                      return;
                    }
                    provider.updateStudent(
                      index,
                      StudentInfo(
                        name: nameController.text,
                        grade: gradeController.text.isNotEmpty ? gradeController.text : null,
                        emergencyContact: emergencyController.text.isNotEmpty
                            ? emergencyController.text
                            : null,
                      ),
                    );
                    Navigator.pop(context);
                  },
                  child: const Text('حفظ'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
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
                      trip.isReturn ? Icons.home : Icons.school,
                      color: trip.isReturn ? Colors.blue : Colors.green,
                    ),
                    title: Text(trip.pickupTime),
                    subtitle: Text(trip.isReturn ? 'العودة للمنزل' : 'الذهاب للمدرسة'),
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
                        icon: const Icon(Icons.school),
                        label: const Text('ذهاب'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _addTrip(context, setModalState, trips, true),
                        icon: const Icon(Icons.home),
                        label: const Text('عودة'),
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
      initialTime: isReturn ? const TimeOfDay(hour: 14, minute: 0) : const TimeOfDay(hour: 7, minute: 30),
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

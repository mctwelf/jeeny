import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../providers/ride_provider.dart';
import '../../providers/location_provider.dart';

class AirportTransferScreen extends StatefulWidget {
  const AirportTransferScreen({super.key});

  @override
  State<AirportTransferScreen> createState() => _AirportTransferScreenState();
}

class _AirportTransferScreenState extends State<AirportTransferScreen> {
  final _formKey = GlobalKey<FormState>();
  final _flightController = TextEditingController();
  final _airlineController = TextEditingController();
  bool _isPickup = true; // true = from airport, false = to airport
  DateTime? _scheduledDate;
  TimeOfDay? _scheduledTime;
  String? _selectedAirport;

  final _airports = [
    {'code': 'NKC', 'name': 'مطار نواكشوط الدولي'},
    {'code': 'NDB', 'name': 'مطار نواذيبو'},
    {'code': 'ATR', 'name': 'مطار أطار'},
  ];

  @override
  void dispose() {
    _flightController.dispose();
    _airlineController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(title: const Text('نقل المطار')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildTransferTypeSelector(),
            const SizedBox(height: 16),
            _buildAirportSelector(),
            const SizedBox(height: 16),
            _buildFlightInfo(),
            const SizedBox(height: 16),
            _buildDateTimePicker(),
            const SizedBox(height: 16),
            _buildDestinationSelector(),
            const SizedBox(height: 24),
            _buildSubmitButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildTransferTypeSelector() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('نوع النقل', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildTypeOption(
                    icon: Icons.flight_land,
                    label: 'من المطار',
                    isSelected: _isPickup,
                    onTap: () => setState(() => _isPickup = true),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildTypeOption(
                    icon: Icons.flight_takeoff,
                    label: 'إلى المطار',
                    isSelected: !_isPickup,
                    onTap: () => setState(() => _isPickup = false),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildTypeOption({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : AppTheme.dividerColor,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
          color: isSelected ? AppTheme.primaryColor.withOpacity(0.05) : null,
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAirportSelector() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('المطار', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _selectedAirport,
              decoration: InputDecoration(
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              hint: const Text('اختر المطار'),
              items: _airports.map((airport) {
                return DropdownMenuItem(
                  value: airport['code'],
                  child: Text(airport['name']!),
                );
              }).toList(),
              onChanged: (value) => setState(() => _selectedAirport = value),
              validator: (value) => value == null ? 'الرجاء اختيار المطار' : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFlightInfo() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('معلومات الرحلة (اختياري)', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextFormField(
              controller: _airlineController,
              decoration: InputDecoration(
                labelText: 'شركة الطيران',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _flightController,
              decoration: InputDecoration(
                labelText: 'رقم الرحلة',
                hintText: 'مثال: MA123',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              textDirection: TextDirection.ltr,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateTimePicker() {
    final dateFormat = DateFormat('EEEE، dd MMMM yyyy', 'ar');
    
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_isPickup ? 'موعد الوصول' : 'موعد المغادرة', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _selectDate,
                    icon: const Icon(Icons.calendar_today),
                    label: Text(_scheduledDate != null ? dateFormat.format(_scheduledDate!) : 'اختر التاريخ'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _selectTime,
                    icon: const Icon(Icons.access_time),
                    label: Text(_scheduledTime != null ? _scheduledTime!.format(context) : 'اختر الوقت'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDestinationSelector() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: const Icon(Icons.location_on),
        title: Text(_isPickup ? 'الوجهة' : 'نقطة الانطلاق'),
        subtitle: const Text('اختر الموقع'),
        trailing: const Icon(Icons.chevron_left),
        onTap: () {},
      ),
    );
  }

  Widget _buildSubmitButton() {
    return ElevatedButton(
      onPressed: _submitRequest,
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: const Text('متابعة'),
    );
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      locale: const Locale('ar'),
    );
    if (date != null) setState(() => _scheduledDate = date);
  }

  Future<void> _selectTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (time != null) setState(() => _scheduledTime = time);
  }

  void _submitRequest() {
    if (!_formKey.currentState!.validate()) return;
    if (_scheduledDate == null || _scheduledTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('الرجاء اختيار التاريخ والوقت')),
      );
      return;
    }
    // Navigate to booking confirmation
  }
}

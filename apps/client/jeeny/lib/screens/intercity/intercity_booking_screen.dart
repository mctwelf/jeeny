import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../models/intercity.dart';
import '../../providers/intercity_provider.dart';
import '../../widgets/widgets.dart';

/// Intercity booking screen with passenger info form
class IntercityBookingScreen extends StatefulWidget {
  const IntercityBookingScreen({super.key});

  @override
  State<IntercityBookingScreen> createState() => _IntercityBookingScreenState();
}

class _IntercityBookingScreenState extends State<IntercityBookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  late List<PassengerFormData> _passengers;

  @override
  void initState() {
    super.initState();
    final provider = context.read<IntercityProvider>();
    _passengers = List.generate(
      provider.passengerCount,
      (index) => PassengerFormData(),
    );
  }

  @override
  void dispose() {
    _notesController.dispose();
    for (final p in _passengers) {
      p.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<IntercityProvider>();
    final trip = provider.selectedTrip;
    final timeFormat = DateFormat('HH:mm', 'ar');
    final dateFormat = DateFormat('EEEE، d MMMM yyyy', 'ar');

    if (trip == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('حجز الرحلة')),
        body: const Center(child: Text('لم يتم اختيار رحلة')),
      );
    }

    final totalPrice = trip.pricePerSeat.amount * provider.passengerCount;

    return Scaffold(
      appBar: AppBar(
        title: const Text('تفاصيل الحجز'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Trip summary card
                    CustomContainer(
                      height: null,
                      width: double.infinity,
                      color: Colors.white,
                      circular: 20,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'ملخص الرحلة',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            _buildTripSummaryRow(
                              icon: Icons.calendar_today,
                              label: 'التاريخ',
                              value: dateFormat.format(trip.departureTime),
                            ),
                            const SizedBox(height: 12),
                            _buildTripSummaryRow(
                              icon: Icons.access_time,
                              label: 'وقت المغادرة',
                              value: timeFormat.format(trip.departureTime),
                            ),
                            const SizedBox(height: 12),
                            _buildTripSummaryRow(
                              icon: Icons.route,
                              label: 'المسار',
                              value: '${trip.route.fromCity} → ${trip.route.toCity}',
                            ),
                            const SizedBox(height: 12),
                            _buildTripSummaryRow(
                              icon: Icons.timer,
                              label: 'المدة المتوقعة',
                              value: AppTheme.formatDuration(
                                trip.route.estimatedDuration * 60,
                              ),
                            ),
                            if (trip.vehicleInfo != null) ...[
                              const SizedBox(height: 12),
                              _buildTripSummaryRow(
                                icon: Icons.directions_bus,
                                label: 'المركبة',
                                value: trip.vehicleInfo!,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Passengers section
                    const Text(
                      'معلومات المسافرين',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Passenger forms
                    ...List.generate(_passengers.length, (index) {
                      return _buildPassengerForm(index);
                    }),

                    // Notes
                    const SizedBox(height: 16),
                    const Text(
                      'ملاحظات إضافية',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _notesController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: 'أي ملاحظات خاصة بالرحلة...',
                        filled: true,
                        fillColor: AppTheme.offButtonColor,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(15),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),

                    // Error message
                    if (provider.errorMessage != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.errorColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.error_outline,
                              color: AppTheme.errorColor,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                provider.errorMessage!,
                                style: const TextStyle(
                                  color: AppTheme.errorColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Bottom bar with price and confirm button
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.shade200,
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'المجموع',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          Text(
                            AppTheme.formatCurrency(totalPrice),
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryColor,
                            ),
                          ),
                          Text(
                            '${provider.passengerCount} مسافر × ${AppTheme.formatCurrency(trip.pricePerSeat.amount)}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: provider.isLoading
                          ? null
                          : () => _confirmBooking(context, provider),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 32,
                          vertical: 16,
                        ),
                      ),
                      child: provider.isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('تأكيد الحجز'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTripSummaryRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.primaryColor),
        const SizedBox(width: 12),
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey.shade600,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPassengerForm(int index) {
    final passenger = _passengers[index];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'المسافر ${index + 1}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Name field
          TextFormField(
            controller: passenger.nameController,
            decoration: InputDecoration(
              labelText: 'الاسم الكامل',
              prefixIcon: const Icon(Icons.person_outline),
              filled: true,
              fillColor: AppTheme.offButtonColor,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'يرجى إدخال الاسم';
              }
              return null;
            },
          ),
          const SizedBox(height: 12),

          // Phone field
          TextFormField(
            controller: passenger.phoneController,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: 'رقم الهاتف (اختياري)',
              prefixIcon: const Icon(Icons.phone_outlined),
              filled: true,
              fillColor: AppTheme.offButtonColor,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 12),

          // ID field
          TextFormField(
            controller: passenger.idController,
            decoration: InputDecoration(
              labelText: 'رقم الهوية (اختياري)',
              prefixIcon: const Icon(Icons.badge_outlined),
              filled: true,
              fillColor: AppTheme.offButtonColor,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmBooking(
    BuildContext context,
    IntercityProvider provider,
  ) async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final passengers = _passengers.map((p) {
      return PassengerInfo(
        name: p.nameController.text.trim(),
        phoneNumber: p.phoneController.text.trim().isNotEmpty
            ? p.phoneController.text.trim()
            : null,
        idNumber: p.idController.text.trim().isNotEmpty
            ? p.idController.text.trim()
            : null,
      );
    }).toList();

    final notes = _notesController.text.trim().isNotEmpty
        ? _notesController.text.trim()
        : null;

    final success = await provider.createBooking(passengers, notes: notes);

    if (success && mounted) {
      Navigator.pushReplacementNamed(context, Routes.tripDetails);
    }
  }
}

/// Helper class to manage passenger form data
class PassengerFormData {
  final nameController = TextEditingController();
  final phoneController = TextEditingController();
  final idController = TextEditingController();

  void dispose() {
    nameController.dispose();
    phoneController.dispose();
    idController.dispose();
  }
}

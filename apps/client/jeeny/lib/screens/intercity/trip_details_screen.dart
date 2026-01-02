import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../models/enums.dart';
import '../../models/intercity.dart';
import '../../providers/intercity_provider.dart';
import '../../widgets/widgets.dart';

/// Trip details screen showing booking status
class TripDetailsScreen extends StatelessWidget {
  const TripDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<IntercityProvider>();
    final booking = provider.currentBooking;
    final trip = provider.selectedTrip;
    final timeFormat = DateFormat('HH:mm', 'ar');
    final dateFormat = DateFormat('EEEE، d MMMM yyyy', 'ar');

    if (booking == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('تفاصيل الحجز')),
        body: const Center(child: Text('لا يوجد حجز')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('تفاصيل الحجز'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            Navigator.popUntil(context, (route) => route.isFirst);
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              // TODO: Share booking details
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Status header
            _buildStatusHeader(booking),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Booking ID
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.offButtonColor,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'رقم الحجز',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        Text(
                          '#${booking.id.substring(0, 8).toUpperCase()}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Trip details card
                  if (trip != null) ...[
                    const Text(
                      'تفاصيل الرحلة',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    CustomContainer(
                      height: null,
                      width: double.infinity,
                      color: Colors.white,
                      circular: 20,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            // Route visualization
                            Row(
                              children: [
                                Column(
                                  children: [
                                    Container(
                                      width: 12,
                                      height: 12,
                                      decoration: const BoxDecoration(
                                        color: AppTheme.primaryColor,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    Container(
                                      width: 2,
                                      height: 40,
                                      color: Colors.grey.shade300,
                                    ),
                                    Container(
                                      width: 12,
                                      height: 12,
                                      decoration: const BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        trip.route.fromCity,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        timeFormat.format(trip.departureTime),
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                      const SizedBox(height: 20),
                                      Text(
                                        trip.route.toCity,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        timeFormat.format(
                                          trip.departureTime.add(
                                            Duration(
                                              minutes: trip.route.estimatedDuration,
                                            ),
                                          ),
                                        ),
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const Divider(height: 32),
                            _buildDetailRow(
                              icon: Icons.calendar_today,
                              label: 'التاريخ',
                              value: dateFormat.format(trip.departureTime),
                            ),
                            const SizedBox(height: 12),
                            _buildDetailRow(
                              icon: Icons.timer,
                              label: 'المدة',
                              value: AppTheme.formatDuration(
                                trip.route.estimatedDuration * 60,
                              ),
                            ),
                            if (trip.vehicleInfo != null) ...[
                              const SizedBox(height: 12),
                              _buildDetailRow(
                                icon: Icons.directions_bus,
                                label: 'المركبة',
                                value: trip.vehicleInfo!,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),

                  // Passengers
                  const Text(
                    'المسافرون',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...booking.passengers.asMap().entries.map((entry) {
                    return _buildPassengerCard(entry.key + 1, entry.value);
                  }),
                  const SizedBox(height: 24),

                  // Payment details
                  const Text(
                    'تفاصيل الدفع',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  CustomContainer(
                    height: null,
                    width: double.infinity,
                    color: Colors.white,
                    circular: 20,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildPaymentRow(
                            'عدد المقاعد',
                            '${booking.numberOfSeats}',
                          ),
                          const SizedBox(height: 8),
                          _buildPaymentRow(
                            'سعر المقعد',
                            trip != null
                                ? AppTheme.formatCurrency(trip.pricePerSeat.amount)
                                : '-',
                          ),
                          const Divider(height: 24),
                          _buildPaymentRow(
                            'المجموع',
                            AppTheme.formatCurrency(booking.totalPrice.amount),
                            isBold: true,
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Text(
                                'طريقة الدفع',
                                style: TextStyle(
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                              const Spacer(),
                              _buildPaymentMethodChip(booking.paymentMethod),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Text(
                                'حالة الدفع',
                                style: TextStyle(
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                              const Spacer(),
                              _buildPaymentStatusChip(booking.paymentStatus),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Action buttons
                  if (booking.status == IntercityBookingStatus.confirmed ||
                      booking.status == IntercityBookingStatus.pending) ...[
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => _showCancelDialog(context, provider, booking),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.errorColor,
                          side: const BorderSide(color: AppTheme.errorColor),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('إلغاء الحجز'),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.popUntil(context, (route) => route.isFirst);
                      },
                      child: const Text('العودة للرئيسية'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusHeader(IntercityBooking booking) {
    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (booking.status) {
      case IntercityBookingStatus.pending:
        statusColor = Colors.orange;
        statusIcon = Icons.hourglass_empty;
        statusText = 'في انتظار التأكيد';
        break;
      case IntercityBookingStatus.confirmed:
        statusColor = AppTheme.successColor;
        statusIcon = Icons.check_circle;
        statusText = 'تم تأكيد الحجز';
        break;
      case IntercityBookingStatus.cancelled:
        statusColor = AppTheme.errorColor;
        statusIcon = Icons.cancel;
        statusText = 'تم إلغاء الحجز';
        break;
      case IntercityBookingStatus.completed:
        statusColor = AppTheme.primaryColor;
        statusIcon = Icons.done_all;
        statusText = 'اكتملت الرحلة';
        break;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
      ),
      child: Column(
        children: [
          Icon(statusIcon, size: 60, color: statusColor),
          const SizedBox(height: 12),
          Text(
            statusText,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: statusColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.primaryColor),
        const SizedBox(width: 12),
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.textSecondary,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildPassengerCard(int index, PassengerInfo passenger) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                '$index',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  passenger.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (passenger.phoneNumber != null)
                  Text(
                    passenger.phoneNumber!,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isBold ? AppTheme.textPrimary : AppTheme.textSecondary,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            fontSize: isBold ? 18 : 14,
            color: isBold ? AppTheme.primaryColor : AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentMethodChip(PaymentProvider method) {
    String label;
    switch (method) {
      case PaymentProvider.bankily:
        label = 'بنكيلي';
        break;
      case PaymentProvider.sedad:
        label = 'سداد';
        break;
      case PaymentProvider.masrvi:
        label = 'مصرفي';
        break;
      case PaymentProvider.cash:
        label = 'نقداً';
        break;
      case PaymentProvider.wallet:
        label = 'المحفظة';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.offButtonColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildPaymentStatusChip(PaymentStatus status) {
    Color color;
    String label;

    switch (status) {
      case PaymentStatus.pending:
        color = Colors.orange;
        label = 'في الانتظار';
        break;
      case PaymentStatus.completed:
        color = AppTheme.successColor;
        label = 'مكتمل';
        break;
      case PaymentStatus.failed:
        color = AppTheme.errorColor;
        label = 'فشل';
        break;
      case PaymentStatus.refunded:
        color = Colors.blue;
        label = 'مسترد';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  void _showCancelDialog(
    BuildContext context,
    IntercityProvider provider,
    IntercityBooking booking,
  ) {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إلغاء الحجز'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('هل أنت متأكد من إلغاء هذا الحجز؟'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                labelText: 'سبب الإلغاء (اختياري)',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('لا'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final reason = reasonController.text.trim().isNotEmpty
                  ? reasonController.text.trim()
                  : null;
              await provider.cancelBooking(booking.id, reason: reason);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('نعم، إلغاء'),
          ),
        ],
      ),
    );
  }
}

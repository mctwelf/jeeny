import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../models/enums.dart';
import '../../models/delivery.dart';
import '../../providers/delivery_provider.dart';
import '../../widgets/widgets.dart';

/// Delivery tracking screen with status updates
class DeliveryTrackingScreen extends StatefulWidget {
  const DeliveryTrackingScreen({super.key});

  @override
  State<DeliveryTrackingScreen> createState() => _DeliveryTrackingScreenState();
}

class _DeliveryTrackingScreenState extends State<DeliveryTrackingScreen> {
  @override
  void initState() {
    super.initState();
    final provider = context.read<DeliveryProvider>();
    if (provider.currentDelivery != null) {
      provider.startTracking(provider.currentDelivery!.id);
    }
  }

  @override
  void dispose() {
    context.read<DeliveryProvider>().stopTracking();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeliveryProvider>();
    final delivery = provider.currentDelivery;
    final dateFormat = DateFormat('d MMMM yyyy، HH:mm', 'ar');

    if (delivery == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('تتبع التوصيل')),
        body: const Center(child: Text('لا يوجد توصيل حالي')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('تتبع التوصيل'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.popUntil(context, (route) => route.isFirst),
        ),
        actions: [
          if (delivery.status == DeliveryStatus.pending ||
              delivery.status == DeliveryStatus.accepted)
            IconButton(
              icon: const Icon(Icons.cancel_outlined),
              onPressed: () => _showCancelDialog(context, provider, delivery),
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Status header
            _buildStatusHeader(delivery),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Delivery ID
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
                          'رقم التوصيل',
                          style: TextStyle(color: AppTheme.textSecondary),
                        ),
                        Text(
                          '#${delivery.id.substring(0, 8).toUpperCase()}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Timeline
                  _buildTimeline(delivery),
                  const SizedBox(height: 24),

                  // Route details
                  const Text(
                    'تفاصيل المسار',
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
                          _buildRoutePoint(
                            icon: Icons.circle,
                            iconColor: AppTheme.primaryColor,
                            title: 'نقطة الاستلام',
                            address: delivery.pickup.formattedAddress,
                            name: delivery.senderName,
                            phone: delivery.senderPhone,
                          ),
                          Container(
                            margin: const EdgeInsets.only(right: 11),
                            width: 2,
                            height: 30,
                            color: Colors.grey.shade300,
                          ),
                          _buildRoutePoint(
                            icon: Icons.location_on,
                            iconColor: Colors.red,
                            title: 'نقطة التسليم',
                            address: delivery.dropoff.formattedAddress,
                            name: delivery.recipientName,
                            phone: delivery.recipientPhone,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Package details
                  const Text(
                    'تفاصيل الطرد',
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
                          _buildDetailRow(
                            'حجم الطرد',
                            _getPackageSizeLabel(delivery.packageSize),
                          ),
                          if (delivery.weight != null) ...[
                            const SizedBox(height: 8),
                            _buildDetailRow(
                              'الوزن',
                              '${delivery.weight} كغ',
                            ),
                          ],
                          if (delivery.fragile) ...[
                            const SizedBox(height: 8),
                            Row(
                              children: const [
                                Icon(Icons.warning_amber, color: Colors.orange, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'طرد قابل للكسر',
                                  style: TextStyle(color: Colors.orange),
                                ),
                              ],
                            ),
                          ],
                          if (delivery.packageDescription != null) ...[
                            const Divider(height: 24),
                            Align(
                              alignment: Alignment.centerRight,
                              child: Text(
                                delivery.packageDescription!,
                                style: const TextStyle(color: AppTheme.textSecondary),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Driver info (if assigned)
                  if (delivery.driver != null) ...[
                    const Text(
                      'السائق',
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
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 30,
                              backgroundColor: AppTheme.offButtonColor,
                              child: delivery.driver!.profilePicture != null
                                  ? ClipOval(
                                      child: Image.network(
                                        delivery.driver!.profilePicture!,
                                        fit: BoxFit.cover,
                                      ),
                                    )
                                  : const Icon(Icons.person, size: 30),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    delivery.driver!.fullName,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  if (delivery.driver!.rating != null)
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.star,
                                          size: 16,
                                          color: Colors.amber,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          delivery.driver!.rating!.toStringAsFixed(1),
                                          style: const TextStyle(
                                            color: AppTheme.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                // TODO: Call driver
                              },
                              icon: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryColor,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.phone, size: 20),
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                // TODO: Chat with driver
                              },
                              icon: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppTheme.offButtonColor,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.chat, size: 20),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

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
                          _buildDetailRow(
                            'التكلفة',
                            AppTheme.formatCurrency(delivery.fare.amount),
                            isBold: true,
                          ),
                          const SizedBox(height: 8),
                          _buildDetailRow(
                            'طريقة الدفع',
                            _getPaymentMethodLabel(delivery.paymentMethod),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'حالة الدفع',
                                style: TextStyle(color: AppTheme.textSecondary),
                              ),
                              _buildPaymentStatusChip(delivery.paymentStatus),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Timestamps
                  CustomContainer(
                    height: null,
                    width: double.infinity,
                    color: AppTheme.offButtonColor,
                    circular: 15,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildDetailRow(
                            'تاريخ الإنشاء',
                            dateFormat.format(delivery.createdAt),
                          ),
                          if (delivery.pickedUpAt != null) ...[
                            const SizedBox(height: 8),
                            _buildDetailRow(
                              'تاريخ الاستلام',
                              dateFormat.format(delivery.pickedUpAt!),
                            ),
                          ],
                          if (delivery.deliveredAt != null) ...[
                            const SizedBox(height: 8),
                            _buildDetailRow(
                              'تاريخ التسليم',
                              dateFormat.format(delivery.deliveredAt!),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Action button
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

  Widget _buildStatusHeader(PackageDeliveryInfo delivery) {
    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (delivery.status) {
      case DeliveryStatus.pending:
        statusColor = Colors.orange;
        statusIcon = Icons.hourglass_empty;
        statusText = 'في انتظار السائق';
        break;
      case DeliveryStatus.accepted:
        statusColor = Colors.blue;
        statusIcon = Icons.check_circle;
        statusText = 'تم قبول الطلب';
        break;
      case DeliveryStatus.pickedUp:
        statusColor = AppTheme.primaryColor;
        statusIcon = Icons.local_shipping;
        statusText = 'تم استلام الطرد';
        break;
      case DeliveryStatus.inTransit:
        statusColor = AppTheme.primaryColor;
        statusIcon = Icons.directions_car;
        statusText = 'في الطريق';
        break;
      case DeliveryStatus.delivered:
        statusColor = AppTheme.successColor;
        statusIcon = Icons.done_all;
        statusText = 'تم التسليم';
        break;
      case DeliveryStatus.cancelled:
        statusColor = AppTheme.errorColor;
        statusIcon = Icons.cancel;
        statusText = 'ملغي';
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

  Widget _buildTimeline(PackageDeliveryInfo delivery) {
    final steps = [
      (DeliveryStatus.pending, 'تم إنشاء الطلب', Icons.add_circle),
      (DeliveryStatus.accepted, 'تم قبول الطلب', Icons.check_circle),
      (DeliveryStatus.pickedUp, 'تم استلام الطرد', Icons.inventory),
      (DeliveryStatus.inTransit, 'في الطريق', Icons.local_shipping),
      (DeliveryStatus.delivered, 'تم التسليم', Icons.done_all),
    ];

    final currentIndex = steps.indexWhere((s) => s.$1 == delivery.status);

    return Column(
      children: steps.asMap().entries.map((entry) {
        final index = entry.key;
        final step = entry.value;
        final isCompleted = index <= currentIndex;
        final isCurrent = index == currentIndex;

        return Row(
          children: [
            Column(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: isCompleted ? AppTheme.primaryColor : Colors.grey.shade300,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    step.$3,
                    size: 14,
                    color: isCompleted ? Colors.black : Colors.grey,
                  ),
                ),
                if (index < steps.length - 1)
                  Container(
                    width: 2,
                    height: 30,
                    color: isCompleted ? AppTheme.primaryColor : Colors.grey.shade300,
                  ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  step.$2,
                  style: TextStyle(
                    fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                    color: isCompleted ? AppTheme.textPrimary : AppTheme.textSecondary,
                  ),
                ),
              ),
            ),
          ],
        );
      }).toList(),
    );
  }

  Widget _buildRoutePoint({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String address,
    required String name,
    required String phone,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 24, color: iconColor),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                address,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(
                '$name • $phone',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppTheme.textSecondary),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: isBold ? AppTheme.primaryColor : AppTheme.textPrimary,
          ),
        ),
      ],
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

  String _getPackageSizeLabel(PackageSize size) {
    switch (size) {
      case PackageSize.small:
        return 'صغير';
      case PackageSize.medium:
        return 'متوسط';
      case PackageSize.large:
        return 'كبير';
      case PackageSize.extraLarge:
        return 'كبير جداً';
    }
  }

  String _getPaymentMethodLabel(PaymentProvider method) {
    switch (method) {
      case PaymentProvider.cash:
        return 'نقداً';
      case PaymentProvider.bankily:
        return 'بنكيلي';
      case PaymentProvider.sedad:
        return 'سداد';
      case PaymentProvider.masrvi:
        return 'مصرفي';
      case PaymentProvider.wallet:
        return 'المحفظة';
    }
  }

  void _showCancelDialog(
    BuildContext context,
    DeliveryProvider provider,
    PackageDeliveryInfo delivery,
  ) {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إلغاء التوصيل'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('هل أنت متأكد من إلغاء هذا التوصيل؟'),
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
              await provider.cancelDelivery(delivery.id, reason: reason);
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

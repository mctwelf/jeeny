import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../models/enums.dart';
import '../../models/food.dart';
import '../../providers/food_provider.dart';
import '../../widgets/widgets.dart';

/// Order tracking screen with status updates
class OrderTrackingScreen extends StatefulWidget {
  const OrderTrackingScreen({super.key});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  @override
  void initState() {
    super.initState();
    final provider = context.read<FoodProvider>();
    if (provider.currentOrder != null) {
      provider.startTracking(provider.currentOrder!.id);
    }
  }

  @override
  void dispose() {
    context.read<FoodProvider>().stopTracking();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FoodProvider>();
    final order = provider.currentOrder;
    final dateFormat = DateFormat('d MMMM yyyy، HH:mm', 'ar');

    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('تتبع الطلب')),
        body: const Center(child: Text('لا يوجد طلب حالي')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('تتبع الطلب'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.popUntil(context, (route) => route.isFirst),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Status header
            _buildStatusHeader(order),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Order ID and ETA
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.offButtonColor,
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'رقم الطلب',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                              Text(
                                '#${order.id.substring(0, 8).toUpperCase()}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'monospace',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      if (order.estimatedDeliveryTime != null)
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'الوقت المتوقع',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                                Text(
                                  '${order.estimatedDeliveryTime} دقيقة',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Timeline
                  _buildTimeline(order),
                  const SizedBox(height: 24),

                  // Restaurant info
                  if (order.restaurant != null) ...[
                    const Text(
                      'المطعم',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(15),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: AppTheme.offButtonColor,
                              borderRadius: BorderRadius.circular(10),
                              image: order.restaurant!.imageUrl != null
                                  ? DecorationImage(
                                      image: NetworkImage(order.restaurant!.imageUrl!),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                            ),
                            child: order.restaurant!.imageUrl == null
                                ? const Icon(Icons.restaurant, color: Colors.grey)
                                : null,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  order.restaurant!.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Row(
                                  children: [
                                    const Icon(Icons.star, size: 14, color: Colors.amber),
                                    const SizedBox(width: 4),
                                    Text(
                                      order.restaurant!.rating.toStringAsFixed(1),
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              // TODO: Call restaurant
                            },
                            icon: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppTheme.offButtonColor,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.phone, size: 20),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Order items
                  const Text(
                    'الطلبات',
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
                    circular: 15,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: order.items.map((item) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Row(
                              children: [
                                Container(
                                  width: 24,
                                  height: 24,
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryColor,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Center(
                                    child: Text(
                                      '${item.quantity}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(item.name),
                                ),
                                Text(
                                  AppTheme.formatCurrency(item.totalPrice.amount),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Delivery address
                  const Text(
                    'عنوان التوصيل',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.offButtonColor,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on, color: AppTheme.primaryColor),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(order.deliveryAddress.formattedAddress),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Payment summary
                  const Text(
                    'ملخص الدفع',
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
                    circular: 15,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildSummaryRow('المجموع الفرعي', order.subtotal.amount),
                          const SizedBox(height: 8),
                          _buildSummaryRow('رسوم التوصيل', order.deliveryFee.amount),
                          const Divider(height: 24),
                          _buildSummaryRow('المجموع', order.total.amount, isBold: true),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'طريقة الدفع',
                                style: TextStyle(color: AppTheme.textSecondary),
                              ),
                              Text(
                                _getPaymentMethodLabel(order.paymentMethod),
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Timestamp
                  Center(
                    child: Text(
                      'تم الطلب: ${dateFormat.format(order.createdAt)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Action buttons
                  if (order.status == FoodOrderStatus.pending) ...[
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => _showCancelDialog(context, provider, order),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.errorColor,
                          side: const BorderSide(color: AppTheme.errorColor),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('إلغاء الطلب'),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
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

  Widget _buildStatusHeader(FoodOrder order) {
    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (order.status) {
      case FoodOrderStatus.pending:
        statusColor = Colors.orange;
        statusIcon = Icons.hourglass_empty;
        statusText = 'في انتظار التأكيد';
        break;
      case FoodOrderStatus.confirmed:
        statusColor = Colors.blue;
        statusIcon = Icons.check_circle;
        statusText = 'تم تأكيد الطلب';
        break;
      case FoodOrderStatus.preparing:
        statusColor = AppTheme.primaryColor;
        statusIcon = Icons.restaurant;
        statusText = 'جاري التحضير';
        break;
      case FoodOrderStatus.ready:
        statusColor = AppTheme.primaryColor;
        statusIcon = Icons.check_circle;
        statusText = 'جاهز للتوصيل';
        break;
      case FoodOrderStatus.onTheWay:
        statusColor = AppTheme.primaryColor;
        statusIcon = Icons.delivery_dining;
        statusText = 'في الطريق إليك';
        break;
      case FoodOrderStatus.delivered:
        statusColor = AppTheme.successColor;
        statusIcon = Icons.done_all;
        statusText = 'تم التوصيل';
        break;
      case FoodOrderStatus.cancelled:
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

  Widget _buildTimeline(FoodOrder order) {
    final steps = [
      (FoodOrderStatus.pending, 'تم استلام الطلب', Icons.receipt),
      (FoodOrderStatus.confirmed, 'تم التأكيد', Icons.check_circle),
      (FoodOrderStatus.preparing, 'جاري التحضير', Icons.restaurant),
      (FoodOrderStatus.ready, 'جاهز', Icons.inventory),
      (FoodOrderStatus.onTheWay, 'في الطريق', Icons.delivery_dining),
      (FoodOrderStatus.delivered, 'تم التوصيل', Icons.done_all),
    ];

    final currentIndex = steps.indexWhere((s) => s.$1 == order.status);

    return Row(
      children: steps.asMap().entries.map((entry) {
        final index = entry.key;
        final step = entry.value;
        final isCompleted = index <= currentIndex;
        final isCurrent = index == currentIndex;

        return Expanded(
          child: Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isCompleted ? AppTheme.primaryColor : Colors.grey.shade300,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  step.$3,
                  size: 16,
                  color: isCompleted ? Colors.black : Colors.grey,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                step.$2,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                  color: isCompleted ? AppTheme.textPrimary : AppTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildSummaryRow(String label, double amount, {bool isBold = false}) {
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
          AppTheme.formatCurrency(amount),
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            fontSize: isBold ? 18 : 14,
            color: isBold ? AppTheme.primaryColor : AppTheme.textPrimary,
          ),
        ),
      ],
    );
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
    FoodProvider provider,
    FoodOrder order,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إلغاء الطلب'),
        content: const Text('هل أنت متأكد من إلغاء هذا الطلب؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('لا'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await provider.cancelOrder(order.id);
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

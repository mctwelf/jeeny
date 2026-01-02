import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../models/enums.dart';
import '../../providers/food_provider.dart';
import '../../services/food_service.dart';
import '../../widgets/widgets.dart';

/// Cart screen with order summary
class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FoodProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('السلة'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (provider.cart.isNotEmpty)
            TextButton(
              onPressed: () => _showClearCartDialog(context, provider),
              child: const Text(
                'مسح الكل',
                style: TextStyle(color: AppTheme.errorColor),
              ),
            ),
        ],
      ),
      body: provider.cart.isEmpty
          ? _buildEmptyCart(context)
          : Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Restaurant info
                        if (provider.selectedRestaurant != null)
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.offButtonColor,
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.restaurant, color: AppTheme.primaryColor),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    provider.selectedRestaurant!.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        const SizedBox(height: 24),

                        // Cart items
                        const Text(
                          'الطلبات',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ...provider.cart.map((item) => _buildCartItem(item, provider)),
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
                        _buildAddressSelector(context, provider),
                        const SizedBox(height: 24),

                        // Payment method
                        const Text(
                          'طريقة الدفع',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildPaymentMethodSelector(provider),
                        const SizedBox(height: 24),

                        // Notes
                        const Text(
                          'ملاحظات',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _notesController,
                          decoration: InputDecoration(
                            hintText: 'أي ملاحظات للمطعم أو السائق...',
                            filled: true,
                            fillColor: AppTheme.offButtonColor,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(15),
                              borderSide: BorderSide.none,
                            ),
                          ),
                          maxLines: 2,
                          onChanged: (v) => provider.setOrderNotes(v.isNotEmpty ? v : null),
                        ),
                        const SizedBox(height: 24),

                        // Order summary
                        CustomContainer(
                          height: null,
                          width: double.infinity,
                          color: Colors.white,
                          circular: 20,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                _buildSummaryRow('المجموع الفرعي', provider.cartSubtotal),
                                const SizedBox(height: 8),
                                _buildSummaryRow('رسوم التوصيل', provider.deliveryFee),
                                const Divider(height: 24),
                                _buildSummaryRow(
                                  'المجموع',
                                  provider.cartTotal,
                                  isBold: true,
                                ),
                              ],
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
                                const Icon(Icons.error_outline, color: AppTheme.errorColor),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    provider.errorMessage!,
                                    style: const TextStyle(color: AppTheme.errorColor),
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

                // Checkout button
                _buildCheckoutBar(context, provider),
              ],
            ),
    );
  }

  Widget _buildEmptyCart(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.shopping_cart_outlined,
            size: 80,
            color: Colors.grey.shade300,
          ),
          const SizedBox(height: 16),
          const Text(
            'السلة فارغة',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'أضف بعض الأصناف من القائمة',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('تصفح القائمة'),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItem(CartItem item, FoodProvider provider) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          // Quantity controls
          Column(
            children: [
              GestureDetector(
                onTap: () => provider.updateCartItemQuantity(
                  item.menuItemId,
                  item.quantity + 1,
                ),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(Icons.add, size: 16),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  '${item.quantity}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              GestureDetector(
                onTap: () => provider.updateCartItemQuantity(
                  item.menuItemId,
                  item.quantity - 1,
                ),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: item.quantity > 1
                        ? AppTheme.offButtonColor
                        : AppTheme.errorColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(
                    item.quantity > 1 ? Icons.remove : Icons.delete,
                    size: 16,
                    color: item.quantity > 1 ? Colors.grey : AppTheme.errorColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 16),

          // Item info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (item.specialInstructions != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    item.specialInstructions!,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  AppTheme.formatCurrency(item.unitPrice),
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),

          // Total price
          Text(
            AppTheme.formatCurrency(item.totalPrice),
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressSelector(BuildContext context, FoodProvider provider) {
    return GestureDetector(
      onTap: () {
        // TODO: Navigate to address selection
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('اختيار العنوان قيد التطوير')),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.offButtonColor,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Row(
          children: [
            Icon(
              Icons.location_on,
              color: provider.deliveryAddress != null
                  ? AppTheme.primaryColor
                  : Colors.grey,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                provider.deliveryAddress?.formattedAddress ?? 'اختر عنوان التوصيل',
                style: TextStyle(
                  color: provider.deliveryAddress != null
                      ? AppTheme.textPrimary
                      : Colors.grey,
                ),
              ),
            ),
            const Icon(Icons.chevron_left, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodSelector(FoodProvider provider) {
    final methods = [
      (PaymentProvider.cash, 'نقداً', Icons.money),
      (PaymentProvider.bankily, 'بنكيلي', Icons.account_balance_wallet),
      (PaymentProvider.sedad, 'سداد', Icons.payment),
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: methods.map((method) {
        final isSelected = provider.paymentMethod == method.$1;
        return GestureDetector(
          onTap: () => provider.setPaymentMethod(method.$1),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isSelected ? AppTheme.primaryColor : AppTheme.offButtonColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  method.$3,
                  size: 20,
                  color: isSelected ? Colors.black : Colors.grey,
                ),
                const SizedBox(width: 8),
                Text(
                  method.$2,
                  style: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ],
            ),
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

  Widget _buildCheckoutBar(BuildContext context, FoodProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
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
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: provider.canOrder && !provider.isLoading
                ? () => _placeOrder(context, provider)
                : null,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: provider.isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(
                    'تأكيد الطلب - ${AppTheme.formatCurrency(provider.cartTotal)}',
                  ),
          ),
        ),
      ),
    );
  }

  void _showClearCartDialog(BuildContext context, FoodProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('مسح السلة'),
        content: const Text('هل أنت متأكد من مسح جميع الأصناف؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('لا'),
          ),
          ElevatedButton(
            onPressed: () {
              provider.clearCart();
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('نعم، مسح'),
          ),
        ],
      ),
    );
  }

  Future<void> _placeOrder(BuildContext context, FoodProvider provider) async {
    final success = await provider.createOrder();
    if (success && mounted) {
      Navigator.pushReplacementNamed(context, Routes.orderTracking);
    }
  }
}

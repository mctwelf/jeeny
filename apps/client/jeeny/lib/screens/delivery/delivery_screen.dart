import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../models/enums.dart';
import '../../providers/delivery_provider.dart';
import '../../widgets/widgets.dart';

/// Delivery screen with package form
class DeliveryScreen extends StatefulWidget {
  const DeliveryScreen({super.key});

  @override
  State<DeliveryScreen> createState() => _DeliveryScreenState();
}

class _DeliveryScreenState extends State<DeliveryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _senderNameController = TextEditingController();
  final _senderPhoneController = TextEditingController();
  final _recipientNameController = TextEditingController();
  final _recipientPhoneController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _weightController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DeliveryProvider>().resetForm();
    });
  }

  @override
  void dispose() {
    _senderNameController.dispose();
    _senderPhoneController.dispose();
    _recipientNameController.dispose();
    _recipientPhoneController.dispose();
    _descriptionController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeliveryProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('توصيل طرد'),
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
                    // Header
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.primaryColor,
                            AppTheme.primaryColor.withOpacity(0.7),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.local_shipping, size: 40),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'أرسل طردك',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  'توصيل سريع وآمن',
                                  style: TextStyle(fontSize: 14),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Pickup address
                    _buildSectionTitle('عنوان الاستلام'),
                    const SizedBox(height: 8),
                    _buildAddressSelector(
                      label: 'من أين؟',
                      address: provider.pickup,
                      onTap: () => _selectAddress(context, true),
                    ),
                    const SizedBox(height: 16),

                    // Dropoff address
                    _buildSectionTitle('عنوان التسليم'),
                    const SizedBox(height: 8),
                    _buildAddressSelector(
                      label: 'إلى أين؟',
                      address: provider.dropoff,
                      onTap: () => _selectAddress(context, false),
                    ),
                    const SizedBox(height: 24),

                    // Sender info
                    _buildSectionTitle('معلومات المرسل'),
                    const SizedBox(height: 8),
                    _buildTextField(
                      controller: _senderNameController,
                      label: 'اسم المرسل',
                      icon: Icons.person_outline,
                      validator: (v) => v?.isEmpty == true ? 'مطلوب' : null,
                      onChanged: (v) => _updateSenderInfo(),
                    ),
                    const SizedBox(height: 12),
                    _buildTextField(
                      controller: _senderPhoneController,
                      label: 'هاتف المرسل',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      validator: (v) => v?.isEmpty == true ? 'مطلوب' : null,
                      onChanged: (v) => _updateSenderInfo(),
                    ),
                    const SizedBox(height: 24),

                    // Recipient info
                    _buildSectionTitle('معلومات المستلم'),
                    const SizedBox(height: 8),
                    _buildTextField(
                      controller: _recipientNameController,
                      label: 'اسم المستلم',
                      icon: Icons.person_outline,
                      validator: (v) => v?.isEmpty == true ? 'مطلوب' : null,
                      onChanged: (v) => _updateRecipientInfo(),
                    ),
                    const SizedBox(height: 12),
                    _buildTextField(
                      controller: _recipientPhoneController,
                      label: 'هاتف المستلم',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      validator: (v) => v?.isEmpty == true ? 'مطلوب' : null,
                      onChanged: (v) => _updateRecipientInfo(),
                    ),
                    const SizedBox(height: 24),

                    // Package info
                    _buildSectionTitle('معلومات الطرد'),
                    const SizedBox(height: 8),
                    _buildTextField(
                      controller: _descriptionController,
                      label: 'وصف الطرد (اختياري)',
                      icon: Icons.description_outlined,
                      maxLines: 2,
                      onChanged: (v) => provider.setPackageDescription(v),
                    ),
                    const SizedBox(height: 16),

                    // Package size
                    const Text(
                      'حجم الطرد',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _buildPackageSizeSelector(provider),
                    const SizedBox(height: 16),

                    // Weight
                    _buildTextField(
                      controller: _weightController,
                      label: 'الوزن بالكيلوغرام (اختياري)',
                      icon: Icons.scale_outlined,
                      keyboardType: TextInputType.number,
                      onChanged: (v) {
                        final weight = double.tryParse(v);
                        provider.setWeight(weight);
                      },
                    ),
                    const SizedBox(height: 16),

                    // Fragile checkbox
                    _buildFragileCheckbox(provider),
                    const SizedBox(height: 24),

                    // Payment method
                    _buildSectionTitle('طريقة الدفع'),
                    const SizedBox(height: 8),
                    _buildPaymentMethodSelector(provider),

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

            // Bottom bar
            _buildBottomBar(context, provider),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildAddressSelector({
    required String label,
    dynamic address,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
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
              color: address != null ? AppTheme.primaryColor : Colors.grey,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                address?.formattedAddress ?? label,
                style: TextStyle(
                  fontSize: 14,
                  color: address != null ? AppTheme.textPrimary : Colors.grey,
                ),
              ),
            ),
            const Icon(Icons.chevron_left, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        filled: true,
        fillColor: AppTheme.offButtonColor,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  Widget _buildPackageSizeSelector(DeliveryProvider provider) {
    return Row(
      children: PackageSize.values.map((size) {
        final isSelected = provider.packageSize == size;
        String label;
        IconData icon;

        switch (size) {
          case PackageSize.small:
            label = 'صغير';
            icon = Icons.inventory_2_outlined;
            break;
          case PackageSize.medium:
            label = 'متوسط';
            icon = Icons.inventory_2;
            break;
          case PackageSize.large:
            label = 'كبير';
            icon = Icons.inventory;
            break;
          case PackageSize.extraLarge:
            label = 'كبير جداً';
            icon = Icons.local_shipping;
            break;
        }

        return Expanded(
          child: GestureDetector(
            onTap: () => provider.setPackageSize(size),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.primaryColor : AppTheme.offButtonColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300,
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    icon,
                    color: isSelected ? Colors.black : Colors.grey,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildFragileCheckbox(DeliveryProvider provider) {
    return GestureDetector(
      onTap: () => provider.setFragile(!provider.fragile),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: provider.fragile
              ? AppTheme.errorColor.withOpacity(0.1)
              : AppTheme.offButtonColor,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: provider.fragile ? AppTheme.errorColor : Colors.grey.shade300,
          ),
        ),
        child: Row(
          children: [
            Icon(
              provider.fragile ? Icons.check_box : Icons.check_box_outline_blank,
              color: provider.fragile ? AppTheme.errorColor : Colors.grey,
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text('طرد قابل للكسر'),
            ),
            const Icon(Icons.warning_amber, color: Colors.orange),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodSelector(DeliveryProvider provider) {
    final methods = [
      (PaymentProvider.cash, 'نقداً', Icons.money),
      (PaymentProvider.bankily, 'بنكيلي', Icons.account_balance_wallet),
      (PaymentProvider.sedad, 'سداد', Icons.payment),
      (PaymentProvider.masrvi, 'مصرفي', Icons.credit_card),
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

  Widget _buildBottomBar(BuildContext context, DeliveryProvider provider) {
    return Container(
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
            if (provider.fareEstimate != null)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'التكلفة المتوقعة',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    Text(
                      AppTheme.formatCurrency(provider.fareEstimate!.amount),
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ],
                ),
              )
            else
              Expanded(
                child: OutlinedButton(
                  onPressed: provider.canEstimate && !provider.isLoading
                      ? () => provider.getFareEstimate()
                      : null,
                  child: provider.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('حساب التكلفة'),
                ),
              ),
            const SizedBox(width: 16),
            ElevatedButton(
              onPressed: provider.canSubmit && !provider.isLoading
                  ? () => _submitDelivery(context, provider)
                  : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
              child: provider.isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('إرسال الطلب'),
            ),
          ],
        ),
      ),
    );
  }

  void _updateSenderInfo() {
    context.read<DeliveryProvider>().setSenderInfo(
          name: _senderNameController.text,
          phone: _senderPhoneController.text,
        );
  }

  void _updateRecipientInfo() {
    context.read<DeliveryProvider>().setRecipientInfo(
          name: _recipientNameController.text,
          phone: _recipientPhoneController.text,
        );
  }

  void _selectAddress(BuildContext context, bool isPickup) {
    // TODO: Navigate to address selection screen
    // For now, show a placeholder
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('اختيار العنوان قيد التطوير')),
    );
  }

  Future<void> _submitDelivery(
    BuildContext context,
    DeliveryProvider provider,
  ) async {
    if (!_formKey.currentState!.validate()) return;

    final success = await provider.createDelivery();
    if (success && mounted) {
      Navigator.pushReplacementNamed(context, Routes.deliveryTracking);
    }
  }
}

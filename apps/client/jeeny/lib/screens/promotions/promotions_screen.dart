import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../providers/promotion_provider.dart';
import '../../services/promotion_service.dart';

class PromotionsScreen extends StatefulWidget {
  const PromotionsScreen({super.key});

  @override
  State<PromotionsScreen> createState() => _PromotionsScreenState();
}

class _PromotionsScreenState extends State<PromotionsScreen> {
  final _codeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PromotionProvider>().loadPromotions();
    });
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(title: const Text('العروض والخصومات')),
      body: Column(
        children: [
          _buildPromoCodeInput(),
          Expanded(child: _buildPromotionsList()),
        ],
      ),
    );
  }

  Widget _buildPromoCodeInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Consumer<PromotionProvider>(
        builder: (context, provider, _) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _codeController,
                      decoration: InputDecoration(
                        hintText: 'أدخل كود الخصم',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      textDirection: TextDirection.ltr,
                    ),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: provider.isLoading ? null : _validateCode,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    ),
                    child: provider.isLoading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('تطبيق'),
                  ),
                ],
              ),
              if (provider.validationError != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(provider.validationError!, style: const TextStyle(color: AppTheme.errorColor, fontSize: 12)),
                ),
              if (provider.appliedPromotion != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: AppTheme.successColor, size: 16),
                      const SizedBox(width: 8),
                      Text('تم تطبيق: ${provider.appliedPromotion!.title}', style: const TextStyle(color: AppTheme.successColor)),
                    ],
                  ),
                ),
            ],
          );
        },
      ),
    );
  }


  Widget _buildPromotionsList() {
    return Consumer<PromotionProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.promotions.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.promotions.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.local_offer, size: 80, color: Colors.grey[300]),
                const SizedBox(height: 16),
                const Text('لا توجد عروض متاحة حالياً', style: TextStyle(color: AppTheme.textSecondary)),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => provider.loadPromotions(),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.promotions.length,
            itemBuilder: (context, index) => _buildPromotionCard(provider.promotions[index]),
          ),
        );
      },
    );
  }

  Widget _buildPromotionCard(Promotion promo) {
    final dateFormat = DateFormat('dd/MM/yyyy', 'ar');
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          _codeController.text = promo.code;
          _validateCode();
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    promo.discountText,
                    style: const TextStyle(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(promo.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(promo.description, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(promo.code, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                        ),
                        const Spacer(),
                        if (promo.expiresAt != null)
                          Text(
                            'حتى ${dateFormat.format(promo.expiresAt!)}',
                            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _validateCode() async {
    if (_codeController.text.isEmpty) return;
    await context.read<PromotionProvider>().validatePromoCode(_codeController.text);
  }
}

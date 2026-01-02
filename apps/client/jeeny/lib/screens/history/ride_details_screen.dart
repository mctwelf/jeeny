import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../providers/history_provider.dart';

class RideDetailsScreen extends StatefulWidget {
  final String rideId;

  const RideDetailsScreen({super.key, required this.rideId});

  @override
  State<RideDetailsScreen> createState() => _RideDetailsScreenState();
}

class _RideDetailsScreenState extends State<RideDetailsScreen> {
  Map<String, dynamic>? _details;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  Future<void> _loadDetails() async {
    try {
      final details = await context.read<HistoryProvider>().getRideDetails(widget.rideId);
      setState(() {
        _details = details;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(title: const Text('تفاصيل الرحلة')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppTheme.errorColor),
            const SizedBox(height: 16),
            Text(_error!),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadDetails, child: const Text('إعادة المحاولة')),
          ],
        ),
      );
    }

    if (_details == null) return const SizedBox();

    final ride = _details!['ride'] ?? {};
    final driver = _details!['driver'] ?? {};
    final dateFormat = DateFormat('dd/MM/yyyy - HH:mm', 'ar');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildMapPreview(),
          const SizedBox(height: 16),
          _buildInfoCard(ride, driver, dateFormat),
          const SizedBox(height: 16),
          _buildReceiptCard(ride),
          const SizedBox(height: 16),
          _buildActionsCard(),
        ],
      ),
    );
  }

  Widget _buildMapPreview() {
    return Container(
      height: 180,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Center(
        child: Icon(Icons.map, size: 64, color: Colors.grey),
      ),
    );
  }

  Widget _buildInfoCard(Map<String, dynamic> ride, Map<String, dynamic> driver, DateFormat dateFormat) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  child: const Icon(Icons.person, color: AppTheme.primaryColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(driver['name'] ?? 'السائق', style: const TextStyle(fontWeight: FontWeight.bold)),
                      Row(
                        children: [
                          const Icon(Icons.star, size: 16, color: Colors.amber),
                          const SizedBox(width: 4),
                          Text('${driver['rating'] ?? '-'}'),
                        ],
                      ),
                    ],
                  ),
                ),
                Text(ride['vehiclePlate'] ?? '', style: const TextStyle(color: AppTheme.textSecondary)),
              ],
            ),
            const Divider(height: 24),
            _buildLocationInfo(ride),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildInfoItem('التاريخ', ride['createdAt'] != null 
                    ? dateFormat.format(DateTime.parse(ride['createdAt'])) : '-'),
                _buildInfoItem('المسافة', '${ride['distance'] ?? '-'} كم'),
                _buildInfoItem('المدة', '${ride['duration'] ?? '-'} د'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationInfo(Map<String, dynamic> ride) {
    return Column(
      children: [
        Row(
          children: [
            const Icon(Icons.circle, size: 12, color: AppTheme.primaryColor),
            const SizedBox(width: 12),
            Expanded(child: Text(ride['pickupAddress'] ?? 'نقطة الانطلاق')),
          ],
        ),
        Container(
          margin: const EdgeInsets.only(right: 5),
          height: 24,
          width: 2,
          color: AppTheme.dividerColor,
        ),
        Row(
          children: [
            const Icon(Icons.location_on, size: 12, color: AppTheme.errorColor),
            const SizedBox(width: 12),
            Expanded(child: Text(ride['dropoffAddress'] ?? 'الوجهة')),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildReceiptCard(Map<String, dynamic> ride) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('الفاتورة', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            _buildReceiptRow('أجرة الرحلة', '${ride['baseFare'] ?? '-'} MRU'),
            _buildReceiptRow('رسوم الخدمة', '${ride['serviceFee'] ?? '-'} MRU'),
            if (ride['discount'] != null && ride['discount'] > 0)
              _buildReceiptRow('الخصم', '-${ride['discount']} MRU', isDiscount: true),
            const Divider(),
            _buildReceiptRow('الإجمالي', '${ride['totalFare'] ?? '-'} MRU', isBold: true),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.payment, size: 16, color: AppTheme.textSecondary),
                const SizedBox(width: 8),
                Text(ride['paymentMethod'] ?? 'نقداً', style: const TextStyle(color: AppTheme.textSecondary)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value, {bool isBold = false, bool isDiscount = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: isDiscount ? AppTheme.successColor : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionsCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.receipt_long),
            title: const Text('إرسال الفاتورة بالبريد'),
            trailing: const Icon(Icons.chevron_left),
            onTap: _showEmailDialog,
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.support_agent),
            title: const Text('الإبلاغ عن مشكلة'),
            trailing: const Icon(Icons.chevron_left),
            onTap: () {},
          ),
        ],
      ),
    );
  }

  void _showEmailDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إرسال الفاتورة'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'البريد الإلكتروني',
            hintText: 'example@email.com',
          ),
          keyboardType: TextInputType.emailAddress,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                await context.read<HistoryProvider>().sendReceiptByEmail(widget.rideId, controller.text);
                if (mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('تم إرسال الفاتورة بنجاح')),
                  );
                }
              }
            },
            child: const Text('إرسال'),
          ),
        ],
      ),
    );
  }
}

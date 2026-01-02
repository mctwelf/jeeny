import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../models/ride.dart';
import '../../providers/ride_provider.dart';

class ScheduledRidesScreen extends StatefulWidget {
  const ScheduledRidesScreen({super.key});

  @override
  State<ScheduledRidesScreen> createState() => _ScheduledRidesScreenState();
}

class _ScheduledRidesScreenState extends State<ScheduledRidesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RideProvider>().loadScheduledRides();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(title: const Text('الرحلات المجدولة')),
      body: Consumer<RideProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final scheduledRides = provider.scheduledRides;
          if (scheduledRides.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadScheduledRides(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: scheduledRides.length,
              itemBuilder: (context, index) => _buildScheduledRideCard(scheduledRides[index]),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showScheduleDialog(),
        icon: const Icon(Icons.add),
        label: const Text('جدولة رحلة'),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.schedule, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          const Text('لا توجد رحلات مجدولة', style: TextStyle(fontSize: 18, color: AppTheme.textSecondary)),
          const SizedBox(height: 8),
          const Text('يمكنك جدولة رحلة مسبقاً', style: TextStyle(color: AppTheme.textSecondary)),
        ],
      ),
    );
  }


  Widget _buildScheduledRideCard(Ride ride) {
    final dateFormat = DateFormat('EEEE، dd MMMM', 'ar');
    final timeFormat = DateFormat('HH:mm', 'ar');
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.schedule, color: AppTheme.primaryColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ride.scheduledAt != null ? dateFormat.format(ride.scheduledAt!) : '',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        ride.scheduledAt != null ? timeFormat.format(ride.scheduledAt!) : '',
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (value) => _handleAction(value, ride),
                  itemBuilder: (context) => [
                    const PopupMenuItem(value: 'edit', child: Text('تعديل')),
                    const PopupMenuItem(value: 'cancel', child: Text('إلغاء')),
                  ],
                ),
              ],
            ),
            const Divider(height: 24),
            _buildLocationRow(Icons.circle, AppTheme.primaryColor, ride.pickup.address),
            Container(
              margin: const EdgeInsets.only(right: 11),
              height: 20,
              width: 2,
              color: AppTheme.dividerColor,
            ),
            _buildLocationRow(Icons.location_on, AppTheme.errorColor, ride.dropoff.address),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationRow(IconData icon, Color color, String address) {
    return Row(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 12),
        Expanded(child: Text(address, maxLines: 1, overflow: TextOverflow.ellipsis)),
      ],
    );
  }

  void _handleAction(String action, Ride ride) {
    if (action == 'cancel') {
      _showCancelDialog(ride);
    }
  }

  void _showCancelDialog(Ride ride) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إلغاء الرحلة'),
        content: const Text('هل أنت متأكد من إلغاء هذه الرحلة المجدولة؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('لا')),
          ElevatedButton(
            onPressed: () {
              context.read<RideProvider>().cancelScheduledRide(ride.id);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorColor),
            child: const Text('نعم، إلغاء'),
          ),
        ],
      ),
    );
  }

  void _showScheduleDialog() {
    Navigator.pushNamed(context, '/schedule-ride');
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../models/ride.dart';
import '../../models/enums.dart';
import '../../providers/history_provider.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HistoryProvider>().loadHistory(refresh: true);
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<HistoryProvider>().loadHistory();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('سجل الرحلات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      body: Consumer<HistoryProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.rides.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null && provider.rides.isEmpty) {
            return _buildErrorState(provider);
          }

          if (provider.rides.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadHistory(refresh: true),
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: provider.rides.length + (provider.hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == provider.rides.length) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }
                return _buildRideCard(provider.rides[index]);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildRideCard(Ride ride) {
    final dateFormat = DateFormat('dd/MM/yyyy - HH:mm', 'ar');
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => Navigator.pushNamed(
          context,
          Routes.rideHistory,
          arguments: {'rideId': ride.id},
        ),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    dateFormat.format(ride.createdAt),
                    style: const TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                  _buildStatusChip(ride.status),
                ],
              ),
              const SizedBox(height: 12),
              _buildLocationRow(
                Icons.circle,
                AppTheme.primaryColor,
                ride.pickup.address,
              ),
              Container(
                margin: const EdgeInsets.only(right: 11),
                height: 20,
                width: 2,
                color: AppTheme.dividerColor,
              ),
              _buildLocationRow(
                Icons.location_on,
                AppTheme.errorColor,
                ride.dropoff.address,
              ),
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        _getVehicleIcon(ride.vehicleType),
                        size: 20,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _getVehicleTypeName(ride.vehicleType),
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                  Text(
                    '${ride.fare?.toStringAsFixed(0) ?? '-'} MRU',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLocationRow(IconData icon, Color color, String address) {
    return Row(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            address,
            style: const TextStyle(fontSize: 14),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusChip(RideStatus status) {
    Color color;
    String text;
    
    switch (status) {
      case RideStatus.completed:
        color = AppTheme.successColor;
        text = 'مكتملة';
        break;
      case RideStatus.cancelled:
        color = AppTheme.errorColor;
        text = 'ملغاة';
        break;
      case RideStatus.inProgress:
        color = AppTheme.primaryColor;
        text = 'جارية';
        break;
      default:
        color = AppTheme.textSecondary;
        text = 'معلقة';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w500),
      ),
    );
  }

  IconData _getVehicleIcon(VehicleType type) {
    switch (type) {
      case VehicleType.economy:
        return Icons.directions_car;
      case VehicleType.comfort:
        return Icons.directions_car;
      case VehicleType.premium:
        return Icons.local_taxi;
      case VehicleType.suv:
        return Icons.airport_shuttle;
      case VehicleType.van:
        return Icons.airport_shuttle;
    }
  }

  String _getVehicleTypeName(VehicleType type) {
    switch (type) {
      case VehicleType.economy:
        return 'اقتصادي';
      case VehicleType.comfort:
        return 'مريح';
      case VehicleType.premium:
        return 'فاخر';
      case VehicleType.suv:
        return 'دفع رباعي';
      case VehicleType.van:
        return 'فان';
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          const Text(
            'لا توجد رحلات سابقة',
            style: TextStyle(fontSize: 18, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 8),
          const Text(
            'ستظهر رحلاتك هنا بعد إتمامها',
            style: TextStyle(color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(HistoryProvider provider) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 80, color: AppTheme.errorColor),
          const SizedBox(height: 16),
          Text(provider.error ?? 'حدث خطأ'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => provider.loadHistory(refresh: true),
            child: const Text('إعادة المحاولة'),
          ),
        ],
      ),
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const _FilterSheet(),
    );
  }
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet();

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  RideStatus? _selectedStatus;
  DateTimeRange? _dateRange;

  @override
  void initState() {
    super.initState();
    final provider = context.read<HistoryProvider>();
    _selectedStatus = provider.statusFilter;
    if (provider.fromDate != null && provider.toDate != null) {
      _dateRange = DateTimeRange(start: provider.fromDate!, end: provider.toDate!);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'تصفية الرحلات',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          const Text('حالة الرحلة'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              _buildFilterChip('الكل', null),
              _buildFilterChip('مكتملة', RideStatus.completed),
              _buildFilterChip('ملغاة', RideStatus.cancelled),
            ],
          ),
          const SizedBox(height: 16),
          const Text('الفترة الزمنية'),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _selectDateRange,
            icon: const Icon(Icons.calendar_today),
            label: Text(_dateRange != null
                ? '${DateFormat('dd/MM').format(_dateRange!.start)} - ${DateFormat('dd/MM').format(_dateRange!.end)}'
                : 'اختر الفترة'),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    context.read<HistoryProvider>().clearFilters();
                    Navigator.pop(context);
                  },
                  child: const Text('مسح الفلاتر'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: _applyFilters,
                  child: const Text('تطبيق'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, RideStatus? status) {
    final isSelected = _selectedStatus == status;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _selectedStatus = status),
      selectedColor: AppTheme.primaryColor.withOpacity(0.2),
    );
  }

  Future<void> _selectDateRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: _dateRange,
      locale: const Locale('ar'),
    );
    if (range != null) {
      setState(() => _dateRange = range);
    }
  }

  void _applyFilters() {
    final provider = context.read<HistoryProvider>();
    provider.setStatusFilter(_selectedStatus);
    if (_dateRange != null) {
      provider.setDateRange(_dateRange!.start, _dateRange!.end);
    }
    Navigator.pop(context);
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../providers/intercity_provider.dart';
import '../../widgets/widgets.dart';

/// Intercity search screen with city selection and date picker
class IntercitySearchScreen extends StatefulWidget {
  const IntercitySearchScreen({super.key});

  @override
  State<IntercitySearchScreen> createState() => _IntercitySearchScreenState();
}

class _IntercitySearchScreenState extends State<IntercitySearchScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<IntercityProvider>().loadRoutes();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<IntercityProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('السفر بين المدن'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: provider.isLoading && provider.routes.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header image
                  Container(
                    height: 150,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.primaryColor,
                          AppTheme.primaryColor.withOpacity(0.7),
                        ],
                      ),
                    ),
                    child: Stack(
                      children: [
                        Positioned(
                          left: 20,
                          top: 20,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'سافر بين المدن',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'احجز رحلتك بسهولة',
                                style: TextStyle(fontSize: 14),
                              ),
                            ],
                          ),
                        ),
                        Positioned(
                          right: 20,
                          bottom: 10,
                          child: Icon(
                            Icons.directions_bus,
                            size: 80,
                            color: Colors.white.withOpacity(0.3),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Search form
                  CustomContainer(
                    height: null,
                    width: double.infinity,
                    color: Colors.white,
                    circular: 25,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          // Origin city
                          _buildCitySelector(
                            label: 'من',
                            hint: 'اختر مدينة الانطلاق',
                            icon: Icons.circle_outlined,
                            iconColor: AppTheme.primaryColor,
                            selectedCityId: provider.originCityId,
                            routes: provider.routes,
                            isOrigin: true,
                            onSelect: (cityId) => provider.setOrigin(cityId),
                          ),
                          const SizedBox(height: 8),

                          // Swap button
                          Row(
                            children: [
                              Expanded(
                                child: Divider(color: Colors.grey.shade300),
                              ),
                              IconButton(
                                onPressed: provider.swapCities,
                                icon: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: AppTheme.offButtonColor,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(
                                    Icons.swap_vert,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ),
                              Expanded(
                                child: Divider(color: Colors.grey.shade300),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          // Destination city
                          _buildCitySelector(
                            label: 'إلى',
                            hint: 'اختر مدينة الوصول',
                            icon: Icons.location_on,
                            iconColor: Colors.red,
                            selectedCityId: provider.destinationCityId,
                            routes: provider.routes,
                            isOrigin: false,
                            onSelect: (cityId) => provider.setDestination(cityId),
                          ),
                          const SizedBox(height: 20),

                          // Date selector
                          _buildDateSelector(context, provider),
                          const SizedBox(height: 16),

                          // Passenger count
                          _buildPassengerSelector(provider),
                          const SizedBox(height: 24),

                          // Error message
                          if (provider.errorMessage != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: Text(
                                provider.errorMessage!,
                                style: const TextStyle(
                                  color: AppTheme.errorColor,
                                  fontSize: 14,
                                ),
                              ),
                            ),

                          // Search button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: provider.isLoading
                                  ? null
                                  : () => _searchTrips(context, provider),
                              child: provider.isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text('بحث عن رحلات'),
                            ),
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

  Widget _buildCitySelector({
    required String label,
    required String hint,
    required IconData icon,
    required Color iconColor,
    required String? selectedCityId,
    required List routes,
    required bool isOrigin,
    required Function(String) onSelect,
  }) {
    // Get unique cities from routes
    final cities = <String>{};
    for (final route in routes) {
      cities.add(route.fromCity);
      cities.add(route.toCity);
    }

    final selectedCity = selectedCityId;

    return GestureDetector(
      onTap: () => _showCityPicker(
        context,
        cities.toList(),
        selectedCity,
        onSelect,
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.offButtonColor,
          borderRadius: BorderRadius.circular(15),
        ),
        child: Row(
          children: [
            Icon(icon, color: iconColor),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    selectedCity ?? hint,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: selectedCity != null
                          ? FontWeight.w600
                          : FontWeight.normal,
                      color: selectedCity != null
                          ? AppTheme.textPrimary
                          : Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildDateSelector(BuildContext context, IntercityProvider provider) {
    final dateFormat = DateFormat('EEEE، d MMMM yyyy', 'ar');

    return GestureDetector(
      onTap: () => _selectDate(context, provider),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.offButtonColor,
          borderRadius: BorderRadius.circular(15),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today, color: AppTheme.primaryColor),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'تاريخ السفر',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    provider.selectedDate != null
                        ? dateFormat.format(provider.selectedDate!)
                        : 'اختر التاريخ',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: provider.selectedDate != null
                          ? FontWeight.w600
                          : FontWeight.normal,
                      color: provider.selectedDate != null
                          ? AppTheme.textPrimary
                          : Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildPassengerSelector(IntercityProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.offButtonColor,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          const Icon(Icons.people, color: AppTheme.primaryColor),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'عدد المسافرين',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${provider.passengerCount} مسافر',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Row(
            children: [
              _buildCounterButton(
                icon: Icons.remove,
                onTap: provider.passengerCount > 1
                    ? () => provider.setPassengerCount(provider.passengerCount - 1)
                    : null,
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  '${provider.passengerCount}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              _buildCounterButton(
                icon: Icons.add,
                onTap: provider.passengerCount < 10
                    ? () => provider.setPassengerCount(provider.passengerCount + 1)
                    : null,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCounterButton({
    required IconData icon,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: onTap != null ? AppTheme.primaryColor : Colors.grey.shade300,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          icon,
          color: onTap != null ? Colors.black : Colors.grey,
          size: 20,
        ),
      ),
    );
  }

  void _showCityPicker(
    BuildContext context,
    List<String> cities,
    String? selectedCity,
    Function(String) onSelect,
  ) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppTheme.lineContainer(),
            const SizedBox(height: 20),
            const Text(
              'اختر المدينة',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: cities.length,
                itemBuilder: (context, index) {
                  final city = cities[index];
                  final isSelected = city == selectedCity;
                  return ListTile(
                    title: Text(
                      city,
                      style: TextStyle(
                        fontWeight:
                            isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected
                            ? AppTheme.primaryColor
                            : AppTheme.textPrimary,
                      ),
                    ),
                    trailing: isSelected
                        ? const Icon(Icons.check, color: AppTheme.primaryColor)
                        : null,
                    onTap: () {
                      onSelect(city);
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _selectDate(
    BuildContext context,
    IntercityProvider provider,
  ) async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: provider.selectedDate ?? now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
      locale: const Locale('ar'),
    );
    if (date != null) {
      provider.setDate(date);
    }
  }

  Future<void> _searchTrips(
    BuildContext context,
    IntercityProvider provider,
  ) async {
    await provider.searchTrips();
    if (provider.errorMessage == null && provider.searchResults.isNotEmpty) {
      if (mounted) {
        Navigator.pushNamed(context, Routes.tripList);
      }
    } else if (provider.searchResults.isEmpty && provider.errorMessage == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('لا توجد رحلات متاحة في هذا التاريخ')),
        );
      }
    }
  }
}

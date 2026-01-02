import 'package:dotted_line/dotted_line.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../providers/location_provider.dart';
import '../../providers/ride_provider.dart';
import '../../widgets/widgets.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  GoogleMapController? _mapController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LocationProvider>().initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    final locationProvider = context.watch<LocationProvider>();
    final rideProvider = context.watch<RideProvider>();

    return Scaffold(
      body: Stack(
        children: [
          // Map
          MapWidget(
            initialLocation: locationProvider.currentLocation,
            showMyLocation: true,
            onMapCreated: (controller) {
              _mapController = controller;
            },
          ),

          // Top bar
          Positioned(
            top: 59,
            left: 0,
            right: 0,
            child: _buildTopBar(context),
          ),

          // Driver marker (if available)
          if (rideProvider.driverLocation != null)
            Positioned(
              top: 240,
              left: 150,
              child: Column(
                children: [
                  Container(
                    height: 25,
                    width: 57,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      color: AppTheme.primaryColor,
                    ),
                    child: Center(
                      child: Text(
                        '${rideProvider.driverEta ?? 3} دقيقة',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                  ),
                  Image.asset(
                    'assets/images/car_top.png',
                    width: 40,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.local_taxi,
                      size: 40,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
            ),

          // My location button
          Positioned(
            bottom: 300,
            right: 20,
            child: CustomContainer(
              height: 50,
              width: 50,
              color: AppTheme.primaryColor,
              circular: 15,
              child: IconButton(
                onPressed: () async {
                  await locationProvider.refreshLocation();
                  if (locationProvider.currentLocation != null) {
                    _mapController?.animateCamera(
                      CameraUpdate.newLatLng(
                        LatLng(
                          locationProvider.currentLocation!.latitude,
                          locationProvider.currentLocation!.longitude,
                        ),
                      ),
                    );
                  }
                },
                icon: const Icon(
                  Icons.my_location,
                  color: Colors.white,
                ),
              ),
            ),
          ),

          // Bottom sheet
          Positioned(
            bottom: 20,
            left: 25,
            right: 25,
            child: _buildBottomSheet(context, rideProvider),
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Profile picture
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, Routes.profile),
            child: Container(
              height: 50,
              width: 50,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white),
                color: AppTheme.offButtonColor,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.person, color: Colors.grey),
            ),
          ),

          // Wallet
          CustomContainer(
            height: 50,
            width: 124,
            color: Colors.white,
            circular: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                const Icon(Icons.wallet),
                const CustomText(
                  text: '0 MRU',
                  size: 14,
                  weight: FontWeight.w700,
                ),
                CustomContainer(
                  height: 38,
                  width: 38,
                  color: AppTheme.primaryColor,
                  child: IconButton(
                    onPressed: () => Navigator.pushNamed(context, Routes.myWallet),
                    icon: const Icon(Icons.add, size: 20),
                  ),
                ),
              ],
            ),
          ),

          // Search
          CustomContainer(
            height: 50,
            width: 50,
            color: Colors.white,
            circular: 20,
            child: IconButton(
              onPressed: () {
                // TODO: Open search
              },
              icon: const Icon(Icons.search),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomSheet(BuildContext context, RideProvider rideProvider) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, Routes.addressSelection),
      child: CustomContainer(
        height: 255,
        width: double.infinity,
        color: Colors.white,
        circular: 35,
        child: Column(
          children: [
            const SizedBox(height: 15),
            // Handle bar
            Container(
              height: 5,
              width: 40,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: AppTheme.offButtonColor,
              ),
            ),
            const SizedBox(height: 39),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Pickup
                  Row(
                    children: [
                      const SizedBox(width: 46),
                      CustomText(
                        text: rideProvider.pickup != null
                            ? 'نقطة الانطلاق'
                            : 'أين أنت؟',
                        size: 14,
                        weight: FontWeight.w400,
                        color: Colors.grey,
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      Icon(
                        Icons.circle_outlined,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 26),
                      Expanded(
                        child: CustomText(
                          text: rideProvider.pickup?.formattedAddress ?? '|',
                          size: 14,
                        ),
                      ),
                    ],
                  ),

                  // Divider with taxi icon
                  Row(
                    children: [
                      SizedBox(
                        width: 24,
                        height: 69,
                        child: VerticalDivider(
                          color: AppTheme.offButtonColor,
                          thickness: 2,
                        ),
                      ),
                      Expanded(
                        child: DottedLine(
                          dashColor: Colors.grey.shade400,
                        ),
                      ),
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: AppTheme.offButtonColor,
                        child: const Icon(
                          Icons.local_taxi,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),

                  // Dropoff
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 26),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const CustomText(
                            text: 'الوجهة',
                            color: Colors.grey,
                          ),
                          const SizedBox(height: 3),
                          CustomText(
                            text: rideProvider.dropoff?.formattedAddress ??
                                'إلى أين تريد الذهاب؟',
                            size: 16,
                            weight: FontWeight.w600,
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

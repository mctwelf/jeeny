import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/base_models.dart';
import '../config/theme.dart';

/// Custom map widget with Google Maps
class MapWidget extends StatefulWidget {
  final GeoLocation? initialLocation;
  final GeoLocation? destination;
  final Set<Marker>? markers;
  final Set<Polyline>? polylines;
  final bool showMyLocation;
  final bool showMyLocationButton;
  final bool zoomControlsEnabled;
  final Function(GoogleMapController)? onMapCreated;
  final Function(LatLng)? onTap;
  final Function(CameraPosition)? onCameraMove;
  final double initialZoom;

  const MapWidget({
    super.key,
    this.initialLocation,
    this.destination,
    this.markers,
    this.polylines,
    this.showMyLocation = true,
    this.showMyLocationButton = false,
    this.zoomControlsEnabled = false,
    this.onMapCreated,
    this.onTap,
    this.onCameraMove,
    this.initialZoom = 15.0,
  });

  @override
  State<MapWidget> createState() => _MapWidgetState();
}

class _MapWidgetState extends State<MapWidget> {
  GoogleMapController? _controller;
  
  // Default location (Nouakchott, Mauritania)
  static const LatLng _defaultLocation = LatLng(18.0735, -15.9582);

  @override
  void didUpdateWidget(MapWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Animate to new location if changed
    if (widget.initialLocation != oldWidget.initialLocation &&
        widget.initialLocation != null &&
        _controller != null) {
      _controller!.animateCamera(
        CameraUpdate.newLatLng(
          LatLng(
            widget.initialLocation!.latitude,
            widget.initialLocation!.longitude,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final initialPosition = widget.initialLocation != null
        ? LatLng(
            widget.initialLocation!.latitude,
            widget.initialLocation!.longitude,
          )
        : _defaultLocation;

    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: initialPosition,
        zoom: widget.initialZoom,
      ),
      onMapCreated: (controller) {
        _controller = controller;
        widget.onMapCreated?.call(controller);
      },
      markers: widget.markers ?? {},
      polylines: widget.polylines ?? {},
      myLocationEnabled: widget.showMyLocation,
      myLocationButtonEnabled: widget.showMyLocationButton,
      zoomControlsEnabled: widget.zoomControlsEnabled,
      mapToolbarEnabled: false,
      compassEnabled: false,
      onTap: widget.onTap,
      onCameraMove: widget.onCameraMove,
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }
}

/// Location picker widget
class LocationPicker extends StatefulWidget {
  final GeoLocation? initialLocation;
  final Function(GeoLocation) onLocationSelected;
  final String? title;

  const LocationPicker({
    super.key,
    this.initialLocation,
    required this.onLocationSelected,
    this.title,
  });

  @override
  State<LocationPicker> createState() => _LocationPickerState();
}

class _LocationPickerState extends State<LocationPicker> {
  GeoLocation? _selectedLocation;
  GoogleMapController? _controller;

  @override
  void initState() {
    super.initState();
    _selectedLocation = widget.initialLocation;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title ?? 'اختر الموقع'),
        backgroundColor: AppTheme.backgroundColor,
        elevation: 0,
        actions: [
          if (_selectedLocation != null)
            TextButton(
              onPressed: () {
                widget.onLocationSelected(_selectedLocation!);
                Navigator.pop(context);
              },
              child: const Text(
                'تأكيد',
                style: TextStyle(
                  color: AppTheme.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
      body: Stack(
        children: [
          MapWidget(
            initialLocation: widget.initialLocation,
            showMyLocation: true,
            showMyLocationButton: true,
            onMapCreated: (controller) {
              _controller = controller;
            },
            onTap: (latLng) {
              setState(() {
                _selectedLocation = GeoLocation(
                  latitude: latLng.latitude,
                  longitude: latLng.longitude,
                );
              });
            },
            markers: _selectedLocation != null
                ? {
                    Marker(
                      markerId: const MarkerId('selected'),
                      position: LatLng(
                        _selectedLocation!.latitude,
                        _selectedLocation!.longitude,
                      ),
                      icon: BitmapDescriptor.defaultMarkerWithHue(
                        BitmapDescriptor.hueOrange,
                      ),
                    ),
                  }
                : {},
          ),
          
          // Center marker indicator
          const Center(
            child: Padding(
              padding: EdgeInsets.only(bottom: 40),
              child: Icon(
                Icons.location_on,
                size: 40,
                color: AppTheme.primaryColor,
              ),
            ),
          ),
          
          // Instructions
          Positioned(
            top: 20,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: const Text(
                'اضغط على الخريطة لتحديد الموقع',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Driver marker widget
class DriverMarker extends StatelessWidget {
  final String? imageUrl;
  final double heading;

  const DriverMarker({
    super.key,
    this.imageUrl,
    this.heading = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: heading * 3.14159 / 180,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppTheme.primaryColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white, width: 2),
        ),
        child: const Icon(
          Icons.local_taxi,
          color: Colors.white,
          size: 24,
        ),
      ),
    );
  }
}

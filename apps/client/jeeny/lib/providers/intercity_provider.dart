import 'package:flutter/foundation.dart';
import '../models/intercity.dart';
import '../services/intercity_service.dart';

/// Intercity travel state provider
class IntercityProvider extends ChangeNotifier {
  final IntercityService _service = IntercityService();

  List<IntercityRoute> _routes = [];
  List<IntercityTrip> _searchResults = [];
  List<IntercityBooking> _myBookings = [];
  IntercityTrip? _selectedTrip;
  IntercityBooking? _currentBooking;
  
  String? _originCityId;
  String? _destinationCityId;
  DateTime? _selectedDate;
  int _passengerCount = 1;
  
  bool _isLoading = false;
  String? _errorMessage;

  List<IntercityRoute> get routes => _routes;
  List<IntercityTrip> get searchResults => _searchResults;
  List<IntercityBooking> get myBookings => _myBookings;
  IntercityTrip? get selectedTrip => _selectedTrip;
  IntercityBooking? get currentBooking => _currentBooking;
  String? get originCityId => _originCityId;
  String? get destinationCityId => _destinationCityId;
  DateTime? get selectedDate => _selectedDate;
  int get passengerCount => _passengerCount;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Load available routes
  Future<void> loadRoutes() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _routes = await _service.getRoutes();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Set origin city
  void setOrigin(String cityId) {
    _originCityId = cityId;
    notifyListeners();
  }

  /// Set destination city
  void setDestination(String cityId) {
    _destinationCityId = cityId;
    notifyListeners();
  }

  /// Set travel date
  void setDate(DateTime date) {
    _selectedDate = date;
    notifyListeners();
  }

  /// Set passenger count
  void setPassengerCount(int count) {
    _passengerCount = count;
    notifyListeners();
  }

  /// Swap origin and destination
  void swapCities() {
    final temp = _originCityId;
    _originCityId = _destinationCityId;
    _destinationCityId = temp;
    notifyListeners();
  }

  /// Search for trips
  Future<void> searchTrips() async {
    if (_originCityId == null || _destinationCityId == null || _selectedDate == null) {
      _errorMessage = 'يرجى تحديد المدينة والتاريخ';
      notifyListeners();
      return;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _searchResults = await _service.searchTrips(
        originCityId: _originCityId!,
        destinationCityId: _destinationCityId!,
        date: _selectedDate!,
        passengers: _passengerCount,
      );
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Select a trip
  void selectTrip(IntercityTrip trip) {
    _selectedTrip = trip;
    notifyListeners();
  }

  /// Create booking
  Future<bool> createBooking(List<PassengerInfo> passengers, {String? notes}) async {
    if (_selectedTrip == null) {
      _errorMessage = 'يرجى اختيار رحلة';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentBooking = await _service.createBooking(
        tripId: _selectedTrip!.id,
        passengers: passengers,
        notes: notes,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Load user's bookings
  Future<void> loadMyBookings({bool upcoming = true}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _myBookings = await _service.getMyBookings(upcoming: upcoming);
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Cancel booking
  Future<bool> cancelBooking(String bookingId, {String? reason}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await _service.cancelBooking(bookingId, reason: reason);
      if (success) {
        await loadMyBookings();
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Reset search
  void resetSearch() {
    _searchResults = [];
    _selectedTrip = null;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

import 'package:flutter/foundation.dart';
import '../models/ride.dart';
import '../models/enums.dart';
import '../services/history_service.dart';

/// Provider for ride history state management
class HistoryProvider extends ChangeNotifier {
  final HistoryService _historyService;

  List<Ride> _rides = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;
  RideStatus? _statusFilter;
  DateTime? _fromDate;
  DateTime? _toDate;

  HistoryProvider(this._historyService);

  List<Ride> get rides => _rides;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMore => _hasMore;
  RideStatus? get statusFilter => _statusFilter;
  DateTime? get fromDate => _fromDate;
  DateTime? get toDate => _toDate;

  /// Load ride history
  Future<void> loadHistory({bool refresh = false}) async {
    if (_isLoading) return;
    if (!refresh && !_hasMore) return;

    _isLoading = true;
    _error = null;
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
    }
    notifyListeners();

    try {
      final newRides = await _historyService.getRideHistory(
        page: _currentPage,
        limit: 20,
        status: _statusFilter,
        fromDate: _fromDate,
        toDate: _toDate,
      );

      if (refresh) {
        _rides = newRides;
      } else {
        _rides.addAll(newRides);
      }

      _hasMore = newRides.length >= 20;
      _currentPage++;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Set status filter
  void setStatusFilter(RideStatus? status) {
    _statusFilter = status;
    loadHistory(refresh: true);
  }

  /// Set date range filter
  void setDateRange(DateTime? from, DateTime? to) {
    _fromDate = from;
    _toDate = to;
    loadHistory(refresh: true);
  }

  /// Clear all filters
  void clearFilters() {
    _statusFilter = null;
    _fromDate = null;
    _toDate = null;
    loadHistory(refresh: true);
  }

  /// Get ride details
  Future<Map<String, dynamic>> getRideDetails(String rideId) async {
    return await _historyService.getRideDetails(rideId);
  }

  /// Get ride receipt
  Future<Map<String, dynamic>> getRideReceipt(String rideId) async {
    return await _historyService.getRideReceipt(rideId);
  }

  /// Send receipt by email
  Future<void> sendReceiptByEmail(String rideId, String email) async {
    await _historyService.sendReceiptByEmail(rideId, email);
  }
}

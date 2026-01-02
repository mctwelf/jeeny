import 'package:flutter/foundation.dart';
import '../services/support_service.dart';

/// Provider for support state management
class SupportProvider extends ChangeNotifier {
  final SupportService _supportService;

  List<FaqItem> _faqs = [];
  List<SupportTicket> _tickets = [];
  SupportTicket? _currentTicket;
  bool _isLoading = false;
  String? _error;

  SupportProvider(this._supportService);

  List<FaqItem> get faqs => _faqs;
  List<SupportTicket> get tickets => _tickets;
  SupportTicket? get currentTicket => _currentTicket;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Load FAQs
  Future<void> loadFaqs({String? category}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _faqs = await _supportService.getFaqs(category: category);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load user's tickets
  Future<void> loadTickets() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _tickets = await _supportService.getTickets();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load ticket details
  Future<void> loadTicket(String ticketId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentTicket = await _supportService.getTicket(ticketId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }


  /// Create new ticket
  Future<bool> createTicket({
    required String subject,
    required String description,
    required String category,
    String? rideId,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final ticket = await _supportService.createTicket(
        subject: subject,
        description: description,
        category: category,
        rideId: rideId,
      );
      _tickets.insert(0, ticket);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Reply to ticket
  Future<bool> replyToTicket(String ticketId, String message) async {
    try {
      await _supportService.replyToTicket(ticketId, message);
      await loadTicket(ticketId);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Close ticket
  Future<bool> closeTicket(String ticketId) async {
    try {
      await _supportService.closeTicket(ticketId);
      await loadTickets();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}

import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';

enum ConnectionStatus {
  online,
  offline,
  unknown,
}

class ConnectivityService extends ChangeNotifier {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  
  ConnectionStatus _status = ConnectionStatus.unknown;
  ConnectionStatus get status => _status;
  
  bool get isOnline => _status == ConnectionStatus.online;
  bool get isOffline => _status == ConnectionStatus.offline;

  ConnectivityService() {
    _init();
  }

  Future<void> _init() async {
    // Get initial status
    await checkConnectivity();
    
    // Listen for changes
    _subscription = _connectivity.onConnectivityChanged.listen(_updateStatus);
  }

  Future<ConnectionStatus> checkConnectivity() async {
    try {
      final results = await _connectivity.checkConnectivity();
      _updateStatus(results);
      return _status;
    } catch (e) {
      _status = ConnectionStatus.unknown;
      notifyListeners();
      return _status;
    }
  }

  void _updateStatus(List<ConnectivityResult> results) {
    final previousStatus = _status;
    
    if (results.isEmpty || results.contains(ConnectivityResult.none)) {
      _status = ConnectionStatus.offline;
    } else {
      _status = ConnectionStatus.online;
    }
    
    if (previousStatus != _status) {
      notifyListeners();
    }
  }

  /// Show offline banner if offline
  Widget buildOfflineBanner({
    required Widget child,
    String message = 'لا يوجد اتصال بالإنترنت',
  }) {
    return Column(
      children: [
        if (isOffline)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8),
            color: Colors.red,
            child: Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontFamily: 'Tajawal',
              ),
            ),
          ),
        Expanded(child: child),
      ],
    );
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

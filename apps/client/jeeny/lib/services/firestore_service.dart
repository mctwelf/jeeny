import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/base_models.dart';
import '../models/enums.dart';

/// Firestore service for real-time data
class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Watch driver location for a ride
  Stream<GeoLocation?> watchDriverLocation(String rideId) {
    return _firestore
        .collection('rides')
        .doc(rideId)
        .snapshots()
        .map((snapshot) {
      if (!snapshot.exists) return null;
      
      final data = snapshot.data();
      if (data == null || data['driverLocation'] == null) return null;
      
      final location = data['driverLocation'];
      return GeoLocation(
        latitude: (location['latitude'] as num).toDouble(),
        longitude: (location['longitude'] as num).toDouble(),
      );
    });
  }

  /// Watch ride status
  Stream<RideStatus?> watchRideStatus(String rideId) {
    return _firestore
        .collection('rides')
        .doc(rideId)
        .snapshots()
        .map((snapshot) {
      if (!snapshot.exists) return null;
      
      final data = snapshot.data();
      if (data == null || data['status'] == null) return null;
      
      return RideStatus.values.firstWhere(
        (e) => e.name == data['status'],
        orElse: () => RideStatus.pending,
      );
    });
  }

  /// Watch ride updates (full ride data)
  Stream<Map<String, dynamic>?> watchRide(String rideId) {
    return _firestore
        .collection('rides')
        .doc(rideId)
        .snapshots()
        .map((snapshot) {
      if (!snapshot.exists) return null;
      return snapshot.data();
    });
  }

  /// Watch driver ETA
  Stream<int?> watchDriverEta(String rideId) {
    return _firestore
        .collection('rides')
        .doc(rideId)
        .snapshots()
        .map((snapshot) {
      if (!snapshot.exists) return null;
      
      final data = snapshot.data();
      if (data == null) return null;
      
      return data['driverEta'] as int?;
    });
  }

  /// Watch nearby drivers (for showing on map before booking)
  Stream<List<DriverLocation>> watchNearbyDrivers(
    GeoLocation center,
    double radiusKm,
  ) {
    // Using GeoHash for efficient geo queries
    // This is a simplified version - in production, use geoflutterfire2
    return _firestore
        .collection('drivers')
        .where('isOnline', isEqualTo: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) {
            final data = doc.data();
            if (data['location'] == null) return null;
            
            return DriverLocation(
              driverId: doc.id,
              location: GeoLocation(
                latitude: (data['location']['latitude'] as num).toDouble(),
                longitude: (data['location']['longitude'] as num).toDouble(),
              ),
              heading: (data['heading'] as num?)?.toDouble() ?? 0,
              vehicleType: VehicleType.values.firstWhere(
                (e) => e.name == data['vehicleType'],
                orElse: () => VehicleType.economy,
              ),
            );
          })
          .whereType<DriverLocation>()
          .toList();
    });
  }

  /// Watch chat messages
  Stream<List<Map<String, dynamic>>> watchMessages(String conversationId) {
    return _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();
    });
  }

  /// Send a message
  Future<void> sendMessage({
    required String conversationId,
    required String senderId,
    required String content,
    String type = 'text',
  }) async {
    await _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .add({
      'senderId': senderId,
      'content': content,
      'type': type,
      'isRead': false,
      'createdAt': FieldValue.serverTimestamp(),
    });

    // Update conversation last message
    await _firestore.collection('conversations').doc(conversationId).update({
      'lastMessage': content,
      'lastMessageAt': FieldValue.serverTimestamp(),
    });
  }

  /// Mark messages as read
  Future<void> markMessagesAsRead(String conversationId, String readerId) async {
    final messages = await _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .where('senderId', isNotEqualTo: readerId)
        .where('isRead', isEqualTo: false)
        .get();

    final batch = _firestore.batch();
    for (final doc in messages.docs) {
      batch.update(doc.reference, {'isRead': true});
    }
    await batch.commit();
  }
}

/// Driver location model for map display
class DriverLocation {
  final String driverId;
  final GeoLocation location;
  final double heading;
  final VehicleType vehicleType;

  const DriverLocation({
    required this.driverId,
    required this.location,
    required this.heading,
    required this.vehicleType,
  });
}

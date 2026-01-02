import 'package:equatable/equatable.dart';
import 'enums.dart';
import 'base_models.dart';

/// Contract model
class Contract extends Equatable {
  final String id;
  final String clientId;
  final String? driverId;
  final ContractType type;
  final ContractStatus status;
  final Address pickup;
  final Address dropoff;
  final List<ContractScheduleDay> schedule;
  final Money monthlyPrice;
  final DateTime startDate;
  final DateTime? endDate;
  final PaymentProvider paymentMethod;
  final String? notes;
  final DateTime createdAt;

  const Contract({
    required this.id,
    required this.clientId,
    this.driverId,
    required this.type,
    required this.status,
    required this.pickup,
    required this.dropoff,
    required this.schedule,
    required this.monthlyPrice,
    required this.startDate,
    this.endDate,
    required this.paymentMethod,
    this.notes,
    required this.createdAt,
  });

  factory Contract.fromJson(Map<String, dynamic> json) {
    return Contract(
      id: json['id'] as String,
      clientId: json['clientId'] as String,
      driverId: json['driverId'] as String?,
      type: ContractType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ContractType.monthly,
      ),
      status: ContractStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => ContractStatus.pending,
      ),
      pickup: Address.fromJson(json['pickup'] as Map<String, dynamic>),
      dropoff: Address.fromJson(json['dropoff'] as Map<String, dynamic>),
      schedule: (json['schedule'] as List)
          .map((e) => ContractScheduleDay.fromJson(e as Map<String, dynamic>))
          .toList(),
      monthlyPrice: Money.fromJson(json['monthlyPrice'] as Map<String, dynamic>),
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] != null
          ? DateTime.parse(json['endDate'] as String)
          : null,
      paymentMethod: PaymentProvider.values.firstWhere(
        (e) => e.name == json['paymentMethod'],
        orElse: () => PaymentProvider.cash,
      ),
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'clientId': clientId,
        if (driverId != null) 'driverId': driverId,
        'type': type.name,
        'status': status.name,
        'pickup': pickup.toJson(),
        'dropoff': dropoff.toJson(),
        'schedule': schedule.map((e) => e.toJson()).toList(),
        'monthlyPrice': monthlyPrice.toJson(),
        'startDate': startDate.toIso8601String(),
        if (endDate != null) 'endDate': endDate!.toIso8601String(),
        'paymentMethod': paymentMethod.name,
        if (notes != null) 'notes': notes,
        'createdAt': createdAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, type, status];
}

/// Contract schedule day
class ContractScheduleDay extends Equatable {
  final DayOfWeek day;
  final List<ContractScheduleTrip> trips;
  final bool isActive;

  const ContractScheduleDay({
    required this.day,
    required this.trips,
    this.isActive = true,
  });

  factory ContractScheduleDay.fromJson(Map<String, dynamic> json) {
    return ContractScheduleDay(
      day: DayOfWeek.values.firstWhere(
        (e) => e.name == json['day'],
        orElse: () => DayOfWeek.monday,
      ),
      trips: (json['trips'] as List)
          .map((e) => ContractScheduleTrip.fromJson(e as Map<String, dynamic>))
          .toList(),
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'day': day.name,
        'trips': trips.map((e) => e.toJson()).toList(),
        'isActive': isActive,
      };

  @override
  List<Object?> get props => [day, trips, isActive];
}

/// Contract schedule trip
class ContractScheduleTrip extends Equatable {
  final String pickupTime; // HH:mm format
  final bool isReturn; // true if return trip

  const ContractScheduleTrip({
    required this.pickupTime,
    this.isReturn = false,
  });

  factory ContractScheduleTrip.fromJson(Map<String, dynamic> json) {
    return ContractScheduleTrip(
      pickupTime: json['pickupTime'] as String,
      isReturn: json['isReturn'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'pickupTime': pickupTime,
        'isReturn': isReturn,
      };

  @override
  List<Object?> get props => [pickupTime, isReturn];
}

/// School contract (extends Contract)
class SchoolContract extends Contract {
  final String schoolName;
  final Address schoolAddress;
  final List<StudentInfo> students;

  const SchoolContract({
    required super.id,
    required super.clientId,
    super.driverId,
    super.type = ContractType.school,
    required super.status,
    required super.pickup,
    required super.dropoff,
    required super.schedule,
    required super.monthlyPrice,
    required super.startDate,
    super.endDate,
    required super.paymentMethod,
    super.notes,
    required super.createdAt,
    required this.schoolName,
    required this.schoolAddress,
    required this.students,
  });

  factory SchoolContract.fromJson(Map<String, dynamic> json) {
    return SchoolContract(
      id: json['id'] as String,
      clientId: json['clientId'] as String,
      driverId: json['driverId'] as String?,
      status: ContractStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => ContractStatus.pending,
      ),
      pickup: Address.fromJson(json['pickup'] as Map<String, dynamic>),
      dropoff: Address.fromJson(json['dropoff'] as Map<String, dynamic>),
      schedule: (json['schedule'] as List)
          .map((e) => ContractScheduleDay.fromJson(e as Map<String, dynamic>))
          .toList(),
      monthlyPrice: Money.fromJson(json['monthlyPrice'] as Map<String, dynamic>),
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] != null
          ? DateTime.parse(json['endDate'] as String)
          : null,
      paymentMethod: PaymentProvider.values.firstWhere(
        (e) => e.name == json['paymentMethod'],
        orElse: () => PaymentProvider.cash,
      ),
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      schoolName: json['schoolName'] as String,
      schoolAddress:
          Address.fromJson(json['schoolAddress'] as Map<String, dynamic>),
      students: (json['students'] as List)
          .map((e) => StudentInfo.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  @override
  Map<String, dynamic> toJson() => {
        ...super.toJson(),
        'schoolName': schoolName,
        'schoolAddress': schoolAddress.toJson(),
        'students': students.map((e) => e.toJson()).toList(),
      };

  @override
  List<Object?> get props => [...super.props, schoolName, students];
}

/// Student info
class StudentInfo extends Equatable {
  final String name;
  final String? grade;
  final String? emergencyContact;

  const StudentInfo({
    required this.name,
    this.grade,
    this.emergencyContact,
  });

  factory StudentInfo.fromJson(Map<String, dynamic> json) {
    return StudentInfo(
      name: json['name'] as String,
      grade: json['grade'] as String?,
      emergencyContact: json['emergencyContact'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        if (grade != null) 'grade': grade,
        if (emergencyContact != null) 'emergencyContact': emergencyContact,
      };

  @override
  List<Object?> get props => [name, grade];
}

/// Contract usage tracking
class ContractUsage extends Equatable {
  final String contractId;
  final int totalTrips;
  final int completedTrips;
  final int missedTrips;
  final DateTime periodStart;
  final DateTime periodEnd;

  const ContractUsage({
    required this.contractId,
    required this.totalTrips,
    required this.completedTrips,
    required this.missedTrips,
    required this.periodStart,
    required this.periodEnd,
  });

  factory ContractUsage.fromJson(Map<String, dynamic> json) {
    return ContractUsage(
      contractId: json['contractId'] as String,
      totalTrips: json['totalTrips'] as int,
      completedTrips: json['completedTrips'] as int,
      missedTrips: json['missedTrips'] as int,
      periodStart: DateTime.parse(json['periodStart'] as String),
      periodEnd: DateTime.parse(json['periodEnd'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'contractId': contractId,
        'totalTrips': totalTrips,
        'completedTrips': completedTrips,
        'missedTrips': missedTrips,
        'periodStart': periodStart.toIso8601String(),
        'periodEnd': periodEnd.toIso8601String(),
      };

  @override
  List<Object?> get props => [contractId, totalTrips, completedTrips];
}

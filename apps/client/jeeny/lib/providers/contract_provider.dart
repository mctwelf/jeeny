import 'package:flutter/foundation.dart';
import '../models/contract.dart';
import '../models/enums.dart';
import '../models/base_models.dart';
import '../services/contract_service.dart';

/// Contract state provider
class ContractProvider extends ChangeNotifier {
  final ContractService _contractService;

  ContractProvider(this._contractService);

  // State
  List<Contract> _contracts = [];
  Contract? _selectedContract;
  ContractUsage? _selectedContractUsage;
  bool _isLoading = false;
  String? _error;

  // Form state for creating contracts
  Address? _pickup;
  Address? _dropoff;
  ContractType _selectedType = ContractType.monthly;
  List<ContractScheduleDay> _schedule = [];
  DateTime? _startDate;
  DateTime? _endDate;
  PaymentProvider _paymentMethod = PaymentProvider.cash;
  String? _notes;

  // School contract specific
  String? _schoolName;
  Address? _schoolAddress;
  List<StudentInfo> _students = [];

  // Estimated price
  double? _estimatedPrice;

  // Getters
  List<Contract> get contracts => _contracts;
  List<Contract> get activeContracts => _contracts
      .where((c) => c.status == ContractStatus.active)
      .toList();
  List<Contract> get pendingContracts => _contracts
      .where((c) => c.status == ContractStatus.pending)
      .toList();
  List<Contract> get pausedContracts => _contracts
      .where((c) => c.status == ContractStatus.paused)
      .toList();
  List<Contract> get completedContracts => _contracts
      .where((c) => c.status == ContractStatus.completed || 
                    c.status == ContractStatus.cancelled)
      .toList();
  Contract? get selectedContract => _selectedContract;
  ContractUsage? get selectedContractUsage => _selectedContractUsage;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Form getters
  Address? get pickup => _pickup;
  Address? get dropoff => _dropoff;
  ContractType get selectedType => _selectedType;
  List<ContractScheduleDay> get schedule => _schedule;
  DateTime? get startDate => _startDate;
  DateTime? get endDate => _endDate;
  PaymentProvider get paymentMethod => _paymentMethod;
  String? get notes => _notes;
  String? get schoolName => _schoolName;
  Address? get schoolAddress => _schoolAddress;
  List<StudentInfo> get students => _students;
  double? get estimatedPrice => _estimatedPrice;

  /// Load all contracts
  Future<void> loadContracts({ContractStatus? status, ContractType? type}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _contracts = await _contractService.getContracts(
        status: status,
        type: type,
      );
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Select a contract and load its details
  Future<void> selectContract(String contractId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedContract = await _contractService.getContract(contractId);
      _selectedContractUsage = await _contractService.getUsage(contractId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clear selected contract
  void clearSelectedContract() {
    _selectedContract = null;
    _selectedContractUsage = null;
    notifyListeners();
  }

  // Form setters
  void setPickup(Address address) {
    _pickup = address;
    _updateEstimate();
    notifyListeners();
  }

  void setDropoff(Address address) {
    _dropoff = address;
    _updateEstimate();
    notifyListeners();
  }

  void setContractType(ContractType type) {
    _selectedType = type;
    _updateEstimate();
    notifyListeners();
  }

  void setSchedule(List<ContractScheduleDay> schedule) {
    _schedule = schedule;
    _updateEstimate();
    notifyListeners();
  }

  void addScheduleDay(ContractScheduleDay day) {
    _schedule.add(day);
    _updateEstimate();
    notifyListeners();
  }

  void removeScheduleDay(DayOfWeek day) {
    _schedule.removeWhere((d) => d.day == day);
    _updateEstimate();
    notifyListeners();
  }

  void updateScheduleDay(DayOfWeek day, ContractScheduleDay updatedDay) {
    final index = _schedule.indexWhere((d) => d.day == day);
    if (index != -1) {
      _schedule[index] = updatedDay;
      _updateEstimate();
      notifyListeners();
    }
  }

  void setStartDate(DateTime date) {
    _startDate = date;
    notifyListeners();
  }

  void setEndDate(DateTime? date) {
    _endDate = date;
    notifyListeners();
  }

  void setPaymentMethod(PaymentProvider method) {
    _paymentMethod = method;
    notifyListeners();
  }

  void setNotes(String? notes) {
    _notes = notes;
    notifyListeners();
  }

  // School contract setters
  void setSchoolName(String name) {
    _schoolName = name;
    notifyListeners();
  }

  void setSchoolAddress(Address address) {
    _schoolAddress = address;
    _dropoff = address;
    _updateEstimate();
    notifyListeners();
  }

  void addStudent(StudentInfo student) {
    _students.add(student);
    notifyListeners();
  }

  void removeStudent(int index) {
    if (index >= 0 && index < _students.length) {
      _students.removeAt(index);
      notifyListeners();
    }
  }

  void updateStudent(int index, StudentInfo student) {
    if (index >= 0 && index < _students.length) {
      _students[index] = student;
      notifyListeners();
    }
  }

  /// Update price estimate
  Future<void> _updateEstimate() async {
    if (_pickup == null || _dropoff == null || _schedule.isEmpty) {
      _estimatedPrice = null;
      return;
    }

    try {
      _estimatedPrice = await _contractService.getEstimatedPrice(
        pickup: _pickup!.toJson(),
        dropoff: _dropoff!.toJson(),
        schedule: _schedule.map((s) => s.toJson()).toList(),
        type: _selectedType,
      );
      notifyListeners();
    } catch (e) {
      // Silently fail - estimate is optional
    }
  }

  /// Create a new contract
  Future<Contract?> createContract() async {
    if (_pickup == null || _dropoff == null || _schedule.isEmpty || _startDate == null) {
      _error = 'يرجى ملء جميع الحقول المطلوبة';
      notifyListeners();
      return null;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final contract = await _contractService.createContract(
        type: _selectedType,
        pickup: _pickup!.toJson(),
        dropoff: _dropoff!.toJson(),
        schedule: _schedule.map((s) => s.toJson()).toList(),
        startDate: _startDate!,
        endDate: _endDate,
        paymentMethod: _paymentMethod.name,
        notes: _notes,
      );

      _contracts.insert(0, contract);
      _resetForm();
      return contract;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Create a school contract
  Future<SchoolContract?> createSchoolContract() async {
    if (_pickup == null || _schoolAddress == null || _schoolName == null ||
        _students.isEmpty || _schedule.isEmpty || _startDate == null) {
      _error = 'يرجى ملء جميع الحقول المطلوبة';
      notifyListeners();
      return null;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final contract = await _contractService.createSchoolContract(
        pickup: _pickup!.toJson(),
        schoolAddress: _schoolAddress!.toJson(),
        schoolName: _schoolName!,
        students: _students.map((s) => s.toJson()).toList(),
        schedule: _schedule.map((s) => s.toJson()).toList(),
        startDate: _startDate!,
        endDate: _endDate,
        paymentMethod: _paymentMethod.name,
        notes: _notes,
      );

      _contracts.insert(0, contract);
      _resetForm();
      return contract;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Pause a contract
  Future<bool> pauseContract(String contractId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updated = await _contractService.pauseContract(contractId);
      _updateContractInList(updated);
      if (_selectedContract?.id == contractId) {
        _selectedContract = updated;
      }
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Resume a contract
  Future<bool> resumeContract(String contractId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updated = await _contractService.resumeContract(contractId);
      _updateContractInList(updated);
      if (_selectedContract?.id == contractId) {
        _selectedContract = updated;
      }
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Cancel a contract
  Future<bool> cancelContract(String contractId, {String? reason}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updated = await _contractService.cancelContract(contractId, reason: reason);
      _updateContractInList(updated);
      if (_selectedContract?.id == contractId) {
        _selectedContract = updated;
      }
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Create a trip for a contract
  Future<bool> createContractTrip(
    String contractId, {
    required DateTime scheduledTime,
    bool isReturn = false,
  }) async {
    try {
      await _contractService.createContractTrip(
        contractId,
        scheduledTime: scheduledTime,
        isReturn: isReturn,
      );
      // Refresh usage stats
      if (_selectedContract?.id == contractId) {
        _selectedContractUsage = await _contractService.getUsage(contractId);
        notifyListeners();
      }
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  void _updateContractInList(Contract updated) {
    final index = _contracts.indexWhere((c) => c.id == updated.id);
    if (index != -1) {
      _contracts[index] = updated;
    }
  }

  void _resetForm() {
    _pickup = null;
    _dropoff = null;
    _selectedType = ContractType.monthly;
    _schedule = [];
    _startDate = null;
    _endDate = null;
    _paymentMethod = PaymentProvider.cash;
    _notes = null;
    _schoolName = null;
    _schoolAddress = null;
    _students = [];
    _estimatedPrice = null;
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

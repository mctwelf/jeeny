import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/food.dart';
import '../models/base_models.dart';
import '../models/enums.dart';
import '../services/food_service.dart';

/// Food delivery state provider
class FoodProvider extends ChangeNotifier {
  final FoodService _service = FoodService();

  // Restaurants
  List<Restaurant> _restaurants = [];
  Restaurant? _selectedRestaurant;
  List<MenuItem> _menu = [];
  List<String> _categories = [];
  String? _selectedCategory;

  // Cart
  final List<CartItem> _cart = [];
  Address? _deliveryAddress;
  PaymentProvider _paymentMethod = PaymentProvider.cash;
  String? _orderNotes;

  // Orders
  FoodOrder? _currentOrder;
  List<FoodOrder> _myOrders = [];
  StreamSubscription? _trackingSubscription;

  // UI state
  bool _isLoading = false;
  String? _errorMessage;
  String? _searchQuery;

  // Getters
  List<Restaurant> get restaurants => _restaurants;
  Restaurant? get selectedRestaurant => _selectedRestaurant;
  List<MenuItem> get menu => _menu;
  List<String> get categories => _categories;
  String? get selectedCategory => _selectedCategory;
  List<CartItem> get cart => _cart;
  Address? get deliveryAddress => _deliveryAddress;
  PaymentProvider get paymentMethod => _paymentMethod;
  String? get orderNotes => _orderNotes;
  FoodOrder? get currentOrder => _currentOrder;
  List<FoodOrder> get myOrders => _myOrders;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String? get searchQuery => _searchQuery;

  int get cartItemCount => _cart.fold(0, (sum, item) => sum + item.quantity);
  double get cartSubtotal => _cart.fold(0, (sum, item) => sum + item.totalPrice);
  double get deliveryFee => _selectedRestaurant?.deliveryFee?.amount ?? 0;
  double get cartTotal => cartSubtotal + deliveryFee;

  bool get canOrder =>
      _cart.isNotEmpty &&
      _deliveryAddress != null &&
      _selectedRestaurant != null;

  /// Load restaurants
  Future<void> loadRestaurants({
    String? category,
    GeoLocation? nearLocation,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _restaurants = await _service.getRestaurants(
        category: category,
        search: _searchQuery,
        nearLocation: nearLocation,
      );
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Search restaurants
  void setSearchQuery(String? query) {
    _searchQuery = query;
    notifyListeners();
  }

  /// Select restaurant
  Future<void> selectRestaurant(Restaurant restaurant) async {
    _selectedRestaurant = restaurant;
    _cart.clear();
    _menu = [];
    _categories = [];
    _selectedCategory = null;
    notifyListeners();

    await loadMenu();
    await loadCategories();
  }

  /// Load menu
  Future<void> loadMenu() async {
    if (_selectedRestaurant == null) return;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _menu = await _service.getMenu(
        _selectedRestaurant!.id,
        category: _selectedCategory,
      );
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Load categories
  Future<void> loadCategories() async {
    if (_selectedRestaurant == null) return;

    try {
      _categories = await _service.getMenuCategories(_selectedRestaurant!.id);
    } catch (e) {
      // Silently fail for categories
    }
    notifyListeners();
  }

  /// Select category
  void selectCategory(String? category) {
    _selectedCategory = category;
    loadMenu();
  }

  /// Add item to cart
  void addToCart(MenuItem item, {
    int quantity = 1,
    List<String>? selectedOptions,
    String? specialInstructions,
  }) {
    final existingIndex = _cart.indexWhere((c) => c.menuItemId == item.id);

    if (existingIndex >= 0) {
      // Update existing item
      final existing = _cart[existingIndex];
      _cart[existingIndex] = CartItem(
        menuItemId: existing.menuItemId,
        name: existing.name,
        quantity: existing.quantity + quantity,
        unitPrice: existing.unitPrice,
        selectedOptions: selectedOptions ?? existing.selectedOptions,
        specialInstructions: specialInstructions ?? existing.specialInstructions,
      );
    } else {
      // Add new item
      _cart.add(CartItem(
        menuItemId: item.id,
        name: item.name,
        quantity: quantity,
        unitPrice: item.price.amount,
        selectedOptions: selectedOptions,
        specialInstructions: specialInstructions,
      ));
    }
    notifyListeners();
  }

  /// Update cart item quantity
  void updateCartItemQuantity(String menuItemId, int quantity) {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    final index = _cart.indexWhere((c) => c.menuItemId == menuItemId);
    if (index >= 0) {
      final item = _cart[index];
      _cart[index] = CartItem(
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: quantity,
        unitPrice: item.unitPrice,
        selectedOptions: item.selectedOptions,
        specialInstructions: item.specialInstructions,
      );
      notifyListeners();
    }
  }

  /// Remove item from cart
  void removeFromCart(String menuItemId) {
    _cart.removeWhere((c) => c.menuItemId == menuItemId);
    notifyListeners();
  }

  /// Clear cart
  void clearCart() {
    _cart.clear();
    notifyListeners();
  }

  /// Set delivery address
  void setDeliveryAddress(Address address) {
    _deliveryAddress = address;
    notifyListeners();
  }

  /// Set payment method
  void setPaymentMethod(PaymentProvider method) {
    _paymentMethod = method;
    notifyListeners();
  }

  /// Set order notes
  void setOrderNotes(String? notes) {
    _orderNotes = notes;
    notifyListeners();
  }

  /// Create order
  Future<bool> createOrder() async {
    if (!canOrder) {
      _errorMessage = 'يرجى ملء جميع البيانات المطلوبة';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentOrder = await _service.createOrder(
        restaurantId: _selectedRestaurant!.id,
        items: _cart,
        deliveryAddress: _deliveryAddress!,
        paymentMethod: _paymentMethod,
        notes: _orderNotes,
      );
      clearCart();
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

  /// Load user's orders
  Future<void> loadMyOrders({FoodOrderStatus? status}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _myOrders = await _service.getMyOrders(status: status);
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Get order details
  Future<void> getOrderDetails(String orderId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentOrder = await _service.getOrder(orderId);
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Start tracking order
  void startTracking(String orderId) {
    _trackingSubscription?.cancel();
    _trackingSubscription = _service.trackOrder(orderId).listen(
      (order) {
        _currentOrder = order;
        notifyListeners();
      },
      onError: (e) {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        notifyListeners();
      },
    );
  }

  /// Stop tracking
  void stopTracking() {
    _trackingSubscription?.cancel();
    _trackingSubscription = null;
  }

  /// Cancel order
  Future<bool> cancelOrder(String orderId, {String? reason}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await _service.cancelOrder(orderId, reason: reason);
      if (success) {
        await loadMyOrders();
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Rate order
  Future<bool> rateOrder(
    String orderId, {
    required int rating,
    String? comment,
  }) async {
    try {
      return await _service.rateOrder(
        orderId,
        rating: rating,
        comment: comment,
      );
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  /// Reset state
  void reset() {
    _selectedRestaurant = null;
    _menu = [];
    _categories = [];
    _selectedCategory = null;
    _cart.clear();
    _deliveryAddress = null;
    _paymentMethod = PaymentProvider.cash;
    _orderNotes = null;
    _currentOrder = null;
    _errorMessage = null;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    stopTracking();
    super.dispose();
  }
}

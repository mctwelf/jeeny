import 'package:flutter/material.dart';

import '../screens/splash/splash_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/otp_screen.dart';
import '../screens/auth/profile_setup_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/saved_addresses_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/intercity/intercity_screens.dart';
import '../screens/delivery/delivery_screens.dart';
import '../screens/food/food_screens.dart';
import '../screens/contract/contract_screens.dart';
import '../screens/payment/payment_screens.dart';
import '../screens/chat/chat_screens.dart';
import '../screens/call/call_screens.dart';
import '../screens/notifications/notification_screens.dart';
import '../screens/history/history_screens.dart';
import '../screens/support/support_screens.dart';
import '../screens/promotions/promotion_screens.dart';
import '../screens/scheduled/scheduled_screens.dart';

class Routes {
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String otp = '/otp';
  static const String profileSetup = '/profile-setup';
  static const String home = '/home';
  static const String profile = '/profile';
  static const String savedAddresses = '/saved-addresses';
  static const String settings = '/settings';
  static const String booking = '/booking';
  static const String addressSelection = '/address-selection';
  static const String favoritePlace = '/favorite-place';
  static const String bookingDetails = '/booking-details';
  static const String driverFind = '/driver-find';
  static const String arriving = '/arriving';
  static const String rateDriver = '/rate-driver';
  static const String cancelTrip = '/cancel-trip';
  static const String choseTrip = '/chose-trip';
  static const String notifications = '/notifications';
  static const String faq = '/faq';
  static const String myPromotion = '/my-promotion';
  static const String myWallet = '/my-wallet';
  static const String rideHistory = '/ride-history';
  static const String paymentHistory = '/payment-history';
  static const String driverDetails = '/driver-details';
  static const String chat = '/chat';
  static const String call = '/call';
  static const String accountSetting = '/account-setting';
  static const String editAccount = '/edit-account';
  static const String paymentAccount = '/payment-account';
  static const String addNewCard = '/add-new-card';
  
  // Intercity routes
  static const String intercitySearch = '/intercity-search';
  static const String tripList = '/trip-list';
  static const String intercityBooking = '/intercity-booking';
  static const String tripDetails = '/trip-details';
  static const String myBookings = '/my-bookings';
  
  // Delivery routes
  static const String delivery = '/delivery';
  static const String deliveryTracking = '/delivery-tracking';
  static const String myDeliveries = '/my-deliveries';
  
  // Food delivery routes
  static const String restaurants = '/restaurants';
  static const String menu = '/menu';
  static const String cart = '/cart';
  static const String orderTracking = '/order-tracking';
  static const String myOrders = '/my-orders';
  
  // Contract routes
  static const String contracts = '/contracts';
  static const String contractDetails = '/contract-details';
  static const String createContract = '/create-contract';
  static const String schoolContract = '/school-contract';
  
  // Payment routes
  static const String paymentMethods = '/payment-methods';
  static const String wallet = '/wallet';
  static const String payment = '/payment';
  
  // Chat routes
  static const String conversations = '/conversations';
  
  // History routes
  static const String history = '/history';
  static const String rideDetails = '/ride-details';
  
  // Support routes
  static const String support = '/support';
  static const String ticket = '/ticket';
  
  // Promotions routes
  static const String promotions = '/promotions';
  
  // Scheduled routes
  static const String scheduledRides = '/scheduled-rides';
  static const String scheduleRide = '/schedule-ride';
  static const String airportTransfer = '/airport-transfer';
}


class AppRoutes {
  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case Routes.splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
        
      case Routes.onboarding:
        return MaterialPageRoute(builder: (_) => const OnboardingScreen());
        
      case Routes.login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
        
      case Routes.otp:
        final args = settings.arguments as Map<String, dynamic>;
        return MaterialPageRoute(
          builder: (_) => OtpScreen(
            phoneNumber: args['phoneNumber'],
            verificationId: args['verificationId'],
          ),
        );
        
      case Routes.profileSetup:
        return MaterialPageRoute(builder: (_) => const ProfileSetupScreen());
        
      case Routes.home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
        
      case Routes.profile:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
        
      case Routes.savedAddresses:
        return MaterialPageRoute(builder: (_) => const SavedAddressesScreen());
        
      case Routes.settings:
      case Routes.accountSetting:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
        
      case Routes.intercitySearch:
        return MaterialPageRoute(builder: (_) => const IntercitySearchScreen());
        
      case Routes.tripList:
        return MaterialPageRoute(builder: (_) => const TripListScreen());
        
      case Routes.intercityBooking:
        return MaterialPageRoute(builder: (_) => const IntercityBookingScreen());
        
      case Routes.tripDetails:
        return MaterialPageRoute(builder: (_) => const TripDetailsScreen());
        
      case Routes.delivery:
        return MaterialPageRoute(builder: (_) => const DeliveryScreen());
        
      case Routes.deliveryTracking:
        return MaterialPageRoute(builder: (_) => const DeliveryTrackingScreen());
        
      case Routes.restaurants:
        return MaterialPageRoute(builder: (_) => const RestaurantsScreen());
        
      case Routes.menu:
        return MaterialPageRoute(builder: (_) => const MenuScreen());
        
      case Routes.cart:
        return MaterialPageRoute(builder: (_) => const CartScreen());
        
      case Routes.orderTracking:
        return MaterialPageRoute(builder: (_) => const OrderTrackingScreen());
        
      case Routes.contracts:
        return MaterialPageRoute(builder: (_) => const ContractsListScreen());
        
      case Routes.contractDetails:
        return MaterialPageRoute(builder: (_) => const ContractDetailsScreen());
        
      case Routes.createContract:
        return MaterialPageRoute(builder: (_) => const CreateContractScreen());
        
      case Routes.schoolContract:
        return MaterialPageRoute(builder: (_) => const SchoolContractScreen());
        
      case Routes.paymentMethods:
        return MaterialPageRoute(builder: (_) => const PaymentMethodsScreen());
        
      case Routes.wallet:
      case Routes.myWallet:
        return MaterialPageRoute(builder: (_) => const WalletScreen());
        
      case Routes.payment:
        final args = settings.arguments as Map<String, dynamic>;
        return MaterialPageRoute(
          builder: (_) => PaymentScreen(
            rideId: args['rideId'],
            amount: args['amount'],
            description: args['description'],
          ),
        );
        
      case Routes.conversations:
        return MaterialPageRoute(builder: (_) => const ConversationsScreen());
        
      case Routes.chat:
        return MaterialPageRoute(builder: (_) => const ChatScreen());
        
      case Routes.call:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => CallScreen(
            driverId: args?['driverId'],
            driverName: args?['driverName'],
          ),
        );
        
      case Routes.notifications:
        return MaterialPageRoute(builder: (_) => const NotificationsScreen());
        
      case Routes.history:
      case Routes.rideHistory:
        return MaterialPageRoute(builder: (_) => const HistoryScreen());
        
      case Routes.rideDetails:
        final args = settings.arguments as Map<String, dynamic>;
        return MaterialPageRoute(
          builder: (_) => RideDetailsScreen(rideId: args['rideId']),
        );
        
      case Routes.support:
      case Routes.faq:
        return MaterialPageRoute(builder: (_) => const SupportScreen());
        
      case Routes.ticket:
        return MaterialPageRoute(builder: (_) => const TicketScreen());
        
      case Routes.promotions:
      case Routes.myPromotion:
        return MaterialPageRoute(builder: (_) => const PromotionsScreen());
        
      case Routes.scheduledRides:
        return MaterialPageRoute(builder: (_) => const ScheduledRidesScreen());
        
      case Routes.airportTransfer:
        return MaterialPageRoute(builder: (_) => const AirportTransferScreen());
        
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Text('الصفحة غير موجودة: ${settings.name}'),
            ),
          ),
        );
    }
  }
}

import 'package:dio/dio.dart';

class ApiResponse<T> {
  final T? data;
  final ApiError? error;
  final int? statusCode;
  final bool isSuccess;

  ApiResponse._({
    this.data,
    this.error,
    this.statusCode,
    required this.isSuccess,
  });

  factory ApiResponse.success({T? data, int? statusCode}) {
    return ApiResponse._(
      data: data,
      statusCode: statusCode,
      isSuccess: true,
    );
  }

  factory ApiResponse.error(ApiError error) {
    return ApiResponse._(
      error: error,
      statusCode: error.statusCode,
      isSuccess: false,
    );
  }
}

class ApiError {
  final String message;
  final int? statusCode;
  final String? code;
  final dynamic data;

  ApiError({
    required this.message,
    this.statusCode,
    this.code,
    this.data,
  });

  factory ApiError.fromDioException(DioException e) {
    String message;
    int? statusCode = e.response?.statusCode;
    String? code;
    dynamic data = e.response?.data;

    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        message = 'انتهت مهلة الاتصال';
        code = 'CONNECTION_TIMEOUT';
        break;
      case DioExceptionType.sendTimeout:
        message = 'انتهت مهلة الإرسال';
        code = 'SEND_TIMEOUT';
        break;
      case DioExceptionType.receiveTimeout:
        message = 'انتهت مهلة الاستقبال';
        code = 'RECEIVE_TIMEOUT';
        break;
      case DioExceptionType.badCertificate:
        message = 'شهادة غير صالحة';
        code = 'BAD_CERTIFICATE';
        break;
      case DioExceptionType.badResponse:
        message = _getMessageFromStatusCode(statusCode);
        code = 'BAD_RESPONSE';
        break;
      case DioExceptionType.cancel:
        message = 'تم إلغاء الطلب';
        code = 'CANCELLED';
        break;
      case DioExceptionType.connectionError:
        message = 'خطأ في الاتصال بالإنترنت';
        code = 'CONNECTION_ERROR';
        break;
      case DioExceptionType.unknown:
      default:
        message = e.message ?? 'حدث خطأ غير متوقع';
        code = 'UNKNOWN';
        break;
    }

    // Try to extract message from response
    if (data is Map<String, dynamic>) {
      message = data['message'] ?? data['error'] ?? message;
    }

    return ApiError(
      message: message,
      statusCode: statusCode,
      code: code,
      data: data,
    );
  }

  static String _getMessageFromStatusCode(int? statusCode) {
    switch (statusCode) {
      case 400:
        return 'طلب غير صالح';
      case 401:
        return 'غير مصرح';
      case 403:
        return 'ممنوع الوصول';
      case 404:
        return 'غير موجود';
      case 409:
        return 'تعارض في البيانات';
      case 422:
        return 'بيانات غير صالحة';
      case 429:
        return 'طلبات كثيرة جداً';
      case 500:
        return 'خطأ في الخادم';
      case 502:
        return 'بوابة غير صالحة';
      case 503:
        return 'الخدمة غير متاحة';
      default:
        return 'حدث خطأ';
    }
  }

  @override
  String toString() => 'ApiError(message: $message, statusCode: $statusCode, code: $code)';
}

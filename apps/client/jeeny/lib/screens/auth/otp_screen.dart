import 'package:flutter/material.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';

import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/widgets.dart';

class OtpScreen extends StatefulWidget {
  final String phoneNumber;
  final String verificationId;

  const OtpScreen({
    super.key,
    required this.phoneNumber,
    required this.verificationId,
  });

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _otpController = TextEditingController();
  
  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.length != 6) return;
    
    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.verifyOtp(
      widget.verificationId,
      _otpController.text,
    );
    
    if (!mounted) return;
    
    if (success) {
      // Check if user needs profile setup
      if (authProvider.needsProfileSetup) {
        Navigator.pushReplacementNamed(context, Routes.profileSetup);
      } else {
        Navigator.pushReplacementNamed(context, Routes.home);
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage ?? 'رمز التحقق غير صحيح'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final isLoading = authProvider.status == AuthStatus.loading;

    final defaultPinTheme = PinTheme(
      width: 50,
      height: 50,
      textStyle: const TextStyle(
        fontFamily: 'Tajawal',
        fontSize: 20,
        fontWeight: FontWeight.w600,
      ),
      decoration: BoxDecoration(
        color: AppTheme.offButtonColor,
        borderRadius: BorderRadius.circular(15),
      ),
    );

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 25),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 79),
              const CustomText(
                text: 'رمز',
                size: 32,
                weight: FontWeight.w700,
              ),
              const SizedBox(height: 8),
              const CustomText(
                text: 'التحقق',
                size: 16,
                weight: FontWeight.w700,
              ),
              const SizedBox(height: 4),
              Container(
                height: 5,
                width: 40,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 37),
              Center(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const CustomText(
                      text: 'تم إرسال رمز التحقق إلى',
                      size: 17,
                    ),
                    const SizedBox(height: 45),
                    CustomContainer(
                      height: 50,
                      width: 204,
                      color: AppTheme.offButtonColor,
                      circular: 20,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CustomText(text: '${widget.phoneNumber}    '),
                          Icon(
                            Icons.edit,
                            color: Colors.grey.shade400,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    // OTP Input
                    Directionality(
                      textDirection: TextDirection.ltr,
                      child: Pinput(
                        controller: _otpController,
                        length: 6,
                        defaultPinTheme: defaultPinTheme,
                        focusedPinTheme: defaultPinTheme.copyWith(
                          decoration: BoxDecoration(
                            color: AppTheme.offButtonColor,
                            borderRadius: BorderRadius.circular(15),
                            border: Border.all(color: AppTheme.primaryColor, width: 2),
                          ),
                        ),
                        onCompleted: (_) => _verifyOtp(),
                      ),
                    ),
                    const SizedBox(height: 70),
                    const CustomText(text: 'إعادة إرسال الرمز'),
                    const SizedBox(height: 53),
                    
                    // Resend button
                    SizedBox(
                      height: 60,
                      width: 200,
                      child: ElevatedButton(
                        onPressed: () {
                          // TODO: Implement resend
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.offButtonColor,
                          foregroundColor: Colors.black54,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          elevation: 0,
                        ),
                        child: const CustomText(
                          text: 'إعادة الإرسال',
                          color: Colors.black54,
                          size: 14,
                          weight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Verify button
                    RoundButton(
                      title: isLoading ? 'جاري التحقق...' : 'تأكيد',
                      onPressed: isLoading ? () {} : _verifyOtp,
                      width: 200,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

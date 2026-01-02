import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String _countryCode = '+222'; // Mauritania

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (!_formKey.currentState!.validate()) return;
    
    final phoneNumber = '$_countryCode${_phoneController.text.trim()}';
    final authProvider = context.read<AuthProvider>();
    
    final verificationId = await authProvider.sendOtp(phoneNumber);
    
    if (!mounted) return;
    
    if (verificationId != null) {
      Navigator.pushNamed(
        context,
        Routes.otp,
        arguments: {
          'phoneNumber': phoneNumber,
          'verificationId': verificationId,
        },
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage ?? 'حدث خطأ'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final isLoading = authProvider.status == AuthStatus.loading;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 25),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 79),
                const CustomText(
                  text: 'تأكيد رقم',
                  size: 32,
                  weight: FontWeight.w700,
                ),
                const SizedBox(height: 8),
                const CustomText(
                  text: 'الهاتف',
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
                const Center(
                  child: SizedBox(
                    width: 325,
                    child: CustomText(
                      text: 'يرجى تأكيد رمز البلد وإدخال رقم هاتفك:',
                      align: TextAlign.center,
                      size: 17,
                      weight: FontWeight.w400,
                    ),
                  ),
                ),
                const SizedBox(height: 82),
                
                // Country selector
                Center(
                  child: Container(
                    height: 62,
                    width: 289,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(color: Colors.grey.shade400),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('🇲🇷', style: TextStyle(fontSize: 24)),
                        const SizedBox(width: 12),
                        CustomText(
                          text: _countryCode,
                          size: 16,
                          weight: FontWeight.w700,
                        ),
                        const SizedBox(width: 8),
                        const CustomText(
                          text: 'موريتانيا',
                          size: 16,
                          weight: FontWeight.w700,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 15),
                
                // Phone number input
                Center(
                  child: SizedBox(
                    height: 62,
                    width: 289,
                    child: TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      textDirection: TextDirection.ltr,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(8),
                      ],
                      decoration: InputDecoration(
                        hintText: '12345678',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                        prefixIcon: Padding(
                          padding: const EdgeInsets.only(right: 9.0),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const SizedBox(width: 12),
                              CustomText(text: _countryCode),
                              const CustomText(text: ' |', color: Colors.grey),
                            ],
                          ),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'الرجاء إدخال رقم الهاتف';
                        }
                        if (value.length < 8) {
                          return 'رقم الهاتف غير صحيح';
                        }
                        return null;
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 70),
                
                // Send OTP button
                Center(
                  child: RoundButton(
                    title: isLoading ? 'جاري الإرسال...' : 'إرسال الرمز',
                    onPressed: isLoading ? () {} : _sendOtp,
                    width: 200,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

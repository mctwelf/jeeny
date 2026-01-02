import 'package:flutter/material.dart';
import 'custom_text.dart';
import '../config/theme.dart';

class RoundButton extends StatelessWidget {
  final String title;
  final VoidCallback onPressed;
  final Color? color;
  final double width;
  final double height;
  
  const RoundButton({
    super.key,
    required this.title,
    required this.onPressed,
    this.color,
    required this.width,
    this.height = 60,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withOpacity(0.3),
            offset: const Offset(0, 10),
            blurRadius: 4,
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color ?? AppTheme.primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          elevation: 0,
        ),
        child: CustomText(
          text: title,
          size: 14,
          weight: FontWeight.w600,
        ),
      ),
    );
  }
}

class TextBtn extends StatelessWidget {
  final String title;
  final VoidCallback onPressed;
  final Color? color;
  
  const TextBtn({
    super.key,
    required this.title,
    required this.onPressed,
    this.color,
  });
  
  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onPressed,
      child: Text(
        title,
        style: TextStyle(
          fontFamily: 'Tajawal',
          fontSize: 18,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }
}

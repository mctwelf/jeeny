import 'package:flutter/material.dart';
import 'custom_text.dart';

class CustomTextField extends StatelessWidget {
  final String? hintText;
  final String? labelText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final VoidCallback? onTap;
  final bool autofocus;
  final TextInputType? keyboardType;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final TextDirection? textDirection;

  const CustomTextField({
    super.key,
    this.hintText,
    this.controller,
    this.labelText,
    this.suffixIcon,
    this.obscureText = false,
    this.prefixIcon,
    this.keyboardType,
    this.onTap,
    this.autofocus = false,
    this.validator,
    this.onChanged,
    this.textDirection,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 62,
      child: TextFormField(
        autofocus: autofocus,
        obscureText: obscureText,
        keyboardType: keyboardType,
        controller: controller,
        textDirection: textDirection,
        style: const TextStyle(fontFamily: 'Tajawal'),
        decoration: InputDecoration(
          hintText: hintText,
          labelText: labelText,
          prefixIcon: prefixIcon != null
              ? Padding(
                  padding: const EdgeInsets.only(right: 9.0),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(width: 12),
                      prefixIcon!,
                      const CustomText(text: ' |', color: Colors.grey),
                    ],
                  ),
                )
              : null,
          suffixIcon: suffixIcon,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(25)),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(25),
            borderSide: BorderSide(color: Colors.grey.shade400),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(25),
            borderSide: const BorderSide(color: Color(0xffffbd30), width: 2),
          ),
        ),
        validator: validator,
        onChanged: onChanged,
      ),
    );
  }
}

class SimpleTextField extends StatelessWidget {
  final String? hintText;
  final String? labelText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final bool autofocus;
  final TextInputType? keyboardType;
  final TextEditingController? controller;

  const SimpleTextField({
    super.key,
    this.hintText,
    this.controller,
    this.labelText,
    this.suffixIcon,
    this.obscureText = false,
    this.prefixIcon,
    this.keyboardType,
    this.autofocus = false,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      autofocus: autofocus,
      obscureText: obscureText,
      keyboardType: keyboardType,
      controller: controller,
      style: const TextStyle(fontFamily: 'Tajawal'),
      decoration: InputDecoration(
        hintText: hintText,
        labelText: labelText,
        prefixIcon: prefixIcon,
        suffixIcon: suffixIcon,
        border: InputBorder.none,
        prefixText: '   ',
      ),
      validator: (value) {
        if (value!.isEmpty) {
          return ' ';
        }
        return null;
      },
    );
  }
}

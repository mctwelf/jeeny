import 'package:flutter/material.dart';

class CustomText extends StatelessWidget {
  final String text;
  final Color? color;
  final FontWeight? weight;
  final double? size;
  final TextAlign? align;
  
  const CustomText({
    super.key,
    required this.text,
    this.weight,
    this.color,
    this.size,
    this.align,
  });
  
  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      textAlign: align,
      style: TextStyle(
        fontFamily: 'Tajawal',
        color: color,
        fontSize: size,
        fontWeight: weight,
      ),
    );
  }
}

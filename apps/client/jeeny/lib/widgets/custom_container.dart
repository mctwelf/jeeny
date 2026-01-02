import 'package:flutter/material.dart';

class CustomContainer extends StatelessWidget {
  final double height;
  final double width;
  final Color? color;
  final Widget? child;
  final double? circular;
  final double? elevation;
  
  const CustomContainer({
    super.key,
    required this.height,
    required this.width,
    this.color = Colors.transparent,
    this.child,
    this.circular = 10,
    this.elevation = 0,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(circular!),
        color: color,
        boxShadow: elevation! > 0
            ? [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  offset: Offset(0, elevation!),
                  blurRadius: elevation! * 2,
                ),
              ]
            : null,
      ),
      child: Center(child: child),
    );
  }
}

class SimpleContainer extends StatelessWidget {
  final double height;
  final double width;
  final Color? color;
  final Widget? child;
  final double? circular;
  final double? depth;
  final Color? shadowColor;

  const SimpleContainer({
    super.key,
    required this.height,
    required this.width,
    this.color = Colors.transparent,
    this.child,
    this.circular = 10,
    this.depth = 0,
    this.shadowColor = Colors.black12,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(circular!),
        color: color,
        boxShadow: [
          BoxShadow(
            color: shadowColor!,
            offset: Offset(0, depth!),
            blurRadius: 4,
          ),
        ],
      ),
      child: Center(child: child),
    );
  }
}

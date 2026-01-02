import 'dart:async';
import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../services/call_service.dart';

class CallScreen extends StatefulWidget {
  final String? driverId;
  final String? driverName;
  final CallInfo? callInfo;

  const CallScreen({
    super.key,
    this.driverId,
    this.driverName,
    this.callInfo,
  });

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  CallState _callState = CallState.calling;
  bool _isMuted = false;
  bool _isSpeakerOn = false;
  Duration _callDuration = Duration.zero;
  Timer? _durationTimer;

  @override
  void initState() {
    super.initState();
    _initCall();
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    super.dispose();
  }

  void _initCall() {
    // Simulate call connection after 2 seconds
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _callState = CallState.ringing);
      }
    });

    // Simulate call connected after 4 seconds
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        setState(() => _callState = CallState.connected);
        _startDurationTimer();
      }
    });
  }

  void _startDurationTimer() {
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _callDuration = Duration(seconds: timer.tick);
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.secondaryColor,
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(),
            _buildCallerInfo(),
            const Spacer(),
            _buildCallStatus(),
            const Spacer(flex: 2),
            _buildCallControls(),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }


  Widget _buildCallerInfo() {
    return Column(
      children: [
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            color: AppTheme.primaryColor,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryColor.withOpacity(0.3),
                blurRadius: 30,
                spreadRadius: 10,
              ),
            ],
          ),
          child: const Icon(
            Icons.person,
            size: 60,
            color: Colors.black,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          widget.driverName ?? 'السائق',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildCallStatus() {
    String statusText;
    Widget? statusWidget;

    switch (_callState) {
      case CallState.calling:
        statusText = 'جاري الاتصال...';
        statusWidget = const SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: Colors.white,
          ),
        );
        break;
      case CallState.ringing:
        statusText = 'جاري الرنين...';
        break;
      case CallState.connected:
        statusText = _formatDuration(_callDuration);
        break;
      case CallState.ended:
        statusText = 'انتهت المكالمة';
        break;
      case CallState.failed:
        statusText = 'فشل الاتصال';
        break;
      case CallState.idle:
        statusText = '';
        break;
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (statusWidget != null) ...[
          statusWidget,
          const SizedBox(width: 8),
        ],
        Text(
          statusText,
          style: TextStyle(
            color: Colors.white.withOpacity(0.8),
            fontSize: 16,
          ),
        ),
      ],
    );
  }

  Widget _buildCallControls() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildControlButton(
          icon: _isMuted ? Icons.mic_off : Icons.mic,
          label: _isMuted ? 'إلغاء الكتم' : 'كتم',
          onPressed: () => setState(() => _isMuted = !_isMuted),
          isActive: _isMuted,
        ),
        _buildEndCallButton(),
        _buildControlButton(
          icon: _isSpeakerOn ? Icons.volume_up : Icons.volume_down,
          label: _isSpeakerOn ? 'إيقاف السماعة' : 'السماعة',
          onPressed: () => setState(() => _isSpeakerOn = !_isSpeakerOn),
          isActive: _isSpeakerOn,
        ),
      ],
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
    bool isActive = false,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: isActive ? Colors.white : Colors.white.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: Icon(
              icon,
              color: isActive ? AppTheme.secondaryColor : Colors.white,
            ),
            onPressed: onPressed,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.8),
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildEndCallButton() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 70,
          height: 70,
          decoration: const BoxDecoration(
            color: AppTheme.errorColor,
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: const Icon(
              Icons.call_end,
              color: Colors.white,
              size: 32,
            ),
            onPressed: _endCall,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'إنهاء',
          style: TextStyle(
            color: Colors.white.withOpacity(0.8),
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  void _endCall() {
    _durationTimer?.cancel();
    setState(() => _callState = CallState.ended);

    // Show call ended briefly then pop
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        Navigator.pop(context);
      }
    });
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    if (duration.inHours > 0) {
      final hours = duration.inHours.toString().padLeft(2, '0');
      return '$hours:$minutes:$seconds';
    }
    return '$minutes:$seconds';
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/support_provider.dart';

class TicketScreen extends StatefulWidget {
  const TicketScreen({super.key});

  @override
  State<TicketScreen> createState() => _TicketScreenState();
}

class _TicketScreenState extends State<TicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _selectedCategory = 'rides';

  final _categories = [
    {'value': 'rides', 'label': 'الرحلات'},
    {'value': 'payments', 'label': 'المدفوعات'},
    {'value': 'account', 'label': 'الحساب'},
    {'value': 'safety', 'label': 'السلامة'},
    {'value': 'other', 'label': 'أخرى'},
  ];

  @override
  void dispose() {
    _subjectController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(title: const Text('تذكرة دعم جديدة')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildCategorySelector(),
            const SizedBox(height: 16),
            _buildSubjectField(),
            const SizedBox(height: 16),
            _buildDescriptionField(),
            const SizedBox(height: 24),
            _buildSubmitButton(),
          ],
        ),
      ),
    );
  }


  Widget _buildCategorySelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('التصنيف', style: TextStyle(fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _categories.map((cat) {
            final isSelected = _selectedCategory == cat['value'];
            return ChoiceChip(
              label: Text(cat['label']!),
              selected: isSelected,
              onSelected: (_) => setState(() => _selectedCategory = cat['value']!),
              selectedColor: AppTheme.primaryColor.withOpacity(0.2),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSubjectField() {
    return TextFormField(
      controller: _subjectController,
      decoration: InputDecoration(
        labelText: 'الموضوع',
        hintText: 'اكتب موضوع المشكلة',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) return 'الرجاء إدخال الموضوع';
        return null;
      },
    );
  }

  Widget _buildDescriptionField() {
    return TextFormField(
      controller: _descriptionController,
      maxLines: 5,
      decoration: InputDecoration(
        labelText: 'الوصف',
        hintText: 'اشرح المشكلة بالتفصيل',
        alignLabelWithHint: true,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) return 'الرجاء إدخال الوصف';
        if (value.length < 20) return 'الوصف قصير جداً';
        return null;
      },
    );
  }

  Widget _buildSubmitButton() {
    return Consumer<SupportProvider>(
      builder: (context, provider, _) {
        return ElevatedButton(
          onPressed: provider.isLoading ? null : _submitTicket,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: provider.isLoading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Text('إرسال التذكرة'),
        );
      },
    );
  }

  Future<void> _submitTicket() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await context.read<SupportProvider>().createTicket(
      subject: _subjectController.text,
      description: _descriptionController.text,
      category: _selectedCategory,
    );

    if (success && mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم إرسال التذكرة بنجاح')),
      );
    }
  }
}

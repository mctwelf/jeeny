import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../providers/support_provider.dart';
import '../../services/support_service.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SupportProvider>().loadFaqs();
      context.read<SupportProvider>().loadTickets();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('المساعدة والدعم'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'الأسئلة الشائعة'),
            Tab(text: 'تذاكر الدعم'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildFaqsTab(),
          _buildTicketsTab(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, Routes.faq),
        icon: const Icon(Icons.add),
        label: const Text('تذكرة جديدة'),
      ),
    );
  }


  Widget _buildFaqsTab() {
    return Consumer<SupportProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.faqs.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.faqs.isEmpty) {
          return const Center(child: Text('لا توجد أسئلة شائعة'));
        }

        final categories = provider.faqs.map((f) => f.category).toSet().toList();

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: categories.length,
          itemBuilder: (context, index) {
            final category = categories[index];
            final categoryFaqs = provider.faqs.where((f) => f.category == category).toList();
            
            return _buildFaqCategory(category, categoryFaqs);
          },
        );
      },
    );
  }

  Widget _buildFaqCategory(String category, List<FaqItem> faqs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            _getCategoryName(category),
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
        ...faqs.map((faq) => _buildFaqItem(faq)),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildFaqItem(FaqItem faq) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        title: Text(faq.question, style: const TextStyle(fontSize: 14)),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(faq.answer, style: const TextStyle(color: AppTheme.textSecondary)),
          ),
        ],
      ),
    );
  }

  String _getCategoryName(String category) {
    switch (category) {
      case 'rides': return 'الرحلات';
      case 'payments': return 'المدفوعات';
      case 'account': return 'الحساب';
      case 'safety': return 'السلامة';
      default: return category;
    }
  }

  Widget _buildTicketsTab() {
    return Consumer<SupportProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.tickets.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.tickets.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.support_agent, size: 80, color: Colors.grey[300]),
                const SizedBox(height: 16),
                const Text('لا توجد تذاكر دعم', style: TextStyle(color: AppTheme.textSecondary)),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => provider.loadTickets(),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.tickets.length,
            itemBuilder: (context, index) => _buildTicketCard(provider.tickets[index]),
          ),
        );
      },
    );
  }

  Widget _buildTicketCard(SupportTicket ticket) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Text(ticket.subject, style: const TextStyle(fontWeight: FontWeight.w500)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(ticket.description, maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildStatusChip(ticket.status),
                const Spacer(),
                Text(
                  _formatDate(ticket.createdAt),
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ],
        ),
        onTap: () => Navigator.pushNamed(context, '/ticket-details', arguments: {'ticketId': ticket.id}),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String text;
    
    switch (status) {
      case 'open': color = AppTheme.primaryColor; text = 'مفتوحة'; break;
      case 'pending': color = Colors.orange; text = 'قيد المراجعة'; break;
      case 'resolved': color = AppTheme.successColor; text = 'تم الحل'; break;
      case 'closed': color = AppTheme.textSecondary; text = 'مغلقة'; break;
      default: color = AppTheme.textSecondary; text = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 12)),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    
    if (diff.inDays == 0) return 'اليوم';
    if (diff.inDays == 1) return 'أمس';
    if (diff.inDays < 7) return 'منذ ${diff.inDays} أيام';
    return '${date.day}/${date.month}/${date.year}';
  }
}

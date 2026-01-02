import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../models/contract.dart';
import '../../models/enums.dart';
import '../../providers/contract_provider.dart';

class ContractsListScreen extends StatefulWidget {
  const ContractsListScreen({super.key});

  @override
  State<ContractsListScreen> createState() => _ContractsListScreenState();
}

class _ContractsListScreenState extends State<ContractsListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ContractProvider>().loadContracts();
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
      appBar: AppBar(
        title: const Text('عقودي'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primaryColor,
          tabs: const [
            Tab(text: 'نشطة'),
            Tab(text: 'معلقة'),
            Tab(text: 'منتهية'),
          ],
        ),
      ),
      body: Consumer<ContractProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.contracts.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null && provider.contracts.isEmpty) {
            return _buildErrorState(provider);
          }

          return TabBarView(
            controller: _tabController,
            children: [
              _buildContractsList(
                [...provider.activeContracts, ...provider.pendingContracts],
                'لا توجد عقود نشطة',
              ),
              _buildContractsList(
                provider.pausedContracts,
                'لا توجد عقود معلقة',
              ),
              _buildContractsList(
                provider.completedContracts,
                'لا توجد عقود منتهية',
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, Routes.createContract),
        icon: const Icon(Icons.add),
        label: const Text('عقد جديد'),
      ),
    );
  }

  Widget _buildErrorState(ContractProvider provider) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: AppTheme.errorColor),
          const SizedBox(height: 16),
          Text(
            'حدث خطأ',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            provider.error!,
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => provider.loadContracts(),
            child: const Text('إعادة المحاولة'),
          ),
        ],
      ),
    );
  }

  Widget _buildContractsList(List<Contract> contracts, String emptyMessage) {
    if (contracts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.description_outlined,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              emptyMessage,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => context.read<ContractProvider>().loadContracts(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: contracts.length,
        itemBuilder: (context, index) => _buildContractCard(contracts[index]),
      ),
    );
  }

  Widget _buildContractCard(Contract contract) {
    final isSchool = contract is SchoolContract;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () {
          context.read<ContractProvider>().selectContract(contract.id);
          Navigator.pushNamed(context, Routes.contractDetails);
        },
        borderRadius: BorderRadius.circular(35),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      isSchool ? Icons.school : Icons.repeat,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _getContractTypeLabel(contract.type),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        if (isSchool)
                          Text(
                            (contract as SchoolContract).schoolName,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                      ],
                    ),
                  ),
                  _buildStatusChip(contract.status),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              _buildAddressRow(Icons.trip_origin, contract.pickup.name ?? 'نقطة الانطلاق'),
              const SizedBox(height: 8),
              _buildAddressRow(Icons.location_on, contract.dropoff.name ?? 'الوجهة'),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'السعر الشهري',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Text(
                        AppTheme.formatCurrency(contract.monthlyPrice.amount),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'تاريخ البدء',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Text(
                        DateFormat('dd/MM/yyyy', 'ar').format(contract.startDate),
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAddressRow(IconData icon, String address) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.textSecondary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            address,
            style: Theme.of(context).textTheme.bodyMedium,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusChip(ContractStatus status) {
    Color color;
    String label;

    switch (status) {
      case ContractStatus.active:
        color = AppTheme.successColor;
        label = 'نشط';
        break;
      case ContractStatus.pending:
        color = Colors.orange;
        label = 'قيد الانتظار';
        break;
      case ContractStatus.paused:
        color = Colors.blue;
        label = 'معلق';
        break;
      case ContractStatus.completed:
        color = AppTheme.textSecondary;
        label = 'منتهي';
        break;
      case ContractStatus.cancelled:
        color = AppTheme.errorColor;
        label = 'ملغي';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  String _getContractTypeLabel(ContractType type) {
    switch (type) {
      case ContractType.monthly:
        return 'عقد شهري';
      case ContractType.school:
        return 'عقد مدرسي';
      case ContractType.corporate:
        return 'عقد شركات';
    }
  }
}

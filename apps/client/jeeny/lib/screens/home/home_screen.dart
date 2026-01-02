import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../widgets/widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 2; // Start with booking tab
  final PageController _pageController = PageController(initialPage: 2);

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.ease,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.offButtonColor,
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        children: const [
          _NotificationsTab(),
          _HistoryTab(),
          _BookingTab(),
          _ChatTab(),
          _SettingsTab(),
        ],
      ),
      bottomNavigationBar: BottomAppBar(
        color: Colors.transparent,
        elevation: 0,
        child: Container(
          height: 102,
          width: double.infinity,
          decoration: const BoxDecoration(
            color: AppTheme.offButtonColor,
            image: DecorationImage(
              image: AssetImage('assets/images/icon_yellow.png'),
              fit: BoxFit.cover,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(Icons.home, 0),
              _buildNavItem(Icons.more_time, 1),
              GestureDetector(
                onTap: () => _onTabTapped(2),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SimpleContainer(
                      height: 50,
                      width: 50,
                      color: AppTheme.primaryColor,
                      circular: 25,
                      depth: 15,
                      shadowColor: Colors.yellow.shade100,
                      child: const Icon(Icons.time_to_leave_outlined),
                    ),
                  ],
                ),
              ),
              _buildNavItem(Icons.comment, 3),
              _buildNavItem(Icons.settings, 4),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, int index) {
    return _selectedIndex == index
        ? Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                onPressed: () => _onTabTapped(index),
                icon: Icon(icon),
              ),
              const Text(
                '.',
                style: TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.bold,
                  fontSize: 17,
                ),
              ),
            ],
          )
        : IconButton(
            onPressed: () => _onTabTapped(index),
            icon: Icon(icon),
          );
  }
}

class _BookingTab extends StatelessWidget {
  const _BookingTab();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          height: double.infinity,
          width: double.infinity,
          decoration: const BoxDecoration(
            image: DecorationImage(
              image: AssetImage('assets/images/Map.png'),
              fit: BoxFit.cover,
            ),
          ),
          child: Column(
            children: [
              const SizedBox(height: 59),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Container(
                    height: 50,
                    width: 50,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white),
                      image: const DecorationImage(
                        image: AssetImage('assets/images/profiePic.png'),
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  CustomContainer(
                    height: 50,
                    width: 124,
                    color: Colors.white,
                    elevation: 20,
                    circular: 20,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        const Icon(Icons.wallet),
                        const CustomText(
                          text: '0 MRU',
                          size: 14,
                          weight: FontWeight.w700,
                        ),
                        CustomContainer(
                          height: 38,
                          width: 38,
                          color: AppTheme.primaryColor,
                          child: IconButton(
                            onPressed: () {},
                            icon: const Icon(Icons.add, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                  CustomContainer(
                    height: 50,
                    width: 50,
                    color: Colors.white,
                    elevation: 20,
                    circular: 20,
                    child: IconButton(
                      onPressed: () {},
                      icon: const Icon(Icons.search),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Positioned(
          top: 240,
          left: 150,
          child: Image.asset('assets/images/car_top.png'),
        ),
        Positioned(
          top: 210,
          left: 150,
          child: Container(
            height: 25,
            width: 57,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: AppTheme.primaryColor,
            ),
            child: const Center(child: Text('3 د')),
          ),
        ),
        Positioned(
          bottom: 0,
          child: Container(
            height: 283,
            width: MediaQuery.of(context).size.width,
            decoration: const BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: Colors.black12,
                  offset: Offset(10, 0),
                  blurRadius: 4,
                ),
              ],
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(50),
                topRight: Radius.circular(50),
              ),
              color: Colors.white,
            ),
            child: Column(
              children: [
                const SizedBox(height: 20),
                AppTheme.lineContainer(),
                const SizedBox(height: 27),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    CustomText(
                      text: 'إلى أين؟',
                      weight: FontWeight.w700,
                    ),
                    CustomText(
                      text: 'تخصيص',
                      size: 14,
                      color: Colors.grey,
                    ),
                  ],
                ),
                const SizedBox(height: 57),
                Expanded(
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _WhereToGoItem(
                        icon: Icons.location_on_outlined,
                        title: 'رحلة جديدة',
                        subtitle: 'اضغط للموقع',
                        isSelected: true,
                        onTap: () {},
                      ),
                      _WhereToGoItem(
                        icon: Icons.home,
                        title: 'المنزل',
                        subtitle: '24 كم، 39 د',
                        isSelected: false,
                        onTap: () {},
                      ),
                      _WhereToGoItem(
                        icon: Icons.work,
                        title: 'العمل',
                        subtitle: '14 كم، 15 د',
                        isSelected: false,
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _WhereToGoItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  const _WhereToGoItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 16),
      child: GestureDetector(
        onTap: onTap,
        child: Stack(
          children: [
            Container(height: 130, width: 123),
            Positioned(
              top: 20,
              child: Container(
                height: 93,
                width: 123,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(30),
                  color: AppTheme.offButtonColor,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CustomText(
                      text: title,
                      weight: FontWeight.w600,
                    ),
                    const SizedBox(height: 4),
                    CustomText(
                      text: subtitle,
                      size: 12,
                      color: Colors.grey,
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              top: 1,
              left: 42,
              child: Container(
                height: 40,
                width: 40,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  color: isSelected ? AppTheme.primaryColor : Colors.white,
                ),
                child: Icon(icon),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationsTab extends StatelessWidget {
  const _NotificationsTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإشعارات')),
      body: const Center(child: Text('الإشعارات')),
    );
  }
}

class _HistoryTab extends StatelessWidget {
  const _HistoryTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('السجل')),
      body: const Center(child: Text('سجل الرحلات')),
    );
  }
}

class _ChatTab extends StatelessWidget {
  const _ChatTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('المحادثات')),
      body: const Center(child: Text('المحادثات')),
    );
  }
}

class _SettingsTab extends StatelessWidget {
  const _SettingsTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإعدادات')),
      body: const Center(child: Text('الإعدادات')),
    );
  }
}

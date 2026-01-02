import 'package:flutter/material.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../widgets/widgets.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();

  final List<OnboardingModel> _pages = [
    OnboardingModel(
      image: 'assets/images/onboardingPic1.png',
      title: 'اختر المسار',
      subtitle: 'بسهولة',
    ),
    OnboardingModel(
      image: 'assets/images/onboardingPic2.png',
      title: 'اطلب رحلة',
      subtitle: 'بسرعة',
    ),
    OnboardingModel(
      image: 'assets/images/onboardingPic3.png',
      title: 'احصل على سيارتك',
      subtitle: 'ببساطة',
    ),
    OnboardingModel(
      image: 'assets/images/onboardingPic4.png',
      title: 'وفر وقتك',
      subtitle: 'معنا',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_pageController.page == _pages.length - 1) {
      _pageController.jumpToPage(0);
    } else {
      _pageController.nextPage(
        duration: const Duration(seconds: 1),
        curve: Curves.ease,
      );
    }
  }

  void _goToLogin() {
    Navigator.pushReplacementNamed(context, Routes.login);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 25),
            child: Column(
              children: [
                SizedBox(
                  height: 460,
                  child: PageView.builder(
                    controller: _pageController,
                    itemCount: _pages.length,
                    itemBuilder: (context, index) {
                      return Container(
                        height: 300,
                        width: double.infinity,
                        decoration: const BoxDecoration(
                          borderRadius: BorderRadius.only(
                            bottomLeft: Radius.circular(80),
                          ),
                          color: AppTheme.offButtonColor,
                        ),
                        child: Column(
                          children: [
                            const SizedBox(height: 50),
                            Container(
                              height: 280,
                              width: double.infinity,
                              decoration: BoxDecoration(
                                image: DecorationImage(
                                  image: AssetImage(_pages[index].image),
                                  fit: BoxFit.fill,
                                ),
                              ),
                            ),
                            const SizedBox(height: 43),
                            CustomText(
                              text: _pages[index].title,
                              size: 24,
                              weight: FontWeight.w700,
                            ),
                            const SizedBox(height: 10),
                            CustomText(
                              text: _pages[index].subtitle,
                              size: 18,
                              weight: FontWeight.w400,
                            ),
                            const SizedBox(height: 20),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 30),
                SmoothPageIndicator(
                  controller: _pageController,
                  count: _pages.length,
                  effect: const WormEffect(
                    activeDotColor: Colors.black,
                    dotHeight: 10,
                    dotWidth: 10,
                  ),
                ),
                const SizedBox(height: 45),
                TextBtn(
                  color: Colors.black,
                  title: 'تخطي',
                  onPressed: _goToLogin,
                ),
                const SizedBox(height: 20),
                RoundButton(
                  width: 150,
                  title: 'التالي',
                  onPressed: _nextPage,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class OnboardingModel {
  final String image;
  final String title;
  final String subtitle;

  OnboardingModel({
    required this.image,
    required this.title,
    required this.subtitle,
  });
}

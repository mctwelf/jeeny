# 🚖 Jeeny - Taxi Booking Platform

<div align="center">

![Jeeny Logo](./assets/behance-ito-digital-agency-llc-taxi-booking-app-branding-ui-ux-01.png)

**جيني - منصة حجز سيارات الأجرة الأولى في موريتانيا**

**A modern, full-featured taxi booking platform for Mauritania**

[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-orange.svg)](https://aws.amazon.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red.svg)]()

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Apps](#apps)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Overview

Jeeny (جيني) is a comprehensive taxi booking platform designed specifically for the Mauritanian market. It consists of four applications that work together to provide a seamless ride-hailing experience:

- **Client App** - For passengers to book rides
- **Driver App** - For drivers to accept and complete rides
- **Admin Dashboard** - For administrators to manage the platform
- **Employee App** - For company employees to handle support and operations

### 🌍 Localization

- **Arabic (العربية)** - Default language with RTL support
- **French (Français)** - Secondary language
- **English** - Tertiary language

### 💳 Payment Providers

Local Mauritanian payment integration:
- **Bankily (بنكيلي)**
- **Sedad (السداد)**
- **Masrvi (مصرفي)**

---

## ✨ Features

### Client App
- 📱 Phone number/OTP authentication
- 🗺️ Real-time map with google maps
- 📍 Pickup & destination selection
- 🚗 Multiple vehicle types <car , motosycle , transfer>
- 💰 Fare estimation
- 📊 Ride history
- ⭐ Driver ratings
- 💬 In-app chat with driver
- 📞 In-app calling
- 💳 Multiple payment methods
- ❤️ Favorite locations
- 🔔 Push notifications
- 🎁 Promotions & discounts

### Driver App
- 📱 Driver registration & verification
- 🟢 Online/Offline status toggle
- 📍 Real-time location tracking
- 🔔 Ride request notifications
- 🗺️ Turn-by-turn navigation
- 💰 Earnings dashboard
- 📊 Trip history & analytics
- 📄 Document management
- ⭐ Passenger ratings
- 💬 In-app chat with passenger

### Admin Dashboard (Web)
- 👥 User management (Clients, Drivers, Employees)
- 🚗 Ride monitoring & management
- 📊 Analytics & reporting
- 💰 Pricing & commission management
- 🏙️ City & neighborhood management
- 💳 Payment provider configuration
- 🎫 Support ticket management
- 📢 Push notification broadcasting
- 🎁 Promotions management
- 📋 Driver verification workflow

### Employee App
- 🎫 Support ticket handling
- time the employee show for work and time they left 
- drivers created or verified by the employee
- ✅ Driver document verification
- 📞 Customer support tools
- 📊 Task management

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND APPS                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Client  │ │  Driver  │ │  Admin   │ │ Employee │          │
│  │   App    │ │   App    │ │Dashboard │ │   App    │          │
│  │ (React   │ │ (React   │ │ (React   │ │ (React   │          │
│  │ Native)  │ │ Native)  │ │   Web)   │ │ Native)  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
        └────────────┴─────┬──────┴────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      google cloud API GATEWAY                   │
│              (REST API + WebSocket API)                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    function  │    │    function  │    │    function  │
│   Functions  │    │  (WebSocket  │    │   (Async     │
│  (REST API)  │    │   Handlers)  │    │   Workers)   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   function   │  │   function   │  │   function   │
│  (Database)  │  │  (Storage)   │  │   (Redis)    │
└──────────────┘  └──────────────┘  └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SUPPORTING SERVICES                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │   firebase  │ │    google   │ │     FCM     │ │  firebase │  │
│  │ (Auth/OTP)  │ │     maps    │ │   (Push)    │ │   (SMS)   │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │ function    │ │  function   │ │  function   │ |  function │  |
│  │  (Events)   │ │  (Queues)   │ │  (Email)    │ │ (Logging) │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Apps

| App | Platform | Description |
|-----|----------|-------------|
| **Client** | iOS & Android | Passenger-facing mobile app |
| **Driver** | iOS & Android | Driver-facing mobile app |
| **Admin** | Web | Administrative dashboard |
| **Employee** | iOS & Android | Employee operations app |

---

## 🛠️ Tech Stack

### Frontend
- **React Native** (v0.73+) - Mobile apps
- **React** (v18+) - Admin dashboard
- **TypeScript** (v5+) - Type safety
- **Expo** (v50+) - React Native toolchain
- **React Navigation** (v6) - Navigation
- **React Query** (TanStack Query v5) - Data fetching
- **Zustand** - State management
- **React Native Reanimated** - Animations
- **i18next** - Internationalization
- **React Native Maps** - Map integration

### Backend (AWS)-new google cloud
- **API Gateway** - REST & WebSocket APIs
- **Lambda** - Serverless compute
- **DynamoDB** - NoSQL database
- **Cognito** - Authentication (Phone/OTP)
- **S3** - File storage
- **Location Service** - Maps & tracking
- **SNS** - Push notifications
- **Pinpoint** - SMS (OTP)
- **SES** - Email notifications
- **EventBridge** - Event processing
- **SQS** - Message queues
- **ElastiCache** - Redis caching
- **CloudWatch** - Monitoring & logging
- **CDK** - Infrastructure as code

### Development Tools
- **pnpm** - Package manager
- **Turborepo** - Monorepo management
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing
- **Detox** - E2E testing (mobile)
- **Playwright** - E2E testing (web)

---

## 📁 Project Structure

```
jeeny/
├── apps/
│   ├── client/                 # Client mobile app (React Native)
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── screens/        # App screens
│   │   │   ├── navigation/     # Navigation config
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── services/       # API services
│   │   │   ├── store/          # State management
│   │   │   ├── utils/          # Utilities
│   │   │   ├── i18n/           # Translations
│   │   │   └── types/          # TypeScript types
│   │   ├── app.json
│   │   └── package.json
│   │
│   ├── driver/                 # Driver mobile app (React Native)
│   │   └── ... (similar structure)
│   │
│   ├── employee/               # Employee mobile app (React Native)
│   │   └── ... (similar structure)
│   │
│   └── admin/                  # Admin dashboard (React Web)
│       ├── src/
│       │   ├── components/     # UI components
│       │   ├── pages/          # Page components
│       │   ├── layouts/        # Layout components
│       │   ├── hooks/          # Custom hooks
│       │   ├── services/       # API services
│       │   ├── store/          # State management
│       │   ├── utils/          # Utilities
│       │   ├── i18n/           # Translations
│       │   └── types/          # TypeScript types
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared utilities & types
│   │   ├── src/
│   │   │   ├── constants/      # App constants
│   │   │   ├── types/          # Shared types
│   │   │   ├── utils/          # Shared utilities
│   │   │   └── validation/     # Validation schemas
│   │   └── package.json
│   │
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── components/     # Reusable components
│   │   │   ├── theme/          # Theme configuration
│   │   │   └── styles/         # Shared styles
│   │   └── package.json
│   │
│   └── api/                    # API client
│       ├── src/
│       │   ├── client/         # API client setup
│       │   ├── endpoints/      # API endpoints
│       │   └── types/          # API types
│       └── package.json
│
├── infrastructure/             # AWS CDK infrastructure
│   ├── lib/
│   │   ├── stacks/            # CDK stacks
│   │   ├── constructs/        # Custom constructs
│   │   └── lambdas/           # Lambda functions
│   ├── cdk.json
│   └── package.json
│
├── assets/                     # Design assets
│   ├── fonts/                 # Gilroy font family
│   ├── icons/                 # App icons
│   └── *.png                  # UI/UX mockups
│
├── docs/                       # Documentation
│   ├── api/                   # API documentation
│   ├── database/              # Database documentation
│   └── guides/                # Development guides
│
├── scripts/                    # Build & deployment scripts
├── .github/                    # GitHub Actions workflows
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # pnpm workspace config
├── package.json                # Root package.json
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **AWS CLI** configured
- **Xcode** (for iOS development)
- **Android Studio** (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/jeeny.git
   cd jeeny
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development servers**
   ```bash
   # Start all apps
   pnpm dev

   # Or start individual apps
   pnpm dev:client    # Client app
   pnpm dev:driver    # Driver app
   pnpm dev:admin     # Admin dashboard
   pnpm dev:employee  # Employee app
   ```

### Running on Devices

```bash
# iOS
pnpm ios:client
pnpm ios:driver
pnpm ios:employee

# Android
pnpm android:client
pnpm android:driver
pnpm android:employee
```

---

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | All users (clients, drivers, admins, employees) |
| `vehicles` | Driver vehicles |
| `rides` | Ride requests and history |
| `ride_tracking` | Real-time ride location updates |
| `transactions` | Payment transactions |
| `payment_methods` | User saved payment methods |
| `payment_providers` | Payment provider configurations |
| `cities` | Cities |
| `neighborhoods` | Neighborhoods within cities |
| `pricing_rules` | Pricing configuration |
| `notifications` | Notification history |
| `conversations` | Chat conversations |
| `messages` | Chat messages |
| `ratings` | User ratings |
| `favorites` | Favorite locations |
| `promotions` | Discount codes and offers |
| `support_tickets` | Customer support tickets |
| `documents` | User documents (licenses, etc.) |
| `audit_logs` | System audit logs |

See [Database Documentation](./docs/database/README.md) for full schema details.

---

## 📖 API Documentation

API documentation is available at:
- **Development**: `http://localhost:3000/api/docs`
- **Production**: `https://api.jeeny.mr/docs`

See [API Documentation](./docs/api/README.md) for details.

---

## 🚢 Deployment

### Development
```bash
pnpm deploy:dev
```

### Staging
```bash
pnpm deploy:staging
```

### Production
```bash
pnpm deploy:prod
```

See [Deployment Guide](./docs/guides/deployment.md) for detailed instructions.

---

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Write/update tests
4. Submit a pull request

See [Contributing Guide](./CONTRIBUTING.md) for details.

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 📞 Contact

- **Email**: support@jeeny.mr
- **Website**: https://jeeny.mr

---

<div align="center">
  <p>Built with ❤️ in Mauritania 🇲🇷</p>
</div>
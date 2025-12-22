# Jeeny Taxi Platform - Technical Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND APPS                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Client  │ │  Driver  │ │  Admin   │ │ Employee │          │
│  │   App    │ │   App    │ │Dashboard │ │   App    │          │
│  │ (Expo)   │ │ (Expo)   │ │ (Vite)   │ │ (Expo)   │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
        └────────────┴─────┬──────┴────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                      AWS API GATEWAY                            │
│              REST API (v1) + WebSocket API (v1)                 │
│              Cognito Authorizer | Rate Limiting                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                      LAMBDA FUNCTIONS                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  Auth   │ │  Users  │ │ Drivers │ │  Rides  │ │Payments │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Location │ │  Chat   │ │ Support │ │ Promos  │ │  Admin  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│  ┌─────────┐ ┌─────────┐                                       │
│  │Analytics│ │WebSocket│                                       │
│  └─────────┘ └─────────┘                                       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  DynamoDB   │  │     S3      │  │ ElastiCache │             │
│  │  (Tables)   │  │  (Assets)   │  │   (Redis)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## AWS Services

### Compute
| Service | Purpose | Configuration |
|---------|---------|---------------|
| Lambda | Business logic | Node.js 18.x, 512MB, 30s timeout |
| API Gateway | REST/WebSocket APIs | Regional, v1 stage |

### Storage
| Service | Purpose | Configuration |
|---------|---------|---------------|
| DynamoDB | Primary database | On-demand capacity |
| S3 | File storage | Private, versioned |
| ElastiCache | Caching | Redis 7.x |

### Authentication
| Service | Purpose | Configuration |
|---------|---------|---------------|
| Cognito | User management | Phone auth, OTP |

### Location
| Service | Purpose | Configuration |
|---------|---------|---------------|
| Location Service | Maps, routing, tracking | Esri provider |

### Messaging
| Service | Purpose | Configuration |
|---------|---------|---------------|
| SNS | Push notifications | APNS, FCM |
| Pinpoint | SMS (OTP) | Mauritania enabled |
| SES | Email | Verified domain |

### Monitoring
| Service | Purpose | Configuration |
|---------|---------|---------------|
| CloudWatch | Logs, metrics | 30-day retention |
| X-Ray | Tracing | Active tracing |

---

## DynamoDB Tables

### Users Table
```
PK: USER#{userId}
SK: PROFILE

GSI1: phone-index
  PK: {phoneNumber}
  SK: USER#{userId}

GSI2: email-index
  PK: {email}
  SK: USER#{userId}

GSI3: role-index
  PK: {role}
  SK: {createdAt}
```

### Rides Table
```
PK: RIDE#{rideId}
SK: DETAILS

GSI1: client-index
  PK: CLIENT#{clientId}
  SK: {createdAt}

GSI2: driver-index
  PK: DRIVER#{driverId}
  SK: {createdAt}

GSI3: status-index
  PK: {status}
  SK: {createdAt}
```

### Transactions Table
```
PK: TXN#{transactionId}
SK: DETAILS

GSI1: user-index
  PK: USER#{userId}
  SK: {createdAt}

GSI2: ride-index
  PK: RIDE#{rideId}
  SK: {createdAt}
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/verify-otp | Verify OTP code |
| POST | /auth/resend-otp | Resend OTP |
| POST | /auth/login | Login user |
| POST | /auth/refresh-token | Refresh JWT |
| POST | /auth/logout | Logout user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users | List users |
| POST | /users | Create user |
| GET | /users/{userId} | Get user |
| PUT | /users/{userId} | Update user |
| DELETE | /users/{userId} | Delete user |
| GET | /me | Get current user |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /drivers | List drivers |
| GET | /drivers/{driverId} | Get driver |
| PUT | /drivers/{driverId}/status | Update status |
| PUT | /drivers/{driverId}/location | Update location |
| GET | /drivers/nearby | Find nearby drivers |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /rides | Create ride request |
| GET | /rides/{rideId} | Get ride details |
| POST | /rides/{rideId}/accept | Driver accepts |
| POST | /rides/{rideId}/start | Start ride |
| POST | /rides/{rideId}/complete | Complete ride |
| POST | /rides/{rideId}/cancel | Cancel ride |
| POST | /rides/estimate | Get fare estimate |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /payments/methods | List payment methods |
| POST | /payments/methods | Add payment method |
| GET | /payments/wallet | Get wallet balance |
| POST | /payments/wallet/topup | Top up wallet |
| POST | /payments/providers/bankily | Pay with Bankily |
| POST | /payments/providers/sedad | Pay with Sedad |
| POST | /payments/providers/masrvi | Pay with Masrvi |

---

## WebSocket Events

### Client Events (Incoming)
| Event | Payload | Description |
|-------|---------|-------------|
| updateLocation | {lat, lng} | Update user location |
| subscribeRide | {rideId} | Subscribe to ride updates |
| sendMessage | {conversationId, text} | Send chat message |

### Server Events (Outgoing)
| Event | Payload | Description |
|-------|---------|-------------|
| driverLocation | {lat, lng, heading} | Driver location update |
| rideStatusChanged | {rideId, status} | Ride status change |
| newMessage | {message} | New chat message |
| rideRequest | {ride} | New ride request (driver) |

---

## Frontend Architecture

### Admin Dashboard (React + Vite)

```
apps/admin/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   │   ├── auth/        # Login
│   │   ├── dashboard/   # Main dashboard
│   │   ├── users/       # User management
│   │   ├── drivers/     # Driver management
│   │   ├── rides/       # Ride management
│   │   ├── transactions/# Financial
│   │   ├── promotions/  # Promo codes
│   │   ├── support/     # Support tickets
│   │   ├── analytics/   # Reports
│   │   └── settings/    # Configuration
│   ├── layouts/         # Layout components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── store/           # State management
│   ├── utils/           # Utilities
│   └── i18n/            # Translations
```

### Mobile Apps (React Native + Expo)

```
apps/client/  (or driver/, employee/)
├── src/
│   ├── components/      # UI components
│   ├── screens/         # Screen components
│   ├── navigation/      # React Navigation
│   ├── hooks/           # Custom hooks
│   ├── services/        # API services
│   ├── store/           # Zustand store
│   ├── utils/           # Utilities
│   └── i18n/            # Translations
```

---

## Design System

### Colors
```css
/* Primary - Green */
--primary-500: #22c55e;
--primary-600: #16a34a;

/* Secondary - Yellow */
--secondary-500: #eab308;

/* Accent - Blue */
--accent-500: #3b82f6;

/* Neutral */
--neutral-50: #fafafa;
--neutral-900: #171717;

/* Semantic */
--success: #22c55e;
--warning: #eab308;
--error: #ef4444;
```

### Typography
- Font Family: Cairo (Arabic), Inter (Latin)
- RTL Support: Full
- Direction: RTL by default

### Components
- Cards with hover effects
- Badges for status
- Tables with sorting/filtering
- Charts (Chart.js)
- Forms with validation
- Modals and dialogs
- Toast notifications

---

## Security Considerations

### Authentication
- JWT tokens with 1-hour expiry
- Refresh tokens with 30-day expiry
- OTP expires in 5 minutes
- Max 3 OTP attempts per session

### Authorization
- Role-based access control (RBAC)
- Cognito user groups
- API Gateway authorizers
- Resource-level permissions

### Data Protection
- TLS 1.3 for all traffic
- AES-256 encryption at rest
- PII data masking in logs
- Secure credential storage

### Rate Limiting
- 1000 requests/second burst
- 500 requests/second sustained
- 100,000 requests/month quota

---

## Deployment Strategy

### Environments
| Environment | Purpose | Branch |
|-------------|---------|--------|
| Development | Testing | develop |
| Staging | Pre-production | staging |
| Production | Live | main |

### CI/CD Pipeline
1. Code push triggers GitHub Actions
2. Run tests and linting
3. Build applications
4. Deploy infrastructure (CDK)
5. Deploy applications
6. Run smoke tests

### Infrastructure as Code
- AWS CDK (TypeScript)
- Separate stacks per concern
- Environment-specific configs

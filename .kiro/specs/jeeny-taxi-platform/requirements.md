# Jeeny Taxi Platform - Requirements Specification

## Overview

Jeeny (جيني) is a comprehensive taxi booking platform designed for the Mauritanian market. The platform consists of four applications working together to provide a seamless ride-hailing experience.

**Target Market:** Mauritania 🇲🇷
**Primary Language:** Arabic (RTL support)
**Secondary Languages:** French, English
**Currency:** MRU (Mauritanian Ouguiya)

---

## User Stories

### Epic 1: Client Application (Passenger)

#### US-1.1: User Registration & Authentication
**As a** passenger
**I want to** register and authenticate using my phone number
**So that** I can securely access the platform

**Acceptance Criteria:**
- [ ] User can enter Mauritanian phone number (+222)
- [ ] System sends OTP via SMS (AWS Pinpoint)
- [ ] User can verify OTP within 5 minutes
- [ ] User can resend OTP (max 3 times per session)
- [ ] User profile is created in Cognito and DynamoDB
- [ ] JWT tokens are issued upon successful authentication
- [ ] Refresh token mechanism works correctly

#### US-1.2: Ride Booking
**As a** passenger
**I want to** book a ride by selecting pickup and destination
**So that** I can travel to my desired location

**Acceptance Criteria:**
- [ ] User can select pickup location on map or search
- [ ] User can select destination on map or search
- [ ] System shows available vehicle types with fare estimates
- [ ] User can add multiple stops (if enabled)
- [ ] User can schedule rides for later
- [ ] User can select payment method before booking
- [ ] System finds nearby available drivers
- [ ] User receives real-time ride status updates

#### US-1.3: Real-time Tracking
**As a** passenger
**I want to** track my driver's location in real-time
**So that** I know when they will arrive

**Acceptance Criteria:**
- [ ] Map displays driver's live location (AWS Location Service)
- [ ] ETA updates every 30 seconds
- [ ] User receives push notification when driver arrives
- [ ] User can see driver's vehicle details and photo
- [ ] Route is displayed on map

#### US-1.4: Payment Processing
**As a** passenger
**I want to** pay for my ride using local payment methods
**So that** I can complete transactions conveniently

**Acceptance Criteria:**
- [ ] User can pay with Bankily
- [ ] User can pay with Sedad
- [ ] User can pay with Masrvi
- [ ] User can pay with cash
- [ ] User can use wallet balance
- [ ] User can add/remove payment methods
- [ ] User receives digital receipt after ride

#### US-1.5: Rating & Feedback
**As a** passenger
**I want to** rate my driver after a ride
**So that** I can provide feedback on the service

**Acceptance Criteria:**
- [ ] User can rate driver (1-5 stars)
- [ ] User can add optional comment
- [ ] User can report issues
- [ ] Rating is stored and affects driver's overall rating

---

### Epic 2: Driver Application

#### US-2.1: Driver Registration & Verification
**As a** driver
**I want to** register and submit my documents for verification
**So that** I can start accepting rides

**Acceptance Criteria:**
- [ ] Driver can register with phone number
- [ ] Driver can upload required documents:
  - National ID
  - Driver's license
  - Vehicle registration
  - Vehicle insurance
  - Vehicle photos
- [ ] Documents are stored securely in S3
- [ ] Admin receives notification of new registration
- [ ] Driver is notified of verification status

#### US-2.2: Online/Offline Status
**As a** driver
**I want to** toggle my availability status
**So that** I can control when I receive ride requests

**Acceptance Criteria:**
- [ ] Driver can go online/offline with one tap
- [ ] Location tracking starts when online
- [ ] Location tracking stops when offline
- [ ] Status is synced across devices

#### US-2.3: Ride Request Handling
**As a** driver
**I want to** receive and respond to ride requests
**So that** I can accept passengers

**Acceptance Criteria:**
- [ ] Driver receives push notification for new requests
- [ ] Request shows pickup location, destination, fare estimate
- [ ] Driver has 30 seconds to accept/reject
- [ ] Driver can see passenger rating
- [ ] Accepted ride shows navigation to pickup

#### US-2.4: Ride Execution
**As a** driver
**I want to** navigate to pickup and complete the ride
**So that** I can earn money

**Acceptance Criteria:**
- [ ] Turn-by-turn navigation to pickup
- [ ] Driver can mark "arrived at pickup"
- [ ] Driver can start ride when passenger boards
- [ ] Turn-by-turn navigation to destination
- [ ] Driver can complete ride at destination
- [ ] Fare is calculated and displayed

#### US-2.5: Earnings Dashboard
**As a** driver
**I want to** view my earnings and statistics
**So that** I can track my income

**Acceptance Criteria:**
- [ ] Daily/weekly/monthly earnings summary
- [ ] Number of completed rides
- [ ] Average rating
- [ ] Commission breakdown
- [ ] Withdrawal to bank/mobile money

---

### Epic 3: Admin Dashboard

#### US-3.1: Dashboard Overview
**As an** administrator
**I want to** see platform statistics at a glance
**So that** I can monitor platform health

**Acceptance Criteria:**
- [x] Total users count with growth percentage
- [x] Active drivers count
- [x] Today's rides count
- [x] Today's revenue
- [x] Revenue chart (weekly)
- [x] Ride status distribution chart
- [x] Rides per hour chart
- [x] Recent rides list
- [x] Pending driver verifications

#### US-3.2: User Management
**As an** administrator
**I want to** manage platform users
**So that** I can maintain user accounts

**Acceptance Criteria:**
- [x] List all users with search/filter
- [x] View user details and ride history
- [x] Suspend/activate user accounts
- [x] View user wallet balance
- [ ] Export user data

#### US-3.3: Driver Management
**As an** administrator
**I want to** manage drivers and verify documents
**So that** only qualified drivers operate

**Acceptance Criteria:**
- [x] List all drivers with status filter
- [x] View driver details and documents
- [x] Approve/reject driver applications
- [x] View driver earnings and ratings
- [x] Suspend/activate driver accounts
- [ ] Bulk verification actions

#### US-3.4: Ride Management
**As an** administrator
**I want to** monitor and manage rides
**So that** I can ensure service quality

**Acceptance Criteria:**
- [x] List all rides with filters (status, date, city)
- [x] View ride details with route map
- [x] View ride timeline (events)
- [x] Cancel rides if necessary
- [ ] Refund processing

#### US-3.5: Financial Management
**As an** administrator
**I want to** manage transactions and pricing
**So that** I can control platform finances

**Acceptance Criteria:**
- [x] View all transactions with filters
- [x] Transaction details (payment method, status)
- [x] Configure pricing rules per city
- [x] Configure commission rates
- [ ] Generate financial reports
- [ ] Process driver payouts

#### US-3.6: Promotions Management
**As an** administrator
**I want to** create and manage promotions
**So that** I can attract and retain users

**Acceptance Criteria:**
- [x] Create promo codes with discount rules
- [x] Set validity period and usage limits
- [x] Target specific user segments
- [x] View promotion usage statistics
- [x] Activate/deactivate promotions

#### US-3.7: Support Ticket Management
**As an** administrator
**I want to** handle customer support tickets
**So that** I can resolve user issues

**Acceptance Criteria:**
- [x] View all support tickets
- [x] Filter by status, priority, category
- [x] Assign tickets to employees
- [x] Respond to tickets
- [x] Close/resolve tickets

#### US-3.8: Platform Settings
**As an** administrator
**I want to** configure platform settings
**So that** I can customize platform behavior

**Acceptance Criteria:**
- [x] General settings (app name, contact info)
- [x] Pricing configuration per city
- [x] City/neighborhood management
- [x] Notification settings
- [x] Security settings

#### US-3.9: Analytics & Reporting
**As an** administrator
**I want to** view detailed analytics
**So that** I can make data-driven decisions

**Acceptance Criteria:**
- [x] Ride analytics (trends, peak hours)
- [x] Revenue analytics
- [x] User growth analytics
- [x] Driver performance analytics
- [ ] Export reports (PDF, Excel)
- [ ] Scheduled report delivery

---

### Epic 4: Employee Application

#### US-4.1: Support Ticket Handling
**As an** employee
**I want to** handle assigned support tickets
**So that** I can help users resolve issues

**Acceptance Criteria:**
- [ ] View assigned tickets
- [ ] Respond to tickets
- [ ] Escalate tickets to admin
- [ ] Close resolved tickets

#### US-4.2: Driver Document Verification
**As an** employee
**I want to** verify driver documents
**So that** I can approve qualified drivers

**Acceptance Criteria:**
- [ ] View pending driver applications
- [ ] Review uploaded documents
- [ ] Approve/reject with comments
- [ ] Request additional documents

---

### Epic 5: Backend Infrastructure

#### US-5.1: Authentication Service
**As the** system
**I want to** handle user authentication securely
**So that** only authorized users access the platform

**Acceptance Criteria:**
- [x] AWS Cognito user pool configured
- [x] Phone number authentication with OTP
- [x] JWT token generation and validation
- [x] Token refresh mechanism
- [x] User groups (client, driver, admin, employee)

#### US-5.2: API Gateway
**As the** system
**I want to** expose secure REST and WebSocket APIs
**So that** apps can communicate with backend

**Acceptance Criteria:**
- [x] REST API with Cognito authorizer
- [x] WebSocket API for real-time updates
- [x] CORS configuration
- [x] Rate limiting and throttling
- [x] Request validation

#### US-5.3: Lambda Functions
**As the** system
**I want to** process business logic serverlessly
**So that** the platform scales automatically

**Acceptance Criteria:**
- [x] Auth Lambda (registration, login, OTP)
- [x] Users Lambda (CRUD, profile)
- [x] Drivers Lambda (CRUD, status, location)
- [x] Rides Lambda (booking, status, completion)
- [x] Payments Lambda (processing, wallet)
- [x] Location Lambda (search, routing, tracking)
- [x] Notifications Lambda (push, SMS)
- [x] Chat Lambda (conversations, messages)
- [x] Support Lambda (tickets)
- [x] Promotions Lambda (codes, validation)
- [x] Admin Lambda (management operations)
- [x] Analytics Lambda (reporting)
- [x] WebSocket Lambda (real-time handlers)

#### US-5.4: Database
**As the** system
**I want to** store data reliably
**So that** information is persisted and queryable

**Acceptance Criteria:**
- [x] DynamoDB tables configured
- [x] GSI indexes for query patterns
- [x] TTL for temporary data
- [ ] Backup and recovery configured

#### US-5.5: Location Services
**As the** system
**I want to** provide mapping and tracking capabilities
**So that** users can navigate and track rides

**Acceptance Criteria:**
- [x] AWS Location Service map configured
- [x] Place index for search
- [x] Route calculator for navigation
- [x] Tracker for real-time location
- [ ] Geofencing for city boundaries

#### US-5.6: Payment Integration
**As the** system
**I want to** integrate with local payment providers
**So that** users can pay conveniently

**Acceptance Criteria:**
- [ ] Bankily API integration
- [ ] Sedad API integration
- [ ] Masrvi API integration
- [ ] Wallet system implementation
- [ ] Transaction logging

---

## Technical Requirements

### Performance
- API response time < 500ms (p95)
- Real-time location updates every 3 seconds
- Push notification delivery < 5 seconds
- Support 10,000 concurrent users

### Security
- All data encrypted in transit (TLS 1.3)
- All data encrypted at rest (AES-256)
- PII data handling compliance
- Rate limiting on all endpoints
- Input validation and sanitization

### Availability
- 99.9% uptime SLA
- Multi-AZ deployment
- Automatic failover
- Health monitoring and alerting

### Scalability
- Serverless architecture (Lambda)
- Auto-scaling DynamoDB
- CDN for static assets
- Connection pooling for databases

---

## Current Implementation Status

### ✅ Completed
- Backend Lambda handlers (all 13 handlers)
- API Stack with REST and WebSocket APIs
- Admin Dashboard pages:
  - Dashboard with statistics
  - Users management
  - Drivers management
  - Rides management
  - Transactions
  - Promotions
  - Support tickets
  - Settings
  - Analytics

### 🚧 In Progress
- Client mobile app (React Native)
- Driver mobile app (React Native)
- Employee mobile app (React Native)
- Payment provider integrations

### 📋 Pending
- Infrastructure deployment (CDK)
- End-to-end testing
- Production environment setup
- App store submissions

---

## File References

Key implementation files:
- #[[file:infrastructure/lib/stacks/api-stack.ts]] - API Gateway and Lambda configuration
- #[[file:apps/admin/src/App.tsx]] - Admin dashboard routing
- #[[file:apps/admin/src/pages/dashboard/DashboardPage.tsx]] - Dashboard implementation
- #[[file:.env.example]] - Environment configuration template

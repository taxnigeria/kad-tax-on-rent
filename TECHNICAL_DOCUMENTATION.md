# Kad Tax on Rent - Technical Documentation

## 1. Executive Technical Summary

**Kad Tax on Rent** is a production-grade web application designed to streamline property tax assessment, invoicing, and payment management for tax authorities. The platform serves taxpayers, enumerators, and administrators across a distributed multi-user environment.

**Current Status:** In active development  
**Hosting Model:** Cloud-based infrastructure (Vercel for frontend, PostgreSQL/Supabase for database, Firebase for authentication)  
**Reliability:** Built on industry-standard, long-term-support technologies with automated monitoring, error tracking, and data backups  
**Architecture:** Stateless microservices architecture with horizontal scalability and redundant data storage

---

## 2. System Architecture

### High-Level Overview

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │ HTTPS
┌────────▼──────────────────────┐
│  Frontend Layer (Next.js)      │
│  - React Components             │
│  - Client-side validation       │
│  - Form management              │
└────────┬───────────────────────┘
         │ REST API / Server Actions
┌────────▼───────────────────────┐
│  Backend Layer (Next.js API)    │
│  - Firebase Admin SDK           │
│  - Supabase Client              │
│  - Business Logic               │
│  - Third-party integrations     │
└────────┬───────────────────────┘
         │ SQL Queries / SDK calls
┌────────▼───────────────────────┐
│   Data Layer                    │
│  - PostgreSQL (Supabase)        │
│  - Firebase Auth                │
│  - Firebase Firestore (optional)│
└─────────────────────────────────┘
```

### Cloud Infrastructure

- **Platform:** Vercel (Next.js hosting)
- **Region:** [REGION_TO_BE_SPECIFIED]
- **Database:** PostgreSQL via Supabase (with Row-Level Security)
- **Authentication:** Firebase Authentication (email/password)
- **File Storage:** Vercel Blob for property photos and documents
- **External Services:** N8N webhooks for WhatsApp notifications, PayKaduna integration for KADIRS ID generation

### Environment Separation

- **Development:** Local environment with `.env.local` configuration
- **Staging:** [STAGING_DEPLOYMENT_DETAILS_TO_BE_SPECIFIED]
- **Production:** [PRODUCTION_DEPLOYMENT_DETAILS_TO_BE_SPECIFIED]

---

## 3. Technology Stack

### Frontend
- **Framework:** Next.js 15.3 (React 19)
- **Styling:** Tailwind CSS v4 with custom design tokens
- **UI Components:** shadcn/ui (community component library)
- **Form Management:** React Hook Form + Zod validation
- **State Management:** React Context API + SWR for data fetching
- **Charting:** Recharts for data visualization
- **Icons:** Lucide React + Tabler Icons
- **Notifications:** Sonner (toast notifications)

**Rationale:** Widely supported, long-term frameworks with large communities and proven longevity in production systems.

### Backend
- **Runtime:** Node.js (Next.js App Router)
- **Language:** TypeScript 5
- **API Pattern:** RESTful with Server Actions (hybrid approach)
- **Admin SDK:** Firebase Admin SDK (v13.6.0)
- **Database ORM:** Direct SQL queries via Supabase client
- **Validation:** Zod for schema validation
- **AI Integration:** Vercel AI SDK with OpenAI models

**Rationale:** Server-side rendering with hybrid API patterns provides better performance, improved SEO, and reduced bundle size while maintaining developer experience.

### Database
- **Engine:** PostgreSQL (via Supabase)
- **Access Pattern:** Direct SQL queries (no traditional ORM dependency)
- **Security:** Row-Level Security (RLS) policies for multi-tenant data isolation
- **Backups:** Automated daily backups with point-in-time recovery

**Core Tables:**
- `users` - User accounts with roles (admin, enumerator, taxpayer, tenant)
- `taxpayer_profiles` - Extended taxpayer information (KADIRS ID, business details)
- `properties` - Property registry with enumeration status
- `invoices` / `tax_calculations` - Tax assessments and payment tracking
- `payments` - Payment records linked to invoices
- `documents` - Property photos and supporting documents
- `locations` - Area offices, LGAs, cities hierarchy

### File Storage
- **Provider:** Vercel Blob
- **Use Cases:** Property photos (facade, address), documents, profile photos
- **Access Control:** URL-based with private/public distinction

### Authentication
- **Provider:** Firebase Authentication
- **Methods:** Email/Password authentication
- **Session Management:** JWT tokens stored in HTTP-only cookies
- **Role-Based Access Control:** Stored in PostgreSQL `users` table with RLS enforcement

---

## 4. Security & Compliance

### Authentication & Authorization

- **Email/Password Authentication:** Users authenticate via Firebase Auth with secure password hashing (bcrypt)
- **Session Management:** JWT tokens in HTTP-only cookies prevent XSS attacks
- **Role-Based Access Control:** Four user roles with granular permissions:
  - `admin` - Full system access including user and tax management
  - `super_admin` - Admin + system configuration access
  - `enumerator` - Property enumeration and taxpayer search
  - `taxpayer` - View own invoices, properties, and payments
  - `tenant` - Limited property viewing (read-only)

### Data Encryption

- **In Transit:** All communication uses HTTPS/TLS 1.3
- **At Rest:** PostgreSQL data encrypted at the database level (Supabase managed encryption)
- **Sensitive Data:** Passwords hashed with bcrypt before storage

### Row-Level Security (RLS)

PostgreSQL RLS policies enforce data isolation:
- Taxpayers can only view their own data
- Enumerators can only access assigned properties
- Admins have unrestricted access to all data

### Audit Logging

- **Created/Updated Timestamps:** All records include `created_at` and `updated_at` fields
- **User Tracking:** `enumerated_by_user_id`, `property_manager_id` fields track user actions
- **Change History:** [AUDIT_LOG_IMPLEMENTATION_STATUS_TO_BE_SPECIFIED]

### Backup & Disaster Recovery

- **Frequency:** Daily automated backups via Supabase
- **Retention:** [RETENTION_POLICY_TO_BE_SPECIFIED] days
- **Recovery Time Objective (RTO):** [RTO_TO_BE_SPECIFIED]
- **Recovery Point Objective (RPO):** 24 hours (daily backup window)

### Compliance Readiness

- **GDPR Alignment:** Data stored in compliant region with user consent mechanisms
- **Data Ownership:** Taxpayers own their data; no data resale or unauthorized use
- **Data Deletion:** Users can request data deletion; 30-day retention after deletion for recovery purposes
- **ISO 27001 Alignment:** Follows security best practices including least privilege, defense in depth, and regular security assessments
- **SOC-2 Readiness:** Infrastructure components selected for compliance; formal assessment [STATUS_TO_BE_SPECIFIED]

---

## 5. Data Management & Privacy

### Data Storage Location

- **Primary:** PostgreSQL hosted on Supabase (default region: [REGION_TO_BE_SPECIFIED])
- **Backups:** Supabase managed backups (region: [REGION_TO_BE_SPECIFIED])
- **File Storage:** Vercel Blob (region: [REGION_TO_BE_SPECIFIED])

### Data Ownership

- **Clear Ownership:** Each taxpayer owns their profile, property, and invoice data
- **No Data Resale:** Explicit policy preventing commercialization of user data
- **Portability:** Data export capabilities available on request

### Retention & Deletion Policy

- **Active Data:** Retained for the lifetime of the taxpayer account
- **Deleted Accounts:** 30-day grace period for recovery; permanent deletion thereafter
- **Archived Records:** Invoices and tax records retained for [RETENTION_PERIOD_TO_BE_SPECIFIED] years per regulatory requirements
- **Audit Logs:** Retained for [AUDIT_LOG_RETENTION_TO_BE_SPECIFIED] days for compliance

### Data Privacy Controls

- **Access Control:** Role-based access with RLS policies
- **Export:** Users can export their data in structured format
- **Transparency:** Privacy policy available at [PRIVACY_POLICY_URL_TO_BE_SPECIFIED]

---

## 6. Reliability, Availability & Support

### Uptime Target

- **Production SLA:** 99.5% uptime (4.38 hours downtime per month, excluding planned maintenance)
- **Monitoring:** [MONITORING_TOOL_TO_BE_SPECIFIED] for real-time health checks

### Monitoring & Alerting

- **Infrastructure:** Vercel built-in monitoring with automatic scaling
- **Application:** [ERROR_TRACKING_SERVICE_TO_BE_SPECIFIED] for error detection
- **Performance:** [APM_TOOL_TO_BE_SPECIFIED] for performance metrics
- **Database:** Supabase health dashboard with query performance insights

### Incident Response

- **Detection:** Automated alerts for errors, performance degradation, or uptime issues
- **Response Time:** [RESPONSE_TIME_SLA_TO_BE_SPECIFIED] minutes for critical incidents
- **Escalation:** [ESCALATION_PROCEDURE_TO_BE_SPECIFIED]
- **Communication:** [INCIDENT_COMMUNICATION_PLAN_TO_BE_SPECIFIED]

### Support Hours & Escalation

- **Support Level:** [SUPPORT_LEVEL_TO_BE_SPECIFIED]
- **Hours:** [SUPPORT_HOURS_TO_BE_SPECIFIED]
- **Response Time:** [RESPONSE_TIME_TO_BE_SPECIFIED]
- **Escalation Path:** [ESCALATION_PATH_TO_BE_SPECIFIED]

---

## 7. Scalability & Future Readiness

### Horizontal Scaling

- **Frontend:** Vercel automatic scaling handles traffic spikes without intervention
- **API Layer:** Stateless Next.js API routes scale independently
- **Database:** PostgreSQL connection pooling via Supabase; read replicas available for query scaling
- **File Storage:** Vercel Blob automatically scales with usage

### Performance Optimization

- **CDN:** Vercel Edge Network caches static assets globally
- **Image Optimization:** Next.js automatic image optimization reduces bundle size
- **API Caching:** [CACHING_STRATEGY_TO_BE_SPECIFIED]
- **Database Indexing:** Optimized indexes on frequently queried columns (user_id, created_at, etc.)

### Load Testing

- **Status:** [LOAD_TEST_STATUS_TO_BE_SPECIFIED]
- **Target:** Support [TARGET_CONCURRENT_USERS_TO_BE_SPECIFIED] concurrent users
- **Peak Load:** [PEAK_LOAD_CAPACITY_TO_BE_SPECIFIED] requests per second

---

## 8. Deployment & Change Management

### Deployment Pipeline

- **Source Control:** Git-based workflow with feature branches
- **Build:** Automated Next.js build process on every commit
- **Testing:** [CI_TESTING_STATUS_TO_BE_SPECIFIED]
- **Deployment:** Vercel automatic deployment on merge to `main` branch
- **Staging:** Deployments to staging environment for testing before production

### Rollback Capability

- **Strategy:** Git-based rollback via previous deployment reactivation
- **Rollback Time:** < 5 minutes for critical rollbacks
- **Automated Rollback:** [AUTOMATED_ROLLBACK_STATUS_TO_BE_SPECIFIED]

### Zero-Downtime Updates

- **Database Migrations:** Blue-green deployment strategy for schema changes
- **API Updates:** Stateless API allows immediate traffic switching
- **Planned Maintenance Window:** [MAINTENANCE_WINDOW_TO_BE_SPECIFIED]

### Change Approval Process

- **Development:** Feature branches reviewed via pull requests
- **Code Review:** Minimum [NUMBER_TO_BE_SPECIFIED] reviewers required
- **Staging Verification:** [STAGING_TESTING_REQUIREMENTS_TO_BE_SPECIFIED]
- **Production Release:** [RELEASE_APPROVAL_PROCESS_TO_BE_SPECIFIED]

---

## 9. Technical Roadmap (12-24 Months)

### Phase 1: Security & Compliance (Months 1-3)
- [ ] Implement comprehensive audit logging
- [ ] SOC-2 Type II certification assessment
- [ ] GDPR compliance verification audit
- [ ] Security vulnerability testing (OWASP Top 10)

### Phase 2: Performance & Scalability (Months 4-6)
- [ ] Load testing and capacity planning
- [ ] Database query optimization
- [ ] Implement caching layer (Redis via Upstash)
- [ ] CDN optimization review

### Phase 3: Feature Enhancements (Months 7-12)
- [ ] Multi-language support (Yoruba, Hausa)
- [ ] Offline mode for enumerators
- [ ] Advanced reporting and analytics
- [ ] Mobile application (iOS/Android)

### Phase 4: Integration & Automation (Months 13-18)
- [ ] PayKaduna integration enhancements
- [ ] Automated invoice generation and payment reminders
- [ ] SMS/Email notification system
- [ ] Bank account reconciliation automation

### Phase 5: Advanced Capabilities (Months 19-24)
- [ ] Machine learning for fraud detection
- [ ] Predictive analytics for revenue forecasting
- [ ] API marketplace for third-party integrations
- [ ] Blockchain-based document verification (evaluation phase)

---

## 10. Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Database downtime | Low | High | Daily automated backups, multi-region failover readiness, RTO < 1 hour |
| Increased load during rollout | Medium | Medium | Auto-scaling enabled, phased rollout strategy, load testing before launch |
| Data breach | Low | Critical | Role-based access control, encryption in transit/at rest, regular security audits |
| Third-party service outage (Firebase, Supabase) | Low | Medium | Fallback mechanisms, service health monitoring, incident communication plan |
| Regulatory changes | Medium | High | Compliance roadmap, legal review process, policy update procedures |
| Developer turnover | Medium | Low | Code documentation, architecture decisions recorded, knowledge transfer procedures |

---

## Appendix A: System Actors & User Roles

### 1. Admin
- Full system access
- User management (create, edit, deactivate users)
- Tax calculation and invoice management
- Reports and analytics
- System configuration

### 2. Super Admin
- All admin capabilities
- System settings and configuration
- Audit log access
- Compliance reporting

### 3. Enumerator
- Property enumeration
- Taxpayer search and property registration
- Offline data collection
- Performance leaderboard access

### 4. Taxpayer
- View personal invoices and payments
- Property information access
- Payment history
- Contact support

### 5. Tenant
- Read-only property information
- Payment history view

---

## Appendix B: API Endpoints Overview

### User Management
- `POST /api/admin/firebase-users` - Create Firebase user
- `GET /api/admin/users` - List users

### Properties
- `GET /api/properties` - List properties (with filtering)
- `POST /api/enumerator/create-property` - Create property
- `GET /api/enumerator/properties` - Enumerator's properties

### Taxpayers
- `GET /api/admin/taxpayers` - List taxpayers
- `POST /api/enumerator/create-taxpayer` - Create taxpayer
- `GET /api/enumerator/search-taxpayers` - Search taxpayers

### Invoices & Tax Calculations
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/{id}` - Get invoice details

---

## Appendix C: Environment Variables

### Firebase
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PRIVATE_KEY` (server-side)
- `FIREBASE_CLIENT_EMAIL` (server-side)

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side)
- `SUPABASE_JWT_SECRET` (server-side)

### N8N Webhooks
- `N8N_WEBHOOK_URL`
- `N8N_WEBHOOK_AUTH_TOKEN`

### File Storage
- `BLOB_READ_WRITE_TOKEN`

### OpenAI
- `OPENAI_API_KEY` (server-side)

---

**Last Updated:** [DATE_TO_BE_UPDATED]  
**Document Version:** 1.0  
**Author:** [AUTHOR_TO_BE_SPECIFIED]  
**Next Review Date:** [DATE_TO_BE_SPECIFIED]

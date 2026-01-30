# Database Schema Documentation

**Last Updated:** 2026-01-29  
**Database:** PostgreSQL via Supabase  
**Version:** Schema v14 (based on migration files)

---

## Core Tables

### 1. `users`
**Purpose:** Central user authentication and role management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | User unique identifier |
| `firebase_uid` | VARCHAR | UNIQUE | Firebase Auth UID |
| `email` | VARCHAR | UNIQUE, NOT NULL | User email address |
| `role` | ENUM | NOT NULL | `admin`, `super_admin`, `enumerator`, `taxpayer`, `tenant` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**RLS Policies:**
- Users can only view their own record
- Admins can view all users
- Enumerators cannot view other enumerators

---

### 2. `taxpayer_profiles`
**Purpose:** Extended taxpayer information and KADIRS integration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Profile unique identifier |
| `user_id` | UUID | FK → `users.id` | Link to user account |
| `kadirs_id` | VARCHAR | UNIQUE | KADIRS assessment ID |
| `business_name` | VARCHAR | | Registered business name |
| `tin` | VARCHAR | | Tax Identification Number |
| `phone_number` | VARCHAR | | Primary contact number |
| `phone_verified` | BOOLEAN | DEFAULT FALSE | Phone verification status |
| `email_verified` | BOOLEAN | DEFAULT FALSE | Email verification status |
| `profile_completed` | BOOLEAN | DEFAULT FALSE | Profile completion status |
| `industry_id` | INTEGER | FK → `paykaduna_industries` | Business industry classification |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Profile creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Notes:**
- `kadirs_id` is generated via PayKaduna API integration
- Profile must be 100% complete before KADIRS ID generation

---

### 3. `properties`
**Purpose:** Property registry with enumeration tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Property unique identifier |
| `taxpayer_id` | UUID | FK → `taxpayer_profiles.id` | Property owner |
| `property_address` | TEXT | NOT NULL | Full property address |
| `city_id` | INTEGER | FK → `cities.id` | City reference |
| `lga_id` | INTEGER | FK → `lgas.id` | LGA reference |
| `area_office_id` | INTEGER | FK → `area_offices.id` | Tax office jurisdiction |
| `property_type` | VARCHAR | | `residential`, `commercial`, `industrial` |
| `rental_value` | DECIMAL | | Annual rental value |
| `enumeration_status` | VARCHAR | DEFAULT `pending` | `pending`, `verified`, `rejected` |
| `enumerated_by_user_id` | UUID | FK → `users.id` | Enumerator reference |
| `facade_photo_url` | TEXT | | Property facade photo (Vercel Blob) |
| `address_photo_url` | TEXT | | Address sign photo (Vercel Blob) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Registration timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**RLS Policies:**
- Taxpayers can only view their own properties
- Enumerators can view properties they enumerated
- Admins have full access

---

### 4. `invoices` / `tax_calculations`
**Purpose:** Tax assessments and billing

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Invoice unique identifier |
| `taxpayer_id` | UUID | FK → `taxpayer_profiles.id` | Invoice recipient |
| `property_id` | UUID | FK → `properties.id` | Associated property |
| `invoice_number` | VARCHAR | UNIQUE | Invoice reference (e.g., `KAD-2025-0847`) |
| `tax_amount` | DECIMAL | NOT NULL | Calculated tax amount |
| `penalty_amount` | DECIMAL | DEFAULT 0 | Late payment penalty |
| `total_amount` | DECIMAL | NOT NULL | Total payable amount |
| `due_date` | DATE | | Payment deadline |
| `status` | VARCHAR | DEFAULT `unpaid` | `unpaid`, `paid`, `overdue`, `cancelled` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Invoice generation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

---

### 5. `payments`
**Purpose:** Payment records and reconciliation

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Payment unique identifier |
| `invoice_id` | UUID | FK → `invoices.id` | Associated invoice |
| `payment_method` | VARCHAR | | `bank_transfer`, `card`, `remita`, `ussd` |
| `payment_reference` | VARCHAR | UNIQUE | Transaction reference |
| `amount_paid` | DECIMAL | NOT NULL | Amount paid |
| `payment_date` | TIMESTAMP | | Transaction timestamp |
| `receipt_url` | TEXT | | Official receipt (PDF) |
| `status` | VARCHAR | DEFAULT `pending` | `pending`, `confirmed`, `failed` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

---

### 6. `documents`
**Purpose:** Property photos and supporting documents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Document unique identifier |
| `property_id` | UUID | FK → `properties.id` | Associated property |
| `document_type` | VARCHAR | | `facade`, `address`, `lease`, `ownership_proof` |
| `file_url` | TEXT | NOT NULL | Vercel Blob URL |
| `uploaded_by_user_id` | UUID | FK → `users.id` | Uploader reference |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Upload timestamp |

---

### 7. `locations` (Hierarchy)

#### `lgas` (Local Government Areas)
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `name` | VARCHAR | LGA name (e.g., `Kaduna North`) |
| `paykaduna_lga_id` | INTEGER | PayKaduna API reference |

#### `area_offices` (Tax Offices)
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `name` | VARCHAR | Office name |
| `lga_id` | INTEGER | FK → `lgas.id` |
| `paykaduna_tax_station_id` | INTEGER | PayKaduna API reference |

#### `cities`
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `name` | VARCHAR | City/District name |
| `lga_id` | INTEGER | FK → `lgas.id` |
| `area_office_id` | INTEGER | FK → `area_offices.id` |

---

### 8. `manager_authorizations`
**Purpose:** Property manager delegation system

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `property_id` | UUID | FK → `properties.id` |
| `authorized_manager_id` | UUID | FK → `users.id` |
| `authorized_by_user_id` | UUID | FK → `users.id` (property owner) |
| `permissions` | JSONB | Manager permissions |
| `status` | VARCHAR | `active`, `revoked` |
| `created_at` | TIMESTAMP | Authorization timestamp |

---

### 9. `ownership_history`
**Purpose:** Track property ownership transfers

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `property_id` | UUID | FK → `properties.id` |
| `previous_owner_id` | UUID | FK → `taxpayer_profiles.id` |
| `new_owner_id` | UUID | FK → `taxpayer_profiles.id` |
| `transfer_date` | DATE | Ownership transfer date |
| `reason` | TEXT | Transfer reason |

---

### 10. `system_settings`
**Purpose:** Global system configuration

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `key` | VARCHAR | Setting key (e.g., `tax_rate`, `penalty_percentage`) |
| `value` | JSONB | Setting value |
| `description` | TEXT | Human-readable description |
| `updated_at` | TIMESTAMP | Last configuration change |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

---

### 11. `audit_logs`
**Purpose:** Track system activities and changes for security and compliance

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `user_id` | UUID | FK → `users.id` (who performed the action) |
| `action` | VARCHAR | Type of action (e.g., `create`) |
| `entity_type` | VARCHAR | Table affected (e.g., `properties`) |
| `entity_id` | UUID | ID of the record affected |
| `old_values` | JSONB | Data state before the action |
| `new_values` | JSONB | Data state after the action |
| `change_summary` | TEXT | Human-readable summary of the change |
| `ip_address` | VARCHAR | Client IP address |
| `user_agent` | TEXT | Browser user agent string |
| `created_at` | TIMESTAMP | Action timestamp |

---

## PayKaduna Integration Tables

### `paykaduna_industries`
Industry classification for KADIRS ID generation

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `paykaduna_id` | INTEGER | PayKaduna API industry ID |
| `name` | VARCHAR | Industry name |

---

## Migration Tracking

### Applied Migrations (in order):
1. `001_initial_schema.sql` - Core tables
2. `002_add_firebase_uid.sql` - Firebase integration
3. `002_fix_rls_policies.sql` - Security policies
4. `003_create_ownership_history.sql` - Ownership tracking
5. `004_create_manager_authorizations.sql` - Manager delegation
6. `005_add_tenant_role_and_features.sql` - Tenant role
7. `006_add_profile_completion_fields.sql` - Profile verification
8. `007_add_kadirs_id_requirements.sql` - KADIRS integration
9. `008_add_industry_id_and_populate.sql` - Industry classification
10. `009_add_paykaduna_ids_to_lgas_and_offices.sql` - PayKaduna sync
11. `010_populate_area_offices.sql` - Area office data
12. `011_update_system_settings_state.sql` - System settings
13. `012_populate_paykaduna_tax_stations.sql` - Tax stations
14. `013_fix_lga_area_office_relationship.sql` - Fix FK relationships
15. `014_add_area_office_to_cities.sql` - City-office mapping

---

## Row-Level Security (RLS) Summary

### Policy Enforcement:
- **Taxpayers**: Can only access their own `taxpayer_profiles`, `properties`, `invoices`, and `payments`
- **Enumerators**: Can view properties they enumerated; cannot modify taxpayer data
- **Admins**: Full read/write access to all tables
- **Tenants**: Read-only access to properties where they are listed as tenants

### Key RLS Functions:
```sql
-- Example: Check if user is admin
CREATE FUNCTION is_admin(user_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = user_id AND role IN ('admin', 'super_admin'));
$$ LANGUAGE SQL STABLE;
```

---

## Indexes (Recommended)

For optimal query performance, the following indexes should be verified:

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- Property searches
CREATE INDEX idx_properties_taxpayer_id ON properties(taxpayer_id);
CREATE INDEX idx_properties_city_lga ON properties(city_id, lga_id);
CREATE INDEX idx_properties_enumeration_status ON properties(enumeration_status);

-- Invoice filtering
CREATE INDEX idx_invoices_taxpayer_id ON invoices(taxpayer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Payment reconciliation
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_reference ON payments(payment_reference);
```

---

## Data Retention Policy

- **Active Records**: Retained indefinitely while account is active
- **Deleted Accounts**: 30-day grace period before permanent deletion
- **Audit Logs**: 365 days (to be implemented)
- **Tax Records**: 7 years (regulatory compliance)

---

## Future Enhancements

1. **Audit Logging Table**: ✅ Implemented (v1)
2. **Notification Queue**: Centralized table for email/SMS notifications
3. **Payment Plan Management**: Installment payment support
4. **Property Valuation History**: Track property value changes over time
5. **Tax Exemption Records**: Special case handling for exempted properties

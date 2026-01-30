# Project Architecture & Code Organization

**Project:** Kad Tax on Rent  
**Last Updated:** 2026-01-29  
**Tech Stack:** Next.js 15.3.8, React 19, TypeScript, Supabase, Firebase

---

## Directory Structure

```
kad-tax-on-rent/
├── app/                          # Next.js App Router (routes & pages)
│   ├── actions/                  # Server Actions (business logic)
│   │   ├── auth.ts              # Authentication actions
│   │   ├── invoices.ts          # Invoice management
│   │   ├── taxpayers.ts         # Taxpayer CRUD
│   │   ├── verification.ts      # Phone/Email verification
│   │   └── ...
│   ├── api/                      # REST API routes
│   │   ├── admin/               # Admin-only endpoints
│   │   ├── enumerator/          # Enumerator endpoints
│   │   └── ...
│   ├── admin/                    # Admin dashboard pages
│   │   ├── invoices/
│   │   ├── properties/
│   │   ├── taxpayers/
│   │   ├── users/
│   │   └── page.tsx            # Admin dashboard home
│   ├── enumerator-dashboard/    # Enumerator dashboard
│   ├── taxpayer-dashboard/      # Taxpayer dashboard
│   ├── tenant-dashboard/        # Tenant-specific pages
│   ├── login/                   # Authentication pages
│   ├── signup/
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page (PUBLIC)
│
├── components/                   # Reusable React components
│   ├── admin/                   # Admin-specific components
│   │   ├── invoice-table.tsx
│   │   ├── property-table.tsx
│   │   └── ...
│   ├── enumerator/              # Enumerator components
│   │   ├── property-registration-form.tsx
│   │   └── ...
│   ├── taxpayer/                # Taxpayer components
│   ├── ui/                      # shadcn/ui components (buttons, dialogs, etc.)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ... (34 components)
│   ├── ai-assistant-sidebar.tsx
│   ├── command-search.tsx       # Universal search (Command Palette)
│   ├── data-table.tsx           # Generic data table
│   ├── register-property-modal.tsx
│   └── ...
│
├── lib/                          # Utilities & SDKs
│   ├── auth/                    # Auth helpers
│   ├── supabase/                # Supabase clients
│   │   ├── client.ts           # Client-side Supabase
│   │   ├── server.ts           # Server-side Supabase
│   │   └── admin.ts            # Admin Supabase
│   ├── reports/                 # Report generation utilities
│   ├── firebase.ts              # Firebase client config
│   ├── firebase-admin.ts        # Firebase Admin SDK
│   ├── firebase-errors.ts       # Error handling utilities
│   ├── settings-provider.tsx    # Global settings context
│   └── utils.ts                 # General utilities
│
├── contexts/                     # React Context providers
│   └── auth-context.ts          # Global auth state
│
├── hooks/                        # Custom React hooks
│   └── ...
│
├── scripts/                      # SQL migration files
│   ├── 001_initial_schema.sql
│   ├── 002_add_firebase_uid.sql
│   └── ... (27 migration files)
│
├── public/                       # Static assets
│   ├── images/
│   └── ...
│
├── styles/                       # Additional CSS
│   └── ...
│
├── utils/                        # Shared utilities
│   └── ...
│
├── .env.local                    # Environment variables (DO NOT COMMIT)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── DATABASE_SCHEMA.md            # Database documentation
├── TECHNICAL_DOCUMENTATION.md    # System overview
└── README.md
```

---

## Architectural Patterns

### 1. **Server Actions vs. API Routes**

**Server Actions (`app/actions/`)**: Preferred for mutations
- Direct database access
- Type-safe by default
- Better error handling
- Example: Creating invoices, updating taxpayer profiles

**API Routes (`app/api/`)**: Used for specific scenarios
- External webhook receivers
- Third-party integrations (PayKaduna, N8N)
- File uploads (Vercel Blob)

**Recommendation**: Migrate all internal business logic to Server Actions over time.

---

### 2. **Component Organization**

#### **Role-Based Components**
Components are organized by user role to prevent cross-contamination:
- `components/admin/` - Admin-only UI
- `components/enumerator/` - Enumerator tools
- `components/taxpayer/` - Taxpayer-facing components

#### **Shared UI Components**
All shadcn/ui components live in `components/ui/`:
- **DO NOT** create duplicate UI folders
- All imports should reference `@/components/ui/*`

#### **Large Component Refactoring**
Components exceeding 500 lines should be split:

**Before:**
```tsx
// components/register-property-modal.tsx (41KB)
```

**After (Recommended):**
```tsx
// components/property-registration/
├── index.tsx                    # Main modal
├── BasicInfoStep.tsx
├── TenantDetailsStep.tsx
├── PhotoUploadStep.tsx
└── ReviewStep.tsx
```

---

### 3. **Data Flow Architecture**

```
┌─────────────────────────────────────────────────────┐
│                  Client Component                   │
│  - Displays UI                                      │
│  - Handles user interactions                        │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Calls Server Action
                   ▼
┌─────────────────────────────────────────────────────┐
│             Server Action (app/actions/)            │
│  - Validates input (Zod schemas)                    │
│  - Checks authentication (Firebase)                 │
│  - Checks authorization (RLS)                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Queries Database
                   ▼
┌─────────────────────────────────────────────────────┐
│            Supabase Client (lib/supabase/)          │
│  - Executes SQL queries                             │
│  - Enforces Row-Level Security                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Returns Data
                   ▼
┌─────────────────────────────────────────────────────┐
│                PostgreSQL Database                  │
│  - Stores data with RLS policies                    │
│  - Returns filtered results                         │
└─────────────────────────────────────────────────────┘
```

---

### 4. **Authentication Flow**

**Primary:** Firebase Authentication  
**Session Storage:** HTTP-only cookies  
**Role Management:** PostgreSQL `users` table

```typescript
// Example: Protecting a Server Action
export async function createInvoice(data: InvoiceInput) {
  // 1. Get Firebase user
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Get user role from Supabase
  const { data: userRecord } = await supabase
    .from("users")
    .select("role")
    .eq("firebase_uid", user.uid)
    .single();

  // 3. Check authorization
  if (userRecord.role !== "admin") {
    throw new Error("Forbidden");
  }

  // 4. Perform action
  const result = await supabase
    .from("invoices")
    .insert(data);

  return result;
}
```

---

### 5. **Styling Strategy**

**Framework:** Tailwind CSS v4  
**Component Library:** shadcn/ui  
**Custom Design Tokens:** `app/globals.css`

#### **Animation Management**
- **DO NOT** use `<style jsx global>` in React components
- **DO** define animations in `globals.css` or Tailwind config
- **DO** use CSS custom properties for theme variables

**Example Refactor:**
```tsx
// ❌ BAD: Inline global styles in component
<style jsx global>{`
  @keyframes fadeInUp {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`}</style>

// ✅ GOOD: Move to globals.css
// app/globals.css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Key Technical Decisions

### ✅ What We're Doing Right

1. **Type Safety**: Full TypeScript coverage with strict mode
2. **Security-First**: RLS policies enforced at database level
3. **Modern Stack**: Next.js App Router, React Server Components
4. **Separation of Concerns**: Clear role-based component organization

### ⚠️ Areas for Improvement

1. **Component Size**: Break down large components (>500 lines)
2. **API Consistency**: Migrate remaining API routes to Server Actions
3. **Test Coverage**: Add unit tests for critical business logic
4. **Error Handling**: Standardize error responses across actions

---

## Code Style Guidelines

### Naming Conventions

```typescript
// ✅ Components: PascalCase
export function TaxpayerDashboard() {}

// ✅ Server Actions: camelCase
export async function createTaxpayer() {}

// ✅ Utility functions: camelCase
export function formatCurrency() {}

// ✅ Constants: SCREAMING_SNAKE_CASE
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ✅ Types/Interfaces: PascalCase
export interface Invoice {}
export type PaymentStatus = "paid" | "unpaid";
```

### File Organization

```typescript
// ✅ Imports order:
// 1. React/Next.js
import { useState } from "react";
import { redirect } from "next/navigation";

// 2. Third-party libraries
import { z } from "zod";

// 3. Internal components
import { Button } from "@/components/ui/button";

// 4. Internal utilities
import { formatCurrency } from "@/lib/utils";

// 5. Types
import type { Invoice } from "@/types";
```

---

## Performance Optimization

### 1. **Image Optimization**
- Use Next.js `<Image>` component for all images
- Set `priority` flag for above-the-fold images
- Use WebP format for photos

### 2. **Code Splitting**
- Use dynamic imports for heavy components:
```typescript
const HeavyModal = dynamic(() => import("@/components/HeavyModal"), {
  loading: () => <Skeleton />,
});
```

### 3. **Database Query Optimization**
- Always specify only required columns:
```typescript
// ❌ BAD
const { data } = await supabase.from("properties").select("*");

// ✅ GOOD
const { data } = await supabase
  .from("properties")
  .select("id, address, taxpayer_id");
```

---

## Testing Strategy (Future)

### Unit Tests
- Critical business logic in `app/actions/`
- Utility functions in `lib/`

### Integration Tests
- API endpoints
- Server Actions with database mocking

### E2E Tests
- Critical user flows (login, property registration, payment)

**Framework Recommendations:**
- **Unit/Integration:** Vitest
- **E2E:** Playwright

---

## Deployment Checklist

Before deploying to production:

- [ ] Run `npm run build` locally to check for build errors
- [ ] Verify all environment variables in Vercel dashboard
- [ ] Test authentication flow (Firebase)
- [ ] Verify database RLS policies are active
- [ ] Check file upload limits (Vercel Blob)
- [ ] Test payment integrations (PayKaduna)
- [ ] Review error tracking (set up Sentry if needed)

---

## Migration Guide for New Features

When adding a new feature:

1. **Database Changes:**
   - Create new migration file in `scripts/`
   - Update `DATABASE_SCHEMA.md`
   - Apply migration to Supabase

2. **Server Actions:**
   - Add action to appropriate file in `app/actions/`
   - Add Zod validation schema
   - Implement authorization checks

3. **UI Components:**
   - Create role-specific component in `components/<role>/`
   - Reuse `components/ui/*` for base components
   - Add to appropriate dashboard page

4. **Testing:**
   - Test with different user roles
   - Verify RLS policies work correctly
   - Check mobile responsiveness

---

## Common Pitfalls

### ❌ Duplicate UI Components
**Problem:** Multiple `ui/` folders causing import confusion  
**Solution:** Use only `components/ui/`

### ❌ Client-Side Database Queries
**Problem:** Exposing service role key in client  
**Solution:** Always use Server Actions for database operations

### ❌ Missing Authorization Checks
**Problem:** Users accessing data they shouldn't see  
**Solution:** Always verify user role before returning sensitive data

### ❌ Hardcoded Configuration
**Problem:** Environment-specific values in code  
**Solution:** Use `system_settings` table or environment variables

---

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)

---

**Maintained by:** Development Team  
**Questions?** Check `TECHNICAL_DOCUMENTATION.md` for system overview

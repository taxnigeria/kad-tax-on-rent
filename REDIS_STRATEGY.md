# 🚀 Redis Strategy for Kad Tax on Rent

This document outlines the performance optimization strategy using Redis for the Kad Tax on Rent application.

## 📝 What is Redis?
Redis is an **in-memory data store** that acts as a lightning-fast "middleman" between the application and the database (Supabase/PostgreSQL). It serves frequently accessed data from memory, providing nanosecond-level reads compared to millisecond-level database queries.

---

## 🏢 How Big Tech Companies Use Redis

| Company | Redis Use Case |
|---------|---------------|
| **Twitter/X** | Timeline caching, session management, rate limiting |
| **Instagram** | Caching user feeds, counting likes/followers in real-time |
| **Uber** | Geospatial data (driver locations), ride-matching queues |
| **GitHub** | Job queues (background workers), caching repository metadata |
| **Netflix** | Session management, API response caching, real-time analytics |

### The Common Pattern:
Big tech treats Redis as **three primary things**:
1. **Cache layer** – Store frequent reads, rare changes.
2. **Message broker** – Pub/Sub for real-time features.
3. **Rate limiter/counter** – Track API usage, login attempts.

---

## 🎯 Where YOUR App Needs Redis Most

Based on the architecture (Next.js + Supabase + Firebase), these are the highest-impact areas:

### **1. 🔥 Authentication & Session Caching (CRITICAL)**
Currently, every server action queries Supabase for the user's role after Firebase token verification. This is the primary bottleneck.
- **Goal:** Cache `role`, `firebase_uid`, and basic profile for **5-10 minutes**.
- **Impact:** Eliminates 1 DB query per authenticated request across the app.

### **2. 📊 Admin Dashboard Aggregates (HIGH IMPACT)**
The dashboard performs heavy aggregate queries (COUNT, SUM, GROUP BY) on every load.
- **Goal:** Cache KPIs (total properties, invoice totals, collection rates) with a **1-5 minute TTL**.
- **Big tech pattern:** Perfectly acceptable to have 60-second stale data for summaries.

### **3. 🔍 System Settings & Config (HIGH IMPACT)**
Settings (maintenance mode, AI features, branding) are read on almost every page but rarely change.
- **Goal:** Cache the `system_settings` object with a **10-30 minute TTL**.
- **Impact:** Eliminates a DB round trip on every page render.

### **4. ⚡ Security & Rate Limiting (SECURITY WIN)**
- **OTP Verification:** Max 5 attempts per phone number per 15 mins.
- **AI Assistant:** Limit requests per user to manage costs.
- **Login Brute Force:** Limit attempts per IP.

### **5. 📄 Expensive Query Results**
- **Property Searches:** Cache paginated results for 30-60 seconds.
- **Taxpayer Lookups:** Cache frequently visited profiles.
- **Report Data:** Cache monthly/weekly reports.

---

## 📏 Best Practices (The Golden Rules)

### **1. Cache-Aside Pattern**
- **Read:** Check Redis → If Hit, return → If Miss, query DB → Store in Redis → Return.
- **Write:** Update DB → **Delete** from Redis (let the next read repopulate).

### **2. TTL (Time-to-Live) Recommendations**

| Data Type | Recommended TTL |
|-----------|----------------|
| User session/role | 5-10 minutes |
| Dashboard KPIs | 1-5 minutes |
| System settings | 15-30 minutes |
| Search results | 60 seconds |
| Rate limiters | 15 min window |

### **3. Key Naming Convention**
Use structured namespaces:
- `kad:user:{uid}:role`
- `kad:dashboard:admin:kpis`
- `kad:settings:system`
- `kad:ratelimit:otp:{phone}`

### **4. Failure Strategy**
Redis should be a **performance optimization, not a dependency**. If Redis is down, the code should "fail open" and query the database directly.

---

## 🛠️ Recommended Implementation

For a Next.js/Vercel stack, **Upstash Redis** is the recommended provider:
- **Serverless-native:** No persistent connection issues in Lambda functions.
- **HTTP-based SDK:** Works in Edge Runtime and Server Actions.
- **Free tier:** 10K commands/day, perfect for development.

### Implementation Priority:
1. **User Role Caching** (Auth protection)
2. **System Settings Caching** (App-wide)
3. **Rate Limiting** (Security for OTP/AI)
4. **Dashboard KPI Caching** (Admin UX)

---

## 📈 Expected Performance Gains

| Area | Before Redis | After Redis | Improvement |
|------|-------------|-------------|-------------|
| Auth check | ~50-100ms | ~1-5ms | **~20x faster** |
| Dashboard load | ~500ms+ | ~50ms | **~10x faster** |
| Settings fetch | ~30ms | ~2ms | **~15x faster** |
| Security | Vulnerable | Protected | **Security Win** |

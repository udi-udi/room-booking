# TASKS.md — Room Booking System

## Project Decisions

| Decision             | Choice                                      |
|----------------------|---------------------------------------------|
| Frontend Framework   | Vue 3 + TypeScript                          |
| UI Library           | Vuetify 3 (Material Design, built-in RTL)   |
| Backend              | NestJS + TypeScript                         |
| Database / ORM       | PostgreSQL + Prisma                         |
| Authentication       | Google OAuth + Email/Password               |
| i18n / RTL           | Built-in from day one (Hebrew + English)    |
| Calendar Component   | Best fit (FullCalendar or custom)           |
| User Roles (MVP)     | All 3: user, super_user, admin              |
| Recurring Bookings   | Included in MVP                             |
| Admin Panel          | Full (company, locations, rooms, users)     |
| Project Structure    | Monorepo: `/client` + `/server`             |
| Deployment           | Local development first                     |

---

## Phase 1 — Project Scaffolding & Infrastructure

### 1.1 Restructure to Monorepo
- [x] Create `/client` directory — move existing Vue app into it
- [x] Create `/server` directory — initialize NestJS + TypeScript project
- [x] Create root `package.json` with workspace scripts for running both client and server
- [x] Update `.gitignore` for both client and server (node_modules, dist, .env, etc.)
- [x] Create `.env.example` files for both client and server

### 1.2 Client Setup (Vue 3 + TypeScript + Vuetify)
- [x] Convert project from JavaScript to TypeScript (`tsconfig.json`, rename files)
- [x] Remove default Vue scaffold (HelloWorld, icons, TheWelcome, etc.)
- [x] Install and configure Vuetify 3 with RTL support
- [x] Install and configure vue-i18n for Hebrew/English
- [x] Create translation files: `/client/src/locales/he.json` and `/client/src/locales/en.json`
- [x] Install and configure Vue Router
- [x] Install and configure Pinia for state management
- [x] Install Axios for HTTP client
- [x] Install date-fns with locale support (he, en-US)
- [x] Set up Vite proxy for API requests to backend
- [x] Create base app layout with Vuetify (app bar, navigation drawer, main content)

### 1.3 Server Setup (NestJS + Prisma)
- [x] Scaffold NestJS project with `@nestjs/cli`
- [x] Configure `@nestjs/config` for environment variables
- [x] Set up global pipes (ValidationPipe), filters (HttpExceptionFilter), and CORS
- [x] Install and configure Prisma ORM — create `PrismaModule` + `PrismaService`
- [x] Create Prisma schema with all tables (Users, Companies, Locations, Rooms, UserLocations, Bookings)
- [x] Run initial migration (`prisma migrate dev`)
- [x] Create seed script with sample data (company, locations, rooms, test users)
- [x] Configure Swagger/OpenAPI documentation (`@nestjs/swagger`)

---

## Phase 2 — Authentication System

### 2.1 Backend Auth (NestJS Auth Module)
- [x] Install auth dependencies (`@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`, `passport-google-oauth20`, `bcrypt`)
- [x] Create `AuthModule` with `AuthController` and `AuthService`
- [x] Create DTOs: `RegisterDto`, `LoginDto` with class-validator decorators
- [x] Create `JwtStrategy` (passport-jwt) for token verification
- [x] Create `JwtAuthGuard` for protecting routes
- [x] Create auth controller endpoints:
  - `POST /api/auth/register` — email/password registration
  - `POST /api/auth/login` — email/password login
  - `POST /api/auth/logout` — logout (clear tokens)
  - `GET /api/auth/me` — get current user profile
  - `GET /api/auth/google` — initiate Google OAuth flow
  - `GET /api/auth/google/callback` — Google OAuth callback
- [x] Implement JWT token generation (access + refresh tokens)
- [x] Implement password hashing with bcrypt
- [x] Create `GoogleStrategy` for OAuth flow
- [x] Create `RolesGuard` + `@Roles()` decorator for role-based authorization
- [x] Add rate limiting with `@nestjs/throttler`

### 2.2 Frontend Auth
- [x] Create auth store (Pinia) — user state, tokens, login/logout actions
- [x] Create Login page with email/password form + Google sign-in button
- [x] Create Registration page with email/password + name fields
- [x] Implement Axios interceptor for JWT (attach token, handle 401 refresh)
- [x] Create route guards (authenticated, role-based)
- [x] Add auth-related translations (he/en) for all form labels, errors, buttons
- [x] Persist auth state (localStorage/cookies) for page refresh

### 2.3 Database Auto-Migration & Cleanup
- [x] Auto-detect missing tables on server startup (`PrismaService.onModuleInit`) and run `prisma migrate deploy` if needed
- [x] Remove all hardcoded demo/example users from seed.ts
- [x] Remove demo credentials from Swagger API examples in DTOs

---

## Phase 3 — Core Data & Navigation

### 3.1 Backend — Locations & Rooms API (NestJS Modules)
- [x] Create `LocationsModule` with controller, service, and DTOs:
  - `GET /api/locations` — user's accessible locations
  - `POST /api/locations` — create (super_user+)
  - `PUT /api/locations/:id` — update (super_user+)
  - `DELETE /api/locations/:id` — delete (super_user+)
- [x] Create `RoomsModule` with controller, service, and DTOs:
  - `GET /api/locations/:locationId/rooms` — rooms in a location
  - `POST /api/locations/:locationId/rooms` — create (super_user+)
  - `PUT /api/rooms/:id` — update (super_user+)
  - `DELETE /api/rooms/:id` — delete (super_user+)
- [x] Use class-validator DTOs for input validation
- [x] Ensure location access is filtered by user's assigned locations (via guard or service logic)

### 3.2 Frontend — Navigation & Location Selection
- [x] Create main app layout:
  - App bar with: logo, location selector dropdown, language toggle (HE/EN), user menu
  - Navigation drawer (for admin links if super_user/admin)
  - Main content area
- [x] Create locations store (Pinia) — fetch and cache user's locations
- [x] Create location selector component (dropdown in app bar)
- [x] Create language toggle component — switches locale + direction (LTR/RTL)
- [x] Implement persistent language preference (localStorage)
- [x] Set up Vue Router with routes:
  - `/login` — Login page
  - `/register` — Registration page
  - `/` — Redirect to `/calendar`
  - `/calendar` — Weekly calendar (main view)
  - `/admin/company` — Company settings
  - `/admin/locations` — Location management
  - `/admin/users` — User management
- [x] Add navigation translations (he/en)

---

## Phase 4 — Weekly Calendar & Booking System

### 4.1 Backend — Bookings API (NestJS Bookings Module)
- [x] Create `BookingsModule` with controller, service, and DTOs:
  - `GET /api/bookings` — current user's bookings (with date range filter)
  - `GET /api/rooms/:roomId/bookings?start=&end=` — room bookings for date range
  - `GET /api/locations/:locationId/bookings?start=&end=` — all bookings in location for a week
  - `POST /api/bookings` — create booking (single or recurring)
  - `DELETE /api/bookings/:id` — cancel booking (own or super_user for any)
- [x] Implement conflict detection service:
  - Check for overlapping bookings on same room
  - Return specific error with conflicting booking details
- [x] Implement recurring booking logic:
  - Create parent booking + individual instances
  - Support daily, weekly, monthly patterns
  - Validate recurrence end date
  - Detect conflicts across all instances
- [x] Add booking validation rules:
  - Start time must be in the future
  - End time after start time
  - Duration: 15 min minimum, 4 hours maximum
  - User must have access to the location
- [x] Add endpoint to delete recurring bookings from a specific date forward

### 4.2 Frontend — Weekly Calendar View
- [x] Create weekly calendar component showing:
  - Y-axis: time slots (08:00–22:00 in 15-min intervals)
  - X-axis: rooms as columns, grouped by day
  - Week navigation (previous/next week, today button)
  - Current week dates in header
- [x] Create time slot component with visual states:
  - Available (clickable)
  - User's own booking (highlighted, clickable for cancel)
  - Other user's booking (dimmed, view-only with tooltip showing booker name)
  - Past slots (disabled/grayed out)
- [x] Create booking modal/dialog:
  - Pre-filled start time from clicked slot
  - End time selector (15-min interval dropdown)
  - Room name display
  - Recurring booking toggle:
    - Frequency selector (daily, weekly, monthly)
    - End date picker
  - Validation error display
  - Confirm / Cancel buttons
- [x] Create bookings store (Pinia):
  - Fetch bookings for current location + week
  - Create booking action (with optimistic UI update)
  - Cancel booking action
  - Handle conflict errors
- [x] Create booking cancellation confirmation dialog
- [x] Add all calendar/booking translations (he/en)
- [x] Ensure calendar layout mirrors correctly in RTL mode

---

## Phase 5 — Admin Panel

### 5.1 Backend — User Management API (NestJS Modules)
- [x] Create `UsersModule` with controller, service, and DTOs:
  - `GET /api/users` — list all users in company (super_user+)
  - `POST /api/users/invite` — create/invite user (super_user+)
  - `PUT /api/users/:id` — update user details/role (super_user+)
  - `DELETE /api/users/:id` — remove user (super_user+)
  - `PUT /api/users/:id/locations` — assign locations to user (super_user+)
- [x] Create `CompanyModule` with controller and service:
  - `GET /api/company` — get company details (admin sees all companies)
  - `PUT /api/company` — update company name/settings (super_user+)
  - `POST /api/company` — create company (admin only)
  - `DELETE /api/company/:id` — delete company (admin only)
- [x] Create `AdminModule` with controller and service (admin role):
  - `GET /api/admin/companies` — list all companies
  - `POST /api/admin/companies` — create company
  - `DELETE /api/admin/companies/:id` — delete company + all data
  - `GET /api/admin/companies/:id/users` — users in any company
  - `DELETE /api/admin/bookings/:id` — delete any booking
- [x] Add validation: cannot delete own account, cannot remove last super_user
- [x] Add validation: admin-only access to admin endpoints

### 5.2 Frontend — Admin Pages

#### Company Settings Page
- [x] Company name edit form
- [x] Company logo upload (stored as base64 in DB)
- [x] Display company info

#### Location Management Page
- [x] List all locations with room count
- [x] Add new location form
- [x] Edit location name (inline or modal)
- [x] Delete location (with confirmation — warns about cascading room/booking deletion)
- [x] For each location: manage rooms
  - List rooms
  - Add room
  - Edit room name
  - Delete room (with confirmation)

#### User Management Page
- [x] List all users in company (table with: name, email, role, assigned locations)
- [x] Invite new user form (email, name, role, location assignments)
- [x] Edit user dialog (change role, update location assignments)
- [x] Delete user (with confirmation, prevent self-delete and last super_user)
- [x] Location assignment: multi-select checkbox for each user

#### Admin Dashboard (admin role only)
- [x] List all companies
- [x] Create new company
- [x] Delete company (with cascading deletion warning)
- [x] View users per company
- [x] Delete any booking across all companies

### 5.3 Admin Translations
- [x] Add all admin panel strings to he.json and en.json

---

## Phase 6 — Polish & Integration

### 6.1 Error Handling & UX
- [x] Global error handler (Axios interceptor → toast notifications)
- [x] Loading states for all async operations (skeletons, spinners)
- [x] Empty states (no locations, no bookings, no users)
- [x] Form validation with inline error messages (client-side + server error display)
- [x] Responsive design — ensure usable on tablets (mobile is bonus)
- [x] Success notifications (booking created, user invited, etc.)

### 6.2 Backend Hardening
- [x] Global `HttpExceptionFilter` for centralized error handling
- [x] Request logging (NestJS Logger or pino-http)
- [x] Input sanitization (class-transformer)
- [x] CORS configuration (allow client origin)
- [x] API response interceptor for consistent envelope format (`{ success, data, error }`)

### 6.3 Final Integration Testing
- [ ] Test full flow: register → login → select location → view calendar → book → cancel
- [ ] Test recurring booking creation and cancellation
- [ ] Test super_user: manage locations, rooms, users
- [ ] Test admin: manage companies, delete bookings
- [ ] Test language switching (Hebrew RTL ↔ English LTR) across all pages
- [ ] Test Google OAuth flow end-to-end
- [ ] Test conflict detection (overlapping bookings)
- [ ] Test role-based access (regular user cannot access admin pages/APIs)

---

## Phase 7 — Future Enhancements (Post-MVP)

- [ ] Email notifications (booking confirmation, cancellation, invitation)
- [ ] Room capacity and amenities metadata
- [ ] Search/filter bookings
- [ ] Export bookings (CSV, iCal)
- [ ] Mobile-responsive or PWA
- [ ] Dark mode (Vuetify theme toggle)
- [ ] Audit log for admin actions
- [ ] Docker setup for deployment
- [ ] CI/CD pipeline
- [ ] Unit & integration tests (Vitest + Supertest)
- [ ] API documentation (Swagger/OpenAPI)

---

## Notes

- All times stored in UTC in the database, displayed in user's local timezone
- Calendar week starts on Sunday (configurable per locale)
- Prisma handles migrations — run `npx prisma migrate dev` after schema changes
- Seed data should include at least 1 company, 2 locations, 3-4 rooms, and test users for each role
- Keep CLAUDE.md updated as decisions evolve (especially: Vue 3 replaces React)
# Room Booking System – Project Documentation

## Project Overview
A web-based room booking system with bilingual support (Hebrew/English) for managing meeting room reservations across multiple locations.

## Core Features
- **Authentication**: User login system
- **Multi-location support**: Users can access multiple locations based on permissions
- **Weekly calendar view**: Visual scheduler showing room availability
- **Time slots**: 15-minute intervals from 8:00 AM to 10:00 PM
- **Booking management**: Create, view, and cancel reservations
- **Recurring bookings**: Support for one-time and recurring reservations
- **Conflict prevention**: Automatic overlap detection and blocking
- **Role-based access**: Regular users and superusers with different permissions

## User Roles

### Regular User
- View locations assigned to them
- Book available time slots
- Cancel their own bookings
- Set recurring or one-time reservations
- Cannot interact with other users' bookings

### Super User
- All regular user permissions that are assigned in their account
- Manage company settings (name, locations, rooms, logo image)
- Invite/edit/remove users from the account
- Assign users to locations
- Remove any user's reservation from the scheduler
- Full administrative control
- Can assign Super User role to other users

### Admin
- Has visibility of all companies and their users
- Can create new companies and assign users to them
- Can delete any company and its users
- Can delete any booking made by any user in any company
- Can delete any location and its rooms in any company

## Technology Stack

### Frontend
- **Framework**: Vue 3 with TypeScript
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **UI Components**: Vuetify 3 (Material Design with built-in RTL support)
- **Calendar Component**: FullCalendar (Vue 3 plugin) or custom implementation
- **Internationalization**: vue-i18n for Hebrew/English switching
- **Date/Time**: date-fns with locale support (he, en-US)
- **HTTP Client**: Axios

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Google OAuth + Email/Password (JWT via @nestjs/jwt + @nestjs/passport)
- **Validation**: class-validator + class-transformer
- **API Documentation**: Swagger/OpenAPI (@nestjs/swagger)

### DevOps
- **Environment**: @nestjs/config for configuration
- **Build**: Vite for frontend, nest build for backend
- **Code Quality**: ESLint, Prettier

## Project Structure

```
/
├── client/                          # Frontend application (Vue 3 + TypeScript)
│   ├── src/
│   │   ├── components/             # Vue components
│   │   │   ├── auth/
│   │   │   │   └── LoginForm.vue
│   │   │   ├── calendar/
│   │   │   │   ├── WeeklyCalendar.vue
│   │   │   │   ├── TimeSlot.vue
│   │   │   │   └── BookingModal.vue
│   │   │   ├── admin/
│   │   │   │   ├── CompanySettings.vue
│   │   │   │   ├── LocationManagement.vue
│   │   │   │   ├── RoomManagement.vue
│   │   │   │   └── UserManagement.vue
│   │   │   └── layout/
│   │   │       ├── AppLayout.vue
│   │   │       └── LanguageSelector.vue
│   │   ├── composables/            # Vue composables
│   │   │   ├── useAuth.ts
│   │   │   ├── useBookings.ts
│   │   │   ├── useLocations.ts
│   │   │   └── useLanguage.ts
│   │   ├── stores/                 # Pinia stores
│   │   │   ├── auth.ts
│   │   │   ├── bookings.ts
│   │   │   └── locations.ts
│   │   ├── services/               # API services
│   │   │   ├── api.ts             # Axios instance
│   │   │   ├── authService.ts
│   │   │   ├── bookingService.ts
│   │   │   ├── locationService.ts
│   │   │   └── userService.ts
│   │   ├── types/                  # TypeScript types
│   │   │   ├── auth.types.ts
│   │   │   ├── booking.types.ts
│   │   │   ├── location.types.ts
│   │   │   └── user.types.ts
│   │   ├── utils/                  # Utility functions
│   │   │   ├── dateHelpers.ts
│   │   │   ├── validators.ts
│   │   │   └── timeSlotHelpers.ts
│   │   ├── locales/                # Translation files
│   │   │   ├── he.json
│   │   │   └── en.json
│   │   ├── router/
│   │   │   └── index.ts           # Vue Router configuration
│   │   ├── plugins/
│   │   │   ├── vuetify.ts         # Vuetify configuration
│   │   │   └── i18n.ts            # vue-i18n configuration
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                          # Backend application (NestJS)
│   ├── src/
│   │   ├── auth/                   # Auth module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── google.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── bookings/               # Bookings module
│   │   │   ├── bookings.module.ts
│   │   │   ├── bookings.controller.ts
│   │   │   ├── bookings.service.ts
│   │   │   └── dto/
│   │   │       └── create-booking.dto.ts
│   │   ├── locations/              # Locations module
│   │   │   ├── locations.module.ts
│   │   │   ├── locations.controller.ts
│   │   │   ├── locations.service.ts
│   │   │   └── dto/
│   │   │       └── create-location.dto.ts
│   │   ├── rooms/                  # Rooms module
│   │   │   ├── rooms.module.ts
│   │   │   ├── rooms.controller.ts
│   │   │   ├── rooms.service.ts
│   │   │   └── dto/
│   │   │       └── create-room.dto.ts
│   │   ├── users/                  # Users module
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │       └── create-user.dto.ts
│   │   ├── company/                # Company module
│   │   │   ├── company.module.ts
│   │   │   ├── company.controller.ts
│   │   │   └── company.service.ts
│   │   ├── prisma/                 # Prisma service module
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── common/                 # Shared decorators, pipes, filters
│   │   │   ├── decorators/
│   │   │   │   └── roles.decorator.ts
│   │   │   └── filters/
│   │   │       └── http-exception.filter.ts
│   │   ├── app.module.ts           # Root module
│   │   └── main.ts                 # Entry point
│   ├── prisma/                     # Prisma ORM
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── .env.example                    # Environment variables template
├── .gitignore
├── README.md
└── CLAUDE.md                       # This file
```

## Database Schema

### Users Table
- id (UUID, primary key)
- email (unique, not null)
- password_hash (not null)
- first_name (not null)
- last_name (not null)
- role (enum: 'user', 'super_user', 'admin')
- company_id (foreign key)
- created_at (timestamp)
- updated_at (timestamp)

### Companies Table
- id (UUID, primary key)
- name (not null)
- created_at (timestamp)
- updated_at (timestamp)

### Locations Table
- id (UUID, primary key)
- name (not null)
- company_id (foreign key)
- created_at (timestamp)
- updated_at (timestamp)

### Rooms Table
- id (UUID, primary key)
- name (not null)
- location_id (foreign key)
- created_at (timestamp)
- updated_at (timestamp)

### UserLocations Table (Many-to-Many)
- user_id (foreign key)
- location_id (foreign key)
- primary key (user_id, location_id)

### Bookings Table
- id (UUID, primary key)
- room_id (foreign key)
- user_id (foreign key)
- start_time (timestamp with timezone, not null)
- end_time (timestamp with timezone, not null)
- is_recurring (boolean, default false)
- recurrence_pattern (enum: 'daily', 'weekly', 'monthly', nullable)
- recurrence_end_date (timestamp with timezone, nullable)
- parent_booking_id (foreign key, self-reference for recurring bookings)
- created_at (timestamp)
- updated_at (timestamp)

### Indexes
- bookings: (room_id, start_time, end_time) for conflict detection
- bookings: (user_id) for user's bookings
- users: (email) unique index
- user_locations: (user_id, location_id) composite index

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback

### Locations
- `GET /api/locations` - Get user's accessible locations
- `POST /api/locations` - Create location (super user)
- `PUT /api/locations/:id` - Update location (super user)
- `DELETE /api/locations/:id` - Delete location (super user)

### Rooms
- `GET /api/locations/:locationId/rooms` - Get rooms for location
- `POST /api/locations/:locationId/rooms` - Create room (super user)
- `PUT /api/rooms/:id` - Update room (super user)
- `DELETE /api/rooms/:id` - Delete room (super user)

### Bookings
- `GET /api/bookings` - Get user's bookings
- `GET /api/rooms/:roomId/bookings` - Get bookings for a room (with date range)
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/:id` - Delete booking (own or super user)

### Users (Super User Only)
- `GET /api/users` - List all users
- `POST /api/users/invite` - Invite new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Remove user
- `PUT /api/users/:id/locations` - Assign locations to user

### Company (Super User Only)
- `GET /api/company` - Get company details
- `PUT /api/company` - Update company details

## Key Business Logic

### Booking Conflict Detection
```typescript
// Pseudo-code for overlap detection
function hasConflict(roomId, startTime, endTime, excludeBookingId?) {
  // Check if any booking exists where:
  // - Same room
  // - (new_start < existing_end AND new_end > existing_start)
  // - Not the same booking (for updates)
}
```

### Recurring Booking Handling
- When creating recurring: Create parent booking + individual instances
- When deleting recurring: Delete from selected date forward
- Option 1: Store each instance separately
- Option 2: Store pattern + generate instances on query

### Time Slot Generation
- Generate slots in 15-minute intervals
- Range: 08:00 - 22:00 (56 slots per day)
- Timezone handling: Store all times in UTC, display in local

## UI/UX Requirements

### RTL Support
- Full RTL layout for Hebrew
- Mirror calendar layout and navigation
- Proper text alignment and direction

### Calendar View
- Week view (Monday-Sunday or Sunday-Saturday based on locale)
- Time on Y-axis (08:00-22:00)
- Rooms as columns within each day
- Visual distinction between:
    - Available slots
    - User's own bookings (editable)
    - Other users' bookings (view-only)
    - Past time slots (disabled)

### Booking Modal
- Start time (pre-filled from click)
- End time (dropdown with 15-min intervals)
- Recurring checkbox
- If recurring: frequency selector + end date
- Validation messages in current language

### Language Switching
- Toggle button in header
- Persist preference in localStorage
- All text, dates, and times formatted per locale

## Validation Rules

### Booking Validation
- Start time must be in the future
- End time must be after start time
- Minimum booking duration: 15 minutes
- No overlaps with existing bookings
- User must have access to the location
- Recurring end date must be after start date

### User Management (Super User)
- Email must be valid and unique
- Password minimum 8 characters
- Cannot delete own account
- Cannot remove last super user

## Security Considerations
- JWT tokens with expiration
- HTTP-only cookies for refresh tokens
- CORS configuration
- SQL injection prevention (use ORM/parameterized queries)
- XSS prevention (sanitize inputs)
- Rate limiting on login endpoint
- Password strength requirements

## Database Startup Check
- On server startup, `PrismaService.onModuleInit()` checks if DB tables exist by querying the `companies` table
- If tables are missing, it automatically runs `prisma migrate deploy` to create them
- This means the server is self-healing: a fresh database will have its schema created on first boot
- **Never hardcode demo users, example credentials, or seed data in the codebase** — users must register through the API
- The seed script (`prisma/seed.ts`) is intentionally empty; all user creation happens via `/api/auth/register`

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- **Frontend**: Use Vue 3 Composition API with `<script setup lang="ts">`
- **Frontend**: Use Pinia stores for shared state
- **Frontend**: Use Vue composables for reusable logic
- **Backend**: Follow NestJS module pattern (module + controller + service per domain)
- **Backend**: Use DTOs with class-validator for request validation
- **Backend**: Use Guards for authentication and authorization
- Implement proper error handling
- Write meaningful comments
- Use async/await for asynchronous operations

### Testing (Future)
- Unit tests for utilities and services
- Integration tests for API endpoints
- E2E tests for critical user flows

### Deployment (Future)
- Frontend: Vercel/Netlify
- Backend: Railway/Render/AWS
- Database: PostgreSQL on managed service
- Environment-based configuration

## Getting Started

1. **Install Dependencies**
   ```bash
   # Install backend dependencies
   cd server && npm install
   
   # Install frontend dependencies
   cd ../client && npm install
   ```

2. **Setup Database**
   ```bash
   # Create .env file with DATABASE_URL
   # Run migrations
   cd server && npx prisma migrate dev
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/roombooking
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=7d
PORT=3003
NODE_ENV=development
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3003/api/auth/google/callback
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3003/api
VITE_DEFAULT_LANGUAGE=he
```

## Next Steps

1. Initialize the project structure
2. Set up database with Prisma
3. Create authentication system
4. Build calendar component
5. Implement booking logic
6. Add admin panel
7. Add internationalization
8. Styling and responsive design
9. Testing
10. Deployment

## Notes

- All times should be stored in UTC in the database
- Display times in user's local timezone
- Consider implementing email notifications (future feature)
- Consider adding room capacity/amenities (future feature)
- Consider mobile app version (future feature)
- when a task is completed, mark as done the corresponding task in the tasks file
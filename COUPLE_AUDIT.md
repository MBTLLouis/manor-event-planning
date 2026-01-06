# Couple Portal Audit - Issues Identified

## Core Issues Found

### 1. **Authentication Context Problem**
- **Issue**: Couple user object created in context.ts uses synthetic user with `role: 'couple'`
- **Problem**: The `ctx.user.username` may not be properly populated for couple sessions
- **Impact**: `events.list` query fails because it tries to look up event by username which might be null
- **Location**: `server/_core/context.ts` lines 40-52

### 2. **Events Query Not Working for Couples**
- **Issue**: `events.list` protectedProcedure uses `ctx.user.username` but couple context might not set it correctly
- **Problem**: Couple dashboard can't load their event
- **Impact**: Dashboard shows "Loading..." indefinitely or shows no event
- **Location**: `server/routers.ts` lines 125-133

### 3. **Couple User ID vs Event ID Confusion**
- **Issue**: Synthetic couple user has `id: eventId` but this might cause confusion in other queries
- **Problem**: Queries that expect user.id to be a user ID will get event ID instead
- **Impact**: Potential data access issues in protected procedures
- **Location**: `server/_core/context.ts` line 41

### 4. **Missing Couple-Specific Queries**
- **Issue**: Most procedures use `protectedProcedure` which requires authentication
- **Problem**: Couple needs to access their event data but procedures might not be designed for couple context
- **Impact**: Guests, accommodations, seating, menu queries might fail
- **Location**: Multiple routers in `server/routers.ts`

### 5. **Couple Dashboard Relies on events.list**
- **Issue**: CoupleDashboard assumes `events[0]` is their event
- **Problem**: If events.list returns empty or wrong data, entire dashboard breaks
- **Impact**: No dashboard content, no access to features
- **Location**: `client/src/pages/couple/CoupleDashboard.tsx` lines 18-19

## Rebuild Strategy

### Phase 1: Fix Authentication & Event Retrieval
1. Ensure couple context properly sets username from event data
2. Create a dedicated `events.getCouple` procedure that returns the couple's event
3. Update CoupleDashboard to use the new procedure

### Phase 2: Fix Feature Access
1. Verify guests.list works for couples
2. Verify accommodations queries work for couples
3. Verify seating, menu, timeline queries work for couples
4. Add couple-specific permissions checks

### Phase 3: Rebuild Dashboard Features
1. Guest List - view and manage guests
2. Accommodations - view and allocate rooms
3. Seating - view seating arrangements
4. Timeline - view event timeline
5. Menu - view menu options
6. Notes - view and edit notes

### Phase 4: Testing
1. Test couple login with valid credentials
2. Test each feature sequentially
3. Verify data loads and displays correctly
4. Test mutations (if any)

## Test Credentials
- Need to find valid couple username/password from database
- Will need to create test data if none exists

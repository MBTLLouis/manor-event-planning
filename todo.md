# Manor By The Lake Event Planning - TODO

## Database Schema & Models
- [x] Create events table with couple names, date, event code, status
- [x] Create guests table with RSVP status, meal selection, dietary restrictions
- [x] Create floor plans table for multiple floor plan support
- [x] Create tables and seats tables for floor plan designer
- [x] Create timeline days and timeline events tables
- [x] Create food options table for menu configuration
- [x] Create messages table with read/urgent status
- [x] Update users table to support employee/couple roles with credentials

## Authentication System
- [x] Create role selection page (Employee/Couple login options)
- [x] Build employee login form with username/password
- [x] Build couple login form with username/password
- [x] Implement authentication procedures in tRPC
- [x] Add role-based access control

## Employee Dashboard
- [x] Create dashboard layout with sidebar navigation
- [x] Build summary cards (Total Events, Upcoming Events, Unread Messages, Pending Tasks)
- [x] Implement recent activity feed
- [x] Add upcoming events list

## Events Management
- [x] Create events list page with search functionality
- [x] Add tabs for Upcoming and Past events
- [x] Build event cards grid layout showing couple names, dates, event codes, status
- [x] Implement "New Event" functionality
- [x] Create event detail dashboard with 11 planning module cards
- [x] Add event summary statistics (Guests, Budget, Vendors, Tasks)

## Guest List Module
- [x] Build guest list table with all columns (name, email, group, RSVP, meal, invitation)
- [x] Add guest functionality with form
- [x] Implement invite guest feature
- [x] Create search bar for guests
- [x] Add tabs for Initial Invitations and Confirmed Guests
- [x] Build summary cards (Total, Confirmed, Pending, Declined)
- [x] Implement edit/delete guest actions

## Floor Plans Module
- [x] Create floor plan designer with grid canvas
- [x] Implement drag-and-drop for tables and seats
- [x] Add support for multiple floor plans with tabs
- [x] Build "Add Table" functionality with round and rectangular shapes
- [x] Build "Add Seat" functionality for standalone seats
- [x] Implement visual seat assignment (green for assigned, gray for empty)
- [x] Create table overview section with seat details and fill status
- [x] Enforce fixed table sizes (no resizing)

## Timeline Module
- [x] Create timeline view with multiple day tabs
- [x] Implement "Add Day" functionality
- [x] Build "Add Event" functionality with time, title, description, assignment, notes
- [x] Add drag-and-drop reordering for timeline events
- [x] Display events in chronological order

## Food Choices Module
- [x] Create menu configuration section (Starters, Main Courses, Desserts)
- [x] Implement "Add Option" functionality for each category
- [x] Build meal selection statistics with summary cards
- [x] Add dietary restrictions tracking section
- [x] Display guest meal choices overview

## Messages Center
- [x] Create messages list page with search functionality
- [x] Add tabs for All, Unread, and Urgent messages
- [x] Build message cards showing event name, sender, preview, date, timestamp
- [x] Implement message read/unread status
- [x] Add urgent message flagging

## Styling & Theming
- [x] Set up beige/cream base color scheme
- [x] Configure dark green/teal for employee theme
- [x] Configure gold/yellow for couple theme
- [x] Add status colors (green, yellow, red)
- [x] Import and configure fonts (Playfair Display, Cormorant Garamond, Inter)
- [x] Apply consistent styling across all components

## Additional Modules (Placeholders)
- [x] Budget module placeholder
- [x] Vendors module placeholder
- [x] Checklist module placeholder
- [x] Wedding Website module placeholder
- [x] Notes module placeholder
- [x] Accommodations module placeholder

## Testing & Deployment
- [x] Test authentication flow for both roles
- [x] Test all CRUD operations across modules
- [x] Test drag-and-drop functionality
- [x] Verify responsive design
- [x] Create initial checkpoint

## Bugs to Fix
- [x] Fix employee login authentication - users cannot log in with employee credentials
- [x] Fix login redirect loop - page goes blank and redirects back to login after successful authentication
- [ ] Fix dashboard not displaying after successful login - user is logged in but dashboard doesn't render

## New Module Implementation
- [x] Build Budget module with expense tracking and budget management
- [x] Build Vendors module with vendor contact management and status tracking
- [x] Build Checklist module with task management and progress tracking
- [x] Build Notes module for event-specific notes and documentation
- [x] Build Accommodations module for guest hotel/lodging management
- [x] Build Wedding Website module for couple's public event website

## Couple Portal Implementation
- [x] Design visual mockup for couple portal matching Manor By The Lake branding (teal/green, elegant serif typography, photography-first)
- [x] Create couple-specific layout component with elegant navigation
- [x] Build couple dashboard with wedding countdown and progress overview
- [x] Implement couple views for Guest List (RSVP management)
- [x] Implement couple views for Floor Plans (seating preferences)
- [x] Implement couple views for Timeline (day-of schedule viewing)
- [x] Implement couple views for Food Choices (meal selection)
- [x] Implement couple views for Notes (personal notes)
- [x] Implement couple views for Accommodations (hotel information)
- [x] Implement couple views for Wedding Website (preview and editing)
- [x] Add personalization features (couple names, wedding date, photos)
- [x] Apply warm color scheme (gold/cream/blush tones)
- [x] Test couple login and portal access

## 3-Stage Guest Management System
- [x] Update database schema to support guest stages (1: Save the Date, 2: RSVP Details, 3: Final Database)
- [x] Add unique RSVP token field to guests table
- [x] Add stage field to track guest progression
- [x] Create Stage 1: Save the Date interface with Yes/No availability
- [x] Create Stage 2: RSVP Details form with unique link access
- [x] Implement name verification against guest list
- [x] Add meal selection interface (starter/main/dessert)
- [x] Add dietary requirements field
- [x] Create Stage 3: Final Guest Database view with complete records
- [x] Implement automated stage progression (Yes → Stage 2, Completed RSVP → Stage 3)
- [x] Add CRUD operations for each stage
- [x] Create public RSVP page accessible via unique token
- [x] Test complete 3-stage workflow

## Seating Planner Performance Optimization
- [x] Optimize reception table drag performance to eliminate lag
- [x] Improve drag overlay rendering
- [x] Reduce unnecessary re-renders during drag operations
- [x] Test drag smoothness matches ceremony mode

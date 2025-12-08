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

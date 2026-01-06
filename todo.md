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

## Seating Planner Bug Fixes
- [x] Fix drag drop positioning - tables not landing where dropped
- [x] Add canvas boundary constraints to prevent tables going off-screen
- [x] Test drag positioning accuracy
- [x] Test boundary constraints work correctly

## Critical Bug - Table Disappearing
- [x] Fix table disappearing after drag-and-drop
- [x] Debug mutation response and query invalidation
- [x] Test table persistence after drag

## New Feature Enhancements from Requirements Document

### 1. Events Section Enhancements
- [x] Add "Delete Event" button under three dots menu on event cards
- [x] Enable editing of event name and event reference
- [x] Add toggle section under three dots to control couple visibility

### 2. Event Details Navigation
- [ ] Make "Back to events" button more prominent in event details view

### 3. Guest List Management Enhancements
- [x] Implement tabs: All Guests, Save The Date, Food Choices, Table Assignment, Completed
- [x] Add sub-tabs for Save The Date: Invited, Attending, Unavailable
- [x] Add sub-tabs for Food Choices: Awaiting Choices, Confirmed
- [x] Add sub-tabs for Table Assignment: Un-Allocated, Allocated
- [x] Add required fields: First Name, Last Name, RSVP Status with color coding
- [x] Add optional fields: Email, Group
- [x] Add Food Choices: Single-choice dropdown (Starter, Main, Dessert)
- [x] Add Dietary Requirement checkbox with expanded form
- [x] Add Dietary Restriction multi-choice dropdown with "Other" text box
- [x] Add Allergy Severity (Mild/Severe)
- [x] Add "Can others consume around you?" (Yes/No)
- [x] Add Additional details text box for dietary requirements

### 4. Timeline Management
- [x] Allow deletion and modification of day titles and dates
- [x] Display timeline in ascending day order
- [x] Ensure new events are inserted in correct chronological position
- [x] Implement drag-and-drop reordering for timeline items

### 5. Checklist Improvement
- [x] Add assignedTo field to checklist schema (Manor/Couple)
- [x] Add tabs: "Manor By The Lake" and "Couple" to distinguish tasks
- [x] Show independent progress tracking for each tab
- [x] Update checklist create/edit forms to include assignment

### 6. Food Choices Configuration
- [x] Create menu configuration schema (starters, mains, desserts tables)
- [x] Build backend tRPC procedures for menu CRUD operations
- [x] Create Menu Configuration UI for staff to manage options
- [x] Update Guest List dropdowns to use dynamic menu options
- [x] Test menu configuration and guest selection integration
- [ ] Provide meal breakdown summary for chefs (counts per dish + dietary notes)
- [ ] Highlight severe allergies with prominent alerts

### 7. Wedding Website Builder
- [ ] Create header with names, wedding date, venue
- [ ] Add navigation tabs: Home, Our Story, Event Details, Travel, Accommodation, Gifts, Q&A
- [ ] Implement 10 customizable sections with text/photo editing
- [ ] Add drag-and-drop reordering for sections
- [ ] Add visibility toggle for sections
- [ ] Add pre-filled templates for quick setup
- [ ] Goal: Complete site buildable in <30 minutes

### 8. Messages System
- [ ] Create messaging section for couple-staff communication
- [ ] Tie messages to specific events

### 9. Accommodations Management
- [ ] Show Rooms 1-12 with guest assignment capability
- [ ] Pull existing guest dietary requirements into breakfast planning
- [ ] Include notes section for room setup instructions

### 10. Calendar View
- [ ] Display all booked events with color coding (Green = available, Red = booked)
- [ ] Allow event creation directly from calendar

### 11. Vendors/Suppliers Section
- [ ] Import vendors from Manor by the Lake partners page
- [ ] Use card-style layout similar to Events section
- [ ] Add vendor form fields: Company Name, First Name, Last Name, Email, Phone, Services, Website
- [ ] Source vendors from: https://www.manorbythelake.co.uk/partners

## Bug Fix - Guest Update Validation Errors
- [x] Fix tRPC Zod schema to accept null values for optional fields (mealSelection, starterSelection, mainSelection, dessertSelection, dietaryDetails, tableId, seatId)
- [x] Test guest update functionality

## Bug Fix - Input Focus Loss in Guest Forms
- [x] Fix input losing focus after typing one character in add/edit guest dialogs
- [x] Identify cause of re-render on each keystroke
- [x] Test all form inputs maintain focus

## Timeline Events - Automatic Time Sorting
- [x] Update database query to sort events by time field (chronological)
- [x] Remove manual drag-and-drop ordering for events
- [x] Test that earliest events appear at top, latest at bottom

## Timeline Event Editing
- [x] Add edit button to timeline event cards
- [x] Create edit event dialog with all fields (time, title, description, assignedTo, notes)
- [x] Test editing events and verify automatic re-sorting by time

## Custom Course Management
- [x] Update menuItems schema to use text field instead of enum for course
- [x] Add course management UI to add/remove custom courses
- [x] Update Guest List to dynamically generate food selection fields based on configured courses
- [x] Store guest food selections in flexible JSON structure
- [x] Test adding custom courses (e.g., "Canapés", "Cheese Course")
- [x] Test removing courses and handling existing guest selections

## Integrate Menu Configuration into Food Choices Section
- [x] Move menu configuration UI into event-specific Food Choices tab/section
- [x] Remove standalone MenuConfig page
- [x] Remove MenuConfig route from App.tsx
- [x] Test menu management within event context

## Food Choices Enhancements
- [x] Set default menu courses (Starter, Main, Dessert) on event creation
- [x] Add dietary restriction flags to Guest Selections Summary
- [x] Implement PDF export for menu reports
- [x] Add drag-and-drop course ordering for serving sequence

## Food Choices UI Spacing Adjustments (REVERTED)
- [x] Reduce title spacing in Food Choices page (reverted to mb-8)
- [x] Move action buttons inward with better padding (reverted - removed max-w)
- [x] Narrow course card width to add more gap from sides (reverted - removed max-w)

## Food Choices Layout Revert
- [x] Revert spacing changes in Food Choices page
- [x] Match layout to other event sections (Guest List, Timeline, etc.)

## Bug Fix - Select.Item Empty Value Error
- [x] Fix Select.Item components with empty string values in Guest List page

## Employee Management Feature
- [x] Create tRPC procedures for employee CRUD operations
- [x] Build employee management UI component with table and dialogs
- [x] Add role/permission management (admin/employee)
- [x] Integrate into admin dashboard with visibility control
- [x] Test employee creation, editing, deletion, and permission changes

## Seating Plan Bug Fixes
- [x] Fix canvas sizing to fit within white background box properly
- [x] Fix drag-and-drop positioning - tables disappearing off screen
- [x] Add zoom in/out controls for seating plan canvas

## Seating Plan - Corner Boundary Bug
- [x] Fix tables disappearing when moved to corners of canvas
- [x] Debug boundary constraint calculations for corner positions

## Navigation Improvements
- [x] Add back to event button to Food Choices page

## Seating Plan Section (New Feature)
- [x] Create Seating Plan page component with card-style table interface
- [x] Build drag-and-drop guest assignment to table cards
- [x] Add unassigned guests sidebar
- [x] Implement table capacity indicators
- [x] Add navigation link in event dashboard
- [x] Test guest allocation workflow

## Drinks Choices Feature
- [x] Create drinks table in database schema
- [x] Add tRPC procedures for drink CRUD operations
- [x] Rename "Menu Configuration" tab to "Food Choices"
- [x] Add "Drinks Choices" tab with consistent UI
- [x] Build drinks form with conditional fields (Drink Type, Sub-Type, Brand/Producer, etc.)
- [x] Implement Corkage toggle (Client Brings vs Venue Provides)
- [x] Add Total Quantity field for drinks
- [x] Test drinks creation, editing, and deletion

## Guest Accommodation Feature
- [x] Create accommodation schema with 12 rooms + Lodge + Cottage
- [x] Add room blocking checkbox functionality
- [x] Create tRPC procedures for room allocation and blocking
- [x] Build Accommodations page with room cards
- [x] Implement multi-guest allocation from RSVP system
- [x] Add additional notes section for each room
- [x] Test room allocation and blocking workflow

## Accommodation Bugs
- [x] Fix sidebar not visible when navigating to Accommodations page
- [x] Fix duplicate rooms being created when initializing rooms - cleared duplicates from database

## Accommodation Dietary Requirements
- [x] Display dietary requirements for guests assigned to rooms
- [x] Pull dietary data from guest profiles when allocating to rooms
- [x] Show dietary flags (Mild/Severe allergies) in room cards

## Bug Fixes - NaN EventId Error
- [x] Fix NaN eventId when accessing event pages with undefined URL parameter
- [x] Add error boundary and fallback when eventId is invalid

## Navigation Bugs
- [x] Back button from Accommodations shows Invalid Event ID error - fixed to navigate to /events list

## Couple Login Credentials Feature
- [x] Add couple username and password fields to event schema
- [x] Generate unique credentials when creating new events
- [x] Add Login Details button to event menu (three dots)
- [x] Create LoginDetailsModal to view and edit credentials
- [x] Integrate modal into events list
- [x] Allow employees to view and modify couple login credentials
- [x] Test credential generation and modification workflow


## Couple Feature Parity - Full Event Modification Capabilities
- [ ] Audit employee pages to identify all CRUD operations
- [x] Update CoupleGuests.tsx with add/edit/delete guest functionality
- [x] Update CoupleMenu.tsx with food choice selection and management
- [ ] Update CoupleSeating.tsx with seating arrangement capabilities
- [x] Update CoupleTimeline.tsx with timeline editing
- [ ] Update CoupleNotes.tsx with note creation/editing
- [ ] Update CoupleHotels.tsx with accommodation management
- [ ] Update CoupleWebsite.tsx with website content editing
- [ ] Ensure couple pages use same tRPC procedures as employees
- [ ] Add permission checks to couple pages (respect employee permissions)
- [ ] Test couple functionality end-to-end


## Couple Seating Management - Complete
- [x] Implement CoupleSeating page with table and guest management
- [x] Add drag-and-drop guest assignment to tables
- [x] Add table capacity and allocation tracking
- [x] Test couple seating functionality end-to-end


## Couple Website Editing - Complete
- [x] Audit employee wedding website editor
- [x] Create CoupleWebsite page with content editing
- [x] Implement photo gallery management
- [x] Add story/about section editing
- [x] Test couple website editing end-to-end


## Bug Fixes
- [x] Remove edit/delete from CoupleTimeline - make read-only


## Table Planning - Simplification - Complete
- [x] Simplify employee seating plan to basic table list view
- [x] Simplify couple seating plan to basic table list view
- [x] Test basic table planning functionality


## Bugs to Fix
- [x] Tables not displaying after being added in seating plan - fixed by adding query invalidation


## Seating Plan Restructuring - Complete
- [x] Update employee seating plan to add guests to tables
- [x] Update couple seating plan to add guests to tables
- [x] Remove floor plans section from navigation

## Seating Plan Card-Based Rebuild - Complete
- [x] Rebuild employee seating plan with card-based interface (table cards showing name, capacity, assigned guests, add/remove buttons)
- [x] Rebuild couple seating plan with card-based interface
- [x] Show unassigned guests at top/side
- [x] Add button opens dropdown to select from unassigned guests
- [x] Remove button next to each guest returns them to unassigned list
- [x] Test add/remove functionality for both employee and couple

## Debugging - Seating Plan Table Display Issue
- [ ] Check if floor plans are being created for events
- [ ] Verify tables.create mutation is working
- [ ] Check if allTables is empty due to missing floor plans
- [ ] Add console logging to debug data flow

## Seating Plan Version 2 - Simple Standalone - Complete
- [x] Create simple table planner component (no database connections)
- [x] Add table name input and create button
- [x] Display tables as cards with name and capacity
- [x] Add guest input field to assign guests to tables
- [x] Display assigned guests under each table
- [x] Add remove guest button
- [x] Test basic add/remove functionality

## Seating Plan Version 2 - Enhancements - Complete
- [x] Add seat numbers to each guest assignment
- [x] Allow selection from guest list instead of typing names
- [x] Show table and seat number in guest list
- [x] Update guest list to reference seating assignments

## Timeline Table Redesign - Complete
- [x] Convert timeline from card layout to table format
- [x] Display events as table rows with columns: Time, Title, Description, Assigned To, Notes
- [x] Add edit and delete buttons in each row
- [x] Style table for readability and compact display

## Timeline Description Expansion - Complete
- [x] Add expandable row for full description text
- [x] Show multiline description without truncation
- [x] Add expand/collapse button to each row
- [x] Preserve all description information

## Couple Seating Plan Update - Complete
- [x] Update couple seating plan to use new table planner (SeatingPlanV2)
- [x] Test couple seating plan functionality
- [x] Verify table and seat assignments work for couples

## Couple Seating Plan Error Fix - Complete
- [x] Fix NaN eventId error in couple seating plan
- [x] Get couple's event from list instead of URL params
- [x] Test couple seating plan loads correctly

## Empty Tables Visibility Bug Fix - Hybrid Persistence - Complete
- [x] Add "Save Seating Plan" button to persist to database
- [x] Load saved tables from database on page load
- [x] Allow in-memory editing until user saves
- [x] Show save status indicator
- [x] Test both employee and couple seating plans
- [x] Added tables.list procedure to routers
- [x] Implemented hybrid persistence in both employee and couple seating plans

## Couple Event Loading Bug - Fixed
- [x] Fix couple login to show correct event
- [x] Couple should see their own event, not Louis & Ren
- [x] Check how couple is associated with event in database
- [x] Update couple dashboard to load correct event
- [x] Updated events.list procedure to filter by couple username for couple users
- [x] Used existing getEventByCoupleUsername database function

## Wedding Website - Public Couple Portal - Complete
- [x] Create wedding website database schema (weddingWebsite table with content fields)
- [x] Add backend procedures for creating/updating wedding website content
- [x] Build wedding website frontend with hero banner, countdown, event details
- [x] Add sections: schedule, accommodation, travel/parking, gift registry, photo gallery
- [x] Create wedding website editor in event dashboard (CoupleWebsite component)
- [x] Implement publish/unpublish functionality
- [x] Generate public URL for wedding website (/wedding/:slug)
- [x] Add public procedures (getBySlug, getEventBySlug)
- [x] Create database helper (getWeddingWebsiteBySlug)
- [x] Test public access without login
- [x] Test elegant/formal design and responsiveness
- [x] Write and pass unit tests for wedding website functionality

## Couple Navigation - Add Wedding Website Link - Complete
- [x] Add wedding website editor link to couple navigation menu (already exists in CoupleLayout)
- [x] Make it visible and accessible from couple dashboard
- [x] Test navigation link works correctly
- [x] Website link uses Globe icon and points to /couple/website route

## Login Page Updates - Complete
- [x] Change "Employee Login" to "Planner" in EmployeeLogin.tsx
- [x] Change "Couple Login" to "Couple" in CoupleLogin.tsx
- [x] Update RoleSelection page titles to "Planner" and "Couple"
- [x] Update button text to "Continue as Planner"
- [x] Remove "Login" from all titles
- [x] Test login page displays correctly

## Couple Accommodation Display - Complete
- [x] Update CoupleHotels.tsx to display event rooms
- [x] Add Accommodation link to couple dashboard
- [x] Test accommodation display for couples

## Couple Guest Allocation - Complete
- [x] Add guest allocation UI to couple accommodations page
- [x] Implement room capacity and guest assignment logic
- [x] Test guest allocation workflow for couples

## Couple Portal Complete Rebuild - Complete
- [x] Audit current couple implementation and identify issues
- [x] Rebuild couple login with proper authentication flow
- [x] Recreate couple dashboard with working features
- [x] Implement and test each couple feature sequentially
- [x] End-to-end testing of complete couple workflow


## Role-Based Menu Management - In Progress
- [ ] Set up default courses (Starter, Main, Dessert) on event creation
- [ ] Add role-based access control to menu configuration (employees only)
- [ ] Build couple menu choice interface (read-only courses, add options)
- [ ] Test employee course management workflow
- [ ] Test couple menu choice workflow


## Role-Based Menu Management - Complete
- [x] Set up default courses (Starter, Main, Dessert) on event creation
- [x] Add role-based access control to menu management
- [x] Build couple menu choice interface
- [x] Test role-based menu workflows

## Allow Courses Without Menu Items
- [x] Update UI to allow course creation without requiring initial menu items
- [x] Test course creation and item addition workflow


## Fix Accommodations Section for Couples
- [x] Investigate why rooms aren't showing in couple's Accommodations section
- [x] Fix room display and guest allocation functionality
- [x] Test and verify rooms are visible to couples


## Fix Back Button Navigation in Accommodations
- [x] Fix the back button to navigate to the specific event instead of events list
- [x] Test the back button navigation


## Wedding Website Section Enhancements
- [ ] Update database schema to support new content sections and photo metadata
- [ ] Add preview mode functionality
- [ ] Expand content sections (Event Details, Travel Info, FAQ, Dress Code)
- [x] Implement drag-and-drop section reordering
- [x] Add photo captions and metadata support
- [ ] Test all new features

## Website UI Improvements
- [ ] Update database schema for registry links with titles
- [ ] Update database schema for FAQ items with individual Q&A
- [x] Implement registry links with titles and hyperlinks
- [x] Convert event details to custom timeline interface
- [x] Convert FAQ to individual Q&A items with add/edit/delete
- [ ] Enhance visual design to match Manor By The Lake branding

### Timeline Event Management Enhancements
- [x] Add edit button to timeline events to modify time/title/description
- [x] Add delete button to timeline events
- [x] Test edit/delete functionality for timeline events
## Photo Upload System
- [x] Replace photo URL input with file upload field
- [x] Implement S3 file upload for photos
- [x] Add photo preview after upload
- [x] Test photo upload functionality


## Public RSVP Page for Guests
- [x] Create public RSVP page component accessible via website slug
- [x] Implement guest name search functionality
- [x] Add attendance confirmation (Yes/No/Maybe)
- [x] Implement food choices selection on RSVP page
- [x] Create tRPC procedures for guest RSVP updates
- [x] Add RSVP page link/button to website navigation
- [x] Test guest RSVP workflow end-to-end


## RSVP Dietary Requirements Enhancement
- [x] Add dietary requirements checkboxes to couple's RSVP page
- [x] Add allergy severity selection (Mild/Severe)
- [x] Add "Can others consume around you?" toggle
- [x] Add dietary details text area for additional information
- [x] Update tRPC procedures to handle dietary data fields
- [x] Test dietary requirements submission and storage


## Public Website Redesign - Manor By The Lake Branding
- [x] Move RSVP section to appear after hero section
- [x] Redesign hero section with Manor By The Lake aesthetic
- [x] Update color scheme to match Manor By The Lake (golds, creams, deep greens)
- [x] Add elegant typography and spacing
- [x] Enhance event details section with upscale styling
- [x] Redesign timeline section with elegant visual treatment
- [x] Update gallery section layout
- [x] Redesign footer with Manor By The Lake branding
- [x] Add decorative elements (dividers, icons, flourishes)
- [x] Test responsive design across devices


## Bug Fixes
- [x] Fix timeline section to display actual timeline items on public website


## Couple Checklist Feature
- [x] Create couple-specific checklist view separate from employee dashboard
- [x] Add tRPC procedures for couple checklist items (create, read, update, delete, toggle)
- [x] Create CoupleChecklist component with task management UI
- [x] Integrate checklist into couple home/dashboard page
- [x] Add checklist progress tracking (% complete)
- [x] Test couple checklist CRUD operations


## Checklist Task Fixes
- [x] Add edit functionality to employee Checklist component
- [x] Revert to category-based grouping (keep edit functionality)
- [x] Add red highlighting for overdue tasks
- [x] Test overdue highlighting with category grouping


## Checklist UI Simplification
- [x] Remove category grouping from checklist display
- [x] Display all tasks in single list sorted by priority


## Remove Category Dropdown
- [x] Remove category dropdown from Add Task form


## Checklist Navigation
- [x] Add back to event button on checklist page
- [x] Fix back button 404 error - should navigate to /events/:id not /employee/events/:id

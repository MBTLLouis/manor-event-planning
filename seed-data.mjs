import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try to find the database
const possiblePaths = [
  '/tmp/manus_db.sqlite',
  '/home/ubuntu/manor-event-planning/db.sqlite',
  path.join(__dirname, 'db.sqlite'),
];

let dbPath = null;
let db = null;

// Try to connect to the database
for (const p of possiblePaths) {
  try {
    db = new Database(p);
    db.pragma('foreign_keys = ON');
    dbPath = p;
    console.log(`✓ Connected to database at ${p}`);
    break;
  } catch (e) {
    // Try next path
  }
}

if (!db) {
  console.error('❌ Could not find database file');
  process.exit(1);
}

try {
  // Get Louis & Ren's event ID
  const event = db.prepare('SELECT id FROM events WHERE coupleUsername = ?').get('louis_ren');
  if (!event) {
    console.error('❌ Louis & Ren event not found');
    process.exit(1);
  }

  const eventId = event.id;
  console.log(`\n📋 Populating event ID: ${eventId}\n`);

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  db.prepare('DELETE FROM guests WHERE eventId = ?').run(eventId);
  db.prepare('DELETE FROM menuItems WHERE eventId = ?').run(eventId);
  db.prepare('DELETE FROM drinks WHERE eventId = ?').run(eventId);
  db.prepare('DELETE FROM timelineItems WHERE eventId = ?').run(eventId);
  db.prepare('DELETE FROM floorPlans WHERE eventId = ?').run(eventId);
  db.prepare('DELETE FROM tables WHERE eventId = ?').run(eventId);
  db.prepare('DELETE FROM accommodationRooms WHERE eventId = ?').run(eventId);
  db.prepare('DELETE FROM budgetItems WHERE eventId = ?').run(eventId);
  db.prepare('DELETE FROM vendors WHERE eventId = ?').run(eventId);
  db.prepare('DELETE FROM checklistItems WHERE eventId = ?').run(eventId);

  // 1. Add 120 guests
  console.log('👥 Adding 120 guests...');
  const firstNames = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'Robert', 'Sophia', 'William', 'Isabella', 'Richard', 'Mia', 'Joseph', 'Charlotte', 'Thomas', 'Amelia', 'Charles', 'Harper', 'Christopher', 'Evelyn'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  const guestTypes = ['Day', 'Evening', 'Both'];
  const rsvpStatuses = ['draft', 'invited', 'confirmed', 'declined'];
  const allergySeverities = ['none', 'mild', 'severe'];
  const restrictions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut Allergy', 'Shellfish Allergy', 'Kosher', 'Halal'];

  const insertGuest = db.prepare(`
    INSERT INTO guests (
      eventId, firstName, lastName, email, rsvpStatus, guestType, 
      hasDietaryRequirements, dietaryRestrictions, allergySeverity, 
      canOthersConsumeNearby, dietaryDetails, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (let i = 0; i < 120; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const email = `guest${i + 1}@example.com`;
    const rsvpStatus = rsvpStatuses[i % rsvpStatuses.length];
    const guestType = guestTypes[i % guestTypes.length];
    const hasDietary = i % 3 === 0 ? 1 : 0;
    
    let dietaryRestrictions = null;
    let allergySeverity = 'none';
    let canOthersConsume = 1;
    let dietaryDetails = null;

    if (hasDietary) {
      dietaryRestrictions = restrictions[i % restrictions.length];
      allergySeverity = allergySeverities[i % allergySeverities.length];
      dietaryDetails = `Please prepare ${dietaryRestrictions.toLowerCase()} options`;
    }

    insertGuest.run(
      eventId, firstName, lastName, email, rsvpStatus, guestType,
      hasDietary, dietaryRestrictions, allergySeverity, canOthersConsume, dietaryDetails
    );
  }
  console.log('   ✓ Added 120 guests');

  // 2. Add menu items
  console.log('🍽️  Adding menu items...');
  const insertMenuItem = db.prepare(`
    INSERT INTO menuItems (eventId, course, name, description, orderIndex, isAvailable, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const menuData = [
    { course: 'Canapes', items: [
      { name: 'Smoked Salmon Blini', desc: 'Crispy potato pancake with smoked salmon and dill cream' },
      { name: 'Goat Cheese Tartlet', desc: 'Caramelized onion and goat cheese on pastry' },
      { name: 'Beef Wellington Bite', desc: 'Tender beef with mushroom duxelles' }
    ]},
    { course: 'Starter', items: [
      { name: 'Burrata & Heirloom Tomato', desc: 'Fresh burrata with basil oil and aged balsamic' },
      { name: 'Roasted Beet Salad', desc: 'Roasted beets, goat cheese, candied walnuts, arugula' },
      { name: 'Lobster Bisque', desc: 'Creamy lobster bisque with crispy croutons' }
    ]},
    { course: 'Main', items: [
      { name: 'Filet Mignon', desc: 'Prime filet mignon with red wine reduction and roasted vegetables' },
      { name: 'Pan-Seared Salmon', desc: 'Atlantic salmon with lemon butter sauce and seasonal vegetables' },
      { name: 'Herb Roasted Chicken', desc: 'Free-range chicken breast with thyme jus and root vegetables' },
      { name: 'Vegetarian Wellington', desc: 'Mushroom and spinach wellington with red wine sauce' }
    ]},
    { course: 'Dessert', items: [
      { name: 'Chocolate Torte', desc: 'Rich chocolate torte with raspberry coulis' },
      { name: 'Lemon Panna Cotta', desc: 'Silky lemon panna cotta with shortbread' },
      { name: 'Strawberry Cheesecake', desc: 'Classic cheesecake with fresh strawberries' },
      { name: 'Tiramisu', desc: 'Traditional Italian tiramisu with mascarpone' }
    ]}
  ];

  menuData.forEach(courseData => {
    courseData.items.forEach((item, idx) => {
      insertMenuItem.run(eventId, courseData.course, item.name, item.desc, idx, 1);
    });
  });
  console.log('   ✓ Added menu items (4 courses, 12 dishes)');

  // 3. Add drinks
  console.log('🍷 Adding drinks...');
  const insertDrink = db.prepare(`
    INSERT INTO drinks (eventId, type, subType, name, quantity, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const drinks = [
    { type: 'Soft', subType: 'Water', name: 'Still Water', qty: 200 },
    { type: 'Soft', subType: 'Water', name: 'Sparkling Water', qty: 150 },
    { type: 'Soft', subType: 'Juice', name: 'Orange Juice', qty: 50 },
    { type: 'Soft', subType: 'Juice', name: 'Cranberry Juice', qty: 50 },
    { type: 'Alcoholic', subType: 'Wine', name: 'Chateau Margaux 2015', qty: 12, notes: 'Red wine for main course' },
    { type: 'Alcoholic', subType: 'Wine', name: 'Chablis Premier Cru', qty: 15, notes: 'White wine for starter' },
    { type: 'Alcoholic', subType: 'Champagne', name: 'Veuve Clicquot', qty: 20, notes: 'For toasts' },
    { type: 'Alcoholic', subType: 'Cocktail', name: 'Signature Cocktail', qty: 100, notes: 'Aperitif hour special' },
    { type: 'Alcoholic', subType: 'Beer', name: 'Craft Beer Selection', qty: 50 }
  ];

  drinks.forEach(drink => {
    insertDrink.run(eventId, drink.type, drink.subType, drink.name, drink.qty, drink.notes || null);
  });
  console.log('   ✓ Added 9 drink selections');

  // 4. Create floor plan and tables
  console.log('🎪 Adding tables...');
  const insertFloorPlan = db.prepare(`
    INSERT INTO floorPlans (eventId, name, mode, createdAt, updatedAt)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `);

  const floorPlanResult = insertFloorPlan.run(eventId, 'Reception Layout', 'reception');
  const floorPlanId = floorPlanResult.lastInsertRowid;

  const insertTable = db.prepare(`
    INSERT INTO tables (floorPlanId, eventId, name, tableType, capacity, positionX, positionY, rotation, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const tableConfigs = [
    { name: 'Table 1', type: 'round', capacity: 8 },
    { name: 'Table 2', type: 'round', capacity: 8 },
    { name: 'Table 3', type: 'round', capacity: 8 },
    { name: 'Table 4', type: 'round', capacity: 8 },
    { name: 'Table 5', type: 'round', capacity: 8 },
    { name: 'Table 6', type: 'round', capacity: 8 },
    { name: 'Table 7', type: 'round', capacity: 8 },
    { name: 'Table 8', type: 'round', capacity: 8 },
    { name: 'Table 9', type: 'round', capacity: 8 },
    { name: 'Table 10', type: 'round', capacity: 8 },
    { name: 'Table 11', type: 'round', capacity: 8 },
    { name: 'Table 12', type: 'round', capacity: 8 },
    { name: 'Sweetheart', type: 'round', capacity: 2 },
    { name: 'Kids Table', type: 'rectangular', capacity: 6 }
  ];

  const tableIds = [];
  tableConfigs.forEach((config, idx) => {
    const x = (idx % 4) * 250 + 100;
    const y = Math.floor(idx / 4) * 250 + 100;
    const result = insertTable.run(floorPlanId, eventId, config.name, config.type, config.capacity, x, y, 0);
    tableIds.push(result.lastInsertRowid);
  });
  console.log('   ✓ Added 14 tables');

  // 5. Assign guests to tables
  console.log('🪑 Assigning guests to tables...');
  const updateGuest = db.prepare('UPDATE guests SET tableId = ?, seatNumber = ? WHERE id = ?');
  const allGuests = db.prepare('SELECT id FROM guests WHERE eventId = ? ORDER BY id').all(eventId);

  let guestIdx = 0;
  tableIds.forEach((tableId, tableIdx) => {
    const tableConfig = tableConfigs[tableIdx];
    for (let seatNum = 1; seatNum <= tableConfig.capacity && guestIdx < allGuests.length; seatNum++) {
      updateGuest.run(tableId, seatNum, allGuests[guestIdx].id);
      guestIdx++;
    }
  });
  console.log(`   ✓ Assigned ${guestIdx} guests to tables`);

  // 6. Add timeline items
  console.log('⏰ Adding timeline items...');
  const insertTimelineItem = db.prepare(`
    INSERT INTO timelineItems (eventId, title, description, time, assignedTo, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const timelineItems = [
    { title: 'Venue Opens', desc: 'Doors open for guest arrival', time: '14:00', assigned: 'Venue Staff' },
    { title: 'Guest Arrival', desc: 'Welcome guests at entrance', time: '14:30', assigned: 'Ushers' },
    { title: 'Cocktail Hour', desc: 'Aperitif and canapés in garden', time: '15:00', assigned: 'Catering' },
    { title: 'Guests Seated', desc: 'Direct guests to their tables', time: '16:00', assigned: 'Ushers' },
    { title: 'Welcome Speech', desc: 'Couple welcomes guests', time: '16:15', assigned: 'Couple' },
    { title: 'Starter Course', desc: 'Serve first course', time: '16:30', assigned: 'Kitchen' },
    { title: 'Main Course', desc: 'Serve main course', time: '17:15', assigned: 'Kitchen' },
    { title: 'Toasts & Speeches', desc: 'Best man and maid of honor speeches', time: '18:00', assigned: 'MC' },
    { title: 'Cake Cutting', desc: 'Cut and serve wedding cake', time: '18:30', assigned: 'Catering' },
    { title: 'Dessert Course', desc: 'Serve dessert', time: '18:45', assigned: 'Kitchen' },
    { title: 'First Dance', desc: 'Couple\'s first dance', time: '19:15', assigned: 'DJ' },
    { title: 'Dancing Begins', desc: 'Open dance floor to guests', time: '19:30', assigned: 'DJ' },
    { title: 'Late Night Snacks', desc: 'Serve late night food and drinks', time: '21:00', assigned: 'Catering' },
    { title: 'Last Dance', desc: 'Final song of the evening', time: '22:30', assigned: 'DJ' },
    { title: 'Goodbyes', desc: 'Thank guests and say goodbye', time: '23:00', assigned: 'Couple' }
  ];

  timelineItems.forEach(item => {
    insertTimelineItem.run(eventId, item.title, item.desc, item.time, item.assigned, null);
  });
  console.log('   ✓ Added 15 timeline items');

  // 7. Add accommodation rooms
  console.log('🏨 Adding accommodation rooms...');
  const insertRoom = db.prepare(`
    INSERT INTO accommodationRooms (eventId, roomName, capacity, isAccessible, isBlocked, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const rooms = [
    { name: 'Room 101', capacity: 2, accessible: 1 },
    { name: 'Room 102', capacity: 2, accessible: 0 },
    { name: 'Room 103', capacity: 2, accessible: 1 },
    { name: 'Room 104', capacity: 2, accessible: 0 },
    { name: 'Room 105', capacity: 2, accessible: 0 },
    { name: 'Room 201', capacity: 2, accessible: 0 },
    { name: 'Room 202', capacity: 2, accessible: 0 },
    { name: 'Room 203', capacity: 2, accessible: 0 },
    { name: 'Room 204', capacity: 2, accessible: 0 },
    { name: 'Room 205', capacity: 2, accessible: 0 },
    { name: 'Lodge Suite', capacity: 4, accessible: 1 },
    { name: 'Cottage', capacity: 4, accessible: 0 }
  ];

  rooms.forEach(room => {
    insertRoom.run(eventId, room.name, room.capacity, room.accessible, 0, null);
  });
  console.log('   ✓ Added 12 accommodation rooms');

  // 8. Add budget items
  console.log('💰 Adding budget items...');
  const insertBudgetItem = db.prepare(`
    INSERT INTO budgetItems (eventId, category, description, estimatedCost, actualCost, paymentStatus, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const budgetItems = [
    { cat: 'Venue', desc: 'Manor By The Lake venue rental', est: 5000, actual: 5000, status: 'paid' },
    { cat: 'Catering', desc: 'Food and beverage for 120 guests', est: 12000, actual: 12500, status: 'pending' },
    { cat: 'Catering', desc: 'Bar service and premium drinks', est: 3000, actual: 3000, status: 'paid' },
    { cat: 'Photography', desc: 'Professional photographer (8 hours)', est: 2500, actual: 2500, status: 'paid' },
    { cat: 'Photography', desc: 'Videographer', est: 1500, actual: 1500, status: 'paid' },
    { cat: 'Flowers', desc: 'Bridal bouquet and centerpieces', est: 2000, actual: 2100, status: 'pending' },
    { cat: 'Music', desc: 'DJ and sound system', est: 1200, actual: 1200, status: 'paid' },
    { cat: 'Music', desc: 'Live band for cocktail hour', est: 800, actual: 800, status: 'paid' },
    { cat: 'Decorations', desc: 'Linens, centerpieces, and decor', est: 1500, actual: 1500, status: 'paid' },
    { cat: 'Accommodations', desc: 'Room blocks for 40 guests', est: 4000, actual: 4000, status: 'paid' },
    { cat: 'Transportation', desc: 'Shuttle service for guests', est: 800, actual: 800, status: 'paid' },
    { cat: 'Invitations', desc: 'Custom printed invitations', est: 500, actual: 500, status: 'paid' },
    { cat: 'Miscellaneous', desc: 'Favors and gifts', est: 1000, actual: 1200, status: 'pending' }
  ];

  budgetItems.forEach(item => {
    insertBudgetItem.run(eventId, item.cat, item.desc, item.est, item.actual, item.status, null);
  });
  console.log('   ✓ Added 13 budget items (~$36,400 total)');

  // 9. Add vendors
  console.log('🤝 Adding vendors...');
  const insertVendor = db.prepare(`
    INSERT INTO vendors (eventId, name, category, contactName, email, phone, contractStatus, paymentStatus, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const vendors = [
    { name: 'Gourmet Catering Co', cat: 'Catering', contact: 'Chef Marcus', email: 'marcus@gourmetcatering.com', phone: '555-0101', contract: 'signed', payment: 'paid' },
    { name: 'Elegant Florals', cat: 'Flowers', contact: 'Sarah Chen', email: 'sarah@elegantflorals.com', phone: '555-0102', contract: 'signed', payment: 'pending' },
    { name: 'Capture Moments Photography', cat: 'Photography', contact: 'David Smith', email: 'david@capturemoments.com', phone: '555-0103', contract: 'signed', payment: 'paid' },
    { name: 'DJ Elite Entertainment', cat: 'Music', contact: 'Tom Wilson', email: 'tom@djelite.com', phone: '555-0104', contract: 'signed', payment: 'paid' },
    { name: 'Silk & Satin Linens', cat: 'Decorations', contact: 'Lisa Brown', email: 'lisa@silkandsatin.com', phone: '555-0105', contract: 'signed', payment: 'paid' },
    { name: 'Premier Transportation', cat: 'Transportation', contact: 'James Garcia', email: 'james@premiertrans.com', phone: '555-0106', contract: 'signed', payment: 'paid' }
  ];

  vendors.forEach(vendor => {
    insertVendor.run(eventId, vendor.name, vendor.cat, vendor.contact, vendor.email, vendor.phone, vendor.contract, vendor.payment, null);
  });
  console.log('   ✓ Added 6 vendors');

  // 10. Add checklist items
  console.log('✅ Adding checklist items...');
  const insertChecklist = db.prepare(`
    INSERT INTO checklistItems (eventId, title, description, category, priority, assignedTo, dueDate, isCompleted, completedAt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const checklistItems = [
    { title: 'Confirm guest count with caterer', desc: 'Finalize headcount for catering', cat: 'general', priority: 'High', assigned: 'Manor', due: '2026-01-20' },
    { title: 'Final menu selection', desc: 'Confirm all menu items with kitchen', cat: 'general', priority: 'High', assigned: 'Manor', due: '2026-01-20' },
    { title: 'Seating chart finalization', desc: 'Complete and print seating chart', cat: 'general', priority: 'High', assigned: 'Manor', due: '2026-01-25' },
    { title: 'Vendor final confirmations', desc: 'Confirm all vendor arrival times and details', cat: 'general', priority: 'High', assigned: 'Manor', due: '2026-01-25' },
    { title: 'Dietary requirements review', desc: 'Review all dietary restrictions with kitchen', cat: 'general', priority: 'High', assigned: 'Manor', due: '2026-01-25' },
    { title: 'Ceremony rehearsal', desc: 'Walk through ceremony with couple', cat: 'general', priority: 'Medium', assigned: 'Manor', due: '2026-01-30' },
    { title: 'Sound check', desc: 'Test DJ equipment and microphones', cat: 'general', priority: 'Medium', assigned: 'Manor', due: '2026-01-30' },
    { title: 'Decoration setup plan', desc: 'Plan decoration placement and timing', cat: 'general', priority: 'Medium', assigned: 'Manor', due: '2026-01-28' },
    { title: 'Prepare emergency contacts', desc: 'Create list of vendor emergency numbers', cat: 'general', priority: 'Medium', assigned: 'Manor', due: '2026-01-27' },
    { title: 'Final walk-through', desc: 'Complete final venue walk-through', cat: 'general', priority: 'High', assigned: 'Manor', due: '2026-01-30' },
    { title: 'Confirm accommodations', desc: 'Verify all room bookings and check-in times', cat: 'general', priority: 'Medium', assigned: 'Manor', due: '2026-01-20' },
    { title: 'Prepare welcome packets', desc: 'Create welcome packets for guests', cat: 'general', priority: 'Low', assigned: 'Couple', due: '2026-01-25' },
    { title: 'Write vows', desc: 'Finalize wedding vows', cat: 'general', priority: 'High', assigned: 'Couple', due: '2026-01-15' },
    { title: 'Arrange transportation', desc: 'Confirm shuttle schedule and drivers', cat: 'general', priority: 'Medium', assigned: 'Couple', due: '2026-01-20' },
    { title: 'Prepare speeches', desc: 'Write and practice best man/maid of honor speeches', cat: 'general', priority: 'Medium', assigned: 'Couple', due: '2026-01-20' }
  ];

  checklistItems.forEach(item => {
    insertChecklist.run(eventId, item.title, item.desc, item.cat, item.priority, item.assigned, item.due, 0, null);
  });
  console.log('   ✓ Added 15 checklist items');

  console.log('\n✅ Successfully populated Louis & Ren event with complete wedding data!\n');
  console.log('📊 Summary:');
  console.log('   • 120 guests with dietary requirements');
  console.log('   • 14 tables with seating assignments');
  console.log('   • 4 menu courses with 12 dishes');
  console.log('   • 9 drink selections');
  console.log('   • 15 timeline items');
  console.log('   • 12 accommodation rooms');
  console.log('   • 13 budget items (~$36,400 total)');
  console.log('   • 6 vendors');
  console.log('   • 15 planning tasks\n');

  db.close();
} catch (error) {
  console.error('❌ Error:', error.message);
  db?.close();
  process.exit(1);
}

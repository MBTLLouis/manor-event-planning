import type { Event, Guest, MenuItem, Drink, Table, TimelineDay, TimelineEvent } from '@shared/types';

interface ExportData {
  event: Event & { eventDate: Date };
  guests: Guest[];
  menuItems: MenuItem[];
  drinks: Drink[];
  tables: (Table & { seats?: any[] })[];
  timeline: (TimelineDay & { events?: TimelineEvent[] })[];
}

export function generateEventPDF(data: ExportData) {
  const { event, guests, menuItems, drinks, tables, timeline } = data;

  // Group menu items by course
  const menuByCategory: Record<string, MenuItem[]> = {
    Canapes: menuItems.filter(m => m.course === 'Canapes'),
    Starter: menuItems.filter(m => m.course === 'Starter'),
    Main: menuItems.filter(m => m.course === 'Main'),
    Dessert: menuItems.filter(m => m.course === 'Dessert'),
  };

  // Count meal selections
  const mealCounts: Record<string, number> = {};
  guests.forEach(guest => {
    if (guest.mainSelection) {
      mealCounts[guest.mainSelection] = (mealCounts[guest.mainSelection] || 0) + 1;
    }
  });

  // Count dietary requirements
  const dietaryCount = guests.filter(g => g.hasDietaryRequirements).length;
  const allergies = guests.filter(g => g.allergySeverity === 'severe');

  const eventDate = new Date(event.eventDate);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Event Export - ${event.coupleName1}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .page {
          page-break-after: always;
          padding: 40px;
          min-height: 297mm;
          background: white;
        }
        
        .header {
          margin-bottom: 30px;
          border-bottom: 2px solid #1a5f5f;
          padding-bottom: 15px;
        }
        
        .title {
          font-size: 28pt;
          font-weight: bold;
          color: #1a5f5f;
          margin-bottom: 5px;
        }
        
        .subtitle {
          font-size: 14pt;
          color: #666;
          margin-bottom: 3px;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 16pt;
          font-weight: bold;
          color: #1a5f5f;
          margin-bottom: 12px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 6px;
        }
        
        .cover-info {
          margin-top: 60px;
          margin-bottom: 40px;
        }
        
        .couple-name {
          font-size: 24pt;
          font-weight: bold;
          color: #1a5f5f;
          margin-bottom: 10px;
        }
        
        .event-date {
          font-size: 16pt;
          color: #666;
          margin-bottom: 5px;
        }
        
        .event-code {
          font-size: 14pt;
          color: #999;
        }
        
        .summary {
          margin-top: 80px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
        
        .summary-item {
          font-size: 12pt;
          color: #666;
          margin-bottom: 10px;
        }
        
        .summary-item strong {
          color: #1a5f5f;
        }
        
        .severe-warning {
          color: #d32f2f;
          font-weight: bold;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          border: 1px solid #ddd;
        }
        
        th {
          background-color: #1a5f5f;
          color: white;
          padding: 8px;
          text-align: left;
          font-weight: bold;
          font-size: 10pt;
        }
        
        td {
          padding: 8px;
          border-bottom: 1px solid #eee;
          font-size: 10pt;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        .row {
          display: flex;
          margin-bottom: 8px;
        }
        
        .label {
          font-weight: bold;
          width: 120px;
          color: #1a5f5f;
        }
        
        .value {
          flex: 1;
        }
        
        .menu-category {
          margin-bottom: 15px;
        }
        
        .menu-category-title {
          font-size: 12pt;
          font-weight: bold;
          color: #1a5f5f;
          margin-bottom: 6px;
        }
        
        .menu-item {
          margin-bottom: 4px;
          padding-left: 12px;
          font-size: 11pt;
        }
        
        .menu-description {
          font-size: 9pt;
          color: #666;
          font-style: italic;
        }
        
        .dietary-item {
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        
        .dietary-name {
          font-weight: bold;
          color: #1a5f5f;
        }
        
        .dietary-details {
          font-size: 10pt;
          margin-top: 2px;
        }
        
        .page-number {
          text-align: center;
          color: #999;
          font-size: 10pt;
          margin-top: 40px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        
        .guest-list {
          font-size: 10pt;
          margin-top: 10px;
          padding-left: 12px;
        }
        
        .guest-item {
          margin-bottom: 2px;
        }
        
        @media print {
          body {
            background: white;
          }
          .page {
            page-break-after: always;
            padding: 20mm;
            min-height: 297mm;
          }
        }
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="page">
        <div class="header">
          <div class="title">Manor By The Lake</div>
          <div class="subtitle">Event Planning & Operations</div>
        </div>
        
        <div class="cover-info">
          <div class="couple-name">${event.coupleName1}${event.coupleName2 ? ` & ${event.coupleName2}` : ''}</div>
          <div class="event-date">${formattedDate}</div>
          <div class="event-code">Event Code: ${event.eventCode || 'N/A'}</div>
        </div>
        
        <div class="summary">
          <div class="summary-item"><strong>Total Guests:</strong> ${guests.length}</div>
          <div class="summary-item"><strong>Confirmed:</strong> ${guests.filter(g => g.rsvpStatus === 'confirmed').length}</div>
          <div class="summary-item"><strong>Dietary Requirements:</strong> ${dietaryCount}</div>
          ${allergies.length > 0 ? `<div class="summary-item severe-warning">⚠️ SEVERE ALLERGIES: ${allergies.length}</div>` : ''}
        </div>
      </div>
      
      <!-- Guest List Page -->
      <div class="page">
        <div class="header">
          <div class="title">Guest List</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>RSVP</th>
              <th>Main Course</th>
              <th>Table</th>
            </tr>
          </thead>
          <tbody>
            ${guests.map(guest => `
              <tr>
                <td>${guest.firstName} ${guest.lastName}</td>
                <td>${guest.email || '-'}</td>
                <td style="color: ${guest.rsvpStatus === 'confirmed' ? '#155724' : guest.rsvpStatus === 'declined' ? '#721c24' : '#856404'}; font-weight: bold;">
                  ${guest.rsvpStatus?.charAt(0).toUpperCase() + guest.rsvpStatus?.slice(1) || '-'}
                </td>
                <td>${guest.mainSelection || '-'}</td>
                <td>${guest.tableId ? `Table ${guest.tableId}` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="page-number">Page 2</div>
      </div>
      
      <!-- Menu & Meal Summary Page -->
      <div class="page">
        <div class="header">
          <div class="title">Menu & Meal Summary</div>
        </div>
        
        <!-- Menu Items -->
        <div class="section">
          <div class="section-title">Menu Offerings</div>
          ${Object.entries(menuByCategory).map(([course, items]) => 
            items.length > 0 ? `
              <div class="menu-category">
                <div class="menu-category-title">${course}</div>
                ${items.map(item => `
                  <div class="menu-item">
                    • ${item.name}
                    ${item.description ? `<div class="menu-description">${item.description}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''
          ).join('')}
        </div>
        
        <!-- Meal Counts -->
        <div class="section">
          <div class="section-title">Meal Selection Summary</div>
          ${Object.entries(mealCounts).map(([meal, count]) => `
            <div class="row">
              <div class="label">${meal}:</div>
              <div class="value">${count} guests</div>
            </div>
          `).join('')}
        </div>
        
        <!-- Dietary Requirements -->
        ${dietaryCount > 0 ? `
          <div class="section">
            <div class="section-title">⚠️ Dietary Requirements</div>
            ${guests.filter(g => g.hasDietaryRequirements).map(guest => `
              <div class="dietary-item">
                <div class="dietary-name">
                  ${guest.firstName} ${guest.lastName}
                  ${guest.allergySeverity === 'severe' ? '<span style="color: #d32f2f;"> - SEVERE</span>' : ''}
                </div>
                ${guest.dietaryRestrictions ? `<div class="dietary-details"><strong>Restrictions:</strong> ${guest.dietaryRestrictions}</div>` : ''}
                ${guest.dietaryDetails ? `<div class="dietary-details"><strong>Details:</strong> ${guest.dietaryDetails}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="page-number">Page 3</div>
      </div>
      
      <!-- Seating Plan Page -->
      ${tables.length > 0 ? `
        <div class="page">
          <div class="header">
            <div class="title">Seating Arrangements</div>
          </div>
          
          ${tables.map(table => `
            <div class="section">
              <div class="section-title">Table ${table.id}</div>
              <div class="row">
                <div class="label">Capacity:</div>
                <div class="value">${table.seatCount} seats</div>
              </div>
              <div class="row">
                <div class="label">Assigned:</div>
                <div class="value">${guests.filter(g => g.tableId === table.id).length} guests</div>
              </div>
              
              ${guests.filter(g => g.tableId === table.id).length > 0 ? `
                <div class="guest-list">
                  <strong style="font-size: 10pt; color: #666;">Guests at this table:</strong>
                  ${guests.filter(g => g.tableId === table.id).map(guest => `
                    <div class="guest-item">
                      • ${guest.firstName} ${guest.lastName}${guest.hasDietaryRequirements ? ' (dietary requirements)' : ''}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
          
          <div class="page-number">Page 4</div>
        </div>
      ` : ''}
      
      <!-- Timeline Page -->
      ${timeline.length > 0 ? `
        <div class="page">
          <div class="header">
            <div class="title">Event Timeline</div>
          </div>
          
          ${timeline.map(day => `
            <div class="section">
              <div class="section-title">
                ${new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              
              ${day.events && day.events.length > 0 ? `
                ${day.events.map(event => `
                  <div style="margin-bottom: 12px;">
                    <div class="row">
                      <div class="label" style="font-weight: bold;">${event.time}</div>
                      <div class="value" style="font-weight: bold;">${event.title}</div>
                    </div>
                    ${event.description ? `<div style="font-size: 10pt; color: #666; margin-left: 120px;">${event.description}</div>` : ''}
                    ${event.assignedTo ? `<div style="font-size: 10pt; color: #999; margin-left: 120px;">Assigned to: ${event.assignedTo}</div>` : ''}
                  </div>
                `).join('')}
              ` : `<div style="font-size: 10pt; color: #999; font-style: italic;">No events scheduled</div>`}
            </div>
          `).join('')}
          
          <div class="page-number">Page 5</div>
        </div>
      ` : ''}
    </body>
    </html>
  `;

  // Create a blob and download
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Create an iframe to print the HTML
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  
  document.body.appendChild(iframe);
  
  // Wait for iframe to load, then print
  iframe.onload = () => {
    iframe.contentWindow?.print();
    
    // Clean up after a delay
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 1000);
  };
}

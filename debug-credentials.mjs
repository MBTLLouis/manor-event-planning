// Quick script to check what credentials are in the database
import { execSync } from 'child_process';

// Use the webdev tool output to check database
console.log('Checking database for Louis & Ren event...');
console.log('You can manually check with:');
console.log('SELECT id, title, coupleUsername, couplePassword FROM events WHERE title LIKE "%Louis%"');

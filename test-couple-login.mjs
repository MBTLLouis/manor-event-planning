import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'test',
});

// Query the Louis & Ren event
const [rows] = await connection.execute(
  'SELECT id, title, coupleUsername, couplePassword FROM events WHERE title LIKE ? LIMIT 1',
  ['%Louis%']
);

if (rows.length > 0) {
  const event = rows[0];
  console.log('Event found:');
  console.log('  ID:', event.id);
  console.log('  Title:', event.title);
  console.log('  Username:', event.coupleUsername);
  console.log('  Password:', event.couplePassword);
  console.log('\nTesting credentials:');
  console.log('  Input username: LouisRen');
  console.log('  Input password: Manor1854');
  console.log('  Match username?', event.coupleUsername === 'LouisRen');
  console.log('  Match password?', event.couplePassword === 'Manor1854');
} else {
  console.log('No event found');
}

await connection.end();

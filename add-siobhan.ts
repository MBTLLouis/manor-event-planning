import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  connectionLimit: 1,
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'manor',
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

async function addSiobhan() {
  try {
    const hashedPassword = await bcrypt.hash('Password1234', 10);
    
    const connection = await pool.getConnection();
    
    await connection.execute(
      'INSERT INTO users (name, email, username, password, role, loginMethod) VALUES (?, ?, ?, ?, ?, ?)',
      ['Siobhan', 'siobhan@manor.com', 'siobhan', hashedPassword, 'employee', 'local']
    );
    
    connection.release();
    console.log('✅ Siobhan added successfully!');
    console.log('Username: siobhan');
    console.log('Password: Password1234');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding Siobhan:', error);
    process.exit(1);
  }
}

addSiobhan();

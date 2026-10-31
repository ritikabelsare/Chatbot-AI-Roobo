
const db = require('./db');

async function testConnection() {
    try {
        const [rows] = await db.query('SHOW TABLES');
        console.log('MySQL connected successfully!');
        console.log('Tables:', rows);
    } catch (error) {
        console.error('MySQL connection failed:', error.message);
    } finally {
        await db.end();
    }
}

testConnection();

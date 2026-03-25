const pool = require('../db');
async function checkUsers() {
    try {
        const res = await pool.query('SELECT id, email, name FROM users');
        console.log('Users:', JSON.stringify(res.rows, null, 2));
        const trips = await pool.query('SELECT * FROM trips');
        console.log('Trips:', JSON.stringify(trips.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUsers();

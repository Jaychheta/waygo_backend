const pool = require('../db');
async function checkTrips() {
    try {
        const uRes = await pool.query('SELECT id, email, name FROM users WHERE email = $1', ['alex@gmail.com']);
        const user = uRes.rows[0];
        console.log('User alex@gmail.com:', JSON.stringify(user, null, 2));
        if (user) {
            const tRes = await pool.query('SELECT * FROM trips WHERE user_id = $1', [user.id]);
            console.log(`Trips for user ${user.id}:`, JSON.stringify(tRes.rows, null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkTrips();

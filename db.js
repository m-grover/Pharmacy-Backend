const mysql = require('mysql2');

// Create connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root', 
    database: 'health_survey'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('MySQL Connected ✅');
});

module.exports = db;
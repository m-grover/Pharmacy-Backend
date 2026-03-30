const db = require('../db');
const bcrypt = require('bcrypt');


// SIGNUP
exports.signup = async (req, res) => {
    const { name, student_id, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, student_id, email, password)
            VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [name, student_id, email, hashedPassword], (err, result) => {
            if (err) return res.status(500).send(err);

            res.json({ message: "User registered successfully" });
        });

    } catch (err) {
        res.status(500).send(err);
    }
};


// LOGIN
exports.login = (req, res) => {
  const { student_id, password, village } = req.body;

  const sql = `SELECT * FROM users WHERE student_id = ?`;

  db.query(sql, [student_id], async (err, results) => {
    if (err) return res.status(500).send(err);

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Optional: update village
    const updateVillage = `UPDATE users SET village = ? WHERE student_id = ?`;
    db.query(updateVillage, [village, user.student_id], (err) => {
      if (err) console.log("Village update error:", err);
    });
    res.json({ message: "Login successful", 
        user_id: user.user_id,
        name: user.name
     });
  });
};
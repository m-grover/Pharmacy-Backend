const db = require('../db');
const bcrypt = require('bcrypt');

/* ============================= */
/* SIGNUP */
/* ============================= */
exports.signup = async (req, res) => {
  const { name, student_id, email, password } = req.body;

  if (!name || !student_id || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check duplicate student_id
    const checkSql = `SELECT user_id FROM users WHERE student_id = ? LIMIT 1`;
    db.query(checkSql, [student_id], async (checkErr, checkResult) => {
      if (checkErr) return res.status(500).json({ message: "DB error" });

      if (checkResult.length > 0) {
        return res.status(409).json({ message: "Student ID already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO users (name, student_id, email, password, role)
        VALUES (?, ?, ?, ?, 'student')
      `;

      db.query(sql, [name, student_id, email, hashedPassword], (err, result) => {
        if (err) return res.status(500).json({ message: "Signup failed" });
        res.json({ message: "User registered successfully" });
      });
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================= */
/* LOGIN */
/* ============================= */
exports.login = (req, res) => {
  const { student_id, password, village } = req.body;

  if (!student_id || !password) {
    return res.status(400).json({ message: "Student ID and password are required" });
  }

  const sql = `SELECT * FROM users WHERE student_id = ?`;

  db.query(sql, [student_id], async (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Update village on login
    if (village) {
      const updateVillage = `UPDATE users SET village = ? WHERE student_id = ?`;
      db.query(updateVillage, [village, student_id], (err) => {
        if (err) console.log("Village update error:", err);
      });
    }

    // ✅ Send role, name, user_id — all needed by frontend
    res.json({
      message: "Login successful",
      user_id:    user.user_id,
      name:       user.name,
      role:       user.role,       // ✅ was missing before
      village:    village || user.village,
      student_id: user.student_id
    });
  });
};
const db = require('../db');

exports.addPregnancy = (req, res) => {
    const { member_id, is_married, is_pregnant, pregnancies_count } = req.body;

    const sql = `
        INSERT INTO pregnancy 
        (member_id, is_married, is_pregnant, pregnancies_count)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [member_id, is_married, is_pregnant, pregnancies_count], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        res.json({ message: "Pregnancy data saved" });
    });
};
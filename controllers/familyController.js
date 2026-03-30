const db = require('../db');

exports.addFamily = (req, res) => {
    const {
        head_name,
        address,
        religion,
        caste,
        occupation,
        marital_status,
        total_members,
        family_type,
        eligible_couples,
        house_type,
        village,
        created_by
    } = req.body;

    const sql = `
        INSERT INTO families 
        (head_name, address, religion, caste, occupation, marital_status,
         total_members, family_type, eligible_couples, house_type, village, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        head_name,
        address,
        religion,
        caste,
        occupation,
        marital_status,
        total_members,
        family_type,
        eligible_couples,
        house_type,
        village,
        created_by
    ], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        res.json({ family_id: result.insertId });
    });
};
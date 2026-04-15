const db = require('../db');

exports.addEconomic = (req, res) => {
    const {
        family_id,
        family_income,
        income_source,
        house_ownership,
        land_ownership,
        assets,
        bpl,
        scheme
    } = req.body;

    const sql = `
        INSERT INTO economic_status 
        (family_id, family_income, income_source, house_ownership, land_ownership, assets, bpl, scheme)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        family_id,
        family_income,
        income_source,
        house_ownership,
        land_ownership,
        assets,
        bpl,
        scheme
    ], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        res.json({ message: "Economic data saved" });
    });
};
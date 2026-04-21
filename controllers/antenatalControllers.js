const db = require('../db');

exports.saveAntenatal = (req, res) => {
  const { survey_id, woman_name, age, spouse_name, lmp, edd, weight, bp, hb, urine_sugar } = req.body;

  if (!lmp) return res.status(400).json({ message: "LMP is required" });

  const sql = `
    INSERT INTO antenatal_records
    (survey_id, woman_name, age, spouse_name, lmp, edd, weight, bp, hb, urine_sugar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [survey_id, woman_name, age, spouse_name, lmp, edd, weight, bp, hb, urine_sugar], (err, result) => {
    if (err) { console.error("DB Error:", err); return res.status(500).json({ message: "Database error" }); }
    res.status(200).json({ message: "Antenatal record saved", id: result.insertId });
  });
};

exports.updateAntenatal = (req, res) => {
  const { id } = req.params;
  const { woman_name, age, spouse_name, lmp, edd, weight, bp, hb, urine_sugar } = req.body;

  if (!lmp) return res.status(400).json({ message: "LMP is required" });

  const sql = `
    UPDATE antenatal_records SET
      woman_name=?, age=?, spouse_name=?, lmp=?, edd=?,
      weight=?, bp=?, hb=?, urine_sugar=?
    WHERE id=?
  `;

  db.query(sql, [woman_name, age, spouse_name, lmp, edd, weight, bp, hb, urine_sugar, id], (err) => {
    if (err) { console.error("DB Error:", err); return res.status(500).json({ message: "Database error" }); }
    res.status(200).json({ message: "Antenatal record updated", id: parseInt(id) });
  });
};

exports.getAntenatalBySurveyId = (req, res) => {
  const { survey_id } = req.params;
  const sql = `SELECT * FROM antenatal_records WHERE survey_id = ?`;
  db.query(sql, [survey_id], (err, results) => {
    if (err) { console.error("DB Error:", err); return res.status(500).json({ message: "Database error" }); }
    res.status(200).json(results);
  });
};

// const db = require('../db'); // adjust if your db path is different

// /* ============================= */
// /* SAVE ANTENATAL */
// /* ============================= */

// exports.saveAntenatal = (req, res) => {

//     const {
//         survey_id,
//         woman_name,
//         age,
//         spouse_name,
//         lmp,
//         edd,
//         weight,
//         bp,
//         hb,
//         urine_sugar
//     } = req.body;

//     if (!lmp) {
//         return res.status(400).json({ message: "LMP is required" });
//     }

//     const sql = `
//         INSERT INTO antenatal_records
//         (survey_id, woman_name, age, spouse_name, lmp, edd,
//          weight, bp, hb, urine_sugar)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     db.query(sql, [
//         survey_id,
//         woman_name,
//         age,
//         spouse_name,
//         lmp,
//         edd,
//         weight,
//         bp,
//         hb,
//         urine_sugar
//     ], (err, result) => {

//         if (err) {
//             console.error("DB Error:", err);
//             return res.status(500).json({ message: "Database error" });
//         }

//         res.status(200).json({
//             message: "Antenatal record saved",
//             id: result.insertId
//         });
//     });
// };


// /* ============================= */
// /* GET ANTENATAL BY SURVEY ID */
// /* ============================= */

// exports.getAntenatalBySurveyId = (req, res) => {

//     const { survey_id } = req.params;

//     const sql = `SELECT * FROM antenatal_records WHERE survey_id = ?`;

//     db.query(sql, [survey_id], (err, results) => {

//         if (err) {
//             console.error("DB Error:", err);
//             return res.status(500).json({ message: "Database error" });
//         }

//         res.status(200).json(results);
//     });
// };
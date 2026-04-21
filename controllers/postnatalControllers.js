const db = require('../db');

exports.savePostnatal = (req, res) => {
  const {
    survey_id, member_id, delivery_date, delivery_time, place, conducted_by,
    membrane_rupture, labour_duration, hemorrhage, followup_date,
    breast_engorgement, nipple_condition, perineum_condition, discharge_pv,
    personal_hygiene, diet_type, involution, any_complaint
  } = req.body;

  if (!delivery_date) return res.status(400).json({ message: "Delivery date is required" });

  const sql = `
    INSERT INTO postnatal_records (
      survey_id, member_id, delivery_date, delivery_time, place, conducted_by,
      membrane_rupture, labour_duration, hemorrhage, followup_date,
      breast_engorgement, nipple_condition, perineum_condition, discharge_pv,
      personal_hygiene, diet_type, involution, any_complaint
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    survey_id, member_id, delivery_date, delivery_time, place, conducted_by,
    membrane_rupture, labour_duration, hemorrhage, followup_date,
    breast_engorgement, nipple_condition, perineum_condition, discharge_pv,
    personal_hygiene, diet_type, involution, any_complaint
  ], (err, result) => {
    if (err) { console.error("Postnatal DB Error:", err); return res.status(500).json({ message: "Database error" }); }
    res.status(200).json({ message: "Postnatal record saved", id: result.insertId });
  });
};

exports.updatePostnatal = (req, res) => {
  const { id } = req.params;
  const {
    delivery_date, delivery_time, place, conducted_by,
    membrane_rupture, labour_duration, hemorrhage, followup_date,
    breast_engorgement, nipple_condition, perineum_condition, discharge_pv,
    personal_hygiene, diet_type, involution, any_complaint
  } = req.body;

  const sql = `
    UPDATE postnatal_records SET
      delivery_date=?, delivery_time=?, place=?, conducted_by=?,
      membrane_rupture=?, labour_duration=?, hemorrhage=?, followup_date=?,
      breast_engorgement=?, nipple_condition=?, perineum_condition=?, discharge_pv=?,
      personal_hygiene=?, diet_type=?, involution=?, any_complaint=?
    WHERE id=?
  `;

  db.query(sql, [
    delivery_date, delivery_time, place, conducted_by,
    membrane_rupture, labour_duration, hemorrhage, followup_date,
    breast_engorgement, nipple_condition, perineum_condition, discharge_pv,
    personal_hygiene, diet_type, involution, any_complaint, id
  ], (err) => {
    if (err) { console.error("Postnatal Update Error:", err); return res.status(500).json({ message: "Database error" }); }
    res.status(200).json({ message: "Postnatal record updated", id: parseInt(id) });
  });
};

// const db = require('../db');

// exports.savePostnatal = (req, res) => {

//   const {
//     survey_id, member_id,
//     delivery_date, delivery_time, place, conducted_by,
//     membrane_rupture, labour_duration, hemorrhage,
//     followup_date, breast_engorgement, nipple_condition,
//     perineum_condition, discharge_pv, personal_hygiene,
//     diet_type, involution, any_complaint
//   } = req.body;

//   if (!delivery_date) {
//     return res.status(400).json({ message: "Delivery date is required" });
//   }

//   const sql = `
//     INSERT INTO postnatal_records (
//       survey_id, member_id,
//       delivery_date, delivery_time, place, conducted_by,
//       membrane_rupture, labour_duration, hemorrhage,
//       followup_date, breast_engorgement, nipple_condition,
//       perineum_condition, discharge_pv, personal_hygiene,
//       diet_type, involution, any_complaint
//     )
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;

//   db.query(sql, [
//     survey_id, member_id,
//     delivery_date, delivery_time, place, conducted_by,
//     membrane_rupture, labour_duration, hemorrhage,
//     followup_date, breast_engorgement, nipple_condition,
//     perineum_condition, discharge_pv, personal_hygiene,
//     diet_type, involution, any_complaint
//   ], (err, result) => {

//     if (err) {
//       console.error("Postnatal DB Error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     res.status(200).json({
//       message: "Postnatal record saved",
//       id: result.insertId
//     });
//   });
// };
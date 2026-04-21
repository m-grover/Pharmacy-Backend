const db = require('../db');

exports.saveObstetrical = (req, res) => {
  const {
    survey_id, member_id, child_number, pregnancy, problem_full_term,
    miscarriage, abortion, delivery_type, place_of_delivery, year_of_delivery,
    type_of_delivery, sex_of_baby, outcome, still_baby, birth_weight,
    present_status, cause_of_death, conducted_by, remarks
  } = req.body;

  const sql = `
    INSERT INTO obstetrical_records (
      survey_id, member_id, child_number, pregnancy, problem_full_term,
      miscarriage, abortion, delivery_type, place_of_delivery, year_of_delivery,
      type_of_delivery, sex_of_baby, outcome, still_baby, birth_weight,
      present_status, cause_of_death, conducted_by, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    survey_id, member_id, child_number, pregnancy, problem_full_term,
    miscarriage, abortion, delivery_type, place_of_delivery, year_of_delivery,
    type_of_delivery, sex_of_baby, outcome, still_baby, birth_weight,
    present_status, cause_of_death, conducted_by, remarks
  ], (err, result) => {
    if (err) { console.error("Obstetrical DB Error:", err); return res.status(500).json({ message: "Database error" }); }
    res.status(200).json({ message: "Obstetrical record saved", id: result.insertId });
  });
};

exports.updateObstetrical = (req, res) => {
  const { id } = req.params;
  const {
    pregnancy, problem_full_term, miscarriage, abortion, delivery_type,
    place_of_delivery, year_of_delivery, type_of_delivery, sex_of_baby,
    outcome, still_baby, birth_weight, present_status, cause_of_death,
    conducted_by, remarks
  } = req.body;

  const sql = `
    UPDATE obstetrical_records SET
      pregnancy=?, problem_full_term=?, miscarriage=?, abortion=?,
      delivery_type=?, place_of_delivery=?, year_of_delivery=?, type_of_delivery=?,
      sex_of_baby=?, outcome=?, still_baby=?, birth_weight=?,
      present_status=?, cause_of_death=?, conducted_by=?, remarks=?
    WHERE id=?
  `;

  db.query(sql, [
    pregnancy, problem_full_term, miscarriage, abortion, delivery_type,
    place_of_delivery, year_of_delivery, type_of_delivery, sex_of_baby,
    outcome, still_baby, birth_weight, present_status, cause_of_death,
    conducted_by, remarks, id
  ], (err) => {
    if (err) { console.error("Obstetrical Update Error:", err); return res.status(500).json({ message: "Database error" }); }
    res.status(200).json({ message: "Obstetrical record updated", id: parseInt(id) });
  });
};

// const db = require('../db');

// exports.saveObstetrical = (req, res) => {

//   const {
//     survey_id, member_id, child_number,
//     pregnancy, problem_full_term, miscarriage, abortion,
//     delivery_type, place_of_delivery, year_of_delivery,
//     type_of_delivery, sex_of_baby, outcome, still_baby,
//     birth_weight, present_status, cause_of_death,
//     conducted_by, remarks
//   } = req.body;

//   const sql = `
//     INSERT INTO obstetrical_records (
//       survey_id, member_id, child_number,
//       pregnancy, problem_full_term, miscarriage, abortion,
//       delivery_type, place_of_delivery, year_of_delivery,
//       type_of_delivery, sex_of_baby, outcome, still_baby,
//       birth_weight, present_status, cause_of_death,
//       conducted_by, remarks
//     )
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;

//   db.query(sql, [
//     survey_id, member_id, child_number,
//     pregnancy, problem_full_term, miscarriage, abortion,
//     delivery_type, place_of_delivery, year_of_delivery,
//     type_of_delivery, sex_of_baby, outcome, still_baby,
//     birth_weight, present_status, cause_of_death,
//     conducted_by, remarks
//   ], (err, result) => {

//     if (err) {
//       console.error("Obstetrical DB Error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     res.status(200).json({
//       message: "Obstetrical record saved",
//       id: result.insertId
//     });
//   });
// };
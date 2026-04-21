const db = require('../db');

exports.saveChildcare = (req, res) => {
  const {
    survey_id, member_id, child_number, birth_weight,
    vax1, vax2, vax3, vax4, vax5, vax6,
    ms_sitting, ms_crawling, ms_standing, ms_walking,
    ms_incisors, ms_speaking, ms_drinking,
    breast_start, breast_stop, bottle_start, bottle_stop,
    spoon_start, spoon_stop, wean_start, wean_stop,
    normal_diet_start, normal_diet_stop
  } = req.body;

  const sql = `
    INSERT INTO childcare_records (
      survey_id, member_id, child_number, birth_weight,
      vax1, vax2, vax3, vax4, vax5, vax6,
      ms_sitting, ms_crawling, ms_standing, ms_walking,
      ms_incisors, ms_speaking, ms_drinking,
      breast_start, breast_stop, bottle_start, bottle_stop,
      spoon_start, spoon_stop, wean_start, wean_stop,
      normal_diet_start, normal_diet_stop
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    survey_id, member_id, child_number, birth_weight || null,
    vax1||null, vax2||null, vax3||null, vax4||null, vax5||null, vax6||null,
    ms_sitting||null, ms_crawling||null, ms_standing||null, ms_walking||null,
    ms_incisors||null, ms_speaking||null, ms_drinking||null,
    breast_start||null, breast_stop||null, bottle_start||null, bottle_stop||null,
    spoon_start||null, spoon_stop||null, wean_start||null, wean_stop||null,
    normal_diet_start||null, normal_diet_stop||null
  ], (err, result) => {
    if (err) { console.error("Childcare DB Error:", err); return res.status(500).json({ message: "Database error" }); }
    res.status(200).json({ message: "Childcare record saved", id: result.insertId });
  });
};

exports.updateChildcare = (req, res) => {
  const { id } = req.params;
  const {
    birth_weight, vax1, vax2, vax3, vax4, vax5, vax6,
    ms_sitting, ms_crawling, ms_standing, ms_walking,
    ms_incisors, ms_speaking, ms_drinking,
    breast_start, breast_stop, bottle_start, bottle_stop,
    spoon_start, spoon_stop, wean_start, wean_stop,
    normal_diet_start, normal_diet_stop
  } = req.body;

  const sql = `
    UPDATE childcare_records SET
      birth_weight=?, vax1=?, vax2=?, vax3=?, vax4=?, vax5=?, vax6=?,
      ms_sitting=?, ms_crawling=?, ms_standing=?, ms_walking=?,
      ms_incisors=?, ms_speaking=?, ms_drinking=?,
      breast_start=?, breast_stop=?, bottle_start=?, bottle_stop=?,
      spoon_start=?, spoon_stop=?, wean_start=?, wean_stop=?,
      normal_diet_start=?, normal_diet_stop=?
    WHERE id=?
  `;

  db.query(sql, [
    birth_weight||null, vax1||null, vax2||null, vax3||null, vax4||null, vax5||null, vax6||null,
    ms_sitting||null, ms_crawling||null, ms_standing||null, ms_walking||null,
    ms_incisors||null, ms_speaking||null, ms_drinking||null,
    breast_start||null, breast_stop||null, bottle_start||null, bottle_stop||null,
    spoon_start||null, spoon_stop||null, wean_start||null, wean_stop||null,
    normal_diet_start||null, normal_diet_stop||null, id
  ], (err) => {
    if (err) { console.error("Childcare Update Error:", err); return res.status(500).json({ message: "Database error" }); }
    res.status(200).json({ message: "Childcare record updated", id: parseInt(id) });
  });
};

// const db = require('../db');

// exports.saveChildcare = (req, res) => {

//   const {
//     survey_id, member_id, child_number, birth_weight,
//     vax1, vax2, vax3, vax4, vax5, vax6,
//     ms_sitting, ms_crawling, ms_standing, ms_walking,
//     ms_incisors, ms_speaking, ms_drinking,
//     breast_start, breast_stop, bottle_start, bottle_stop,
//     spoon_start, spoon_stop, wean_start, wean_stop,
//     normal_diet_start, normal_diet_stop
//   } = req.body;

//   const sql = `
//     INSERT INTO childcare_records (
//       survey_id, member_id, child_number, birth_weight,
//       vax1, vax2, vax3, vax4, vax5, vax6,
//       ms_sitting, ms_crawling, ms_standing, ms_walking,
//       ms_incisors, ms_speaking, ms_drinking,
//       breast_start, breast_stop, bottle_start, bottle_stop,
//       spoon_start, spoon_stop, wean_start, wean_stop,
//       normal_diet_start, normal_diet_stop
//     )
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;

//   db.query(sql, [
//     survey_id, member_id, child_number, birth_weight || null,
//     vax1 || null, vax2 || null, vax3 || null,
//     vax4 || null, vax5 || null, vax6 || null,
//     ms_sitting || null, ms_crawling || null, ms_standing || null,
//     ms_walking || null, ms_incisors || null, ms_speaking || null,
//     ms_drinking || null,
//     breast_start || null, breast_stop || null,
//     bottle_start || null, bottle_stop || null,
//     spoon_start || null, spoon_stop || null,
//     wean_start || null, wean_stop || null,
//     normal_diet_start || null, normal_diet_stop || null
//   ], (err, result) => {

//     if (err) {
//       console.error("Childcare DB Error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     res.status(200).json({
//       message: "Childcare record saved",
//       id: result.insertId
//     });
//   });
// };
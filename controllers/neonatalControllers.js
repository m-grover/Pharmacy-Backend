const db = require('../db');

// Convert empty string / undefined / null → null for numeric columns
const toFloat = v => (v === "" || v === undefined || v === null) ? null : parseFloat(v);

// Convert empty string / undefined / null → null for date/time columns
const toDate  = v => (v === "" || v === undefined || v === null) ? null : v;

exports.saveNeonatal = (req, res) => {
  const data = req.body;
  if (!data.delivery_date) return res.status(400).json({ message: "Delivery date required" });

  const sql = `
    INSERT INTO neonatal_records (
      survey_id, baby_name, sex, delivery_date, delivery_time, place, conducted_by,
      birth_weight, followup_date, abnormality, weight, oozing_cord, infected_cord,
      red_eyes, eye_discharge, distended_abdomen, diarrhea, fever, cough,
      other_symptoms, breastfeeding, ghurti, water, tea, bottle_milk
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.survey_id    || null,
    data.baby_name    || null,
    data.sex          || null,
    toDate(data.delivery_date),           // DATE — must not be ""
    toDate(data.delivery_time),           // TIME — must not be ""
    data.place        || null,
    data.conducted_by || null,
    toFloat(data.birth_weight),           // FLOAT — must not be ""
    toDate(data.followup_date),           // DATE — must not be ""
    data.abnormality  || null,
    toFloat(data.weight),                 // FLOAT — must not be ""
    data.oozing_cord         || null,
    data.infected_cord       || null,
    data.red_eyes            || null,
    data.eye_discharge       || null,
    data.distended_abdomen   || null,
    data.diarrhea            || null,
    data.fever               || null,
    data.cough               || null,
    data.other_symptoms      || null,
    data.breastfeeding       || null,
    data.ghurti              || null,
    data.water               || null,
    data.tea                 || null,
    data.bottle_milk         || null,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Neonatal DB Error:", err);
      return res.status(500).json({ message: "Database error", detail: err.message });
    }
    res.json({ message: "Saved successfully", id: result.insertId });
  });
};

exports.updateNeonatal = (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const sql = `
    UPDATE neonatal_records SET
      baby_name=?, sex=?, delivery_date=?, delivery_time=?, place=?, conducted_by=?,
      birth_weight=?, followup_date=?, abnormality=?, weight=?, oozing_cord=?,
      infected_cord=?, red_eyes=?, eye_discharge=?, distended_abdomen=?, diarrhea=?,
      fever=?, cough=?, other_symptoms=?, breastfeeding=?, ghurti=?, water=?, tea=?, bottle_milk=?
    WHERE id=?
  `;

  const values = [
    data.baby_name    || null,
    data.sex          || null,
    toDate(data.delivery_date),
    toDate(data.delivery_time),
    data.place        || null,
    data.conducted_by || null,
    toFloat(data.birth_weight),
    toDate(data.followup_date),
    data.abnormality  || null,
    toFloat(data.weight),
    data.oozing_cord         || null,
    data.infected_cord       || null,
    data.red_eyes            || null,
    data.eye_discharge       || null,
    data.distended_abdomen   || null,
    data.diarrhea            || null,
    data.fever               || null,
    data.cough               || null,
    data.other_symptoms      || null,
    data.breastfeeding       || null,
    data.ghurti              || null,
    data.water               || null,
    data.tea                 || null,
    data.bottle_milk         || null,
    id,
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error("Neonatal Update Error:", err);
      return res.status(500).json({ message: "Database error", detail: err.message });
    }
    res.json({ message: "Updated successfully", id: parseInt(id) });
  });
};

// const db = require('../db');

// exports.saveNeonatal = (req, res) => {
//   const data = req.body;
//   if (!data.delivery_date) return res.status(400).json({ message: "Delivery date required" });

//   const sql = `
//     INSERT INTO neonatal_records (
//       survey_id, baby_name, sex, delivery_date, delivery_time, place, conducted_by,
//       birth_weight, followup_date, abnormality, weight, oozing_cord, infected_cord,
//       red_eyes, eye_discharge, distended_abdomen, diarrhea, fever, cough,
//       other_symptoms, breastfeeding, ghurti, water, tea, bottle_milk
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;

//   const values = [
//     data.survey_id, data.baby_name, data.sex, data.delivery_date, data.delivery_time,
//     data.place, data.conducted_by, data.birth_weight, data.followup_date, data.abnormality,
//     data.weight, data.oozing_cord, data.infected_cord, data.red_eyes, data.eye_discharge,
//     data.distended_abdomen, data.diarrhea, data.fever, data.cough, data.other_symptoms,
//     data.breastfeeding, data.ghurti, data.water, data.tea, data.bottle_milk
//   ];

//   db.query(sql, values, (err, result) => {
//     if (err) { console.error(err); return res.status(500).json({ message: "Database error" }); }
//     res.json({ message: "Saved successfully", id: result.insertId });
//   });
// };

// exports.updateNeonatal = (req, res) => {
//   const { id } = req.params;
//   const data = req.body;

//   const sql = `
//     UPDATE neonatal_records SET
//       baby_name=?, sex=?, delivery_date=?, delivery_time=?, place=?, conducted_by=?,
//       birth_weight=?, followup_date=?, abnormality=?, weight=?, oozing_cord=?,
//       infected_cord=?, red_eyes=?, eye_discharge=?, distended_abdomen=?, diarrhea=?,
//       fever=?, cough=?, other_symptoms=?, breastfeeding=?, ghurti=?, water=?, tea=?, bottle_milk=?
//     WHERE id=?
//   `;

//   const values = [
//     data.baby_name, data.sex, data.delivery_date, data.delivery_time,
//     data.place, data.conducted_by, data.birth_weight, data.followup_date, data.abnormality,
//     data.weight, data.oozing_cord, data.infected_cord, data.red_eyes, data.eye_discharge,
//     data.distended_abdomen, data.diarrhea, data.fever, data.cough, data.other_symptoms,
//     data.breastfeeding, data.ghurti, data.water, data.tea, data.bottle_milk, id
//   ];

//   db.query(sql, values, (err) => {
//     if (err) { console.error(err); return res.status(500).json({ message: "Database error" }); }
//     res.json({ message: "Updated successfully", id: parseInt(id) });
//   });
// };
const db = require('../db');

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
    data.survey_id, data.baby_name, data.sex, data.delivery_date, data.delivery_time,
    data.place, data.conducted_by, data.birth_weight, data.followup_date, data.abnormality,
    data.weight, data.oozing_cord, data.infected_cord, data.red_eyes, data.eye_discharge,
    data.distended_abdomen, data.diarrhea, data.fever, data.cough, data.other_symptoms,
    data.breastfeeding, data.ghurti, data.water, data.tea, data.bottle_milk
  ];

  db.query(sql, values, (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: "Database error" }); }
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
    data.baby_name, data.sex, data.delivery_date, data.delivery_time,
    data.place, data.conducted_by, data.birth_weight, data.followup_date, data.abnormality,
    data.weight, data.oozing_cord, data.infected_cord, data.red_eyes, data.eye_discharge,
    data.distended_abdomen, data.diarrhea, data.fever, data.cough, data.other_symptoms,
    data.breastfeeding, data.ghurti, data.water, data.tea, data.bottle_milk, id
  ];

  db.query(sql, values, (err) => {
    if (err) { console.error(err); return res.status(500).json({ message: "Database error" }); }
    res.json({ message: "Updated successfully", id: parseInt(id) });
  });
};

// const db = require('../db');

// exports.saveNeonatal = (req, res) => {

//     const data = req.body;

//     if (!data.delivery_date) {
//         return res.status(400).json({ message: "Delivery date required" });
//     }

//     const sql = `
//         INSERT INTO neonatal_records (
//             survey_id, baby_name, sex,
//             delivery_date, delivery_time, place, conducted_by,
//             birth_weight, followup_date, abnormality,
//             weight, oozing_cord, infected_cord, red_eyes,
//             eye_discharge, distended_abdomen, diarrhea,
//             fever, cough, other_symptoms,
//             breastfeeding, ghurti, water, tea, bottle_milk
//         )
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     db.query(sql, [
//         data.survey_id,
//         data.baby_name,
//         data.sex,

//         data.delivery_date,
//         data.delivery_time,
//         data.place,
//         data.conducted_by,

//         data.birth_weight,
//         data.followup_date,
//         data.abnormality,

//         data.weight,
//         data.oozing_cord,
//         data.infected_cord,
//         data.red_eyes,
//         data.eye_discharge,
//         data.distended_abdomen,
//         data.diarrhea,
//         data.fever,
//         data.cough,
//         data.other_symptoms,

//         data.breastfeeding,
//         data.ghurti,
//         data.water,
//         data.tea,
//         data.bottle_milk

//     ], (err, result) => {

//         if (err) {
//             console.error(err);
//             return res.status(500).json({ message: "Database error" });
//         }

//         res.json({ message: "Saved successfully" });
//     });
// };
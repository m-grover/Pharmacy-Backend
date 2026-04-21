const db = require("../db");

exports.addMember = (req, res) => {
  const {
    family_id, name, spouse, relation, aadhar_head, aadhar, phone,
    sex, dob, age, diet, education, employment, income,
    height, weight, bmi, systolic, diastolic, sugar, hb,
    urineSugar, urinealbumin, smoke, alcohol, healthProblem,
    communicable, noncommunicable,
  } = req.body;

  const checkSql = `SELECT member_id FROM members WHERE aadhar = ? LIMIT 1`;

  db.query(checkSql, [aadhar], (checkErr, checkResult) => {
    if (checkErr) return res.status(500).send(checkErr);

    if (checkResult.length > 0) {
      return res.status(409).json({ message: "A member with this Aadhar number already exists." });
    }

    const memberSql = `
      INSERT INTO members 
      (family_id, name, spouse_name, relation, aadhar_head, aadhar, phone, sex, dob, age, diet, education, employment, income)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(memberSql, [
      family_id, name, spouse, relation, aadhar_head, aadhar,
      phone, sex, dob, age, diet, education, employment, income,
    ], (err, memberResult) => {
      if (err) { console.error("Member Insert Error:", err); return res.status(500).json({ error: err.message }); }

      const member_id = memberResult.insertId;

      const clinicalSql = `
        INSERT INTO clinical_data 
        (member_id, height, weight, bmi, systolic, diastolic, sugar, hb,
         urine_sugar, urine_albumin, smoke, alcohol, health_problem, communicable, non_communicable)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(clinicalSql, [
        member_id,
        height || null, weight || null, bmi || null,
        parseInt(systolic) || null, parseInt(diastolic) || null,
        sugar || null, hb || null,
        urineSugar || null, urinealbumin || null,
        smoke || null, alcohol || null, healthProblem || null,
        communicable || null, noncommunicable || null,
      ], (err2) => {
        if (err2) { console.error("Clinical Insert Error:", err2); return res.status(500).json({ error: err2.message }); }
        return res.status(200).json({ member_id });
      });
    });
  });
};

exports.updateMember = (req, res) => {
  const { id } = req.params;
  const {
    name, spouse, relation, phone, sex, dob, age, diet,
    education, employment, income,
    height, weight, bmi, systolic, diastolic, sugar, hb,
    urineSugar, urinealbumin, smoke, alcohol, healthProblem,
    communicable, noncommunicable,
  } = req.body;

  const memberSql = `
    UPDATE members SET
      name=?, spouse_name=?, relation=?, phone=?, sex=?, dob=?, age=?,
      diet=?, education=?, employment=?, income=?
    WHERE member_id=?
  `;

  db.query(memberSql, [
    name, spouse, relation, phone, sex, dob, age,
    diet, education, employment, income, id
  ], (err) => {
    if (err) { console.error("Member Update Error:", err); return res.status(500).json({ error: err.message }); }

    const clinicalSql = `
      UPDATE clinical_data SET
        height=?, weight=?, bmi=?, systolic=?, diastolic=?, sugar=?, hb=?,
        urine_sugar=?, urine_albumin=?, smoke=?, alcohol=?,
        health_problem=?, communicable=?, non_communicable=?
      WHERE member_id=?
    `;

    db.query(clinicalSql, [
      height || null, weight || null, bmi || null,
      parseInt(systolic) || null, parseInt(diastolic) || null,
      sugar || null, hb || null,
      urineSugar || null, urinealbumin || null,
      smoke || null, alcohol || null, healthProblem || null,
      communicable || null, noncommunicable || null, id
    ], (err2) => {
      if (err2) { console.error("Clinical Update Error:", err2); return res.status(500).json({ error: err2.message }); }
      return res.status(200).json({ member_id: parseInt(id) });
    });
  });
};

exports.getMemberById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      m.member_id, m.name, m.spouse_name, m.age,
      c.weight, c.systolic, c.diastolic, c.hb, c.urine_sugar
    FROM members m
    LEFT JOIN clinical_data c ON m.member_id = c.member_id
    WHERE m.member_id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) { console.error("DB Error:", err); return res.status(500).json({ message: "Database error" }); }
    if (result.length === 0) return res.status(404).json({ message: "Member not found" });
    res.status(200).json(result[0]);
  });
};

// const db = require("../db");

// exports.addMember = (req, res) => {
//   const {
//     family_id,
//     name,
//     spouse,
//     relation,
//     aadhar_head,
//     aadhar,
//     phone,
//     sex,
//     dob,
//     age,
//     diet,
//     education,
//     employment,
//     income,
//     height,
//     weight,
//     bmi,
//     systolic,
//     diastolic,
//     sugar,
//     hb,
//     urineSugar,
//     urinealbumin,
//     smoke,
//     alcohol,
//     healthProblem,
//     communicable,
//     noncommunicable,
//   } = req.body;

//   // ✅ 1. Check for duplicate aadhar
//   const checkSql = `SELECT member_id FROM members WHERE aadhar = ? LIMIT 1`;

//   db.query(checkSql, [aadhar], (checkErr, checkResult) => {
//     if (checkErr) return res.status(500).send(checkErr);

//     if (checkResult.length > 0) {
//       return res
//         .status(409)
//         .json({ message: "A member with this Aadhar number already exists." });
//     }

//     // 2. Insert member
//     const memberSql = `
//             INSERT INTO members 
//             (family_id, name, spouse_name, relation, aadhar_head, aadhar, phone, sex, dob, age, diet, education, employment, income)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//     db.query(
//       memberSql,
//       [
//         family_id,
//         name,
//         spouse,
//         relation,
//         aadhar_head,
//         aadhar,
//         phone,
//         sex,
//         dob,
//         age,
//         diet,
//         education,
//         employment,
//         income,
//       ],
//       (err, memberResult) => {
//         if (err) {
//           console.error("Member Insert Error:", err);
//           return res.status(500).json({ error: err.message });
//         }

//         const member_id = memberResult.insertId;

//         // 3. Insert clinical data
//         const clinicalSql = `
//                 INSERT INTO clinical_data 
//                 (member_id, height, weight, bmi, systolic, diastolic, sugar, hb,
//                  urine_sugar, urine_albumin, smoke, alcohol, health_problem,
//                  communicable, non_communicable)
//                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `;

//         db.query(
//           clinicalSql,
//           [
//             member_id,
//             height || null,
//             weight || null,
//             bmi || null,
//             parseInt(systolic) || null,
// parseInt(diastolic) || null,
//             sugar || null,
//             hb || null,
//             urineSugar || null,
//             urinealbumin || null,
//             smoke || null,
//             alcohol || null,
//             healthProblem || null,
//             communicable || null,
//             noncommunicable || null,
//           ],
//           (err2) => {
//             if (err2) {
//               console.error("Clinical Insert Error:", err2);
//               return res.status(500).json({ error: err2.message });
//             }

//             // ✅ ADD THIS — send success response after both inserts complete
//             return res.status(200).json({ member_id: member_id });
//           },
//         );
//       },
//     );
//   });
// };

// exports.getMemberById = (req, res) => {
//   const { id } = req.params;

//   const sql = `
//         SELECT 
//             m.member_id,
//             m.name,
//             m.spouse_name,
//             m.age,

//             c.weight,
//             c.systolic,
//             c.diastolic,
//             c.hb,
//             c.urine_sugar

//         FROM members m
//         LEFT JOIN clinical_data c 
//         ON m.member_id = c.member_id

//         WHERE m.member_id = ?
//     `;

//   db.query(sql, [id], (err, result) => {
//     if (err) {
//       console.error("DB Error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     if (result.length === 0) {
//       return res.status(404).json({ message: "Member not found" });
//     }

//     res.status(200).json(result[0]);
//   });
// };

const db = require('../db');

/* ============================= */
/* GET PATIENT RECORDS           */
/* ============================= */
exports.getPatients = (req, res) => {
  const sql = `
    SELECT 
      m.member_id        AS id,
      m.name,
      m.age,
      m.created_at       AS lastVisit,
      f.village,
      c.systolic,
      c.diastolic,
      c.sugar,
      c.hb               AS hemoglobin,
      c.urine_sugar      AS urineSugar,
      c.bmi,
      u.name             AS conductedBy
    FROM members m
    LEFT JOIN clinical_data c  ON c.member_id  = m.member_id
    LEFT JOIN families f       ON f.family_id  = m.family_id
    LEFT JOIN users u          ON u.user_id    = f.created_by
    ORDER BY m.created_at DESC
  `;

  db.query(sql, [], (err, results) => {
    if (err) { console.error("Dashboard patients error:", err); return res.status(500).json({ message: "Database error" }); }

    const patients = results.map(row => {
      const systolic  = parseInt(row.systolic)  || 0;
      const diastolic = parseInt(row.diastolic) || 0;
      const sugar     = parseFloat(row.sugar)   || 0;
      const bmi       = parseFloat(row.bmi)     || 0;
      const age       = parseInt(row.age)       || 0;

      const hasBP    = systolic >= 140 || diastolic >= 90;
      const hasSugar = sugar >= 140;
      const hasBoth  = hasBP && hasSugar;

      let condition = "Normal";
      if (hasBoth)       condition = "Both BP & Sugar";
      else if (hasBP)    condition = "High Blood Pressure";
      else if (hasSugar) condition = "High Sugar/Diabetes";

      let ageGroup = "Adult";
      if (age < 6)        ageGroup = "Under 5";
      else if (age <= 19) ageGroup = "Adolescence";
      else if (age <= 59) ageGroup = "Adult";
      else                ageGroup = "Senior Citizen";

      return {
        id:          row.id,
        name:        row.name        || "Unknown",
        age,
        ageGroup,
        village:     row.village     || "-",
        bp:          systolic && diastolic ? `${systolic}/${diastolic}` : "N/A",
        sugar:       sugar   || null,
        hemoglobin:  row.hemoglobin  || null,
        urineSugar:  row.urineSugar  || "No",
        bmi,
        condition,
        conductedBy: row.conductedBy || "Unknown",
        lastVisit:   row.lastVisit ? new Date(row.lastVisit).toISOString().split("T")[0] : "N/A",
        hasBP, hasSugar, hasBoth
      };
    });

    res.status(200).json(patients);
  });
};

/* ============================= */
/* GET FULL CLIENT DETAILS       */
/* ============================= */
exports.getClientDetails = (req, res) => {
  const { id } = req.params;

  // 1. Member + Clinical
  const memberSql = `
    SELECT m.*, c.height, c.weight, c.bmi, c.systolic, c.diastolic,
           c.sugar, c.hb, c.urine_sugar, c.urine_albumin,
           c.smoke, c.alcohol, c.health_problem, c.communicable, c.non_communicable
    FROM members m
    LEFT JOIN clinical_data c ON c.member_id = m.member_id
    WHERE m.member_id = ?
  `;

  db.query(memberSql, [id], (err, memberRows) => {
    if (err) return res.status(500).json({ message: "DB error", detail: err.message });
    if (!memberRows.length) return res.status(404).json({ message: "Member not found" });

    const member = memberRows[0];

    // 2. Family + Economic
    const familySql = `
      SELECT f.*, e.family_income, e.income_source, e.house_ownership,
             e.land_ownership, e.assets, e.bpl, e.scheme
      FROM families f
      LEFT JOIN economic_status e ON e.family_id = f.family_id
      WHERE f.family_id = ?
    `;

    db.query(familySql, [member.family_id], (err2, familyRows) => {
      if (err2) return res.status(500).json({ message: "DB error", detail: err2.message });

      const family = familyRows[0] || {};

      // 3. Pregnancy
      const pregSql = `SELECT * FROM pregnancy WHERE member_id = ? LIMIT 1`;
      db.query(pregSql, [id], (err3, pregRows) => {
        if (err3) return res.status(500).json({ message: "DB error", detail: err3.message });

        // 4. Antenatal
        const antenatalSql = `SELECT * FROM antenatal_records WHERE member_id = ? LIMIT 1`;
        db.query(antenatalSql, [id], (err4, antenatalRows) => {
          if (err4) return res.status(500).json({ message: "DB error", detail: err4.message });

          // 5. Postnatal
          const postnatalSql = `SELECT * FROM postnatal_records WHERE member_id = ? LIMIT 1`;
          db.query(postnatalSql, [id], (err5, postnatalRows) => {
            if (err5) return res.status(500).json({ message: "DB error", detail: err5.message });

            // 6. Neonatal
            const neonatalSql = `SELECT * FROM neonatal_records WHERE member_id = ? LIMIT 1`;
            db.query(neonatalSql, [id], (err6, neonatalRows) => {
              if (err6) return res.status(500).json({ message: "DB error", detail: err6.message });

              // 7. Obstetrical
              const obsSql = `SELECT * FROM obstetrical_records WHERE member_id = ?`;
              db.query(obsSql, [id], (err7, obsRows) => {
                if (err7) return res.status(500).json({ message: "DB error", detail: err7.message });

                // 8. Childcare
                const childSql = `SELECT * FROM childcare_records WHERE member_id = ?`;
                db.query(childSql, [id], (err8, childRows) => {
                  if (err8) return res.status(500).json({ message: "DB error", detail: err8.message });

                  res.status(200).json({
                    member,
                    family,
                    pregnancy:    pregRows[0]      || null,
                    antenatal:    antenatalRows[0] || null,
                    postnatal:    postnatalRows[0] || null,
                    neonatal:     neonatalRows[0]  || null,
                    obstetrical:  obsRows,
                    childcare:    childRows,
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

/* ============================= */
/* GET STUDENT RECORDS           */
/* ============================= */
exports.getStudents = (req, res) => {
  const sql = `
    SELECT 
      u.user_id, u.name, u.student_id AS rollno, u.email,
      u.village, u.semester, u.area, u.supervisor,
      COUNT(DISTINCT f.family_id) AS families,
      COUNT(DISTINCT m.member_id) AS patients,
      MAX(m.created_at)           AS lastVisit
    FROM users u
    LEFT JOIN families f ON f.created_by = u.user_id
    LEFT JOIN members m  ON m.family_id  = f.family_id
    WHERE u.role = 'student'
    GROUP BY u.user_id
    ORDER BY lastVisit DESC
  `;

  db.query(sql, [], (err, results) => {
    if (err) { console.error("Dashboard students error:", err); return res.status(500).json({ message: "Database error" }); }

    const students = results.map(row => ({
      id:         row.user_id,
      name:       row.name,
      rollno:     row.rollno,
      email:      row.email,
      village:    row.village    || "-",
      semester:   row.semester   || "-",
      area:       row.area       || "-",
      supervisor: row.supervisor || "-",
      families:   row.families,
      patients:   row.patients,
      lastVisit:  row.lastVisit ? new Date(row.lastVisit).toISOString().split("T")[0] : "N/A"
    }));

    res.status(200).json(students);
  });
};
// const db = require('../db');

// /* ============================= */
// /* GET PATIENT RECORDS */
// /* ============================= */
// exports.getPatients = (req, res) => {

//   const sql = `
//     SELECT 
//       m.member_id        AS id,
//       m.name,
//       m.age,
//       m.created_at       AS lastVisit,
//       c.systolic,
//       c.diastolic,
//       c.sugar,
//       c.hb               AS hemoglobin,
//       c.urine_sugar      AS urineSugar,
//       c.bmi,
//       u.name             AS conductedBy
//     FROM members m
//     LEFT JOIN clinical_data c  ON c.member_id  = m.member_id
//     LEFT JOIN families f       ON f.family_id  = m.family_id
//     LEFT JOIN users u          ON u.user_id    = f.created_by
//     ORDER BY m.created_at DESC
//   `;

//   db.query(sql, [], (err, results) => {
//     if (err) {
//       console.error("Dashboard patients error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     // Shape data for dashboard
//     const patients = results.map(row => {

//       const systolic  = parseInt(row.systolic)  || 0;
//       const diastolic = parseInt(row.diastolic) || 0;
//       const sugar     = parseFloat(row.sugar)   || 0;
//       const bmi       = parseFloat(row.bmi)     || 0;
//       const age       = parseInt(row.age)       || 0;

//       const hasBP    = systolic >= 140 || diastolic >= 90;
//       const hasSugar = sugar >= 140;
//       const hasBoth  = hasBP && hasSugar;

//       let condition = "Normal";
//       if (hasBoth)       condition = "Both BP & Sugar";
//       else if (hasBP)    condition = "High Blood Pressure";
//       else if (hasSugar) condition = "High Sugar/Diabetes";

//       let ageGroup = "Adult";
//       if (age < 6)        ageGroup = "Under 5";
//       else if (age <= 19) ageGroup = "Adolescence";
//       else if (age <= 59) ageGroup = "Adult";
//       else                ageGroup = "Senior Citizen";

//       return {
//         id:          row.id,
//         name:        row.name        || "Unknown",
//         age:         age,
//         ageGroup:    ageGroup,
//         bp:          systolic && diastolic ? `${systolic}/${diastolic}` : "N/A",
//         sugar:       sugar   || null,
//         hemoglobin:  row.hemoglobin  || null,
//         urineSugar:  row.urineSugar  || "No",
//         bmi:         bmi,
//         condition:   condition,
//         conductedBy: row.conductedBy || "Unknown",
//         lastVisit:   row.lastVisit
//           ? new Date(row.lastVisit).toISOString().split("T")[0]
//           : "N/A",
//         hasBP,
//         hasSugar,
//         hasBoth
//       };
//     });

//     res.status(200).json(patients);
//   });
// };

// /* ============================= */
// /* GET STUDENT RECORDS */
// /* ============================= */
// exports.getStudents = (req, res) => {

//   const sql = `
//     SELECT 
//       u.user_id,
//       u.name,
//       u.student_id   AS rollno,
//       u.email,
//       u.village,
//       u.semester,
//       u.area,
//       u.supervisor,
//       COUNT(DISTINCT f.family_id)  AS families,
//       COUNT(DISTINCT m.member_id)  AS patients,
//       MAX(m.created_at)            AS lastVisit
//     FROM users u
//     LEFT JOIN families f ON f.created_by = u.user_id
//     LEFT JOIN members m  ON m.family_id  = f.family_id
//     WHERE u.role = 'student'
//     GROUP BY u.user_id
//     ORDER BY lastVisit DESC
//   `;

//   db.query(sql, [], (err, results) => {
//     if (err) {
//       console.error("Dashboard students error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     const students = results.map(row => ({
//       id:         row.user_id,
//       name:       row.name,
//       rollno:     row.rollno,
//       email:      row.email,
//       village:    row.village    || "-",
//       semester:   row.semester   || "-",
//       area:       row.area       || "-",
//       supervisor: row.supervisor || "-",
//       families:   row.families,
//       patients:   row.patients,
//       lastVisit:  row.lastVisit
//         ? new Date(row.lastVisit).toISOString().split("T")[0]
//         : "N/A"
//     }));

//     res.status(200).json(students);
//   });
// };
const db = require('../db');

/* ============================= */
/* GET PATIENT RECORDS */
/* ============================= */
exports.getPatients = (req, res) => {

  const sql = `
    SELECT 
      m.member_id        AS id,
      m.name,
      m.age,
      m.created_at       AS lastVisit,
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
    if (err) {
      console.error("Dashboard patients error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // Shape data for dashboard
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
        age:         age,
        ageGroup:    ageGroup,
        bp:          systolic && diastolic ? `${systolic}/${diastolic}` : "N/A",
        sugar:       sugar   || null,
        hemoglobin:  row.hemoglobin  || null,
        urineSugar:  row.urineSugar  || "No",
        bmi:         bmi,
        condition:   condition,
        conductedBy: row.conductedBy || "Unknown",
        lastVisit:   row.lastVisit
          ? new Date(row.lastVisit).toISOString().split("T")[0]
          : "N/A",
        hasBP,
        hasSugar,
        hasBoth
      };
    });

    res.status(200).json(patients);
  });
};

/* ============================= */
/* GET STUDENT RECORDS */
/* ============================= */
exports.getStudents = (req, res) => {

  const sql = `
    SELECT 
      u.user_id,
      u.name,
      u.student_id   AS rollno,
      u.email,
      u.village,
      u.semester,
      u.area,
      u.supervisor,
      COUNT(DISTINCT f.family_id)  AS families,
      COUNT(DISTINCT m.member_id)  AS patients,
      MAX(m.created_at)            AS lastVisit
    FROM users u
    LEFT JOIN families f ON f.created_by = u.user_id
    LEFT JOIN members m  ON m.family_id  = f.family_id
    WHERE u.role = 'student'
    GROUP BY u.user_id
    ORDER BY lastVisit DESC
  `;

  db.query(sql, [], (err, results) => {
    if (err) {
      console.error("Dashboard students error:", err);
      return res.status(500).json({ message: "Database error" });
    }

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
      lastVisit:  row.lastVisit
        ? new Date(row.lastVisit).toISOString().split("T")[0]
        : "N/A"
    }));

    res.status(200).json(students);
  });
};
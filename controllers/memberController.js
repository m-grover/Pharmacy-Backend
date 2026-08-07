const db = require("../db");

/* ============================================================
   EXISTING: addMember, updateMember, getMemberById  (unchanged)
   NEW:      getByAadhar, saveVersion, getVersionHistory
   ============================================================ */

/* ───────────────────────────────────────────────────────────
   ADD MEMBER (unchanged)
─────────────────────────────────────────────────────────── */
exports.addMember = (req, res) => {
  const {
    family_id, name, spouse, relation, aadhar_head, aadhar, phone,
    sex, dob, age, diet, education, employment, income,
    height, weight, bmi, systolic, diastolic, sugar, hb,
    urineSugar, urinealbumin, smoke, alcohol,
    healthProblem, pastMedical, familyMedical, surgical, ongoingTreatment,
  } = req.body;

  const checkSql = `SELECT member_id FROM members WHERE aadhar = ? LIMIT 1`;

  db.query(checkSql, [aadhar], (checkErr, checkResult) => {
    if (checkErr) return res.status(500).send(checkErr);
    if (checkResult.length > 0)
      return res.status(409).json({ message: "A member with this Aadhar number already exists." });

    const memberSql = `
      INSERT INTO members
      (family_id, name, spouse_name, relation, aadhar_head, aadhar, phone, sex, dob, age, diet, education, employment, income)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(memberSql, [
      family_id, name, spouse || null, relation, aadhar_head, aadhar,
      phone, sex, dob, age, diet, education, employment || null, income || null,
    ], (err, memberResult) => {
      if (err) { console.error("Member Insert Error:", err); return res.status(500).json({ error: err.message }); }

      const member_id  = memberResult.insertId;
      const visited_by = req.body.user_id || null;
      const today      = new Date().toISOString().split("T")[0];

      // First visit = version 1, is_latest = 1
      // No trigger — version_number is explicitly set to 1 here
      const versionSql = `
        INSERT INTO member_versions
          (member_id, version_number, visited_at, visited_by, is_latest,
           height, weight, bmi, systolic, diastolic, sugar, hb,
           urine_sugar, urine_albumin, smoke, alcohol,
           health_problem, past_medical, family_medical, surgical, ongoing_treatment)
        VALUES (?, 1, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(versionSql, [
        member_id, today, visited_by,
        height        || null,
        weight        || null,
        bmi           || null,
        parseInt(systolic)  || null,
        parseInt(diastolic) || null,
        sugar         || null,
        hb            || null,
        urineSugar    || null,
        urinealbumin  || null,
        smoke         || null,
        alcohol       || null,
        healthProblem || null,
        pastMedical   || null,
        familyMedical || null,
        surgical      || null,
        ongoingTreatment || null,
      ], (err2) => {
        if (err2) { console.error("Version Insert Error:", err2); return res.status(500).json({ error: err2.message }); }
        return res.status(200).json({ member_id });
      });
    });
  });
};

/* ───────────────────────────────────────────────────────────
   UPDATE MEMBER demographics (name, phone etc — not clinical)
─────────────────────────────────────────────────────────── */
exports.updateMember = (req, res) => {
  const { id } = req.params;
  const {
    name, spouse, relation, phone, sex, dob, age,
    diet, education, employment, income,
  } = req.body;

  const sql = `
    UPDATE members SET
      name=?, spouse_name=?, relation=?, phone=?, sex=?, dob=?, age=?,
      diet=?, education=?, employment=?, income=?
    WHERE member_id=?
  `;

  db.query(sql, [
    name, spouse || null, relation, phone, sex, dob, age,
    diet, education, employment || null, income || null, id,
  ], (err) => {
    if (err) { console.error("Member Update Error:", err); return res.status(500).json({ error: err.message }); }
    return res.status(200).json({ member_id: parseInt(id) });
  });
};

/* ───────────────────────────────────────────────────────────
   GET MEMBER BY ID (returns latest version merged)
─────────────────────────────────────────────────────────── */
exports.getMemberById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      m.member_id,
      m.name,
      m.age,
      m.dob,
      m.sex,
      m.spouse_name,
      m.spouse_name  AS spouse,
      mv.weight,
      mv.systolic,
      mv.diastolic,
      mv.hb,
      mv.urine_sugar,
      mv.version_number,
      mv.visited_at
    FROM members m
    LEFT JOIN member_versions mv
      ON mv.member_id = m.member_id AND mv.is_latest = 1
    WHERE m.member_id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) { console.error("DB Error:", err); return res.status(500).json({ message: "Database error" }); }
    if (result.length === 0) return res.status(404).json({ message: "Member not found" });
    res.status(200).json(result[0]);
  });
};

/* ───────────────────────────────────────────────────────────
   NEW ① GET MEMBER BY AADHAAR
   Called by the "Update Existing" Aadhaar lookup.
   Returns full latest-version data to pre-fill member.html.
─────────────────────────────────────────────────────────── */
exports.getByAadhar = (req, res) => {
  const { aadhar } = req.params;

  const sql = `
    SELECT
      m.member_id,
      m.family_id,
      m.name,
      m.spouse_name  AS spouse,
      m.relation,
      m.aadhar_head,
      m.aadhar,
      m.phone,
      m.sex,
      m.dob,
      m.age,
      m.diet,
      m.education,
      m.employment,
      m.income,
      mv.id              AS version_id,
      mv.version_number,
      mv.visited_at,
      mv.height,
      mv.weight,
      mv.bmi,
      mv.systolic,
      mv.diastolic,
      mv.sugar,
      mv.hb,
      mv.urine_sugar,
      mv.urine_albumin,
      mv.smoke,
      mv.alcohol,
      mv.health_problem,
      mv.past_medical,
      mv.family_medical,
      mv.surgical,
      mv.ongoing_treatment
    FROM members m
    LEFT JOIN member_versions mv
      ON mv.member_id = m.member_id AND mv.is_latest = 1
    WHERE m.aadhar = ?
    LIMIT 1
  `;

  db.query(sql, [aadhar], (err, result) => {
    if (err) { console.error("Aadhar Lookup Error:", err); return res.status(500).json({ message: "Database error" }); }
    if (result.length === 0) return res.status(404).json({ message: "No member found with this Aadhaar number." });
    res.status(200).json(result[0]);
  });
};

/* ───────────────────────────────────────────────────────────
   NEW ② SAVE NEW VERSION (repeat visit)
   No trigger — all logic handled here in a transaction:
   1. Archive previous latest (is_latest = 0)
   2. Get next version_number
   3. Insert new row with is_latest = 1
   4. Commit
─────────────────────────────────────────────────────────── */
exports.saveVersion = (req, res) => {
  const { id } = req.params;   // member_id
  const {
    height, weight, bmi, systolic, diastolic, sugar, hb,
    urineSugar, urinealbumin, smoke, alcohol,
    healthProblem, pastMedical, familyMedical, surgical,
    ongoingTreatment, user_id,
  } = req.body;

  const today = new Date().toISOString().split("T")[0];

  /* ── Step 1: BEGIN transaction ── */
  db.beginTransaction(txErr => {
    if (txErr) {
      console.error("Transaction begin error:", txErr);
      return res.status(500).json({ message: "Transaction error", detail: txErr.message });
    }

    /* ── Step 2: Archive all previous latest versions for this member ── */
    db.query(
      `UPDATE member_versions SET is_latest = 0 WHERE member_id = ?`,
      [id],
      (archiveErr) => {
        if (archiveErr) {
          return db.rollback(() => {
            console.error("Archive error:", archiveErr);
            res.status(500).json({ message: "Failed to archive previous version", detail: archiveErr.message });
          });
        }

        /* ── Step 3: Calculate next version_number ── */
        db.query(
          `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
           FROM member_versions
           WHERE member_id = ?`,
          [id],
          (versionErr, versionResult) => {
            if (versionErr) {
              return db.rollback(() => {
                console.error("Version number error:", versionErr);
                res.status(500).json({ message: "Failed to calculate version number", detail: versionErr.message });
              });
            }

            const nextVersion = versionResult[0].next_version;

            /* ── Step 4: Insert new version row ── */
            const insertSql = `
              INSERT INTO member_versions
                (member_id, version_number, visited_at, visited_by, is_latest,
                 height, weight, bmi, systolic, diastolic, sugar, hb,
                 urine_sugar, urine_albumin, smoke, alcohol,
                 health_problem, past_medical, family_medical, surgical, ongoing_treatment)
              VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
              id,
              nextVersion,
              today,
              user_id       || null,
              height        || null,
              weight        || null,
              bmi           || null,
              parseInt(systolic)  || null,
              parseInt(diastolic) || null,
              sugar         || null,
              hb            || null,
              urineSugar    || null,
              urinealbumin  || null,
              smoke         || null,
              alcohol       || null,
              healthProblem || null,
              pastMedical   || null,
              familyMedical || null,
              surgical      || null,
              ongoingTreatment || null,
            ];

            db.query(insertSql, values, (insertErr, insertResult) => {
              if (insertErr) {
                return db.rollback(() => {
                  console.error("Insert version error:", insertErr);
                  res.status(500).json({ message: "Failed to insert new version", detail: insertErr.message });
                });
              }

              /* ── Step 5: COMMIT ── */
              db.commit(commitErr => {
                if (commitErr) {
                  return db.rollback(() => {
                    console.error("Commit error:", commitErr);
                    res.status(500).json({ message: "Commit failed", detail: commitErr.message });
                  });
                }

                return res.status(200).json({
                  message:        "New visit version saved successfully.",
                  version_id:     insertResult.insertId,
                  version_number: nextVersion,
                  member_id:      parseInt(id),
                  visited_at:     today,
                });
              });
            });
          }
        );
      }
    );
  });
};

/* ───────────────────────────────────────────────────────────
   NEW ③ GET VERSION HISTORY for a member
   Returns all versions (visits) sorted newest first.
   Used by dashboard visit timeline.
─────────────────────────────────────────────────────────── */
exports.getVersionHistory = (req, res) => {
  const { id } = req.params;   // member_id

  const sql = `
    SELECT
      mv.id,
      mv.version_number,
      mv.visited_at,
      mv.is_latest,
      mv.height,
      mv.weight,
      mv.bmi,
      mv.systolic,
      mv.diastolic,
      mv.sugar,
      mv.hb,
      mv.urine_sugar,
      mv.smoke,
      mv.alcohol,
      mv.health_problem,
      mv.ongoing_treatment,
      u.name AS visited_by_name
    FROM member_versions mv
    LEFT JOIN users u ON u.user_id = mv.visited_by
    WHERE mv.member_id = ?
    ORDER BY mv.version_number DESC
  `;

  db.query(sql, [id], (err, result) => {
    if (err) { console.error("Version History Error:", err); return res.status(500).json({ message: "Database error" }); }
    res.status(200).json(result);
  });
};

// const db = require("../db");

// exports.addMember = (req, res) => {
//   const {
//     family_id, name, spouse, relation, aadhar_head, aadhar, phone,
//     sex, dob, age, diet, education, employment, income,
//     height, weight, bmi, systolic, diastolic, sugar, hb,
//     urineSugar, urinealbumin, smoke, alcohol,
//     healthProblem, pastMedical, familyMedical, surgical,
//   } = req.body;

//   const checkSql = `SELECT member_id FROM members WHERE aadhar = ? LIMIT 1`;

//   db.query(checkSql, [aadhar], (checkErr, checkResult) => {
//     if (checkErr) return res.status(500).send(checkErr);
//     if (checkResult.length > 0)
//       return res.status(409).json({ message: "A member with this Aadhar number already exists." });

//     const memberSql = `
//       INSERT INTO members 
//       (family_id, name, spouse_name, relation, aadhar_head, aadhar, phone, sex, dob, age, diet, education, employment, income)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     db.query(memberSql, [
//       family_id, name, spouse || null, relation, aadhar_head, aadhar,
//       phone, sex, dob, age, diet, education, employment || null, income || null,
//     ], (err, memberResult) => {
//       if (err) { console.error("Member Insert Error:", err); return res.status(500).json({ error: err.message }); }

//       const member_id = memberResult.insertId;

//       const clinicalSql = `
//         INSERT INTO clinical_data 
//         (member_id, height, weight, bmi, systolic, diastolic, sugar, hb,
//          urine_sugar, urine_albumin, smoke, alcohol,
//          health_problem, past_medical, family_medical, surgical)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;

//       db.query(clinicalSql, [
//         member_id,
//         height || null, weight || null, bmi || null,
//         parseInt(systolic) || null, parseInt(diastolic) || null,
//         sugar || null, hb || null,
//         urineSugar || null, urinealbumin || null,
//         smoke || null, alcohol || null,
//         healthProblem || null, pastMedical || null, familyMedical || null, surgical || null,
//       ], (err2) => {
//         if (err2) { console.error("Clinical Insert Error:", err2); return res.status(500).json({ error: err2.message }); }
//         return res.status(200).json({ member_id });
//       });
//     });
//   });
// };

// exports.updateMember = (req, res) => {
//   const { id } = req.params;
//   const {
//     name, spouse, relation, phone, sex, dob, age, diet,
//     education, employment, income,
//     height, weight, bmi, systolic, diastolic, sugar, hb,
//     urineSugar, urinealbumin, smoke, alcohol,
//     healthProblem, pastMedical, familyMedical, surgical,
//   } = req.body;

//   const memberSql = `
//     UPDATE members SET
//       name=?, spouse_name=?, relation=?, phone=?, sex=?, dob=?, age=?,
//       diet=?, education=?, employment=?, income=?
//     WHERE member_id=?
//   `;

//   db.query(memberSql, [
//     name, spouse || null, relation, phone, sex, dob, age,
//     diet, education, employment || null, income || null, id
//   ], (err) => {
//     if (err) { console.error("Member Update Error:", err); return res.status(500).json({ error: err.message }); }

//     const clinicalSql = `
//       UPDATE clinical_data SET
//         height=?, weight=?, bmi=?, systolic=?, diastolic=?, sugar=?, hb=?,
//         urine_sugar=?, urine_albumin=?, smoke=?, alcohol=?,
//         health_problem=?, past_medical=?, family_medical=?, surgical=?
//       WHERE member_id=?
//     `;

//     db.query(clinicalSql, [
//       height || null, weight || null, bmi || null,
//       parseInt(systolic) || null, parseInt(diastolic) || null,
//       sugar || null, hb || null,
//       urineSugar || null, urinealbumin || null,
//       smoke || null, alcohol || null,
//       healthProblem || null, pastMedical || null, familyMedical || null, surgical || null,
//       id,
//     ], (err2) => {
//       if (err2) { console.error("Clinical Update Error:", err2); return res.status(500).json({ error: err2.message }); }
//       return res.status(200).json({ member_id: parseInt(id) });
//     });
//   });
// };

// /* ============================= */
// /* GET MEMBER BY ID              */
// /* Now returns: age, dob,        */
// /* spouse_name aliased as spouse */
// /* ============================= */
// exports.getMemberById = (req, res) => {
//   const { id } = req.params;

//   const sql = `
//     SELECT
//       m.member_id,
//       m.name,
//       m.age,
//       m.dob,
//       m.sex,
//       m.spouse_name,
//       m.spouse_name AS spouse,
//       c.weight,
//       c.systolic,
//       c.diastolic,
//       c.hb,
//       c.urine_sugar
//     FROM members m
//     LEFT JOIN clinical_data c ON m.member_id = c.member_id
//     WHERE m.member_id = ?
//   `;

//   db.query(sql, [id], (err, result) => {
//     if (err) {
//       console.error("DB Error:", err);
//       return res.status(500).json({ message: "Database error" });
//     }
//     if (result.length === 0)
//       return res.status(404).json({ message: "Member not found" });

//     res.status(200).json(result[0]);
//   });
// };

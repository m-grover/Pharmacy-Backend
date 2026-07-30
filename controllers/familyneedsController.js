const db = require("../db");

/* ============================= */
/* SAVE FAMILY NEEDS ASSESSMENT  */
/* POST /api/familyneeds/save    */
/* ============================= */
exports.saveFamilyNeeds = (req, res) => {
  const {
    survey_id,          // family_id from localStorage
    problems_identified,
    care_performed,
  } = req.body;

  if (!survey_id) {
    return res.status(400).json({ message: "survey_id (family_id) is required." });
  }

  // Check if a record already exists for this family_id
  const checkSql = `SELECT id FROM family_needs WHERE family_id = ? LIMIT 1`;

  db.query(checkSql, [survey_id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error("Family Needs Check Error:", checkErr);
      return res.status(500).json({ error: checkErr.message });
    }

    if (checkResult.length > 0) {
      // ── UPDATE existing record ──
      const updateSql = `
        UPDATE family_needs SET
          problems_identified = ?,
          care_performed      = ?,
          updated_at          = NOW()
        WHERE family_id = ?
      `;

      db.query(updateSql, [
        problems_identified || null,
        care_performed      || null,
        survey_id,
      ], (updateErr) => {
        if (updateErr) {
          console.error("Family Needs Update Error:", updateErr);
          return res.status(500).json({ error: updateErr.message });
        }

        return res.status(200).json({
          message:   "Family needs assessment updated successfully.",
          family_id: survey_id,
        });
      });

    } else {
      // ── INSERT new record ──
      const insertSql = `
        INSERT INTO family_needs
          (family_id, problems_identified, care_performed, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
      `;

      db.query(insertSql, [
        survey_id,
        problems_identified || null,
        care_performed      || null,
      ], (insertErr, insertResult) => {
        if (insertErr) {
          console.error("Family Needs Insert Error:", insertErr);
          return res.status(500).json({ error: insertErr.message });
        }

        return res.status(200).json({
          message:   "Family needs assessment saved successfully.",
          id:        insertResult.insertId,
          family_id: survey_id,
        });
      });
    }
  });
};

/* ============================= */
/* GET FAMILY NEEDS BY family_id */
/* GET /api/familyneeds/:id      */
/* ============================= */
exports.getFamilyNeedsById = (req, res) => {
  const { id } = req.params;   // id = family_id

  const sql = `
    SELECT
      fn.id,
      fn.family_id,
      fn.problems_identified,
      fn.care_performed,
      fn.created_at,
      fn.updated_at
    FROM family_needs fn
    WHERE fn.family_id = ?
    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Family Needs Fetch Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "No assessment found for this family." });
    }

    return res.status(200).json(result[0]);
  });
};
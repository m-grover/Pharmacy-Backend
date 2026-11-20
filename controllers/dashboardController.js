const db = require('../db');
const { openTxConnection } = require('../utils/txConnection');
const { validateClientEdit } = require('../utils/clientEditValidation');

/* Clinical values come from the member's LATEST VISIT (member_versions, is_latest = 1).
   Members that predate versioning fall back to their clinical_data row.
   (The survey now writes clinical data to member_versions, not clinical_data.) */
const LATEST_JOINS = `
    LEFT JOIN member_versions mv ON mv.member_id = m.member_id AND mv.is_latest = 1
    LEFT JOIN (SELECT member_id, MAX(clinical_id) AS clinical_id
               FROM clinical_data GROUP BY member_id) lc ON lc.member_id = m.member_id
    LEFT JOIN clinical_data c ON c.clinical_id = lc.clinical_id`;
// member_versions is utf8mb4_bin but clinical_data is utf8mb4_0900_ai_ci. Mixing two different
// collations inside one CASE can raise "Illegal mix of collations", so text columns are forced
// to a single collation explicitly.
const TEXT_COLS = new Set(['urine_sugar', 'urine_albumin', 'smoke', 'alcohol', 'health_problem']);
const latest = col => TEXT_COLS.has(col)
  ? `CASE WHEN mv.id IS NOT NULL THEN mv.${col} COLLATE utf8mb4_bin ELSE c.${col} COLLATE utf8mb4_bin END`
  : `CASE WHEN mv.id IS NOT NULL THEN mv.${col} ELSE c.${col} END`;

/* ============================= */
/* GET PATIENT RECORDS           */
/* ============================= */
exports.getPatients = (req, res) => {
  const sql = `
    SELECT
      m.member_id        AS id,
      m.name,
      m.age,
      DATE_FORMAT(CASE WHEN mv.id IS NOT NULL THEN mv.visited_at ELSE m.created_at END, '%Y-%m-%d') AS lastVisit,
      f.village,
      ${latest('systolic')}      AS systolic,
      ${latest('diastolic')}     AS diastolic,
      ${latest('sugar')}         AS sugar,
      ${latest('hb')}            AS hemoglobin,
      ${latest('urine_sugar')}   AS urineSugar,
      ${latest('bmi')}           AS bmi,
      u.name             AS conductedBy
    FROM members m
    ${LATEST_JOINS}
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
        hemoglobin:  parseFloat(row.hemoglobin) || null,
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
    SELECT m.*,
           ${latest('height')}         AS height,
           ${latest('weight')}         AS weight,
           ${latest('bmi')}            AS bmi,
           ${latest('systolic')}       AS systolic,
           ${latest('diastolic')}      AS diastolic,
           ${latest('sugar')}          AS sugar,
           ${latest('hb')}             AS hb,
           ${latest('urine_sugar')}    AS urine_sugar,
           ${latest('urine_albumin')}  AS urine_albumin,
           ${latest('smoke')}          AS smoke,
           ${latest('alcohol')}        AS alcohol,
           ${latest('health_problem')} AS health_problem
    FROM members m
    ${LATEST_JOINS}
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

        // 4. Antenatal — uses survey_id (family_id), no member_id column
        const antenatalSql = `SELECT * FROM antenatal_records WHERE survey_id = ? LIMIT 1`;
        db.query(antenatalSql, [member.family_id], (err4, antenatalRows) => {
          if (err4) return res.status(500).json({ message: "DB error", detail: err4.message });

          // 5. Postnatal — has member_id
          const postnatalSql = `SELECT * FROM postnatal_records WHERE member_id = ? LIMIT 1`;
          db.query(postnatalSql, [id], (err5, postnatalRows) => {
            if (err5) return res.status(500).json({ message: "DB error", detail: err5.message });

            // 6. Neonatal — uses survey_id only, no member_id
            const neonatalSql = `SELECT * FROM neonatal_records WHERE survey_id = ? LIMIT 1`;
            db.query(neonatalSql, [member.family_id], (err6, neonatalRows) => {
              if (err6) return res.status(500).json({ message: "DB error", detail: err6.message });

              // 7. Obstetrical — has member_id
              const obsSql = `SELECT * FROM obstetrical_records WHERE member_id = ?`;
              db.query(obsSql, [id], (err7, obsRows) => {
                if (err7) return res.status(500).json({ message: "DB error", detail: err7.message });

                // 8. Childcare — has member_id
                const childSql = `SELECT * FROM childcare_records WHERE member_id = ?`;
                db.query(childSql, [id], (err8, childRows) => {
                  if (err8) return res.status(500).json({ message: "DB error", detail: err8.message });

                  res.status(200).json({
                    member,
                    family,
                    pregnancy:   pregRows[0]      || null,
                    antenatal:   antenatalRows[0] || null,
                    postnatal:   postnatalRows[0] || null,
                    neonatal:    neonatalRows[0]  || null,
                    obstetrical: obsRows,
                    childcare:   childRows,
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

/* ============================= */
/* GET PREGNANCY RECORDS         */
/* ============================= */
exports.getPregnancy = (req, res) => {
  const sql = `
    SELECT
      p.pregnancy_id,
      p.member_id,
      p.is_pregnant,
      p.pregnancies_count,
      p.created_at        AS pregCreatedAt,
      m.name,
      m.age,
      m.family_id,
      a.lmp,
      a.edd,
      a.visit_date,
      pn.delivery_date,
      pn.conducted_by,
      pn.followup_date
    FROM pregnancy p
    JOIN members m              ON m.member_id  = p.member_id
    LEFT JOIN antenatal_records a  ON a.survey_id = m.family_id
    LEFT JOIN postnatal_records pn ON pn.member_id = m.member_id
    ORDER BY p.created_at DESC
  `;

  db.query(sql, [], (err, results) => {
    if (err) { console.error("Dashboard pregnancy error:", err); return res.status(500).json({ message: "Database error" }); }

    const fmtDate = (d) => d ? new Date(d).toISOString().split("T")[0] : null;

    const pregnancy = results.map(row => {
      const status = row.delivery_date ? "Postnatal" : "Antenatal";

      const lastVisit =
        fmtDate(row.followup_date) ||
        fmtDate(row.visit_date) ||
        fmtDate(row.pregCreatedAt) ||
        "N/A";

      return {
        id:           row.pregnancy_id,
        memberId:     row.member_id,
        name:         row.name || "Unknown",
        age:          row.age || "-",
        status,
        lmp:          fmtDate(row.lmp)  || "-",
        edd:          fmtDate(row.edd)  || "-",
        deliveryDate: fmtDate(row.delivery_date) || "—",
        conductedBy:  row.conducted_by || "-",
        lastVisit
      };
    });

    res.status(200).json(pregnancy);
  });
};

/* ============================= */
/* GET FAMILY VISIT RECORDS      */
/* ============================= */
exports.getFamilies = (req, res) => {
  const sql = `
    SELECT
      f.family_id,
      f.head_name,
      f.village,
      f.total_members,
      f.created_at,
      u.name AS conductedBy
    FROM families f
    LEFT JOIN users u ON u.user_id = f.created_by
    ORDER BY f.created_at DESC
  `;

  db.query(sql, [], (err, results) => {
    if (err) { console.error("Dashboard families error:", err); return res.status(500).json({ message: "Database error" }); }

    const families = results.map(row => ({
      familyId:    row.family_id,
      familyHead:  row.head_name || "Unknown",
      village:     row.village   || "-",
      members:     row.total_members || 0,
      visitDate:   row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : "Unknown",
      conductedBy: row.conductedBy || "Unknown"
    }));

    res.status(200).json(families);
  });
};

/* ============================================================
   ADMIN: EDIT / DELETE ONE CLIENT  (member_id only)
   - Protected by requireAdmin in dashboardRoutes.js
   - Each runs in ONE transaction on a dedicated connection
   - Every change is written to audit_log inside the same transaction
   ============================================================ */

// Valid positive 32-bit integer or null
const parseId = v => {
  const s = String(v);
  const n = Number(s);
  return /^\d{1,10}$/.test(s) && n > 0 && n <= 2147483647 ? n : null;
};

/* PUT /api/dashboard/client/:id  — body: any of systolic, diastolic, sugar, urineSugar */
exports.updateClient = async (req, res) => {
  const memberId = parseId(req.params.id);
  if (!memberId) return res.status(400).json({ message: 'Invalid client id.' });

  const { errors, values } = validateClientEdit(req.body);
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  let conn;
  try {
    conn = await openTxConnection();
    await conn.beginTransaction();

    const [members] = await conn.query(
      'SELECT member_id FROM members WHERE member_id = ? FOR UPDATE', [memberId]);
    if (!members.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Client not found.' });
    }

    // Edit the same record the dashboard displays: the latest visit.
    // Older clients that predate versioning fall back to their clinical_data row.
    let table, keyCol, row;
    const [versions] = await conn.query(
      `SELECT * FROM member_versions
       WHERE member_id = ? AND is_latest = 1
       ORDER BY version_number DESC LIMIT 1 FOR UPDATE`, [memberId]);

    if (versions.length) {
      table = 'member_versions'; keyCol = 'id'; row = versions[0];
    } else {
      const [legacy] = await conn.query(
        `SELECT * FROM clinical_data WHERE member_id = ?
         ORDER BY clinical_id DESC LIMIT 1 FOR UPDATE`, [memberId]);
      if (!legacy.length) {
        await conn.rollback();
        return res.status(404).json({ message: 'This client has no clinical record to edit.' });
      }
      table = 'clinical_data'; keyCol = 'clinical_id'; row = legacy[0];
    }

    // `cols` come from the fixed whitelist in validateClientEdit — never from the request.
    const cols   = Object.keys(values);
    const before = { table, row_id: row[keyCol] };
    cols.forEach(c => { before[c] = row[c]; });

    await conn.query(
      `UPDATE ${table} SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE ${keyCol} = ?`,
      [...cols.map(c => values[c]), row[keyCol]]);

    await conn.query(
      `INSERT INTO audit_log (admin_user_id, action, entity, entity_id, before_data, after_data)
       VALUES (?, 'EDIT_CLIENT_CLINICAL', 'member', ?, ?, ?)`,
      [req.admin.user_id, memberId, JSON.stringify(before), JSON.stringify(values)]);

    await conn.commit();
    return res.status(200).json({ message: 'Client updated.', member_id: memberId });

  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) { /* already closed */ } }
    console.error('Client update error:', err);
    return res.status(500).json({ message: 'Could not save the changes. Nothing was changed.' });
  } finally {
    if (conn) { try { await conn.end(); } catch (_) { /* ignore */ } }
  }
};

/* Tables that hold rows for a single member (all have a member_id column).
   Deleted children-first because pregnancy / postnatal / obstetrical have
   foreign keys to members. */
const CLIENT_CHILD_TABLES = [
  'pregnancy',
  'clinical_data',
  'member_versions',
  'postnatal_records',
  'obstetrical_records',
  'childcare_records',
];

/* DELETE /api/dashboard/client/:id
   Removes ONE client. The family row, other members, family-level records
   (economic_status, family_needs, antenatal_records, neonatal_records) and
   all user accounts are never touched. */
exports.deleteClient = async (req, res) => {
  const memberId = parseId(req.params.id);
  if (!memberId) return res.status(400).json({ message: 'Invalid client id.' });

  let conn;
  try {
    conn = await openTxConnection();
    await conn.beginTransaction();

    const [members] = await conn.query(
      'SELECT * FROM members WHERE member_id = ? FOR UPDATE', [memberId]);
    if (!members.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Client not found.' });
    }

    // Snapshot everything before deleting so a mistaken delete can be reconstructed.
    const snapshot = { members: members[0] };
    for (const t of CLIENT_CHILD_TABLES) {
      const [rows] = await conn.query(`SELECT * FROM ${t} WHERE member_id = ?`, [memberId]);
      snapshot[t] = rows;
    }

    const deleted = {};
    for (const t of CLIENT_CHILD_TABLES) {
      const [r] = await conn.query(`DELETE FROM ${t} WHERE member_id = ?`, [memberId]);
      deleted[t] = r.affectedRows;
    }

    const [m] = await conn.query('DELETE FROM members WHERE member_id = ?', [memberId]);
    deleted.members = m.affectedRows;
    if (m.affectedRows !== 1) {
      // Anything unexpected -> throw -> whole transaction is rolled back.
      throw new Error(`Expected to delete exactly 1 member row, deleted ${m.affectedRows}`);
    }

    await conn.query(
      `INSERT INTO audit_log (admin_user_id, action, entity, entity_id, before_data, after_data)
       VALUES (?, 'DELETE_CLIENT', 'member', ?, ?, ?)`,
      [req.admin.user_id, memberId, JSON.stringify(snapshot), JSON.stringify({ deleted })]);

    await conn.commit();
    return res.status(200).json({ message: 'Client deleted.', member_id: memberId, deleted });

  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) { /* already closed */ } }
    console.error('Client delete error:', err);
    return res.status(500).json({ message: 'Could not delete the client. Nothing was changed.' });
  } finally {
    if (conn) { try { await conn.end(); } catch (_) { /* ignore */ } }
  }
};

// const db = require('../db');

// /* ============================= */
// /* GET PATIENT RECORDS           */
// /* ============================= */
// exports.getPatients = (req, res) => {
//   const sql = `
//     SELECT 
//       m.member_id        AS id,
//       m.name,
//       m.age,
//       m.created_at       AS lastVisit,
//       f.village,
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
//     if (err) { console.error("Dashboard patients error:", err); return res.status(500).json({ message: "Database error" }); }

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
//         age,
//         ageGroup,
//         village:     row.village     || "-",
//         bp:          systolic && diastolic ? `${systolic}/${diastolic}` : "N/A",
//         sugar:       sugar   || null,
//         hemoglobin:  row.hemoglobin  || null,
//         urineSugar:  row.urineSugar  || "No",
//         bmi,
//         condition,
//         conductedBy: row.conductedBy || "Unknown",
//         lastVisit:   row.lastVisit ? new Date(row.lastVisit).toISOString().split("T")[0] : "N/A",
//         hasBP, hasSugar, hasBoth
//       };
//     });

//     res.status(200).json(patients);
//   });
// };

// /* ============================= */
// /* GET FULL CLIENT DETAILS       */
// /* ============================= */
// exports.getClientDetails = (req, res) => {
//   const { id } = req.params;

//   // 1. Member + Clinical
//   const memberSql = `
//     SELECT m.*, c.height, c.weight, c.bmi, c.systolic, c.diastolic,
//            c.sugar, c.hb, c.urine_sugar, c.urine_albumin,
//            c.smoke, c.alcohol, c.health_problem
//     FROM members m
//     LEFT JOIN clinical_data c ON c.member_id = m.member_id
//     WHERE m.member_id = ?
//   `;

//   db.query(memberSql, [id], (err, memberRows) => {
//     if (err) return res.status(500).json({ message: "DB error", detail: err.message });
//     if (!memberRows.length) return res.status(404).json({ message: "Member not found" });

//     const member = memberRows[0];

//     // 2. Family + Economic
//     const familySql = `
//       SELECT f.*, e.family_income, e.income_source, e.house_ownership,
//              e.land_ownership, e.assets, e.bpl, e.scheme
//       FROM families f
//       LEFT JOIN economic_status e ON e.family_id = f.family_id
//       WHERE f.family_id = ?
//     `;

//     db.query(familySql, [member.family_id], (err2, familyRows) => {
//       if (err2) return res.status(500).json({ message: "DB error", detail: err2.message });

//       const family = familyRows[0] || {};

//       // 3. Pregnancy
//       const pregSql = `SELECT * FROM pregnancy WHERE member_id = ? LIMIT 1`;
//       db.query(pregSql, [id], (err3, pregRows) => {
//         if (err3) return res.status(500).json({ message: "DB error", detail: err3.message });

//         // 4. Antenatal — uses survey_id (family_id), no member_id column
//         const antenatalSql = `SELECT * FROM antenatal_records WHERE survey_id = ? LIMIT 1`;
//         db.query(antenatalSql, [member.family_id], (err4, antenatalRows) => {
//           if (err4) return res.status(500).json({ message: "DB error", detail: err4.message });

//           // 5. Postnatal — has member_id
//           const postnatalSql = `SELECT * FROM postnatal_records WHERE member_id = ? LIMIT 1`;
//           db.query(postnatalSql, [id], (err5, postnatalRows) => {
//             if (err5) return res.status(500).json({ message: "DB error", detail: err5.message });

//             // 6. Neonatal — uses survey_id only, no member_id
//             const neonatalSql = `SELECT * FROM neonatal_records WHERE survey_id = ? LIMIT 1`;
//             db.query(neonatalSql, [member.family_id], (err6, neonatalRows) => {
//               if (err6) return res.status(500).json({ message: "DB error", detail: err6.message });

//               // 7. Obstetrical — has member_id
//               const obsSql = `SELECT * FROM obstetrical_records WHERE member_id = ?`;
//               db.query(obsSql, [id], (err7, obsRows) => {
//                 if (err7) return res.status(500).json({ message: "DB error", detail: err7.message });

//                 // 8. Childcare — has member_id
//                 const childSql = `SELECT * FROM childcare_records WHERE member_id = ?`;
//                 db.query(childSql, [id], (err8, childRows) => {
//                   if (err8) return res.status(500).json({ message: "DB error", detail: err8.message });

//                   res.status(200).json({
//                     member,
//                     family,
//                     pregnancy:   pregRows[0]      || null,
//                     antenatal:   antenatalRows[0] || null,
//                     postnatal:   postnatalRows[0] || null,
//                     neonatal:    neonatalRows[0]  || null,
//                     obstetrical: obsRows,
//                     childcare:   childRows,
//                   });
//                 });
//               });
//             });
//           });
//         });
//       });
//     });
//   });
// };

// /* ============================= */
// /* GET STUDENT RECORDS           */
// /* ============================= */
// exports.getStudents = (req, res) => {
//   const sql = `
//     SELECT 
//       u.user_id, u.name, u.student_id AS rollno, u.email,
//       u.village, u.semester, u.area, u.supervisor,
//       COUNT(DISTINCT f.family_id) AS families,
//       COUNT(DISTINCT m.member_id) AS patients,
//       MAX(m.created_at)           AS lastVisit
//     FROM users u
//     LEFT JOIN families f ON f.created_by = u.user_id
//     LEFT JOIN members m  ON m.family_id  = f.family_id
//     WHERE u.role = 'student'
//     GROUP BY u.user_id
//     ORDER BY lastVisit DESC
//   `;

//   db.query(sql, [], (err, results) => {
//     if (err) { console.error("Dashboard students error:", err); return res.status(500).json({ message: "Database error" }); }

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
//       lastVisit:  row.lastVisit ? new Date(row.lastVisit).toISOString().split("T")[0] : "N/A"
//     }));

//     res.status(200).json(students);
//   });
// };

// /* ============================= */
// /* GET PREGNANCY RECORDS         */
// /* ============================= */
// exports.getPregnancy = (req, res) => {
//   const sql = `
//     SELECT
//       p.pregnancy_id,
//       p.member_id,
//       p.is_pregnant,
//       p.pregnancies_count,
//       p.created_at        AS pregCreatedAt,
//       m.name,
//       m.age,
//       m.family_id,
//       a.lmp,
//       a.edd,
//       a.visit_date,
//       pn.delivery_date,
//       pn.conducted_by,
//       pn.followup_date
//     FROM pregnancy p
//     JOIN members m              ON m.member_id  = p.member_id
//     LEFT JOIN antenatal_records a  ON a.survey_id = m.family_id
//     LEFT JOIN postnatal_records pn ON pn.member_id = m.member_id
//     ORDER BY p.created_at DESC
//   `;

//   db.query(sql, [], (err, results) => {
//     if (err) { console.error("Dashboard pregnancy error:", err); return res.status(500).json({ message: "Database error" }); }

//     const fmtDate = (d) => d ? new Date(d).toISOString().split("T")[0] : null;

//     const pregnancy = results.map(row => {
//       const status = row.delivery_date ? "Postnatal" : "Antenatal";

//       const lastVisit =
//         fmtDate(row.followup_date) ||
//         fmtDate(row.visit_date) ||
//         fmtDate(row.pregCreatedAt) ||
//         "N/A";

//       return {
//         id:           row.pregnancy_id,
//         memberId:     row.member_id,
//         name:         row.name || "Unknown",
//         age:          row.age || "-",
//         status,
//         lmp:          fmtDate(row.lmp)  || "-",
//         edd:          fmtDate(row.edd)  || "-",
//         deliveryDate: fmtDate(row.delivery_date) || "—",
//         conductedBy:  row.conducted_by || "-",
//         lastVisit
//       };
//     });

//     res.status(200).json(pregnancy);
//   });
// };

// /* ============================= */
// /* GET FAMILY VISIT RECORDS      */
// /* ============================= */
// exports.getFamilies = (req, res) => {
//   const sql = `
//     SELECT
//       f.family_id,
//       f.head_name,
//       f.village,
//       f.total_members,
//       f.created_at,
//       u.name AS conductedBy
//     FROM families f
//     LEFT JOIN users u ON u.user_id = f.created_by
//     ORDER BY f.created_at DESC
//   `;

//   db.query(sql, [], (err, results) => {
//     if (err) { console.error("Dashboard families error:", err); return res.status(500).json({ message: "Database error" }); }

//     const families = results.map(row => ({
//       familyId:    row.family_id,
//       familyHead:  row.head_name || "Unknown",
//       village:     row.village   || "-",
//       members:     row.total_members || 0,
//       visitDate:   row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : "Unknown",
//       conductedBy: row.conductedBy || "Unknown"
//     }));

//     res.status(200).json(families);
//   });
// };
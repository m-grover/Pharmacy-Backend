const db = require('../db');

const familyFields = [
  'head_name', 'aadhar_number', 'address', 'religion', 'caste',
  'occupation', 'marital_status', 'total_members', 'family_type',
  'eligible_couples', 'family_planning_method', 'house_type', 'village', 'created_by'
];

exports.addFamily = (req, res) => {
  const {
    head_name, aadhar_number, address, religion, caste, occupation,
    marital_status, total_members, family_type, eligible_couples,
    family_planning_method, house_type, village, created_by
  } = req.body;

  const sql = `
    INSERT INTO families 
    (head_name, aadhar_number, address, religion, caste, occupation, marital_status,
     total_members, family_type, eligible_couples, family_planning_method, house_type,
     village, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    head_name, aadhar_number, address, religion, caste, occupation,
    marital_status, total_members, family_type, eligible_couples,
    family_planning_method, house_type, village, created_by
  ], (err, result) => {
    if (err) { console.error(err); return res.status(500).send(err); }
    res.json({ family_id: result.insertId });
  });
};

exports.updateFamily = (req, res) => {
  const { id } = req.params;
  const {
    head_name, aadhar_number, address, religion, caste, occupation,
    marital_status, total_members, family_type, eligible_couples,
    family_planning_method, house_type, village
  } = req.body;

  const sql = `
    UPDATE families SET
      head_name=?, aadhar_number=?, address=?, religion=?, caste=?,
      occupation=?, marital_status=?, total_members=?, family_type=?,
      eligible_couples=?, family_planning_method=?, house_type=?, village=?
    WHERE family_id=?
  `;

  db.query(sql, [
    head_name, aadhar_number, address, religion, caste, occupation,
    marital_status, total_members, family_type, eligible_couples,
    family_planning_method, house_type, village, id
  ], (err) => {
    if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
    res.json({ family_id: parseInt(id) });
  });
};

// const db = require('../db');

// exports.addFamily = (req, res) => {
//     const {
//         head_name,
//         aadhar_number,
//         address,
//         religion,
//         caste,
//         occupation,
//         marital_status,
//         total_members,
//         family_type,
//         eligible_couples,
//         family_planning_method,
//         house_type,
//         village,
//         created_by
//     } = req.body;

//     const sql = `
//         INSERT INTO families 
//         (head_name, aadhar_number, address, religion, caste, occupation, marital_status,
//          total_members, family_type, eligible_couples, family_planning_method, house_type,
//          village, created_by)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     db.query(sql, [
//         head_name,
//         aadhar_number,
//         address,
//         religion,
//         caste,
//         occupation,
//         marital_status,
//         total_members,
//         family_type,
//         eligible_couples,
//         family_planning_method,
//         house_type,
//         village,
//         created_by
//     ], (err, result) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }

//         res.json({ family_id: result.insertId });
//     });
// };
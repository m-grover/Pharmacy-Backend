require("dotenv").config();
const cors = require('cors');
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const familyRoutes = require('./routes/familyRoutes');
const economicRoutes = require('./routes/economicRoutes');
const memberRoutes = require('./routes/memberRoutes');
const pregnancyRoutes = require('./routes/pregnancyRoutes');
const antenatalRoutes = require('./routes/antenatalRoutes');
const neonatalRoutes = require('./routes/neonatalRoutes');
const postnatalRoutes = require('./routes/postnatalRoutes');
const obstetricalRoutes = require('./routes/obstetricalRoutes');
const childcareRoutes = require('./routes/childcareRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const familyNeedsRoutes = require('./routes/familyneedsRoutes');
const db = require("./db");

// Allowed browser origins, comma-separated, e.g.
//   ALLOWED_ORIGINS=https://your-site.netlify.app,http://localhost:5500
// If unset, behaves as before (all origins) and logs a warning.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);
if (allowedOrigins.length === 0) {
  console.warn("ALLOWED_ORIGINS is not set - CORS is open to all origins");
}
app.use(cors({
  origin: (origin, callback) => {
    // no Origin header = non-browser client (health checks, curl)
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/economic', economicRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/pregnancy', pregnancyRoutes);
app.use('/api/antenatal', antenatalRoutes);
app.use('/api/neonatal', neonatalRoutes);
app.use('/api/postnatal', postnatalRoutes);
app.use('/api/obstetrical', obstetricalRoutes);
app.use('/api/childcare', childcareRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/familyneeds', familyNeedsRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running');
});

app.get("/test-db", (req, res) => {
  db.query("SELECT 1", (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send("DB Working ✅");
  });
});

app.listen(process.env.PORT || 5000, () => {
    console.log('Server running on port 5000');
});

// require("dotenv").config();
// const cors = require('cors');
// const express = require('express');
// const app = express();
// const authRoutes = require('./routes/authRoutes');
// const familyRoutes = require('./routes/familyRoutes');
// const economicRoutes = require('./routes/economicRoutes');
// const memberRoutes = require('./routes/memberRoutes');
// const pregnancyRoutes = require('./routes/pregnancyRoutes');
// const antenatalRoutes = require('./routes/antenatalRoutes');
// const neonatalRoutes = require('./routes/neonatalRoutes');
// const postnatalRoutes = require('./routes/postnatalRoutes');
// const obstetricalRoutes = require('./routes/obstetricalRoutes');
// const childcareRoutes = require('./routes/childcareRoutes');
// const dashboardRoutes = require('./routes/dashboardRoutes');
// const familyNeedsRoutes = require('./routes/familyneedsRoutes');
// const db = require("./db");

// app.use(cors({
//   origin: "*"
// }));
// app.use(express.json());
// app.use('/api/auth', authRoutes);
// app.use('/api/family', familyRoutes);
// app.use('/api/economic', economicRoutes);
// app.use('/api/member', memberRoutes);
// app.use('/api/pregnancy', pregnancyRoutes);
// app.use('/api/antenatal', antenatalRoutes);
// app.use('/api/neonatal', neonatalRoutes);
// app.use('/api/postnatal', postnatalRoutes);
// app.use('/api/obstetrical', obstetricalRoutes);
// app.use('/api/childcare', childcareRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/familyneeds', familyNeedsRoutes);

// app.get('/', (req, res) => {
//     res.send('Backend is running');
// });

// app.get("/test-db", (req, res) => {
//   db.query("SELECT 1", (err, result) => {
//     if (err) {
//       return res.status(500).send(err);
//     }
//     res.send("DB Working ✅");
//   });
// });

// app.listen(process.env.PORT || 5000, () => {
//     console.log('Server running on port 5000');
// });
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
const db = require("./db");

app.use(cors({
  origin: "*"
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
const cors = require('cors');
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running');
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});
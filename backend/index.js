const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');


dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);


app.get('/', (req, res) => {
  res.send('🚀 Backend running');
});

app.listen(PORT, () => {
  console.log(`🌐 Server listening on http://localhost:${PORT}`);
});


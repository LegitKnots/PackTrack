const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const routeRoutes = require('./routes/route');



dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/routes', routeRoutes);



app.get('/', (_req, res) => {
  res.send('🚀 Backend running');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server listening on http://0.0.0.0:${PORT}`);
});


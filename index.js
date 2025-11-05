require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./route/auth');
const goalsRoutes = require('./route/goals');
const notesRoutes = require('./route/noteRoute')
const app = express();
app.use(cors());
app.use(express.json());

// Mongo
const MONGO_URI = process.env.MONGO_URI ;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch((err)=> console.error('Mongo error', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/notes', notesRoutes );

// Basic health
app.get('/', (req,res)=> res.send({ ok: true, message: 'GoalMate API' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));

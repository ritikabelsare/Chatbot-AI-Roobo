const express = require('express');
const cors = require('cors');
const db = require('./db');
const createChatRoutes = require('./routes/chatRoutes');
const createMemoryRoutes = require('./routes/memoryRoutes');
const createTaskRoutes = require('./routes/taskRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'My AI Assistant Backend is running!' });
});

app.use('/api', createChatRoutes(db));
app.use('/api/memory', createMemoryRoutes(db));
app.use('/api/tasks', createTaskRoutes(db));

module.exports = app;

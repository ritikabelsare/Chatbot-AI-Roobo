const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      const { memory_key, memory_value } = req.body;
      if (
        typeof memory_key !== 'string' ||
        typeof memory_value !== 'string' ||
        !memory_key.trim() ||
        !memory_value.trim()
      ) {
        return res.status(400).json({ message: 'Memory key and value are required.' });
      }

      const key = memory_key.trim();
      const value = memory_value.trim();
      if (key.length > 100) {
        return res.status(400).json({ message: 'Memory key must be 100 characters or fewer.' });
      }

      await db.query(
        `INSERT INTO assistant_memory (memory_key, memory_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE memory_value = ?`,
        [key, value, value]
      );
      res.json({
        message: 'Memory saved successfully.',
        memory: { memory_key: key, memory_value: value },
      });
    } catch (error) {
      console.error('Save memory error:', error.message);
      res.status(500).json({ message: 'Could not save memory.' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT id, memory_key, memory_value, created_at, updated_at
         FROM assistant_memory
         ORDER BY id DESC`
      );
      res.json({ memories: rows });
    } catch (error) {
      console.error('Get memory error:', error.message);
      res.status(500).json({ message: 'Could not load memories.' });
    }
  });

  return router;
};

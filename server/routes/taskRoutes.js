const express = require('express');

function ensureTaskTable(db) {
  if (!db.taskTableReady) {
    db.taskTableReady = db.query(
      `CREATE TABLE IF NOT EXISTS assistant_tasks (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        due_at DATETIME NULL,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        reminder_sent_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_assistant_tasks_due (is_completed, reminder_sent_at, due_at)
      )`
    ).catch((error) => {
      db.taskTableReady = null;
      throw error;
    });
  }

  return db.taskTableReady;
}

function toUtcSqlDateTime(value) {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function isValidTaskId(value) {
  return /^\d+$/.test(value) && Number(value) > 0;
}

function normalizeTask(task) {
  return { ...task, done: Boolean(task.done) };
}

const taskSelect = `SELECT id, title,
                           DATE_FORMAT(due_at, '%Y-%m-%dT%H:%i:%s.000Z') AS due_at,
                           is_completed AS done,
                           reminder_sent_at, created_at, updated_at
                    FROM assistant_tasks`;

module.exports = (db) => {
  const router = express.Router();

  router.get('/reminders', async (req, res) => {
    try {
      await ensureTaskTable(db);
      const [reminders] = await db.query(
        `SELECT id, title,
                DATE_FORMAT(due_at, '%Y-%m-%dT%H:%i:%s.000Z') AS due_at
         FROM assistant_tasks
         WHERE is_completed = FALSE
           AND due_at IS NOT NULL
           AND due_at <= UTC_TIMESTAMP()
           AND reminder_sent_at IS NULL
         ORDER BY due_at ASC`
      );
      res.json({ reminders });
    } catch (error) {
      console.error('Load reminders error:', error.message);
      res.status(500).json({ message: 'Could not load reminders.' });
    }
  });

  router.post('/:id/reminded', async (req, res) => {
    try {
      await ensureTaskTable(db);
      if (!isValidTaskId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid task ID.' });
      }

      const [result] = await db.query(
        `UPDATE assistant_tasks
         SET reminder_sent_at = UTC_TIMESTAMP()
         WHERE id = ?
           AND is_completed = FALSE
           AND due_at IS NOT NULL
           AND due_at <= UTC_TIMESTAMP()
           AND reminder_sent_at IS NULL`,
        [req.params.id]
      );
      res.json({ reminded: result.affectedRows > 0 });
    } catch (error) {
      console.error('Acknowledge reminder error:', error.message);
      res.status(500).json({ message: 'Could not acknowledge reminder.' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      await ensureTaskTable(db);
      const [tasks] = await db.query(
        `${taskSelect}
         ORDER BY is_completed ASC, due_at IS NULL ASC, due_at ASC, id DESC`
      );
      res.json({ tasks: tasks.map(normalizeTask) });
    } catch (error) {
      console.error('Load tasks error:', error.message);
      res.status(500).json({ message: 'Could not load tasks.' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      await ensureTaskTable(db);
      const { title, dueAt = null } = req.body;
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'Task title is required.' });
      }
      if (title.trim().length > 255) {
        return res.status(400).json({ message: 'Task title must be 255 characters or fewer.' });
      }

      const dueAtSql = toUtcSqlDateTime(dueAt);
      if (dueAtSql === undefined) {
        return res.status(400).json({ message: 'A valid task deadline is required.' });
      }

      const [result] = await db.query(
        'INSERT INTO assistant_tasks (title, due_at) VALUES (?, ?)',
        [title.trim(), dueAtSql]
      );
      const [rows] = await db.query(`${taskSelect} WHERE id = ?`, [result.insertId]);
      res.status(201).json({ task: normalizeTask(rows[0]) });
    } catch (error) {
      console.error('Create task error:', error.message);
      res.status(500).json({ message: 'Could not create task.' });
    }
  });

  router.patch('/:id', async (req, res) => {
    try {
      await ensureTaskTable(db);
      const { id } = req.params;
      if (!isValidTaskId(id)) {
        return res.status(400).json({ message: 'Invalid task ID.' });
      }

      const updates = [];
      const values = [];
      if (Object.hasOwn(req.body, 'title')) {
        if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
          return res.status(400).json({ message: 'Task title cannot be empty.' });
        }
        if (req.body.title.trim().length > 255) {
          return res.status(400).json({ message: 'Task title must be 255 characters or fewer.' });
        }
        updates.push('title = ?');
        values.push(req.body.title.trim());
      }

      let resetReminder = false;
      if (Object.hasOwn(req.body, 'dueAt')) {
        const dueAtSql = toUtcSqlDateTime(req.body.dueAt);
        if (dueAtSql === undefined) {
          return res.status(400).json({ message: 'A valid task deadline is required.' });
        }
        updates.push('due_at = ?');
        values.push(dueAtSql);
        resetReminder = true;
      }

      if (Object.hasOwn(req.body, 'done')) {
        if (typeof req.body.done !== 'boolean') {
          return res.status(400).json({ message: 'Task completion must be true or false.' });
        }
        updates.push('is_completed = ?');
        values.push(req.body.done);
        if (!req.body.done) resetReminder = true;
      }

      if (!updates.length) {
        return res.status(400).json({ message: 'No task changes were provided.' });
      }
      if (resetReminder) updates.push('reminder_sent_at = NULL');

      values.push(id);
      const [result] = await db.query(
        `UPDATE assistant_tasks SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      if (!result.affectedRows) {
        return res.status(404).json({ message: 'Task not found.' });
      }

      const [rows] = await db.query(`${taskSelect} WHERE id = ?`, [id]);
      res.json({ task: normalizeTask(rows[0]) });
    } catch (error) {
      console.error('Update task error:', error.message);
      res.status(500).json({ message: 'Could not update task.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await ensureTaskTable(db);
      if (!isValidTaskId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid task ID.' });
      }

      const [result] = await db.query(
        'DELETE FROM assistant_tasks WHERE id = ?',
        [req.params.id]
      );
      if (!result.affectedRows) {
        return res.status(404).json({ message: 'Task not found.' });
      }
      res.json({ message: 'Task deleted successfully.' });
    } catch (error) {
      console.error('Delete task error:', error.message);
      res.status(500).json({ message: 'Could not delete task.' });
    }
  });

  return router;
};

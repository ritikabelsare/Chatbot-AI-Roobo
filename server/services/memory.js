const { askOllama } = require('./ollama');

async function getSavedMemories(db) {
  const [rows] = await db.query(
    `SELECT memory_key, memory_value
     FROM assistant_memory
     ORDER BY updated_at DESC
     LIMIT 30`
  );

  return rows;
}

async function rememberUsefulFacts(db, userMessage) {
  const extractionPrompt = `
Analyze the user's latest message for useful, long-term information
that the user clearly states about themselves.

Save only explicit facts, preferences, ongoing learning goals, or career goals.
Do not save questions, temporary details, guesses, passwords, financial details,
health details, or other sensitive personal information.
If there is no useful fact, return {"memories": []}.

Return ONLY valid JSON in this format:
{
  "memories": [
    {
      "memory_key": "short_snake_case_key",
      "memory_value": "concise fact"
    }
  ]
}

User's latest message:
${JSON.stringify(userMessage)}
`;

  try {
    const result = await askOllama([
      {
        role: 'system',
        content: 'Extract only explicitly stated facts. Never invent facts. Return JSON only.',
      },
      { role: 'user', content: extractionPrompt },
    ]);

    const start = result.indexOf('{');
    const end = result.lastIndexOf('}');
    if (start === -1 || end <= start) return;

    const parsed = JSON.parse(result.slice(start, end + 1));
    if (!Array.isArray(parsed.memories)) return;

    for (const item of parsed.memories.slice(0, 5)) {
      if (
        typeof item.memory_key !== 'string' ||
        typeof item.memory_value !== 'string'
      ) {
        continue;
      }

      const key = item.memory_key.trim().toLowerCase();
      const value = item.memory_value.trim();
      if (!/^[a-z0-9_]{1,100}$/.test(key) || !value || value.length > 500) {
        continue;
      }

      await db.query(
        `INSERT INTO assistant_memory (memory_key, memory_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE memory_value = ?`,
        [key, value, value]
      );
    }
  } catch (error) {
    console.error('Automatic memory error:', error.message);
  }
}

module.exports = { getSavedMemories, rememberUsefulFacts };

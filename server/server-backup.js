
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'My AI Assistant Backend is running!' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        reply: 'Please enter a message.',
      });
    }

    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen2.5:0.5b',
        messages: [
          {
            role: 'user',
            content: message.trim(),
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }

    const data = await response.json();

    res.json({
      reply: data.message?.content || 'No response received.',
    });
  } catch (error) {
    console.error('Ollama API error:', error.message);

    res.status(500).json({
      reply: 'Sorry, AI is unavailable. Please check whether Ollama is running.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

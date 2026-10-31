import { useEffect, useState } from 'react';
import ChatPanel from './components/ChatPanel';
import InsightRail from './components/InsightRail';
import Sidebar from './components/Sidebar';
import WorkspacePages from './components/WorkspacePages';
import { pageDescriptions, starterTasks } from './data/dashboardData';
import useVoiceAssistant from './hooks/useVoiceAssistant';
import './App.css';
import './components.css';
import './pages.css';

const TASKS_API = 'http://localhost:5000/api/tasks';

async function taskRequest(path = '', options = {}) {
  const response = await fetch(`${TASKS_API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Task request failed.');
  return data;
}

function createChat() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    title: 'New Chat',
    messages: [],
  };
}

function loadChats() {
  try {
    const saved = localStorage.getItem('assistant-chats');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error('Could not load chat history:', error);
  }

  return [createChat()];
}

function loadStoredList(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : null;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [chats, setChats] = useState(loadChats);
  const [activeChatId, setActiveChatId] = useState(() => {
    try {
      const saved = localStorage.getItem('assistant-chats');
      const parsed = saved ? JSON.parse(saved) : [];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
    } catch (error) {
      console.error('Could not restore active chat:', error);
    }
    return null;
  });
  const [activePage, setActivePage] = useState('Chat');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState(() =>
    loadStoredList('assistant-tasks', starterTasks)
  );
  const [notes, setNotes] = useState(() => loadStoredList('assistant-notes', []));
  const [newTask, setNewTask] = useState('');
  const [newTaskDueAt, setNewTaskDueAt] = useState('');
  const [taskNotice, setTaskNotice] = useState('');
  const [reminderNotice, setReminderNotice] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('en-IN');
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('assistant-theme') || 'light';
    } catch {
      return 'light';
    }
  });

  const voice = useVoiceAssistant(voiceLanguage, (transcript) => {
    setMessage(transcript);
    void sendMessage(transcript);
  });

  useEffect(() => {
    try {
      localStorage.setItem('assistant-theme', theme);
    } catch (error) {
      console.error('Could not save theme:', error);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('assistant-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('assistant-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        const data = await taskRequest();
        if (cancelled) return;

        if (data.tasks.length) {
          setTasks(data.tasks);
          setTaskNotice('');
          return;
        }

        const savedTasks = loadStoredList('assistant-tasks', starterTasks);
        const migratedTasks = [];
        for (const task of savedTasks) {
          const created = await taskRequest('', {
            method: 'POST',
            body: JSON.stringify({ title: task.title, dueAt: task.due_at || null }),
          });
          let savedTask = created.task;
          if (task.done) {
            const updated = await taskRequest(`/${savedTask.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ done: true }),
            });
            savedTask = updated.task;
          }
          migratedTasks.push(savedTask);
        }

        if (!cancelled) setTasks(migratedTasks);
      } catch (error) {
        if (!cancelled) {
          setTaskNotice(`Task server unavailable. Using saved browser data. ${error.message}`);
        }
      }
    }

    loadTasks();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkReminders() {
      try {
        const data = await taskRequest('/reminders');
        for (const reminder of data.reminders) {
          if (cancelled) return;

          await taskRequest(`/${reminder.id}/reminded`, { method: 'POST' });
          setReminderNotice(`Reminder: ${reminder.title}`);

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Task reminder', {
              body: reminder.title,
              tag: `task-${reminder.id}`,
            });
          }
        }
      } catch {
        // Task loading reports API availability; polling retries on the next interval.
      }
    }

    checkReminders();
    const intervalId = window.setInterval(checkReminders, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!reminderNotice) return undefined;
    const timeoutId = window.setTimeout(() => setReminderNotice(''), 12000);
    return () => window.clearTimeout(timeoutId);
  }, [reminderNotice]);

  useEffect(() => {
    let cancelled = false;

    async function loadDatabaseChats() {
      try {
        const response = await fetch('http://localhost:5000/api/chats');
        if (!response.ok) throw new Error('Could not load database chats');

        const data = await response.json();
        if (cancelled) return;

        if (Array.isArray(data.chats) && data.chats.length > 0) {
          setChats(data.chats);
          setActiveChatId(data.chats[0].id);
        }
      } catch (error) {
        console.error('Using localStorage chat history:', error.message);
      }
    }

    loadDatabaseChats();
    return () => { cancelled = true; };
  }, []);

  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const completedTasks = tasks.filter((task) => task.done).length;
  const completionRate = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  function toggleTheme() {
    setTheme((current) => current === 'light' ? 'dark' : 'light');
  }

  async function toggleTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const done = !task.done;
    setTasks((previous) => previous.map((item) =>
      item.id === taskId ? { ...item, done } : item
    ));

    if (!/^\d+$/.test(String(taskId))) return;
    try {
      const data = await taskRequest(`/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ done }),
      });
      setTasks((previous) => previous.map((item) =>
        item.id === taskId ? data.task : item
      ));
    } catch (error) {
      setTasks((previous) => previous.map((item) =>
        item.id === taskId ? { ...item, done: task.done } : item
      ));
      setTaskNotice(error.message);
    }
  }

  async function deleteTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    setTasks((previous) => previous.filter((task) => task.id !== taskId));
    if (!/^\d+$/.test(String(taskId))) return;

    try {
      await taskRequest(`/${taskId}`, { method: 'DELETE' });
      setTaskNotice('');
    } catch (error) {
      setTasks((previous) => [task, ...previous]);
      setTaskNotice(error.message);
    }
  }

  async function addTask(event) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;

    const dueAt = newTaskDueAt
      ? new Date(newTaskDueAt).toISOString()
      : null;

    if (dueAt && 'Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }

    try {
      const data = await taskRequest('', {
        method: 'POST',
        body: JSON.stringify({ title, dueAt }),
      });
      setTasks((previous) => [data.task, ...previous]);
      setTaskNotice('');
    } catch (error) {
      setTasks((previous) => [
        { id: `local-${Date.now()}`, title, due_at: dueAt, done: false },
        ...previous,
      ]);
      setTaskNotice(`Saved in this browser only. ${error.message}`);
    }

    setNewTask('');
    setNewTaskDueAt('');
  }

  function addNote(event) {
    event.preventDefault();
    const title = noteTitle.trim();
    const body = noteBody.trim();
    if (!title && !body) return;

    setNotes((previous) => [
      {
        id: `${Date.now()}`,
        title: title || 'Untitled note',
        body,
        updatedAt: new Date().toLocaleDateString(),
      },
      ...previous,
    ]);
    setNoteTitle('');
    setNoteBody('');
  }

  function newChat() {
    const chat = createChat();
    setChats((previous) => [chat, ...previous]);
    setActiveChatId(chat.id);
    setMessage('');
  }

  function deleteChat(chatId) {
    fetch(`http://localhost:5000/api/chats/${encodeURIComponent(chatId)}`, {
      method: 'DELETE',
    }).catch((error) => {
      console.error('Could not delete chat from MySQL:', error);
    });

    const remaining = chats.filter((chat) => chat.id !== chatId);
    setChats(remaining);
    if (activeChatId !== chatId) return;

    if (remaining.length > 0) {
      setActiveChatId(remaining[0].id);
    } else {
      const chat = createChat();
      setChats([chat]);
      setActiveChatId(chat.id);
    }
  }

  async function sendMessage(eventOrText) {
    if (typeof eventOrText !== 'string') eventOrText?.preventDefault();
    const text = typeof eventOrText === 'string'
      ? eventOrText.trim()
      : message.trim();
    if (!text || loading) return;

    let chatId = activeChatId;
    let chat = chats.find((item) => item.id === chatId);
    if (!chat) {
      chat = createChat();
      chatId = chat.id;
      setActiveChatId(chatId);
      setChats((previous) => [chat, ...previous]);
    }

    const updatedTitle = chat.messages.length === 0
      ? text.slice(0, 35) + (text.length > 35 ? '...' : '')
      : chat.title;

    setChats((previous) => previous.map((item) => item.id === chatId
      ? {
        ...item,
        title: updatedTitle,
        messages: [...item.messages, { sender: 'You', text }],
      }
      : item
    ));
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: chatId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.reply || 'Request failed');

      setChats((previous) => previous.map((item) => item.id === chatId
        ? {
          ...item,
          messages: [...item.messages, {
            sender: 'Assistant',
            text: data.reply || 'No reply received.',
          }],
        }
        : item
      ));

      if (data.reply) voice.speakReply(data.reply);
      else voice.resumeHandsFreeAfterReply();
    } catch {
      setChats((previous) => previous.map((item) => item.id === chatId
        ? {
          ...item,
          messages: [...item.messages, {
            sender: 'Assistant',
            text: 'Backend connection failed. Please check the server.',
          }],
        }
        : item
      ));
      voice.resumeHandsFreeAfterReply();
    } finally {
      setLoading(false);
    }
  }

  function selectChat(chatId) {
    setActiveChatId(chatId);
    setMessage('');
  }

  return (
    <div className={`app ${theme}-mode`}>
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={newChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="workspace">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace <span>/</span> {activePage}</div>
            <p>{pageDescriptions[activePage]}</p>
          </div>
          <div className="topbar-actions">
            <span className="today-label">
              {new Intl.DateTimeFormat('en', {
                weekday: 'short', month: 'short', day: 'numeric',
              }).format(new Date())}
            </span>
            <button className="notification-btn" title="Notifications" aria-label="Notifications">♧<i /></button>
          </div>
        </header>
        {(reminderNotice || (taskNotice && activePage !== 'Tasks')) && (
          <div className={`task-notice ${reminderNotice ? 'reminder-notice' : ''}`} role="status">
            <span>{reminderNotice || taskNotice}</span>
            {reminderNotice && <button onClick={() => setReminderNotice('')} aria-label="Dismiss reminder">×</button>}
          </div>
        )}

        <div className="workspace-columns">
          {activePage === 'Chat' ? (
            <ChatPanel
              activeChat={activeChat}
              activeChatId={activeChatId}
              loading={loading}
              message={message}
              onMessageChange={setMessage}
              onSubmit={sendMessage}
              voiceLanguage={voiceLanguage}
              onVoiceLanguageChange={setVoiceLanguage}
              handsFree={voice.handsFree}
              onStartListening={voice.startListening}
              onStopListening={voice.stopListening}
              speaking={voice.speaking}
              onStopSpeaking={voice.stopSpeaking}
              voiceStatus={voice.voiceStatus}
            />
          ) : (
            <WorkspacePages
              activePage={activePage}
              tasks={tasks}
              completedTasks={completedTasks}
              notes={notes}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              newTask={newTask}
              onNewTaskChange={setNewTask}
              newTaskDueAt={newTaskDueAt}
              onNewTaskDueAtChange={setNewTaskDueAt}
              onAddTask={addTask}
              taskNotice={taskNotice}
              noteTitle={noteTitle}
              onNoteTitleChange={setNoteTitle}
              noteBody={noteBody}
              onNoteBodyChange={setNoteBody}
              onAddNote={addNote}
              theme={theme}
              onToggleTheme={toggleTheme}
              voiceLanguage={voiceLanguage}
              onVoiceLanguageChange={setVoiceLanguage}
              onNavigate={setActivePage}
            />
          )}
          <InsightRail
            tasks={tasks}
            notesCount={notes.length}
            completionRate={completionRate}
            onToggleTask={toggleTask}
            onNavigate={setActivePage}
          />
        </div>
      </main>
    </div>
  );
}

export default App;

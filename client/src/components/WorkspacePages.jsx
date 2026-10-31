import { IntegrationGrid, TaskList } from './DashboardWidgets';

export default function WorkspacePages({
  activePage,
  tasks,
  completedTasks,
  notes,
  onToggleTask,
  onDeleteTask,
  newTask,
  onNewTaskChange,
  newTaskDueAt,
  onNewTaskDueAtChange,
  onAddTask,
  taskNotice,
  noteTitle,
  onNoteTitleChange,
  noteBody,
  onNoteBodyChange,
  onAddNote,
  theme,
  onToggleTheme,
  voiceLanguage,
  onVoiceLanguageChange,
  onNavigate,
}) {
  if (activePage === 'Dashboard') {
    return (
      <div className="center-panel page-panel">
        <div className="page-content">
          <div className="page-heading">
            <div><p className="eyebrow">OVERVIEW</p><h1>Your day, <span>in focus.</span></h1></div>
            <button className="quiet-button" onClick={() => onNavigate('Tasks')}>View tasks <span>↗</span></button>
          </div>
          <div className="metric-grid">
            <div className="metric-panel"><span>Open tasks</span><strong>{tasks.length - completedTasks}</strong><small>across your list</small></div>
            <div className="metric-panel"><span>Completed</span><strong>{completedTasks}</strong><small>ready for today</small></div>
            <div className="metric-panel"><span>Saved notes</span><strong>{notes.length}</strong><small>in this workspace</small></div>
          </div>
          <TaskList tasks={tasks} onToggle={onToggleTask} className="full-task-list" />
        </div>
      </div>
    );
  }

  if (activePage === 'Tasks') {
    return (
      <div className="center-panel page-panel">
        <div className="page-content">
          <div className="page-heading">
            <div><p className="eyebrow">YOUR LIST</p><h1>Tasks</h1></div>
            <span className="count-label">{tasks.length} total</span>
          </div>
          <form className="add-item-form" onSubmit={onAddTask}>
            <input value={newTask} onChange={(event) => onNewTaskChange(event.target.value)} placeholder="Add a task..." aria-label="New task" />
            <label className="deadline-field">
              <span>Deadline</span>
              <input
                type="datetime-local"
                value={newTaskDueAt}
                onChange={(event) => onNewTaskDueAtChange(event.target.value)}
                aria-label="Task deadline"
              />
            </label>
            <button type="submit" disabled={!newTask.trim()}>Add task <span>＋</span></button>
          </form>
          {taskNotice && <p className="task-page-notice" role="status">{taskNotice}</p>}
          <TaskList tasks={tasks} onToggle={onToggleTask} onDelete={onDeleteTask} className="full-task-list" showTime />
        </div>
      </div>
    );
  }

  if (activePage === 'Calendar') {
    const scheduledTasks = tasks.filter((task) => !task.done).slice(0, 4);
    return (
      <div className="center-panel page-panel">
        <div className="page-content">
          <div className="page-heading">
            <div><p className="eyebrow">SCHEDULE</p><h1>Calendar</h1></div>
            <span className="count-label">Today</span>
          </div>
          <div className="calendar-date">
            <strong>{new Date().getDate()}</strong>
            <span>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long' }).format(new Date())}</span>
          </div>
          <div className="schedule-list">
            {scheduledTasks.map((task, index) => (
              <div className="schedule-item" key={task.id}>
                <time>{task.time === 'Anytime' ? `${10 + index}:00 AM` : task.time}</time>
                <i />
                <div><strong>{task.title}</strong><small>Personal workspace</small></div>
              </div>
            ))}
            {!scheduledTasks.length && <p className="empty-state">Nothing scheduled yet. Add a task to plan your day.</p>}
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'Notes') {
    return (
      <div className="center-panel page-panel">
        <div className="page-content">
          <div className="page-heading">
            <div><p className="eyebrow">YOUR LIBRARY</p><h1>Notes</h1></div>
            <span className="count-label">{notes.length} saved</span>
          </div>
          <form className="note-editor" onSubmit={onAddNote}>
            <input value={noteTitle} onChange={(event) => onNoteTitleChange(event.target.value)} placeholder="Note title" aria-label="Note title" />
            <textarea value={noteBody} onChange={(event) => onNoteBodyChange(event.target.value)} placeholder="Capture an idea..." aria-label="Note content" />
            <button type="submit" disabled={!noteTitle.trim() && !noteBody.trim()}>Save note <span>↗</span></button>
          </form>
          <div className="notes-list">
            {notes.map((note) => (
              <article className="note-item" key={note.id}>
                <div><strong>{note.title}</strong><time>{note.updatedAt}</time></div>
                <p>{note.body || 'No additional details.'}</p>
              </article>
            ))}
            {!notes.length && <p className="empty-state">Your saved notes will show up here.</p>}
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'Integrations') {
    return (
      <div className="center-panel page-panel">
        <div className="page-content">
          <div className="page-heading">
            <div><p className="eyebrow">WORKSPACE TOOLS</p><h1>Integrations</h1></div>
            <span className="count-label">Preview</span>
          </div>
          <p className="page-intro">Keep the services you use close at hand.</p>
          <IntegrationGrid />
          <p className="demo-note">Connection controls are a UI preview. OAuth setup is needed to connect real accounts.</p>
        </div>
      </div>
    );
  }

  if (activePage === 'Settings') {
    return (
      <div className="center-panel page-panel">
        <div className="page-content">
          <div className="page-heading"><div><p className="eyebrow">PREFERENCES</p><h1>Settings</h1></div></div>
          <div className="settings-list">
            <div className="setting-row">
              <div><strong>Appearance</strong><small>Choose your workspace theme</small></div>
              <button className="quiet-button" onClick={onToggleTheme}>{theme === 'dark' ? 'Dark' : 'Light'} mode <span>↔</span></button>
            </div>
            <div className="setting-row">
              <div><strong>Voice language</strong><small>Speech recognition and spoken replies</small></div>
              <select className="voice-language" value={voiceLanguage} onChange={(event) => onVoiceLanguageChange(event.target.value)}>
                <option value="en-IN">English</option>
                <option value="mr-IN">मराठी</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

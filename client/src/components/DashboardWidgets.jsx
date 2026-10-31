import { integrationItems } from '../data/dashboardData';

export function TaskList({ tasks, onToggle, onDelete, className, showTime = false }) {
  if (!tasks.length) {
    return <p className="empty-state">No tasks yet. Add one to get started.</p>;
  }

  return (
    <div className={className}>
      {tasks.map((task) => (
        <div className={`task-row ${task.done ? 'task-done' : ''}`} key={task.id}>
          <button
            className="task-check"
            onClick={() => onToggle(task.id)}
            aria-label={`${task.done ? 'Reopen' : 'Complete'} ${task.title}`}
            aria-pressed={task.done}
          >
            {task.done ? '✓' : ''}
          </button>
          <span className="task-title">{task.title}</span>
          {showTime && <time className="task-time">{formatDeadline(task)}</time>}
          {onDelete && (
            <button
              className="task-delete"
              onClick={() => onDelete(task.id)}
              aria-label={`Delete ${task.title}`}
              title="Delete task"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function formatDeadline(task) {
  if (!task.due_at) return task.time || 'No deadline';
  const date = new Date(task.due_at);
  if (Number.isNaN(date.getTime())) return 'Invalid deadline';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function IntegrationGrid({ compact = false }) {
  return (
    <div className={`integration-grid ${compact ? 'compact' : ''}`}>
      {integrationItems.map((item) => (
        <button
          className="integration-item"
          key={item.name}
          title={`${item.name} integration preview`}
        >
          <span className={`integration-mark ${item.tone}`}>{item.mark}</span>
          <span>{item.name}</span>
        </button>
      ))}
      <button className="integration-item add-integration" title="Integration preview">
        <span className="integration-mark">＋</span>
        <span>Add new</span>
      </button>
    </div>
  );
}

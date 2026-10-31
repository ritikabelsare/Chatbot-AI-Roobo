import { IntegrationGrid, TaskList } from './DashboardWidgets';

export default function InsightRail({
  tasks,
  notesCount,
  completionRate,
  onToggleTask,
  onNavigate,
}) {
  return (
    <aside className="insight-rail">
      <section className="rail-section integrations-section">
        <div className="rail-heading">
          <h2>Integrations</h2>
          <button onClick={() => onNavigate('Integrations')}>View all <span>↗</span></button>
        </div>
        <IntegrationGrid compact />
      </section>

      <section className="rail-section">
        <div className="rail-heading">
          <h2>Today’s tasks</h2>
          <button onClick={() => onNavigate('Tasks')}>View all <span>↗</span></button>
        </div>
        <TaskList tasks={tasks.slice(0, 3)} onToggle={onToggleTask} className="rail-task-list" />
      </section>

      <section className="rail-section productivity-section">
        <div className="rail-heading"><h2>Productivity</h2><span className="period-label">Today</span></div>
        <div className="productivity-content">
          <div className="progress-ring" style={{ '--progress': `${completionRate}%` }}>
            <div><strong>{completionRate}%</strong><small>tasks done</small></div>
          </div>
          <div className="productivity-stats">
            <div><span>Tasks completed</span><strong>{tasks.filter((task) => task.done).length}</strong></div>
            <div><span>Tasks remaining</span><strong>{tasks.length - tasks.filter((task) => task.done).length}</strong></div>
            <div><span>Notes saved</span><strong>{notesCount}</strong></div>
          </div>
        </div>
      </section>
    </aside>
  );
}

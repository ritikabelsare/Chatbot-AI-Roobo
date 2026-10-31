import { navigationItems } from '../data/dashboardData';

export default function Sidebar({
  activePage,
  onNavigate,
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  theme,
  onToggleTheme,
}) {
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate('Chat')}>
        <span className="brand-mark">✦</span>
        <span>AI Assistant</span>
        <i aria-label="Online" />
      </button>

      <nav className="primary-nav" aria-label="Main navigation">
        {navigationItems.map((item) => (
          <button
            className={`nav-item ${activePage === item.label ? 'active' : ''}`}
            key={item.label}
            onClick={() => onNavigate(item.label)}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {activePage === 'Chat' && (
        <section className="history-section">
          <div className="section-label">Recent chats</div>
          <button className="new-chat-btn" onClick={onNewChat}>
            <span aria-hidden="true">＋</span> New chat
          </button>
          <div className="history-list">
            {chats.map((chat) => (
              <div
                className={`history-item ${chat.id === activeChatId ? 'selected-chat' : ''}`}
                key={chat.id}
              >
                <button
                  className="history-title"
                  onClick={() => onSelectChat(chat.id)}
                  title={chat.title}
                >
                  {chat.title}
                </button>
                <button
                  className="delete-chat-btn"
                  onClick={() => onDeleteChat(chat.id)}
                  title="Delete chat"
                  aria-label={`Delete ${chat.title}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="sidebar-bottom">
        <button className="theme-toggle" onClick={onToggleTheme}>
          <span aria-hidden="true">{theme === 'light' ? '◐' : '☼'}</span>
          <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          <span className={`toggle-track ${theme}`}><i /></span>
        </button>
        <button className="profile-button" onClick={() => onNavigate('Settings')}>
          <span className="profile-avatar">A</span>
          <span className="profile-copy"><strong>My Workspace</strong><small>Personal plan</small></span>
          <span className="profile-more">···</span>
        </button>
      </div>
    </aside>
  );
}

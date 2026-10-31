export default function ChatPanel({
  activeChat,
  activeChatId,
  loading,
  message,
  onMessageChange,
  onSubmit,
  voiceLanguage,
  onVoiceLanguageChange,
  handsFree,
  onStartListening,
  onStopListening,
  speaking,
  onStopSpeaking,
  voiceStatus,
}) {
  return (
    <section className="center-panel chat-panel">
      <section className="chat-area">
        {!activeChat || activeChat.messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="assistant-orbit" aria-hidden="true">
              <span className="orbit-ring" />
              <span className="assistant-face">✦</span>
              <i className="orbit-dot dot-one" />
              <i className="orbit-dot dot-two" />
            </div>
            <p className="eyebrow">YOUR AI WORKSPACE</p>
            <h1>Good day. <span>What’s on your mind?</span></h1>
            <p className="welcome-description">Ask a question, plan your day, or work through an idea.</p>
            <div className="suggestion-row">
              {['Plan my day', 'Summarize a document', 'Help me write'].map((suggestion) => (
                <button key={suggestion} onClick={() => onMessageChange(suggestion)}>
                  {suggestion}<span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {activeChat.messages.map((chat, index) => (
              <div
                className={`chat-message ${chat.sender === 'You' ? 'user-message' : 'ai-message'}`}
                key={`${activeChat.id}-${index}`}
              >
                {chat.sender !== 'You' && <span className="message-avatar">✦</span>}
                <div><strong>{chat.sender}</strong><p>{chat.text}</p></div>
              </div>
            ))}
            {loading && activeChatId === activeChat.id && (
              <div className="chat-message ai-message typing-message" role="status">
                <span className="message-avatar">✦</span>
                <div className="typing-indicator"><i /><i /><i /></div>
              </div>
            )}
          </div>
        )}
      </section>

      <form className="chat-box" onSubmit={onSubmit}>
        <button
          type="button"
          className={`voice-btn ${handsFree ? 'voice-active' : ''}`}
          onClick={handsFree ? onStopListening : onStartListening}
          disabled={loading && !handsFree}
          title={handsFree ? 'Stop hands-free voice chat' : 'Start hands-free voice chat'}
          aria-label={handsFree ? 'Stop hands-free voice chat' : 'Start hands-free voice chat'}
          aria-pressed={handsFree}
        >
          {handsFree ? '⏹' : '🎙️'}
        </button>
        <input
          type="text"
          placeholder="Message your assistant..."
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
        />
        <select
          className="voice-language"
          value={voiceLanguage}
          onChange={(event) => onVoiceLanguageChange(event.target.value)}
          aria-label="Voice language"
          title="Voice language"
        >
          <option value="en-IN">EN</option>
          <option value="mr-IN">MR</option>
        </select>
        {speaking && (
          <button type="button" className="stop-voice-btn" onClick={onStopSpeaking} title="Stop AI voice">
            Stop voice
          </button>
        )}
        <button className="send-btn" type="submit" disabled={loading || !message.trim()} aria-label="Send message">
          {loading ? '…' : '↑'}
        </button>
      </form>
      {voiceStatus && <p className="voice-status" role="status" aria-live="polite">{voiceStatus}</p>}
    </section>
  );
}

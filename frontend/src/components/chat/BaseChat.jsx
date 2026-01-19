import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MoreHorizontal,
  Image,
  Send,
  ChevronRight,
  ChevronLeft,
  Home,
  MessageCircle,
  UserPlus,
  Bot,
  Images,
  Shuffle,
  Crown,
  User,
  HelpCircle
} from 'lucide-react';
import './BaseChat.css';

const BaseChat = ({
  character,
  messages = [],
  recentChats = [],
  onSendMessage,
  onGenerateImage,
  isTyping = false,
  isLoggedIn = false
}) => {
  const [messageInput, setMessageInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (messageInput.trim() && onSendMessage) {
      onSendMessage(messageInput);
      setMessageInput('');
    }
  };

  const sideNavItems = [
    { icon: Home, path: '/' },
    { icon: MessageCircle, path: '/chats', active: true },
    // { icon: UserPlus, path: '/create' },
    // { icon: Image, path: '/generate' },
    // { icon: Bot, path: '/my-ai' },
    // { icon: Images, path: '/gallery' },
    // { icon: Shuffle, path: '/faceswap' },
  ];

  const bottomNavItems = [
    { icon: User, path: '/profile' },
    { icon: HelpCircle, path: '/help' },
  ];

  const renderMessage = (msg) => {
    if (msg.type === 'image') {
      return (
        <div className="message-image">
          <img src={msg.imageUrl} alt="Character" />
        </div>
      );
    }

    return (
      <div className="message-bubble">
        {msg.isNarration && <p className="narration">{msg.content}</p>}
        {msg.isDialogue && (
          <p>
            <span className="dialogue">{msg.content}</span>
            {msg.followUp && <span className="narration"> {msg.followUp} </span>}
            {msg.followUpDialogue && <span className="dialogue">{msg.followUpDialogue}</span>}
          </p>
        )}
        {!msg.isNarration && !msg.isDialogue && <p>{msg.content}</p>}
      </div>
    );
  };

  return (
    <div className="base-chat">
      {/* Compact Side Nav */}
      <aside className="chat-side-nav">
        <div className="nav-items">
          {sideNavItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`nav-item ${item.active ? 'active' : ''}`}
            >
              <item.icon size={20} />
            </Link>
          ))}
        </div>
        <div className="nav-bottom">
          <button className="premium-icon-btn">
            <Crown size={20} />
          </button>
          {bottomNavItems.map((item, index) => (
            <Link key={index} to={item.path} className="nav-item">
              <item.icon size={20} />
            </Link>
          ))}
        </div>
      </aside>

      {/* Recent Chats Sidebar */}
      <aside className="recent-chats-sidebar">
        <h2>Recent Chats</h2>
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search for a character" />
        </div>
        <div className="chat-list">
          {recentChats.map((chat) => (
            <Link
              key={chat.id}
              to={`/chat/${chat.id}`}
              className={`chat-item ${chat.id === character?.id ? 'active' : ''}`}
            >
              <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
              <div className="chat-info">
                <div className="chat-header">
                  <span className="chat-name">{chat.name}</span>
                  <span className="chat-time">{chat.time}</span>
                </div>
                <p className="chat-preview">{chat.lastMessage}</p>
              </div>
            </Link>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <div className="chat-header-bar">
          <div className="chat-header-left">
            <img src={character?.avatar} alt={character?.name} className="header-avatar" />
            <span className="header-name">{character?.name}</span>
          </div>
          <button className="more-btn">
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              {msg.sender === 'character' && (
                <img
                  src={character?.avatar}
                  alt={character?.name}
                  className="message-avatar"
                />
              )}
              <div className="message-content">
                {msg.sender === 'character' && (
                  <span className="message-name">{character?.name}</span>
                )}
                {renderMessage(msg)}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message character">
              <img
                src={character?.avatar}
                alt={character?.name}
                className="message-avatar"
              />
              <div className="message-content">
                <span className="message-name">{character?.name}</span>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {isLoggedIn ? (
          <form className="chat-input-area" onSubmit={handleSubmit}>
            <button type="button" className="image-btn" onClick={onGenerateImage}>
              <Image size={20} />
              <span>Image</span>
            </button>
            <div className="input-wrapper">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Write a message..."
              />
              <button type="submit" className="send-btn">
                <Send size={20} />
              </button>
            </div>
          </form>
        ) : (
          <div className="chat-login-prompt">
            <p>Sign in to chat with {character?.name}</p>
            <Link to="/signin" className="login-prompt-btn">Sign In</Link>
            <span className="login-prompt-divider">or</span>
            <Link to="/signup" className="signup-prompt-btn">Create Account</Link>
          </div>
        )}
      </main>

      {/* Character Profile Sidebar */}
      <aside className="character-profile-sidebar open">
        {character && (
          <>
            <div className="profile-image-container">
              <img src={character.avatar} alt={character.name} />
              <button className="nav-arrow left">
                <ChevronLeft size={20} />
              </button>
              <button className="nav-arrow right">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="profile-info">
              <div className="profile-header">
                <h2>{character.name}</h2>
                <Link to={`/character/${character.id}`} className="view-profile-link">
                  View Profile <ChevronRight size={16} />
                </Link>
              </div>

              <div className="profile-tags">
                {character.tags?.map((tag, index) => (
                  <span key={index} className="profile-tag">{tag}</span>
                ))}
              </div>

              <button className="generate-images-btn" onClick={onGenerateImage}>
                Generate images
              </button>

              <p className="profile-description">
                {character.description}
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default BaseChat;

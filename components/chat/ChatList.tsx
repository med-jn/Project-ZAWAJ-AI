'use client';
import React from 'react';
import { formatDistanceToNow } from 'date-fns'; // مكتبة لتنسيق الوقت (منذ...)
import { ar } from 'date-fns/locale'; // اللغة العربية للوقت

interface ChatItemProps {
  id: string;
  user: {
    name: string;
    avatar: string;
    is_mediator: boolean;
  };
  lastMessage: string;
  time: string;
  unreadCount?: number;
  onClick: (id: string) => void;
}

const ChatList = ({ chats }: { chats: ChatItemProps[] }) => {
  return (
    <div className="chat-list-container">
      {chats.map((chat) => (
        <div 
          key={chat.id} 
          onClick={() => chat.onClick(chat.id)}
          className="chat-item"
        >
          {/* الصورة الشخصية - استخدام عرض ثابت صغير لسرعة المعالجة */}
          <div className="avatar-wrapper">
            <img 
              src={chat.user.avatar} 
              alt={chat.user.name} 
              className="chat-avatar"
              loading="lazy" // تحميل كسول لزيادة السرعة
            />
          </div>

          {/* محتوى المحادثة */}
          <div className="chat-info">
            <div className="chat-header">
              <div className="name-badge">
                <span className="user-name">{chat.user.name}</span>
                {chat.user.is_mediator && (
                  <span className="mediator-badge">وسيط</span>
                )}
              </div>
              <span className="chat-time">
                {formatDistanceToNow(new Date(chat.time), { addSuffix: true, locale: ar })}
              </span>
            </div>
            
            <div className="chat-footer">
              <p className="last-message">{chat.lastMessage}</p>
              {chat.unreadCount ? (
                <span className="unread-dot">{chat.unreadCount}</span>
              ) : null}
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .chat-list-container {
          display: flex;
          flex-direction: column;
          background: #080008; /* متوافق مع Layout الخاص بك */
        }
        .chat-item {
          display: flex;
          padding: 12px 16px;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: background 0.2s;
        }
        .chat-item:active {
          background: rgba(255, 255, 255, 0.05);
        }
        .avatar-wrapper {
          position: relative;
          width: 55px;
          height: 55px;
        }
        .chat-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid rgba(255, 255, 255, 0.1);
        }
        .chat-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .name-badge {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .user-name {
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
        }
        .mediator-badge {
          background: linear-gradient(45deg, #d4af37, #f9e29d); /* لون ذهبي للوسيط */
          color: #000;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
        }
        .chat-time {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.75rem;
        }
        .last-message {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis; /* قص الرسالة الطويلة بنقاط */
          margin: 0;
        }
        .unread-dot {
          background: #ff2d55;
          color: white;
          font-size: 0.7rem;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }
        .chat-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default ChatList;
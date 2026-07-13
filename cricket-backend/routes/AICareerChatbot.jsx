import React, { useState, useRef, useEffect } from 'react';

const AICareerChatbot = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello! I am your AI Career Assistant. Ask me anything about skills, salaries, or career changes!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botMsg = { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: `Based on your question about "${userMsg.text}", I recommend checking out our Job Recommendations tab or comparing your skills in the Skill Gap analyzer. Can I help you with anything else?` 
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '600px', border: '1px solid #ccc', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        
        {/* Chat Header */}
        <div style={{ backgroundColor: '#007bff', color: '#fff', padding: '20px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
          AI Career Chatbot 🤖
        </div>

        {/* Chat Window */}
        <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ backgroundColor: msg.sender === 'user' ? '#007bff' : '#e9ecef', color: msg.sender === 'user' ? '#fff' : '#333', padding: '12px 18px', borderRadius: '18px', borderBottomRightRadius: msg.sender === 'user' ? '4px' : '18px', borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '18px', fontSize: '15px', lineHeight: '1.4' }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', backgroundColor: '#e9ecef', color: '#666', padding: '10px 18px', borderRadius: '18px', fontSize: '14px', fontStyle: 'italic' }}>
              AI is typing...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} style={{ display: 'flex', borderTop: '1px solid #ccc', padding: '15px', backgroundColor: '#fff' }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your career question..." style={{ flex: 1, padding: '12px', borderRadius: '24px', border: '1px solid #ccc', fontSize: '15px', outline: 'none', marginRight: '10px' }} />
          <button type="submit" disabled={isTyping || !input.trim()} style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};

export default AICareerChatbot;
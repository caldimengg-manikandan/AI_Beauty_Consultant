import React, { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX, FiSend, FiMinimize2 } from 'react-icons/fi';
import { sendChatMessage } from '../services/chatApi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import VoiceConsultant from './VoiceConsultant';

export default function ChatWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your AI Beauty Assistant 💅. I can help you book appointments, recommend treatments, or check prices. How can I assist you today?", sender: "bot" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({});
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // If user is not logged in, or is a shop owner, maybe don't show the widget
  // Let's hide it for shop_owners for now since it's for customer bookings
  if (!user || user.account_type === 'shop_owner') return null;

  const handleSend = async (e, directText) => {
    e?.preventDefault();
    const userText = (directText || input).trim();
    if (!userText) return;

    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user' }]);
    setLoading(true);

    try {
      const response = await sendChatMessage(userText, context);
      
      setMessages(prev => [...prev, { id: Date.now()+1, text: response.reply, sender: 'bot' }]);
      
      if (response.action === "CONFIRM_BOOKING") {
        setContext({ pending_action: "CONFIRM_BOOKING", action_data: response.action_data });
      } else if (response.action === "BOOKING_SUCCESS") {
        setContext({});
        toast.success("Appointment booked successfully!");
      } else if (response.action === "NAVIGATE") {
        setContext({});
        setTimeout(() => {
          navigate(response.action_data);
          setIsOpen(false);
        }, 1500);
      }
      
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now()+1, text: "I'm having trouble connecting right now. Please try again later.", sender: 'bot', error: true }]);
    } finally {
      setLoading(false);
    }
  };


  const handleVoiceTranscript = (text) => {
    setInput(text);
    // Auto-send after a tiny delay so user can see it
    setTimeout(() => {
      handleSend(null, text);
    }, 400);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 animate-bounce"
        >
          <FiMessageSquare size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white/90 backdrop-blur-xl w-[350px] sm:w-[400px] h-[520px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/40 animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 text-xl">✨</div>
              <div>
                <h3 className="font-bold text-sm">AI Beauty Assistant</h3>
                <p className="text-[10px] text-pink-100 uppercase tracking-widest font-black flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse"></span>
                  Voice + Text Enabled
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Minimize chat" className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors">
              <FiMinimize2 size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-rose-500 text-white rounded-tr-sm shadow-md' 
                    : msg.error 
                      ? 'bg-red-50 text-red-600 rounded-tl-sm border border-red-100'
                      : 'bg-white text-slate-800 rounded-tl-sm shadow-sm border border-slate-100'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 flex gap-1">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area — now with Voice */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center relative">
            <VoiceConsultant onTranscript={handleVoiceTranscript} />
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask or tap mic to speak..." 
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || loading}
              className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 transition-colors shadow-md"
            >
              <FiSend size={18} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}


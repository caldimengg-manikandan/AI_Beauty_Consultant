import { useState, useRef, useEffect } from "react";
import { sendChat } from "../../services/api";

const ConsultantChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm your AI Beauty Consultant. How can I help you today? ✨", sender: "bot" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const toggleChat = () => setIsOpen(!isOpen);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { text: userMsg, sender: "user" }]);
        setInput("");
        setLoading(true);

        try {
            const res = await sendChat(userMsg);
            console.log("Chat response:", res);
            setMessages(prev => [...prev, { text: res.reply, sender: "bot" }]);
        } catch (err) {
            console.error("Chat error:", err);
            console.error("Error response:", err.response?.data);
            const errorMsg = err.response?.data?.detail || err.response?.data?.error || "Sorry, I'm having trouble connecting. Try again later.";
            setMessages(prev => [...prev, { text: errorMsg, sender: "bot" }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleSend();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white/90 backdrop-blur-xl w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl border border-white/50 flex flex-col mb-4 animate-fade-in-up overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-teal-600 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🤖</span>
                            <div>
                                <h3 className="text-white font-bold text-sm">AI Consultant</h3>
                                <span className="text-white/80 text-xs flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online
                                </span>
                            </div>
                        </div>
                        <button onClick={toggleChat} className="text-white/80 hover:text-white transition-colors">
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm leading-relaxed whitespace-pre-line ${msg.sender === "user"
                                        ? "bg-purple-600 text-white rounded-br-none"
                                        : "bg-white text-gray-700 border border-gray-100 rounded-bl-none"
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask about skin, facials, booking..."
                            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409 8.75 8.75 0 1113.45 0 1 1 0 001.169-1.409l-7-14z" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={toggleChat}
                className="bg-gradient-to-r from-purple-600 to-teal-600 text-white p-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)]
                     hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-110 transition-all duration-300 group z-50 border-4 border-white"
            >
                <span className="text-3xl group-hover:hidden">💬</span>
                <span className="text-3xl hidden group-hover:block">👋</span>

                {!isOpen && (
                    <span className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>
        </div>
    );
};

export default ConsultantChat;

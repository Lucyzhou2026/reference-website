import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Sparkles, Plus, History, Paperclip, FileText, X, BrainCircuit, Globe, Trash2, Edit2, Check } from 'lucide-react';
import mammoth from 'mammoth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: Array<{ name: string; type: string }>;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = '/api/deepseek/chat/completions';

const WritePanel: React.FC = () => {
  // State
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('chat_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; content: string; type: string }>>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Settings
  const [enableDeepThink, setEnableDeepThink] = useState(false);
  const [enableWebSearch, setEnableWebSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize new session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    } else if (!currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, []);

  // Save sessions to local storage
  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, loading]);

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);
  
  const currentMessages = getCurrentSession()?.messages || [];

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [{ 
        role: 'assistant', 
        content: 'Hello! I am your academic writing assistant. I can help you research, write, and refine your paper. You can also upload documents for me to analyze.' 
      }],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let content = '';

      try {
        if (file.name.endsWith('.txt')) {
          content = await file.text();
        } else if (file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
        } else if (file.name.endsWith('.pdf')) {
          // Placeholder for PDF
          content = "[PDF content extraction would go here]"; 
        }

        if (content) {
          newAttachments.push({
            name: file.name,
            content: content,
            type: file.type
          });
        }
      } catch (err) {
        console.error("File read error:", err);
      }
    }

    setAttachedFiles(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateChatTitle = async (firstUserMessage: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful assistant. Generate a short, concise title (max 5 words) for a chat that starts with this user message. Return ONLY the title, no quotes or other text.' },
            { role: 'user', content: firstUserMessage }
          ],
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const title = data.choices[0].message.content.trim();
        return title;
      }
    } catch (error) {
      console.error("Failed to generate title:", error);
    }
    return firstUserMessage.slice(0, 30);
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || loading || !currentSessionId) return;

    const fileContext = attachedFiles.map(f => `[File: ${f.name}]\n${f.content}\n`).join('\n');
    const fullContent = `${fileContext}${input}`;
    
    const userMessage: Message = { 
      role: 'user', 
      content: input,
      files: attachedFiles.map(f => ({ name: f.name, type: f.type }))
    };

    // Determine if we need to generate a title (if it's the first user message)
    let shouldGenerateTitle = false;
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        if (s.messages.length <= 1) {
          shouldGenerateTitle = true;
        }
        return { ...s, messages: [...s.messages, userMessage] };
      }
      return s;
    }));

    setInput('');
    setAttachedFiles([]);
    setLoading(true);

    // Generate title in background if needed
    if (shouldGenerateTitle) {
      generateChatTitle(input).then(newTitle => {
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return { ...s, title: newTitle };
          }
          return s;
        }));
      });
    }

    try {
      if (!DEEPSEEK_API_KEY) throw new Error("API Key missing");

      const apiMessages = [
        { role: 'system', content: 'You are a helpful academic writing assistant.' },
        ...currentMessages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: fullContent }
      ];
      
      if (enableDeepThink) {
        apiMessages[0].content += " Please think deeply and step-by-step about the user's request.";
      }
      
      if (enableWebSearch) {
        apiMessages[0].content += " Use your knowledge base effectively.";
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat', 
          messages: apiMessages,
          stream: true // Enable streaming
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';

      if (reader) {
        // Add initial empty assistant message
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return { ...s, messages: [...s.messages, { role: 'assistant', content: '' }] };
            }
            return s;
        }));

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in buffer
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') break;
              
              try {
                const data = JSON.parse(dataStr);
                const content = data.choices[0]?.delta?.content || '';
                assistantContent += content;

                // Update the last message content incrementally
                setSessions(prev => prev.map(s => {
                    if (s.id === currentSessionId) {
                        const newMessages = [...s.messages];
                        newMessages[newMessages.length - 1] = { 
                            ...newMessages[newMessages.length - 1], 
                            content: assistantContent 
                        };
                        return { ...s, messages: newMessages };
                    }
                    return s;
                }));
              } catch (e) {
                console.error("Error parsing stream chunk", e);
              }
            }
          }
        }
      }

    } catch (error: any) {
      console.error('API failed:', error);
      
      let msgText = 'Sorry, I encountered an error. Please check your network or API key.';
      if (error.message?.includes('401')) {
        msgText = 'Authentication failed (401). Please check your API Key in .env file.';
      } else if (error.message?.includes('429')) {
        msgText = 'Rate limit exceeded (429). Please try again later.';
      } else if (error.message?.includes('500')) {
        msgText = 'Server error (500). DeepSeek service might be down.';
      }

      const errorMessage: Message = {
        role: 'assistant',
        content: msgText
      };
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...s.messages, errorMessage] };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const saveTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingSessionId) {
      setSessions(prev => prev.map(s => 
        s.id === editingSessionId ? { ...s, title: editingTitle } : s
      ));
      setEditingSessionId(null);
    }
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      const newSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(newSessions);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
        if (newSessions.length === 0) {
           const newSession: ChatSession = {
              id: Date.now().toString(),
              title: 'New Chat',
              messages: [{ 
                role: 'assistant', 
                content: 'Hello! I am your academic writing assistant. I can help you research, write, and refine your paper. You can also upload documents for me to analyze.' 
              }],
              createdAt: Date.now()
            };
            setSessions([newSession]);
            setCurrentSessionId(newSession.id);
        }
      }
    }
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar - History */}
      <div 
        className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gray-100 border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b bg-gray-50">
          <button 
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`group w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 cursor-pointer ${
                currentSessionId === session.id ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <History size={14} className="opacity-50 flex-shrink-0" />
              
              {editingSessionId === session.id ? (
                <div className="flex items-center flex-1 gap-1 min-w-0">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 px-1 py-0.5 border rounded text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') saveTitle(e as any);
                    }}
                  />
                  <button onClick={saveTitle} className="p-1 hover:text-green-600"><Check size={12} /></button>
                </div>
              ) : (
                <>
                  <span className="truncate flex-1">{session.title}</span>
                  <div className="hidden group-hover:flex items-center gap-1 opacity-60">
                    <button 
                      onClick={(e) => startEditing(e, session)} 
                      className="p-1 hover:text-blue-600 hover:bg-gray-300 rounded"
                      title="Rename"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={(e) => deleteSession(e, session.id)} 
                      className="p-1 hover:text-red-600 hover:bg-gray-300 rounded"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Header */}
        <div className="h-14 border-b bg-white flex items-center justify-between px-4 shadow-sm z-10">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
             <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-md mr-2"
            >
              <History size={18} />
            </button>
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>DeepSeek Assistant</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button 
              onClick={() => setEnableDeepThink(!enableDeepThink)}
              className={`flex items-center gap-1 px-2 py-1 rounded border ${enableDeepThink ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              title="Enable Deep Thinking Mode"
            >
              <BrainCircuit size={14} />
              DeepThink
            </button>
            <button 
              onClick={() => setEnableWebSearch(!enableWebSearch)}
              className={`flex items-center gap-1 px-2 py-1 rounded border ${enableWebSearch ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              title="Enable Web Search"
            >
              <Globe size={14} />
              Web Search
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {currentMessages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-blue-600" />
                </div>
              )}
              
              <div className={`max-w-[85%] space-y-2`}>
                 {msg.files && msg.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    {msg.files.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border">
                        <FileText size={12} /> {f.name}
                      </div>
                    ))}
                  </div>
                )}
                <div 
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none prose-invert' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                  } prose max-w-none`}
                >
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Override default elements to match style
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                      pre: ({node, ...props}) => <pre className="bg-gray-100 p-2 rounded mb-2 overflow-x-auto text-xs" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-gray-600" />
                </div>
              )}
            </div>
          ))}
          
          {loading && currentMessages[currentMessages.length - 1]?.role !== 'assistant' && (
             <div className="flex gap-4 justify-start">
               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-blue-600" />
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-gray-500 text-sm">
                   <Loader className="w-4 h-4 animate-spin" />
                   Thinking...
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs border border-blue-100">
                  <FileText size={14} />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button 
                    onClick={() => removeAttachment(index)}
                    className="hover:bg-blue-100 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything or attach a document..."
              className="w-full bg-transparent p-4 pr-24 min-h-[60px] max-h-[200px] resize-none focus:outline-none text-sm text-gray-800 placeholder-gray-400"
              style={{ height: 'auto', minHeight: '60px' }}
            />
            
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <label className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors" title="Attach Document">
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept=".txt,.docx,.pdf"
                  onChange={handleFileUpload}
                />
                <Paperclip size={18} />
              </label>
              <button
                onClick={handleSend}
                disabled={(!input.trim() && attachedFiles.length === 0) || loading}
                className={`p-2 rounded-lg transition-all ${
                  (!input.trim() && attachedFiles.length === 0) || loading 
                    ? 'bg-gray-200 text-gray-400' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          
          <div className="text-center mt-2 text-xs text-gray-400">
            AI-generated content may contain errors. Review important information.
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritePanel;

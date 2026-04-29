import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ImagePlus, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
}

export function DoubtSolver() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your advanced AI tutor for RRB Group D. Ask me any doubt from Mathematics, General Science, Reasoning, or General Awareness. You can also upload a screenshot of a question!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string, base64: string, mimeType: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extract base64 data and mime type
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        setSelectedImage({
          url: URL.createObjectURL(file),
          mimeType: matches[1],
          base64: matches[2]
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userText = input.trim();
    const currentImage = selectedImage;
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userText || 'Explain this image', 
      imageUrl: currentImage?.url 
    }]);
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let contents: any = userText || 'Explain this image in the context of RRB Group D exam.';
      
      if (currentImage) {
        contents = {
          parts: [
            { text: userText || 'Explain this image in the context of RRB Group D exam.' },
            {
              inlineData: {
                data: currentImage.base64,
                mimeType: currentImage.mimeType
              }
            }
          ]
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: `You are an RRB Group D expert solver for Mathematics and Reasoning questions. Follow this EXACT output format for every Math or Reasoning question:

✅ ANSWER: [Option Letter) Value]

📝 SOLUTION:
[Exact Formula or Rule Name]
Step 1: [one calculation — real numbers from question only]
Step 2: [one calculation — uses output of Step 1]
Step 3: [one calculation if needed]

⚡ TRICK:
[Exact Rule/Formula Name]
[real numbers only → final answer]

RULES:
- First line after 📝 SOLUTION: exact formula/rule in [square brackets]
- NEVER use x, y, or variables — only real numbers from the question
- Max 3 steps, each step is one calculation only
- TRICK line 1: rule name in [brackets], line 2: numbers → answer (no words)
- For Blood Relation/Reasoning: decode symbol → trace chain → state relation in 4 words

BANNED: "Identify the given values", "Using the formula", "We need to find", generic steps without numbers.

For General Science/Awareness: give a clear factual explanation (no strict format required).`
        }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Sorry, I could not generate a response.' }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error while processing your request. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-container bg-primary/5 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="font-bold text-primary">AI Doubt Solver</h2>
          <p className="text-xs text-on-surface-variant">Powered by Gemini Pro</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-surface/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-tertiary text-white" : "bg-primary text-white"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-tertiary text-white rounded-tr-none" 
                : "bg-white border border-surface-container-high text-on-surface rounded-tl-none"
            )}>
              {msg.role === 'user' ? (
                <div className="space-y-2">
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Uploaded" className="max-w-[200px] rounded-lg border border-white/20" />
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-surface-container-high prose-pre:text-on-surface">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-surface-container-high text-on-surface rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-sm text-on-surface-variant">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-surface-container">
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <img src={selectedImage.url} alt="Preview" className="h-20 rounded-lg border border-surface-container-high" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 hover:bg-error/90"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 text-on-surface-variant hover:text-primary rounded-lg flex items-center justify-center transition-colors"
            title="Upload Image"
          >
            <ImagePlus size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your doubt or upload a question image..."
            className="flex-1 bg-surface-container-lowest border border-surface-container-high rounded-xl pl-12 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-container disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            <Send size={14} />
          </button>
        </form>
        <p className="text-[10px] text-center text-on-surface-variant mt-2">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

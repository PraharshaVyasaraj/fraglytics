import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createAnalystChatSession } from '../services/gemini';
import { TeamData, MatchData } from '../types';

interface AnalystChatProps {
  teams: TeamData[];
  matches: MatchData[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const AnalystChat: React.FC<AnalystChatProps> = ({ teams, matches }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session when opened for the first time
  useEffect(() => {
    if (isOpen && !chatSession && teams.length > 0) {
      // Create a summarized context to save tokens and focus on key data
      const topTeams = teams.slice(0, 10).map(t => 
        `Rank ${t.rank}: ${t.name} | Pts: ${t.totalPoints} | Kills: ${t.totalFinishes} | Dmg: ${t.totalDamage.toLocaleString()} | Trend: ${t.trend}`
      ).join('\n');

      const allPlayers = teams.flatMap(t => t.players).sort((a,b) => b.finishes - a.finishes);
      const topPlayers = allPlayers.slice(0, 10).map(p => 
        `${p.teamName} | ${p.playerName}: ${p.finishes} kills, ${p.damage.toLocaleString()} dmg, Impact: ${p.impactScore.toFixed(1)}`
      ).join('\n');

      const context = `
        SESSION SUMMARY:
        - Total Matches Ingested: ${matches.length}
        - Total Participating Teams: ${teams.length}
        
        TOP 10 STANDINGS:
        ${topTeams}
        
        TOP 10 INDIVIDUAL PERFORMERS:
        ${topPlayers}
        
        DETAILED TEAM ROSTERS (JSON):
        ${JSON.stringify(teams.map(t => ({
          team: t.name,
          rank: t.rank,
          stats: { pts: t.totalPoints, kills: t.totalFinishes, dmg: t.totalDamage, efficiency: t.efficiencyRating.toFixed(1) },
          roster: t.players.map(p => ({
            name: p.playerName,
            kills: p.finishes,
            dmg: p.damage,
            dpk: p.dpk.toFixed(0),
            impact: p.impactScore.toFixed(1),
            class: p.carryClass
          }))
        })))}
      `;
      
      const session = createAnalystChatSession(context);
      setChatSession(session);
      
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: "Hello! I'm FragLab AI, your dedicated esports analyst. Ask me anything about the current tournament standings, team performances, or player stats!"
        }
      ]);
    }
  }, [isOpen, teams, matches, chatSession]);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSendMessage = async () => {
    if (!input.trim() || !chatSession || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSession.sendMessage({ message: userMessage.text });
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text || "I'm sorry, I couldn't process that."
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all z-50 flex items-center justify-center group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out font-bold uppercase text-sm">
          Ask Analyst
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed right-6 z-50 flex flex-col bg-tactical-dark border border-tactical-gray shadow-2xl transition-all duration-300 ease-in-out ${isMinimized ? 'bottom-6 w-72 h-14' : 'bottom-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-black border-b border-tactical-gray cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-red-500" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">AI Analyst</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="text-tactical-light hover:text-white transition-colors">
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-tactical-light hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-black/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-tactical-gray' : 'bg-red-600/20 text-red-500'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[75%] p-3 rounded-md text-sm ${msg.role === 'user' ? 'bg-tactical-gray text-white rounded-tr-none' : 'bg-black border border-tactical-gray text-tactical-light rounded-tl-none'}`}>
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-black border border-tactical-gray rounded-md rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                  <span className="text-xs text-tactical-light uppercase">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-black border-t border-tactical-gray flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about teams, players, or stats..."
              className="flex-1 bg-tactical-dark border border-tactical-gray rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-red-600 text-white rounded-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

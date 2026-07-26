import { useState, useRef, useEffect } from 'react';
import { useAppData } from '../data/appData';

const CHATMU_ICON = '/assets/chatmu-icon.webp?v=20260717-2';
import type { FormEvent } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: { url: string; title: string }[];
}

export function SchmuChatWidget() {
  const { data } = useAppData();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message from settings when component mounts
  useEffect(() => {
    setMessages([
      { role: 'assistant', content: data.aiWelcomeMessage || 'Halo! Ada yang bisa saya bantu?' }
    ]);
  }, [data.aiWelcomeMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isChatOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let responseData: any = {};
      
      const SYSTEM_PROMPT = `Anda adalah Asisten KontenMu, platform pendidikan digital terlengkap di Indonesia.
KontenMu dirancang khusus untuk mendigitalkan materi ajar secara interaktif dan terpusat (Video, Game HTML5, Infografis, Modul Teks) untuk sekolah dan guru.
Bantu pengguna (guru/sekolah) dengan profesional, ramah, dan solutif. Jawab pertanyaan hanya seputar KontenMu, sekolah, atau pendidikan.

Instruksi Khusus dari Admin:
${data.aiSystemPrompt || 'Tidak ada instruksi tambahan. Jawab dengan bebas sesuai profil KontenMu.'}

${data.aiAutoContext || ''}`;

      if (data.aiProvider === 'gemini') {
        const geminiHistory = newMessages.slice(0, -1).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));
        
        geminiHistory.push({ role: 'user', parts: [{ text: userMessage }] });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${data.aiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: geminiHistory 
          })
        });
        const result = await response.json();
        
        if (result.error) throw new Error(result.error.message);
        responseData.reply = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
      } else if (data.aiProvider === 'openai') {
        const openaiMessages = newMessages.map(m => ({
          role: m.role,
          content: m.content
        }));

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.aiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...openaiMessages
            ]
          })
        });
        const result = await response.json();
        
        if (result.error) throw new Error(result.error.message);
        responseData.reply = result.choices?.[0]?.message?.content;
        
      } else {
        // schmu or custom
        const history = newMessages
          .slice(1, -1)
          .slice(-6)
          .map(m => ({ role: m.role, content: m.content }));

        // Inject system prompt to the beginning of history for custom endpoints
        const historyWithSystem = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history
        ];
        
        // For SCHMU API, sometimes history system prompt is ignored. We append a silent instruction to the message.
        const forcedMessage = `${userMessage}\n\n[Sistem: Anda adalah Asisten KontenMu. Harap abaikan identitas lain dan jawablah sebagai Asisten KontenMu. Instruksi Khusus: ${data.aiSystemPrompt || 'Tidak ada'}\n${data.aiAutoContext || ''}]`;

        const response = await fetch(data.aiApiEndpoint || 'https://schmu.id/api/chat/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: forcedMessage, history: historyWithSystem })
        });
        responseData = await response.json();
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseData.reply || responseData.error || 'Maaf, jawaban belum tersedia.',
        sources: responseData.sources
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maaf, layanan AI sedang tidak dapat dihubungi.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '85px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '20px'
    }}>
      
      {isChatOpen && (
        <div style={{
          width: '360px',
          background: '#f8fafc',
          borderRadius: '20px',
          boxShadow: '0 24px 70px rgba(15,23,42,0.24)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #dfe5eb',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: 'Inter, sans-serif'
        }}>
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          
          <div style={{ background: '#087f5b', padding: '16px 18px', color: '#fff', position: 'relative' }}>
            <button 
              onClick={() => setIsChatOpen(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', opacity: 0.7, cursor: 'pointer' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={CHATMU_ICON} alt="AI" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '50%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>
                  {data.aiBotName || 'Asisten SCHMU'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Jawaban berdasarkan konten resmi sekolah
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', minHeight: '250px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f7f9fb' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '6px',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
                    <img src={CHATMU_ICON} alt="AI" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'contain' }} />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{data.aiBotName || 'Asisten SCHMU'}</span>
                  </div>
                )}
                <div style={{ 
                  background: msg.role === 'user' ? '#087f5b' : '#fff', 
                  color: msg.role === 'user' ? '#fff' : '#153047',
                  padding: '10px 12px', 
                  borderRadius: msg.role === 'user' ? '13px' : '13px', 
                  fontSize: '14px', 
                  lineHeight: 1.55, 
                  border: msg.role === 'user' ? '1px solid #087f5b' : '1px solid #e4e9ef',
                  maxWidth: '92%',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {msg.sources.map((src, sIdx) => (
                        <a key={sIdx} href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: '#087f5b', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                          Baca sumber: {src.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
                  <img src={CHATMU_ICON} alt="AI" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{data.aiBotName || 'Asisten SCHMU'}</span>
                </div>
                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '13px', color: '#64748b', fontSize: '14px', border: '1px solid #e4e9ef', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Sedang memikirkan...
                  <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '12px', background: '#fff', borderTop: '1px solid #e4e9ef', margin: 0 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Tanyakan informasi sekolah..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                style={{ flex: 1, minWidth: 0, padding: '11px 12px', borderRadius: '12px', border: '1px solid #cfd8e3', outline: 'none', fontSize: '14px', fontFamily: 'inherit' }}
              />
              <button type="submit" disabled={isLoading || !inputValue.trim()} style={{ width: '44px', height: '44px', borderRadius: '12px', background: (isLoading || !inputValue.trim()) ? '#94a3b8' : '#087f5b', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (isLoading || !inputValue.trim()) ? 'default' : 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          color: '#fff',
          boxShadow: '0 10px 25px rgba(15,23,42,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
          transform: isChatOpen ? 'scale(0.9)' : 'scale(1)'
        }}
      >
        {isChatOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        ) : (
          <img src={CHATMU_ICON} alt="ChatMu" style={{ width: '54px', height: '54px', objectFit: 'contain', borderRadius: '50%' }} />
        )}
      </button>
    </div>
  );
}

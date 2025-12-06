import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, X, Send, Loader2, ChevronDown, Scissors, Heart, MapPin, TrendingUp, Palette, User, LogIn, Mic, MicOff, Star, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

interface QuickActionChip {
  id: string;
  label: string;
  icon: string;
}

interface RichMediaCard {
  type: 'salon' | 'service' | 'product' | 'look';
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  imageUrls?: string[];
  rating?: number;
  reviewCount?: number;
  price?: string;
  distance?: string;
  duration?: string;
  ctaLabel?: string;
  ctaAction?: string;
}

interface RelatedService {
  id: string;
  name: string;
  category: string;
  priceRange: string;
  imageUrl?: string;
  duration?: string;
}

interface RelatedSalon {
  id: string;
  name: string;
  rating: number;
  distance?: string;
  imageUrl?: string;
  reviewCount?: number;
  address?: string;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  followUps?: string[];
  richMedia?: RichMediaCard[];
  relatedServices?: RelatedService[];
  relatedSalons?: RelatedSalon[];
}

interface ChatResponse {
  reply: string;
  suggestions?: string[];
  followUps?: string[];
  richMedia?: RichMediaCard[];
  relatedServices?: RelatedService[];
  relatedSalons?: RelatedSalon[];
}

const DEFAULT_CHIPS: QuickActionChip[] = [
  { id: 'recommend_hairstyle', label: 'Hairstyle Ideas', icon: 'scissors' },
  { id: 'skincare_routine', label: 'Skincare Tips', icon: 'sparkles' },
  { id: 'makeup_tips', label: 'Makeup Guide', icon: 'palette' },
  { id: 'find_salon', label: 'Find Salons', icon: 'map-pin' },
  { id: 'trending_looks', label: 'Trending Now', icon: 'trending-up' },
  { id: 'bridal_beauty', label: 'Bridal Beauty', icon: 'heart' },
];

const INTENT_LABELS: Record<string, string> = {
  recommend_hairstyle: 'Recommend a hairstyle for me',
  skincare_routine: 'What skincare routine should I follow?',
  makeup_tips: 'Give me some makeup tips',
  find_salon: 'Help me find salons nearby',
  trending_looks: "What's trending in beauty right now?",
  bridal_beauty: 'Tell me about bridal beauty',
  men_grooming: "What are men's grooming tips?",
  nail_art: 'Show me nail art ideas',
};

function getChipIcon(iconName: string) {
  const iconMap: Record<string, React.ReactNode> = {
    scissors: <Scissors className="h-4 w-4" />,
    sparkles: <Sparkles className="h-4 w-4" />,
    palette: <Palette className="h-4 w-4" />,
    'map-pin': <MapPin className="h-4 w-4" />,
    'trending-up': <TrendingUp className="h-4 w-4" />,
    heart: <Heart className="h-4 w-4" />,
    user: <User className="h-4 w-4" />,
  };
  return iconMap[iconName] || <Sparkles className="h-4 w-4" />;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function AIBeautyConsultant() {
  const { isAuthenticated, login } = useAuth();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [chips] = useState<QuickActionChip[]>(DEFAULT_CHIPS);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef<string>('');

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setVoiceSupported(true);
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          const newText = baseTextRef.current + (baseTextRef.current ? ' ' : '') + finalTranscript;
          setInputText(newText);
          baseTextRef.current = newText;
        } else if (interimTranscript) {
          setInputText(baseTextRef.current + (baseTextRef.current ? ' ' : '') + interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: Event) => {
        setIsListening(false);
        const errorEvent = event as any;
        if (errorEvent.error === 'not-allowed') {
          setVoiceError('Microphone access denied. Please enable microphone permissions.');
        } else if (errorEvent.error === 'no-speech') {
          setVoiceError('No speech detected. Please try again.');
        } else if (errorEvent.error === 'network') {
          setVoiceError('Network error. Please check your connection.');
        } else {
          setVoiceError('Voice input failed. Please try again.');
        }
        setTimeout(() => setVoiceError(null), 4000);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) return;

    setVoiceError(null);
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      baseTextRef.current = inputText;
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, inputText]);

  const chatMutation = useMutation({
    mutationFn: async ({ message, intent }: { message: string; intent?: string }) => {
      const conversationHistory = messages.slice(-8).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/ai-consultant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message,
          intent,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      return response.json() as Promise<ChatResponse>;
    },
    onSuccess: (data) => {
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        suggestions: data.suggestions,
        followUps: data.followUps,
        richMedia: data.richMedia,
        relatedServices: data.relatedServices,
        relatedSalons: data.relatedSalons,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
  });

  const quickQueryMutation = useMutation({
    mutationFn: async (intent: string) => {
      const response = await fetch('/api/ai-consultant/quick-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ intent }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      return response.json() as Promise<ChatResponse>;
    },
    onSuccess: (data, intent) => {
      const userMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: INTENT_LABELS[intent] || intent,
        timestamp: new Date(),
      };

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        suggestions: data.suggestions,
        followUps: data.followUps,
        richMedia: data.richMedia,
        relatedServices: data.relatedServices,
        relatedSalons: data.relatedSalons,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (text: string, intent?: string) => {
    if (!text.trim() && !intent) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text || INTENT_LABELS[intent || ''] || '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    chatMutation.mutate({ message: text, intent });
  };

  const handleChipClick = (chip: QuickActionChip) => {
    quickQueryMutation.mutate(chip.id);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
    }
  };

  const handleToggle = () => {
    setIsOpen(true);
  };

  const isLoading = chatMutation.isPending || quickQueryMutation.isPending;

  if (!isOpen) {
    return (
      <div className="fixed bottom-24 right-8 z-[9999]">
        <Button
          onClick={handleToggle}
          className="flex items-center gap-2 h-12 px-5 rounded-full shadow-xl bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 transition-all duration-300 hover:scale-105 text-white font-medium"
          title="AI Beauty Consultant"
        >
          <Sparkles className="h-5 w-5" />
          <span>AI Consultant</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-8 w-[400px] h-[550px] bg-background border rounded-2xl shadow-2xl flex flex-col z-[10000] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Beauty Consultant</h3>
            <p className="text-xs text-muted-foreground">Your personal beauty advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setIsOpen(false);
              setMessages([]);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/40 dark:to-pink-950/40 border-b flex items-center justify-between">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            Log in for personalized recommendations
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={login} 
            className="h-6 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-200/50 dark:hover:bg-purple-900/50"
          >
            <LogIn className="h-3 w-3 mr-1" />
            Log In
          </Button>
        </div>
      )}
      
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="p-4 overflow-hidden">
          {messages.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h4 className="font-semibold text-lg">How can I help you today?</h4>
                <p className="text-sm text-muted-foreground">
                  Tap a topic below or type your question
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => handleChipClick(chip)}
                    disabled={isLoading}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border",
                      "bg-purple-50 hover:bg-purple-100 border-purple-200",
                      "dark:bg-purple-950/30 dark:hover:bg-purple-950/50 dark:border-purple-800",
                      "text-sm font-medium text-purple-700 dark:text-purple-300",
                      "transition-colors duration-200",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {getChipIcon(chip.icon)}
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2 w-full">
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5",
                      message.role === 'user'
                        ? "ml-auto bg-gradient-to-br from-purple-600 to-pink-500 text-white rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.richMedia && message.richMedia.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 ml-2 scrollbar-thin scrollbar-thumb-purple-300">
                      {message.richMedia.map((card) => (
                        <div
                          key={`${card.type}-${card.id}`}
                          className="flex-shrink-0 w-40 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => card.ctaAction && setLocation(card.ctaAction)}
                        >
                          {card.imageUrl && (
                            <div className="relative h-24 w-full bg-gray-100 dark:bg-gray-700">
                              <img
                                src={card.imageUrl}
                                alt={card.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              {card.type === 'salon' && card.rating && (
                                <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-white/90 dark:bg-gray-800/90 px-1.5 py-0.5 rounded text-xs font-medium">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span>{card.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="p-2">
                            <h5 className="font-medium text-xs text-gray-900 dark:text-white truncate">{card.title}</h5>
                            {card.subtitle && (
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{card.subtitle}</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {card.price && (
                                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">{card.price}</span>
                              )}
                              {card.duration && (
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                                  <Clock className="h-2.5 w-2.5" />
                                  {card.duration}
                                </span>
                              )}
                              {card.distance && (
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {card.distance}
                                </span>
                              )}
                            </div>
                            {card.ctaLabel && (
                              <button className="mt-2 w-full py-1 text-[10px] font-medium bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-md hover:from-purple-700 hover:to-pink-600 transition-colors flex items-center justify-center gap-1">
                                {card.ctaLabel}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 ml-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={isLoading}
                          className="text-xs px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        {voiceError && (
          <div className="mb-2 px-3 py-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
            {voiceError}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask me anything about beauty..."}
            className={cn("flex-1", isListening && "border-purple-500 ring-2 ring-purple-200")}
            disabled={isLoading}
          />
          {voiceSupported && (
            <Button
              type="button"
              size="icon"
              variant={isListening ? "default" : "outline"}
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={cn(
                "transition-all",
                isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
              )}
              title={isListening ? "Stop listening" : "Voice input"}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            type="submit"
            size="icon"
            disabled={!inputText.trim() || isLoading}
            className="bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AIBeautyConsultant;

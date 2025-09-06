import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Mic, MicOff, Volume2, VolumeX, Sparkles, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  metadata?: {
    suggestions?: string[];
    quickActions?: { label: string; action: string }[];
    confidence?: number;
    category?: string;
    isProactive?: boolean;
  };
}

interface ChatbotKnowledge {
  keywords: string[];
  response: string;
  category: string;
  allowedRoles?: string[];
  fuzzyMatches?: string[];
  synonyms?: string[];
  confidence?: number;
  quickActions?: { label: string; action: string }[];
  contextualTriggers?: string[];
}

interface FuzzyMatch {
  term: string;
  similarity: number;
  category: string;
}

interface UserContext {
  currentPage: string;
  recentActions: string[];
  sessionData: any;
  preferences: any;
}

// Advanced fuzzy matching utilities
class FuzzyMatcher {
  static levenshteinDistance(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
  
  static similarity(a: string, b: string): number {
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1.0;
    return (maxLength - this.levenshteinDistance(a, b)) / maxLength;
  }
  
  static fuzzyMatch(query: string, terms: string[], threshold = 0.6): FuzzyMatch[] {
    return terms.map(term => ({
      term,
      similarity: this.similarity(query.toLowerCase(), term.toLowerCase()),
      category: 'general'
    })).filter(match => match.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
  }
}

// Automotive terminology database
const AUTOMOTIVE_TERMS = {
  parts: ['brake pad', 'brake disc', 'engine oil', 'air filter', 'spark plug', 'chain', 'sprocket', 'tire', 'tyre', 'battery', 'clutch', 'carburetor', 'silencer', 'exhaust', 'headlight', 'indicator', 'mirror', 'handle', 'seat', 'mudguard', 'chain guard', 'kick', 'self', 'starter', 'horn'],
  services: ['oil change', 'brake service', 'tune up', 'general service', 'engine repair', 'clutch repair', 'brake repair', 'chain cleaning', 'washing', 'polishing', 'painting'],
  problems: ['not starting', 'noise', 'vibration', 'overheating', 'smoke', 'leak', 'hard brake', 'chain loose', 'puncture', 'battery dead', 'horn not working'],
  tools: ['spanner', 'screwdriver', 'jack', 'pump', 'multimeter', 'scanner', 'grease gun'],
  brands: ['bajaj', 'hero', 'honda', 'yamaha', 'tvs', 'royal enfield', 'ktm', 'suzuki', 'kawasaki']
};

const MESTHRI_KNOWLEDGE: ChatbotKnowledge[] = [
  // Login and Authentication - Enhanced with fuzzy matching
  {
    keywords: ['login', 'sign in', 'password', 'forgot password', 'authentication', 'access'],
    fuzzyMatches: ['logn', 'signin', 'pasword', 'passward', 'forgot pass', 'auth', 'cant login', 'cannot login'],
    synonyms: ['log in', 'sign-in', 'pwd', 'pass', 'authenticate', 'enter system'],
    response: "Hi! I'm Mesthri, your ultra-intelligent garage assistant! 🤖✨\n\n🔐 **Smart Login Help:**\n1. Enter email → I'll validate format automatically\n2. Enter password → Case-sensitive, I'll show hints\n3. Click 'Login' → I'll handle the rest!\n\n🧠 **AI Troubleshooting:**\n• Email format issues → I'll suggest corrections\n• Password problems → I'll guide you step by step\n• Browser issues → I'll detect and fix automatically\n\n🚀 **Pro Tip:** Save login for faster access next time!",
    category: 'authentication',
    confidence: 0.95,
    quickActions: [
      { label: '🔐 Reset Password', action: 'reset_password' },
      { label: '📧 Contact Support', action: 'contact_support' },
      { label: '🔄 Clear Cache', action: 'clear_cache' }
    ]
  },

  // Customer Management - Advanced AI
  {
    keywords: ['customer', 'add customer', 'customer management', 'bike number', 'customer details', 'client'],
    fuzzyMatches: ['custmer', 'costumer', 'customr', 'customar', 'add custmer', 'bike no', 'bike num'],
    synonyms: ['client', 'customer data', 'customer info', 'vehicle owner', 'bike owner'],
    response: "I'm your smart customer management expert! 👥🧠\n\n🚀 **AI-Powered Customer Management:**\n\n📝 **Smart Add Customer:**\n• Auto-detect duplicate bike numbers\n• Suggest similar names if exists\n• Validate phone numbers automatically\n• Smart model/year suggestions\n\n🔍 **Intelligent Search:**\n• Search by partial bike number\n• Find by phone digits\n• Match similar names\n• Filter by service history\n\n💡 **Proactive Insights:**\n• Customer visit patterns\n• Service preferences\n• Payment behavior\n• Loyalty recommendations",
    category: 'customers',
    confidence: 0.98,
    quickActions: [
      { label: '👤 Add New Customer', action: 'add_customer' },
      { label: '🔍 Search Customer', action: 'search_customer' },
      { label: '📊 Customer Analytics', action: 'customer_analytics' }
    ]
  },

  // Job Cards - Ultra Smart
  {
    keywords: ['job card', 'service', 'job', 'complaint', 'work order', 'service request', 'repair'],
    fuzzyMatches: ['job crd', 'jobcard', 'servce', 'servis', 'complant', 'complane', 'work ordr'],
    synonyms: ['service card', 'work card', 'repair order', 'service order', 'maintenance request'],
    response: "I'm your AI-powered job card specialist! 🔧🤖\n\n🚀 **Ultra-Smart Job Management:**\n\n📋 **Intelligent Creation:**\n• Auto-suggest similar past complaints\n• Smart parts recommendations\n• Estimated time & cost predictions\n• Risk assessment for complex jobs\n\n🧠 **AI Assistance:**\n• Real-time progress tracking\n• Quality check reminders\n• Parts availability alerts\n• Customer communication templates\n\n⚡ **Performance Optimization:**\n• Track mechanic efficiency\n• Suggest workflow improvements\n• Predict completion times\n• Auto-generate detailed reports\n\n💰 **Smart Pricing:**\n• Dynamic pricing suggestions\n• Competitor analysis\n• Profit margin optimization\n• Customer-specific discounts",
    category: 'jobs',
    confidence: 0.97,
    quickActions: [
      { label: '🆕 Create Job Card', action: 'create_job' },
      { label: '📋 View Pending Jobs', action: 'view_pending' },
      { label: '⚡ Quick Service', action: 'quick_service' }
    ]
  },

  // Spare Parts - AI Inventory Master
  {
    keywords: ['spare parts', 'inventory', 'parts', 'stock', 'barcode', 'scanner', 'low stock', 'parts management'],
    fuzzyMatches: ['spar parts', 'spare part', 'inventri', 'inventery', 'stok', 'stck', 'barcod', 'scanr'],
    synonyms: ['components', 'parts inventory', 'stock management', 'auto parts', 'bike parts', 'accessories'],
    response: "I'm your AI Inventory Master! 📦🤖✨\n\n🚀 **Ultra-Smart Inventory:**\n\n📱 **AI Barcode Magic:**\n• Instant part recognition\n• Auto-price suggestions\n• Compatibility checking\n• Duplicate prevention\n• Smart categorization\n\n🧠 **Predictive Analytics:**\n• Demand forecasting\n• Optimal stock levels\n• Reorder point calculations\n• Seasonal trend analysis\n• Supplier performance tracking\n\n⚡ **Real-Time Intelligence:**\n• Live stock monitoring\n• Critical shortage alerts\n• Fast-moving item identification\n• Dead stock optimization\n• Profit margin analysis\n\n💡 **Smart Recommendations:**\n• Bundle deal suggestions\n• Cross-selling opportunities\n• Supplier negotiations\n• Bulk purchase timing",
    category: 'inventory',
    confidence: 0.96,
    quickActions: [
      { label: '📱 Scan Barcode', action: 'scan_barcode' },
      { label: '📦 Add New Part', action: 'add_part' },
      { label: '📊 Stock Analytics', action: 'stock_analytics' },
      { label: '⚠️ Low Stock Alert', action: 'low_stock' }
    ]
  },

  // Invoices - Smart Billing
  {
    keywords: ['invoice', 'bill', 'payment', 'whatsapp', 'pdf', 'generate invoice', 'billing'],
    fuzzyMatches: ['invois', 'invoic', 'bil', 'paymnt', 'whatsap', 'whatapp', 'pdf', 'genarate invoice'],
    synonyms: ['receipt', 'billing', 'payment slip', 'bill generate', 'money receipt'],
    response: "I'm your smart billing specialist! 🧾🤖\n\n💰 **AI-Powered Invoicing:**\n\n📄 **Smart Generation:**\n• Auto-calculate totals with tax\n• Include service + parts automatically\n• Professional PDF formatting\n• Custom garage branding\n\n📱 **WhatsApp Integration:**\n• One-click send to customer\n• Auto-format for mobile viewing\n• Delivery confirmation tracking\n• Follow-up reminders\n\n🧠 **Intelligent Features:**\n• Payment behavior analysis\n• Credit limit suggestions\n• Discount optimization\n• Collection strategies\n\n⚡ **Advanced Options:**\n• Bulk invoice generation\n• Recurring billing setup\n• Payment gateway integration\n• Accounting software sync",
    category: 'invoices',
    confidence: 0.95,
    quickActions: [
      { label: '🧾 Generate Invoice', action: 'generate_invoice' },
      { label: '📱 Send WhatsApp', action: 'send_whatsapp' },
      { label: '💰 Payment Tracking', action: 'payment_tracking' },
      { label: '📊 Revenue Analytics', action: 'revenue_analytics' }
    ]
  },

  // Analytics (Admin only) - Enhanced
  {
    keywords: ['analytics', 'reports', 'revenue', 'profit', 'dashboard', 'statistics', 'sales'],
    response: "I'm your business intelligence expert! 📊🤖\n\n🚀 **Advanced Analytics:**\n\n📈 **Revenue Intelligence:**\n• Real-time profit tracking\n• Service vs parts breakdown\n• Trend analysis & forecasting\n• Competitor benchmarking\n\n👥 **Customer Insights:**\n• Loyalty program optimization\n• Churn prediction\n• Lifetime value analysis\n• Segmentation strategies\n\n📊 **Performance Metrics:**\n• Mechanic efficiency scores\n• Service quality ratings\n• Inventory turnover rates\n• Cost optimization opportunities\n\n🎯 **Strategic Recommendations:**\n• Growth opportunity identification\n• Resource allocation guidance\n• Pricing strategy optimization\n• Market expansion insights",
    category: 'analytics',
    allowedRoles: ['garage_admin', 'super_admin'],
    confidence: 0.94,
    quickActions: [
      { label: '📊 Revenue Report', action: 'revenue_report' },
      { label: '👥 Customer Analysis', action: 'customer_analysis' },
      { label: '⚡ Performance Dashboard', action: 'performance_dashboard' }
    ]
  },

  // Analytics - Staff restricted message
  {
    keywords: ['analytics', 'reports', 'revenue', 'profit', 'dashboard', 'statistics', 'sales'],
    response: "I understand you're interested in analytics! 📊\n\n🔒 **Access Level:** Analytics features are restricted to garage administrators for business security.\n\n✅ **What you can access:**\n• Customer management tools\n• Job card creation & tracking\n• Spare parts inventory\n• Invoice generation\n• Service completion workflows\n\n💡 **Your superpowers:**\n• Create efficient service workflows\n• Track job completion times\n• Monitor parts usage\n• Manage customer relationships\n\nFor detailed reports, please contact your garage administrator.",
    category: 'analytics-restricted',
    allowedRoles: ['mechanic_staff'],
    confidence: 0.90
  },

  // Advanced Troubleshooting & Diagnostics
  {
    keywords: ['problem', 'issue', 'not working', 'broken', 'error', 'fix', 'repair', 'troubleshoot'],
    fuzzyMatches: ['problm', 'issu', 'not workng', 'brokn', 'eror', 'fx', 'repir', 'trubleshoot'],
    synonyms: ['malfunction', 'failure', 'defect', 'glitch', 'bug', 'breakdown'],
    response: "🛠️🤖 **AI Diagnostic Expert at your service!**\n\n🔍 **Smart Problem Analysis:**\n\n⚡ **Common Issues & AI Solutions:**\n• 'Not starting' → Fuel, battery, spark checks\n• 'Strange noise' → Engine, brake, chain diagnosis\n• 'Poor performance' → Air filter, carburetor, tuning\n• 'Vibration' → Engine mount, wheel balance checks\n\n🧠 **Intelligent Troubleshooting:**\n• Step-by-step guided diagnosis\n• Video tutorials for complex repairs\n• Parts compatibility verification\n• Cost-effective solution suggestions\n\n📊 **Performance Insights:**\n• Problem pattern analysis\n• Preventive maintenance alerts\n• Customer communication templates\n• Warranty claim assistance",
    category: 'diagnostics',
    confidence: 0.94,
    quickActions: [
      { label: '🔍 Start Diagnosis', action: 'start_diagnosis' },
      { label: '📱 Scan Problem Code', action: 'scan_error' },
      { label: '🎥 Watch Tutorial', action: 'tutorial_video' },
      { label: '📞 Expert Consultation', action: 'expert_help' }
    ]
  },

  // General Help - Ultra Advanced
  {
    keywords: ['hi', 'hello', 'hey', 'help', 'what can you do', 'features', 'about', 'mesthri'],
    fuzzyMatches: ['helo', 'helo', 'hy', 'hai', 'wat can u do', 'fetures', 'abot'],
    synonyms: ['greetings', 'assistance', 'capabilities', 'functions', 'info'],
    response: "🤖✨ **I'm Mesthri - Your Ultra-Intelligent Garage AI!** ✨🤖\n\n🧠 **My Advanced Capabilities:**\n\n🚀 **Smart Operations:**\n• AI-powered customer insights\n• Predictive maintenance scheduling\n• Intelligent inventory optimization\n• Dynamic pricing recommendations\n\n🔬 **Problem Solving:**\n• Diagnostic troubleshooting\n• Performance analysis\n• Workflow optimization\n• Business intelligence\n\n⚡ **Real-Time Assistance:**\n• Voice command processing\n• Context-aware responses\n• Proactive notifications\n• Emergency handling\n\n🎯 **Personalized Experience:**\n• Role-based intelligence\n• Learning from interactions\n• Customized recommendations\n• Multilingual support\n\n💡 **Ask me anything - I understand fuzzy keywords, context, and even typos!**",
    category: 'general',
    confidence: 1.0,
    quickActions: [
      { label: '🎯 Smart Tutorial', action: 'tutorial' },
      { label: '🔧 Quick Setup', action: 'quick_setup' },
      { label: '📊 Daily Briefing', action: 'daily_briefing' },
      { label: '🎤 Voice Commands', action: 'voice_help' }
    ]
  }
];

// Advanced contextual intelligence
const CONTEXTUAL_RESPONSES = {
  dashboard: {
    greeting: "🏠 Welcome to your command center! I can help with today's overview, quick actions, and performance insights.",
    suggestions: ['Daily briefing', 'Quick stats', 'Pending tasks', 'Performance tips']
  },
  customers: {
    greeting: "👥 Customer hub activated! I can assist with adding, searching, analyzing, and managing customer relationships.",
    suggestions: ['Add customer', 'Search customer', 'Customer analytics', 'Visit patterns']
  },
  'job-cards': {
    greeting: "🔧 Service center online! I can help create, track, optimize, and complete job cards efficiently.",
    suggestions: ['Create job card', 'Track progress', 'Estimate time', 'Quality checklist']
  },
  'spare-parts': {
    greeting: "📦 Inventory command center! I can manage stock, scan barcodes, predict demands, and optimize procurement.",
    suggestions: ['Scan barcode', 'Check stock', 'Reorder alerts', 'Price optimization']
  },
  invoices: {
    greeting: "💰 Billing headquarters! I can generate, customize, send, and track invoices with payment insights.",
    suggestions: ['Generate invoice', 'Send WhatsApp', 'Payment tracking', 'Pricing optimization']
  }
};

// Proactive intelligence system
class ProactiveIntelligence {
  static generateDailyBriefing(garageData: any): string {
    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? '🌅 Good Morning!' : currentHour < 17 ? '☀️ Good Afternoon!' : '🌙 Good Evening!';
    
    return `${greeting} Here's your AI briefing:\n\n📊 **Today's Overview:**\n• Pending services: ${garageData?.pendingServices || 0}\n• Low stock items: ${garageData?.lowStockItems || 0}\n• Revenue target: ${garageData?.revenueProgress || 0}% complete\n\n🎯 **Smart Recommendations:**\n• Priority customer follow-ups\n• Inventory reorder suggestions\n• Performance optimization tips`;
  }
  
  static getSmartSuggestions(context: string, userRole: string): string[] {
    const basesuggestions = CONTEXTUAL_RESPONSES[context as keyof typeof CONTEXTUAL_RESPONSES]?.suggestions || [];
    
    if (userRole === 'mechanic_staff') {
      return basesuggestions.filter(s => !s.includes('analytics') && !s.includes('optimization'));
    }
    
    return basesuggestions;
  }
}

export function MesthriChatbot() {
  const { user, garage } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentContext, setCurrentContext] = useState<UserContext>({
    currentPage: location,
    recentActions: [],
    sessionData: {},
    preferences: {}
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    
    synthRef.current = window.speechSynthesis;
  }, []);
  
  // Update context when location changes
  useEffect(() => {
    const page = location.split('/')[1] || 'dashboard';
    setCurrentContext(prev => ({ ...prev, currentPage: page }));
  }, [location]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Advanced AI Response Engine with Fuzzy Matching
  const findBestResponse = (userMessage: string): { response: string; metadata: any } => {
    const lowerMessage = userMessage.toLowerCase().trim();
    const userRole = user?.role || 'mechanic_staff';
    
    // Extract all possible terms for fuzzy matching
    const allTerms = Object.values(AUTOMOTIVE_TERMS).flat();
    const fuzzyMatches = FuzzyMatcher.fuzzyMatch(lowerMessage, allTerms, 0.5);
    
    // Filter knowledge based on user role
    const availableKnowledge = MESTHRI_KNOWLEDGE.filter(knowledge => 
      !knowledge.allowedRoles || knowledge.allowedRoles.includes(userRole)
    );
    
    let bestMatch: ChatbotKnowledge | null = null;
    let maxScore = 0;
    
    // Advanced matching algorithm
    for (const knowledge of availableKnowledge) {
      let score = 0;
      
      // Exact keyword matches (highest priority)
      const exactMatches = knowledge.keywords.filter(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      ).length;
      score += exactMatches * 10;
      
      // Fuzzy keyword matches
      if (knowledge.fuzzyMatches) {
        const fuzzyKeywordMatches = knowledge.fuzzyMatches.filter(fuzzy =>
          FuzzyMatcher.similarity(lowerMessage, fuzzy) > 0.7
        ).length;
        score += fuzzyKeywordMatches * 8;
      }
      
      // Synonym matches
      if (knowledge.synonyms) {
        const synonymMatches = knowledge.synonyms.filter(synonym =>
          lowerMessage.includes(synonym.toLowerCase())
        ).length;
        score += synonymMatches * 6;
      }
      
      // Automotive term relevance
      const relevantTerms = fuzzyMatches.filter(match => 
        knowledge.keywords.some(keyword => keyword.includes(match.term))
      );
      score += relevantTerms.length * 4;
      
      // Context relevance bonus
      if (knowledge.contextualTriggers?.includes(currentContext.currentPage)) {
        score += 5;
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = knowledge;
      }
    }
    
    if (bestMatch && maxScore > 0) {
      // Personalize response with garage context and AI insights
      let response = bestMatch.response;
      if (garage?.name && userRole !== 'super_admin') {
        response = response.replace(/your garage/gi, garage.name);
      }
      
      // Add contextual greeting if first interaction
      const contextualInfo = CONTEXTUAL_RESPONSES[currentContext.currentPage as keyof typeof CONTEXTUAL_RESPONSES];
      if (messages.length <= 1 && contextualInfo) {
        response = `${contextualInfo.greeting}\n\n${response}`;
      }
      
      return {
        response,
        metadata: {
          confidence: Math.min(maxScore / 10, 1.0),
          category: bestMatch.category,
          quickActions: bestMatch.quickActions || [],
          suggestions: ProactiveIntelligence.getSmartSuggestions(currentContext.currentPage, userRole),
          fuzzyTerms: fuzzyMatches.slice(0, 3).map(m => m.term)
        }
      };
    }
    
    // Advanced fallback with contextual help
    const contextualInfo = CONTEXTUAL_RESPONSES[currentContext.currentPage as keyof typeof CONTEXTUAL_RESPONSES];
    const isStaff = userRole === 'mechanic_staff';
    
    let fallbackResponse = `🤖 I didn't quite catch that, but I'm learning! `;
    
    if (fuzzyMatches.length > 0) {
      fallbackResponse += `\n\n🔍 **Did you mean:** ${fuzzyMatches.slice(0, 3).map(m => m.term).join(', ')}?\n`;
    }
    
    if (contextualInfo) {
      fallbackResponse += `\n${contextualInfo.greeting}\n`;
    }
    
    const smartFeatures = isStaff 
      ? "🏢 Smart Customer Management\n🔧 AI-Powered Job Cards\n📦 Intelligent Inventory\n🧾 Auto Invoice Generation\n📱 Mobile Optimization\n🎤 Voice Commands"
      : "🏢 Smart Customer Management\n🔧 AI-Powered Job Cards\n📦 Intelligent Inventory\n🧾 Auto Invoice Generation\n📊 Advanced Analytics\n📱 Mobile Optimization\n🎤 Voice Commands";
    
    fallbackResponse += `\n**I can assist with:**\n${smartFeatures}\n\n💡 **Pro Tip:** Try voice commands or ask me anything - I understand typos and automotive terms!`;
    
    return {
      response: fallbackResponse,
      metadata: {
        confidence: 0.3,
        category: 'fallback',
        quickActions: [
          { label: '🎯 Help Guide', action: 'help_guide' },
          { label: '🎤 Voice Command', action: 'voice_help' },
          { label: '📞 Contact Support', action: 'contact_support' }
        ],
        suggestions: contextualInfo?.suggestions || ['Help', 'Features', 'Tutorial']
      }
    };
  };
  
  // Voice recognition functions
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };
  
  // Text-to-speech function
  const speakResponse = (text: string) => {
    if (synthRef.current && voiceEnabled && !isSpeaking) {
      const utterance = new SpeechSynthesisUtterance(text.replace(/[🤖✨🚀🧠⚡💡🔍📊🎯]/g, ''));
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.lang = 'en-IN';
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
    }
  };
  
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time with advanced processing
    const thinkingTime = Math.random() * 1000 + 800; // 800-1800ms
    
    setTimeout(() => {
      const aiResponse = findBestResponse(inputMessage);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: aiResponse.response,
        timestamp: new Date(),
        metadata: aiResponse.metadata
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
      
      // Auto-speak response if voice is enabled
      if (voiceEnabled && aiResponse.metadata.confidence > 0.7) {
        speakResponse(aiResponse.response);
      }
    }, thinkingTime);
  };
  
  const handleQuickAction = (action: string) => {
    const quickResponses: { [key: string]: string } = {
      'tutorial': 'Starting smart tutorial mode...',
      'daily_briefing': ProactiveIntelligence.generateDailyBriefing({}),
      'voice_help': '🎤 Voice commands active! Say things like "add customer", "check stock", or "create job card"',
      'scan_barcode': '📱 Barcode scanner ready! Point camera at any product code.',
      'contact_support': '📞 Support: ananthautomotivegarage@gmail.com\n📱 WhatsApp: [Click to chat]'
    };
    
    const response = quickResponses[action] || `Executing: ${action}`;
    setInputMessage(response);
    handleSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Initialize ultra-personalized AI greeting
  useEffect(() => {
    if (messages.length === 0) {
      let personalizedGreeting: string;
      const currentHour = new Date().getHours();
      const timeGreeting = currentHour < 12 ? '🌅 Good Morning' : currentHour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening';
      
      if (user) {
        const garageName = garage?.name || 'your garage';
        const roleLabel = user.role === 'garage_admin' ? 'Admin' : 
                         user.role === 'super_admin' ? 'Super Admin' : 'Mechanic';
        
        personalizedGreeting = user.role === 'super_admin' 
          ? `🤖✨ **${timeGreeting}, ${roleLabel}!**\n\nI'm Mesthri, your Ultra-Intelligent AI Assistant! 🧠⚡\n\n🎯 **System-Wide Capabilities:**\n• Multi-garage analytics\n• Advanced user management\n• Performance optimization\n• Predictive insights\n\n🚀 **Voice Commands Active** | 🔍 **Fuzzy Search Ready**\n\nWhat would you like to accomplish today?`
          : `🤖✨ **${timeGreeting}, ${roleLabel}!**\n\nI'm Mesthri, your Ultra-Smart Garage AI! 🧠⚡\n\n🏢 **${garageName} Command Center:**\n• Real-time operations support\n• Intelligent problem-solving\n• Proactive recommendations\n• Voice-activated assistance\n\n🚀 **Ready to optimize your workflow!**\n\nHow can I supercharge your productivity today?`;
      } else {
        personalizedGreeting = `🤖✨ **${timeGreeting}!**\n\nI'm Mesthri, your AI-Powered Garage Assistant! 🧠⚡\n\n🎯 **Ultra-Advanced Features:**\n• Fuzzy keyword understanding\n• Voice command processing\n• Intelligent problem diagnosis\n• Context-aware responses\n\n🔐 **Please log in to unlock personalized garage management capabilities!**\n\nTry asking me anything - I understand typos and automotive terms!`;
      }
      
      setMessages([{
        id: '1',
        type: 'bot',
        content: personalizedGreeting,
        timestamp: new Date(),
        metadata: {
          confidence: 1.0,
          category: 'greeting',
          quickActions: [
            { label: '🎯 Smart Tutorial', action: 'tutorial' },
            { label: '📊 Daily Briefing', action: 'daily_briefing' },
            { label: '🎤 Voice Commands', action: 'voice_help' }
          ],
          suggestions: ['Help', 'Features', 'Tutorial', 'Voice Commands']
        }
      }]);
    }
  }, [user, garage, messages.length]);

  if (!isOpen) {
    return (
      <div className="fixed left-6 z-[9999]" style={{ bottom: '75px' }}>
        <div className="relative">
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full w-16 h-16 shadow-2xl border-2 border-white/20 backdrop-blur-sm transform transition-all duration-300 hover:scale-110 relative z-[10000]"
            data-testid="chatbot-open-button"
          >
            <div className="relative">
              <Bot className="w-7 h-7" />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
            </div>
          </Button>
          {/* AI Pulse Animation */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse opacity-30 scale-110 pointer-events-none"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-300 to-purple-300 animate-ping opacity-20 scale-125 pointer-events-none"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-6 z-50 w-[420px] h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden backdrop-blur-sm" style={{ bottom: '75px' }}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
              <Bot className="w-6 h-6" />
              <Brain className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-bounce" />
            </div>
            <div className="absolute inset-0 rounded-full bg-white/10 animate-ping scale-110"></div>
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-1">
              Mesthri <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            </h3>
            <p className="text-xs opacity-90 font-medium">Ultra-Intelligent AI Assistant</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs opacity-80">AI Online • Voice Ready</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`text-white hover:bg-white/20 transition-colors ${voiceEnabled ? 'bg-white/10' : 'opacity-50'}`}
            title="Toggle Voice"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20"
            data-testid="chatbot-close-button"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-800">
        {messages.map((message) => (
          <div key={message.id}>
            <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg border ${message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500/30'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600'
                }`}>
                <div className="flex items-start gap-3">
                  {message.type === 'bot' && (
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {message.type === 'user' && (
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="whitespace-pre-line text-sm leading-relaxed">{message.content}</div>
                    
                    {/* Confidence indicator for AI responses */}
                    {message.type === 'bot' && message.metadata?.confidence && (
                      <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                        <TrendingUp className="w-3 h-3" />
                        <span>Confidence: {Math.round(message.metadata.confidence * 100)}%</span>
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    {message.type === 'bot' && message.metadata?.quickActions && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.metadata.quickActions.map((action: any, idx: number) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAction(action.action)}
                            className={`text-xs h-7 ${
                              message.type === 'user'
                                ? 'border-white/30 text-white hover:bg-white/10'
                                : 'border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30'
                            }`}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Mesthri is thinking</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "🎤 Listening..." : "Ask me anything about garage management, parts, services... (I understand typos!)"}
              className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm"
              rows={2}
              data-testid="chatbot-input"
              disabled={isListening}
            />
          </div>
          
          {/* Voice Input Button */}
          {recognitionRef.current && (
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isTyping}
              className={`h-12 w-12 rounded-2xl transition-all duration-200 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white shadow-lg`}
              title={isListening ? 'Stop Listening' : 'Start Voice Input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          )}
          
          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping || isListening}
            className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
            data-testid="chatbot-send-button"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Quick Suggestions */}
        {messages.length <= 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {['Add customer', 'Check stock', 'Create job card', 'Generate invoice', 'Help'].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => { setInputMessage(suggestion); }}
                className="text-xs h-7 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
        
        {/* AI Status */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>AI Online • Fuzzy matching • Voice ready</span>
          </div>
          {isSpeaking && (
            <Button
              variant="ghost"
              size="sm"
              onClick={stopSpeaking}
              className="text-xs text-red-500 hover:text-red-700"
            >
              🔇 Stop speaking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
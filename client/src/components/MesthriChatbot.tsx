import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/lib/auth';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatbotKnowledge {
  keywords: string[];
  response: string;
  category: string;
  allowedRoles?: string[]; // Roles that can see this response
}

const MESTHRI_KNOWLEDGE: ChatbotKnowledge[] = [
  // Login and Authentication
  {
    keywords: ['login', 'sign in', 'password', 'forgot password', 'authentication'],
    response: "Hi! I'm Mesthri, your garage assistant! 👋\n\nFor login help:\n\n🔐 **Login Process:**\n1. Enter your email address\n2. Enter your password\n3. Click 'Login'\n\n🆘 **Having trouble?**\n• Check email format is correct\n• Ensure password case sensitivity\n• Clear browser cache if needed\n\n📞 **Need account access?** Contact your system administrator or support team for login credentials.",
    category: 'authentication'
  },
  
  // Customer Management
  {
    keywords: ['customer', 'add customer', 'customer management', 'bike number', 'customer details'],
    response: "I can help you with customer management! 👥\n\n📝 To add a customer:\n1. Go to 'Customers' section\n2. Click 'Add Customer'\n3. Fill in: Name, Phone, Bike Number, Model, Year\n4. Save the record\n\n🔍 You can search for existing customers using the search bar. Each customer shows their service history and total spending.",
    category: 'customers'
  },
  
  // Job Cards
  {
    keywords: ['job card', 'service', 'job', 'complaint', 'work order', 'service request'],
    response: "Job cards track your service work from start to finish! 🔧\n\n📋 To create a job card:\n1. Go to 'Job Cards' section\n2. Click 'Create Job Card'\n3. Select customer or add new one\n4. Enter the complaint/service needed\n5. Add spare parts used\n6. Set service charges\n7. Mark as complete when done\n\n💡 Tip: You can generate invoices directly from completed job cards!",
    category: 'jobs'
  },
  
  // Spare Parts
  {
    keywords: ['spare parts', 'inventory', 'parts', 'stock', 'barcode', 'scanner', 'low stock'],
    response: "I'll help you manage your spare parts inventory! 📦\n\n➕ To add parts:\n1. Go to 'Spare Parts' section\n2. Click 'Add Spare Part'\n3. Enter: Name, Part Number, Prices, Quantity\n4. Set low stock threshold\n\n📱 Use the barcode scanner to quickly add parts by scanning product codes. The system will alert you when stock is low!",
    category: 'inventory'
  },
  
  // Invoices
  {
    keywords: ['invoice', 'bill', 'payment', 'whatsapp', 'pdf', 'generate invoice'],
    response: "Creating invoices is easy with our system! 🧾\n\n📄 To generate an invoice:\n1. Complete a job card first\n2. Click 'Generate Invoice' on the job card\n3. Review the details (parts + service charges)\n4. Download PDF or send via WhatsApp\n\n📱 WhatsApp integration lets you send invoices directly to customers with one click!",
    category: 'invoices'
  },
  
  // Analytics (Admin only)
  {
    keywords: ['analytics', 'reports', 'revenue', 'profit', 'dashboard', 'statistics', 'sales'],
    response: "Track your garage performance with our analytics! 📊\n\n📈 Available reports:\n• Daily/Weekly/Monthly revenue\n• Parts vs Service revenue breakdown\n• Profit margins (cost vs selling price)\n• Customer statistics\n• Top-selling parts\n\n💡 Use the Dashboard to see real-time performance metrics and export reports for accounting.",
    category: 'analytics',
    allowedRoles: ['garage_admin', 'super_admin']
  },

  // Analytics - Staff restricted message
  {
    keywords: ['analytics', 'reports', 'revenue', 'profit', 'dashboard', 'statistics', 'sales'],
    response: "I understand you're interested in analytics and sales reports! 📊\n\n🔒 **Access Level:** Analytics features are restricted to garage administrators for business security reasons.\n\n✅ **What you can access:**\n• Customer management\n• Job card creation and updates\n• Spare parts inventory\n• Invoice generation\n• Service completion tracking\n\n💡 For sales reports and analytics, please contact your garage administrator.",
    category: 'analytics-restricted',
    allowedRoles: ['mechanic_staff']
  },
  
  // Mobile and Features
  {
    keywords: ['mobile', 'phone', 'responsive', 'app', 'install', 'offline'],
    response: "GarageGuru works great on mobile devices! 📱\n\n✨ Mobile features:\n• Fully responsive design\n• Touch-friendly interface\n• Install as mobile app (Add to Home Screen)\n• Camera integration for barcode scanning\n• Works offline for basic operations\n\nAccess from any mobile browser - Chrome, Safari, etc.",
    category: 'mobile'
  },
  
  // User Roles
  {
    keywords: ['roles', 'permissions', 'admin', 'mechanic', 'staff', 'access', 'user management'],
    response: "Our system has different user roles with specific permissions! 👥\n\n🔐 User Roles:\n• Super Admin: Manages multiple garages and all users\n• Garage Admin: Manages garage operations, reports, inventory\n• Mechanic Staff: Creates job cards, updates service status\n\nEach role has appropriate access levels for security and workflow management.",
    category: 'roles'
  },
  
  // Troubleshooting
  {
    keywords: ['help', 'problem', 'error', 'not working', 'slow', 'issue', 'troubleshoot'],
    response: "I'm here to help solve any issues! 🛠️\n\n🔧 Common solutions:\n• Login problems: Check email format and password\n• Slow performance: Clear browser cache and refresh\n• Barcode scanner: Allow camera permissions\n• PDF downloads: Check popup blocker settings\n• Data not saving: Verify internet connection\n\nFor urgent issues, contact support at ananthautomotivegarage@gmail.com",
    category: 'support'
  },
  
  // General Help
  {
    keywords: ['hi', 'hello', 'hey', 'help', 'what can you do', 'features', 'about'],
    response: "Hello! I'm Mesthri, your friendly garage management assistant! 👋\n\n🔧 I can help you with:\n• Customer management\n• Job card creation\n• Spare parts inventory\n• Invoice generation\n• Analytics and reports\n• Mobile features\n• Troubleshooting\n\nJust ask me anything about using GarageGuru, and I'll guide you step by step!",
    category: 'general'
  }
];

export function MesthriChatbot() {
  const { user, garage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize personalized greeting
  useEffect(() => {
    if (user && messages.length === 0) {
      const garageName = garage?.name || 'your garage';
      const roleLabel = user.role === 'garage_admin' ? 'Admin' : 
                       user.role === 'super_admin' ? 'Super Admin' : 'Staff';
      
      const personalizedGreeting = user.role === 'super_admin' 
        ? `Hi! I'm Mesthri, your garage assistant! 👋\n\nWelcome, ${roleLabel}! I can help you with system-wide management, user access, and garage oversight.\n\nHow can I assist you today?`
        : `Hi! I'm Mesthri, your garage assistant! 👋\n\nWelcome to ${garageName}! I can help you with your daily operations.\n\nHow can I assist you today?`;
      
      setMessages([{
        id: '1',
        type: 'bot',
        content: personalizedGreeting,
        timestamp: new Date()
      }]);
    }
  }, [user, garage, messages.length]);

  const findBestResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const userRole = user?.role || 'mechanic_staff';
    
    // Filter knowledge based on user role
    const availableKnowledge = MESTHRI_KNOWLEDGE.filter(knowledge => 
      !knowledge.allowedRoles || knowledge.allowedRoles.includes(userRole)
    );
    
    // Find the best matching knowledge entry
    let bestMatch: ChatbotKnowledge | null = null;
    let maxMatches = 0;
    
    for (const knowledge of availableKnowledge) {
      const matches = knowledge.keywords.filter(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = knowledge;
      }
    }
    
    if (bestMatch && maxMatches > 0) {
      // Personalize response with garage context
      let response = bestMatch.response;
      if (garage?.name && userRole !== 'super_admin') {
        response = response.replace(/your garage/gi, garage.name);
      }
      return response;
    }
    
    // Role-based default response
    const isStaff = userRole === 'mechanic_staff';
    const defaultFeatures = isStaff 
      ? "🏢 Customer Management\n🔧 Job Cards & Services\n📦 Spare Parts Inventory\n🧾 Invoice Generation\n📱 Mobile Features"
      : "🏢 Customer Management\n🔧 Job Cards & Services\n📦 Spare Parts Inventory\n🧾 Invoice Generation\n📊 Analytics & Reports\n📱 Mobile Features";
    
    return `I'm not sure about that specific question, but I can help you with:\n\n${defaultFeatures}\n\nTry asking about any of these topics, or contact our support team at ananthautomotivegarage@gmail.com for detailed assistance!`;
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

    // Simulate typing delay for more natural interaction
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: findBestResponse(inputMessage),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg"
          data-testid="chatbot-open-button"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Mesthri</h3>
            <p className="text-xs opacity-90">Garage Assistant</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-blue-700"
          data-testid="chatbot-close-button"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <div className="whitespace-pre-line text-sm">{message.content}</div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <div className="text-sm text-gray-600 dark:text-gray-400">Mesthri is typing...</div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Mesthri about GarageGuru..."
            className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={2}
            data-testid="chatbot-input"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="chatbot-send-button"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
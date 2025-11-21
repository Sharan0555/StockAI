import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, BarChart, Bar, ComposedChart, Cell } from 'recharts';
import { Activity, TrendingUp, TrendingDown, BarChart2, Cpu, Zap, Search, Bell, Menu, X, ChevronDown, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, Globe, FileText, Clock, Filter, CandlestickChart, LineChart as LineIcon, MessageSquare, Send, Sparkles, Bot, XCircle, Loader2 } from 'lucide-react';

// --- GEMINI API INTEGRATION ---
const apiKey = ""; // API Key provided by environment

const callGemini = async (prompt, systemInstruction = "") => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          tools: [{ google_search: {} }] // Enable Google Search for market data
        }),
      }
    );

    if (!response.ok) throw new Error("Gemini API Error");
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis unavailable at the moment.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Sorry, I couldn't connect to the AI service right now. Please try again.";
  }
};

// --- MOCK DATA GENERATORS ---

const GENERATE_ALL_STOCKS = () => [
  { symbol: 'RELIANCE', name: 'Reliance Industries', basePrice: 2450, volatility: 0.015, type: 'NSE', sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Svcs', basePrice: 3500, volatility: 0.012, type: 'NSE', sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', basePrice: 1600, volatility: 0.01, type: 'NSE', sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys Ltd', basePrice: 1450, volatility: 0.018, type: 'BSE', sector: 'IT' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', basePrice: 950, volatility: 0.014, type: 'NSE', sector: 'Banking' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', basePrice: 650, volatility: 0.025, type: 'NSE', sector: 'Auto' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', basePrice: 2400, volatility: 0.035, type: 'NSE', sector: 'Metals' },
  { symbol: 'SBIN', name: 'State Bank of India', basePrice: 580, volatility: 0.016, type: 'NSE', sector: 'Banking' },
  { symbol: 'ITC', name: 'ITC Limited', basePrice: 440, volatility: 0.008, type: 'NSE', sector: 'FMCG' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', basePrice: 860, volatility: 0.012, type: 'NSE', sector: 'Telecom' },
  { symbol: 'L&T', name: 'Larsen & Toubro', basePrice: 2600, volatility: 0.015, type: 'NSE', sector: 'Construction' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', basePrice: 1850, volatility: 0.013, type: 'NSE', sector: 'Banking' },
  { symbol: 'AXISBANK', name: 'Axis Bank', basePrice: 980, volatility: 0.016, type: 'NSE', sector: 'Banking' },
  { symbol: 'HCLTECH', name: 'HCL Technologies', basePrice: 1150, volatility: 0.017, type: 'NSE', sector: 'IT' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', basePrice: 3200, volatility: 0.011, type: 'NSE', sector: 'Paints' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', basePrice: 9600, volatility: 0.014, type: 'NSE', sector: 'Auto' },
  { symbol: 'TITAN', name: 'Titan Company', basePrice: 2900, volatility: 0.016, type: 'NSE', sector: 'Consumer' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', basePrice: 7100, volatility: 0.022, type: 'NSE', sector: 'Finance' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma', basePrice: 1050, volatility: 0.013, type: 'NSE', sector: 'Pharma' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', basePrice: 95, volatility: 0.04, type: 'NSE', sector: 'Tech' },
  { symbol: 'PAYTM', name: 'One97 Communications', basePrice: 850, volatility: 0.045, type: 'NSE', sector: 'Tech' },
  { symbol: 'MRF', name: 'MRF Tyres', basePrice: 105000, volatility: 0.005, type: 'NSE', sector: 'Auto' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', basePrice: 410, volatility: 0.015, type: 'NSE', sector: 'IT' },
  { symbol: 'NTPC', name: 'NTPC Limited', basePrice: 220, volatility: 0.01, type: 'NSE', sector: 'Energy' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', basePrice: 245, volatility: 0.009, type: 'NSE', sector: 'Energy' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', basePrice: 120, volatility: 0.02, type: 'NSE', sector: 'Metals' },
  { symbol: 'VEDL', name: 'Vedanta Ltd', basePrice: 280, volatility: 0.025, type: 'NSE', sector: 'Mining' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors', basePrice: 3400, volatility: 0.018, type: 'NSE', sector: 'Auto' },
  { symbol: 'DRREDDY', name: 'Dr. Reddys Labs', basePrice: 5200, volatility: 0.014, type: 'NSE', sector: 'Pharma' },
  { symbol: 'CIPLA', name: 'Cipla', basePrice: 1100, volatility: 0.013, type: 'NSE', sector: 'Pharma' }
];

const ALL_STOCKS = GENERATE_ALL_STOCKS();

const NEWS_ITEMS = [
  { id: 1, title: "RBI Maintains Status Quo on Repo Rates", category: "Economy", time: "10 mins ago", source: "Mint", summary: "The Reserve Bank of India keeps the repo rate unchanged at 6.5% for the fourth consecutive time." },
  { id: 2, title: "TCS Q3 Results: Revenue up 4%, misses estimates", category: "Corporate", time: "1 hour ago", source: "MoneyControl", summary: "Tata Consultancy Services reported a consolidated net profit of ₹11,058 crore for the quarter ended December." },
  { id: 3, title: "Adani Green Energy secures 300MW wind project", category: "Green Energy", time: "2 hours ago", source: "Economic Times", summary: "Adani Green Energy has won a bid for a 300 MW wind energy project in the latest SECI auction." },
  { id: 4, title: "NIFTY hits all-time high crossing 22,000 mark", category: "Markets", time: "3 hours ago", source: "CNBC TV18", summary: "Bullish sentiment continues as foreign institutional investors pump money into Indian equities." },
  { id: 5, title: "Zomato posts first ever quarterly profit", category: "Corporate", time: "4 hours ago", source: "Business Standard", summary: "The food delivery giant turns profitable earlier than expected, driving stock prices up by 12%." },
  { id: 6, title: "Gold prices surge amidst global uncertainty", category: "Commodities", time: "5 hours ago", source: "Reuters", summary: "Safe haven demand pushes gold prices to new highs as geopolitical tensions rise." },
];

// Helper to create candle data structure
const createCandle = (date, open, close, high, low, isPredicted = false) => {
    const isGreen = close >= open;
    return {
        date: date.toISOString().split('T')[0],
        open, close, high, low,
        price: close, // For Line Chart compatibility
        predicted: isPredicted ? close : null, // For Line Chart Prediction
        // For Candlestick Chart (Recharts trick: Bar range [min, max])
        wickRange: [low, high],
        bodyRange: [Math.min(open, close), Math.max(open, close)],
        color: isPredicted 
            ? (isGreen ? '#4ade80' : '#f87171') // Lighter/distinct for prediction
            : (isGreen ? '#22c55e' : '#ef4444'),
        isPredicted,
        isGreen
    };
};

// Generate initial historical data with OHLC
const generateHistory = (basePrice, days = 60) => {
  let currentPrice = basePrice;
  const data = [];
  const today = new Date();
  
  // Generate historical data points backwards
  const rawPoints = [];
  for (let i = days; i > 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Volatility for OHLC
    const volatility = 0.02;
    const change = currentPrice * (Math.random() - 0.5) * (volatility * 2); 
    const open = parseFloat(currentPrice.toFixed(2));
    currentPrice += change;
    const close = parseFloat(currentPrice.toFixed(2));
    
    // Random high/low based on open/close
    const maxBody = Math.max(open, close);
    const minBody = Math.min(open, close);
    const high = parseFloat((maxBody * (1 + Math.random() * 0.01)).toFixed(2));
    const low = parseFloat((minBody * (1 - Math.random() * 0.01)).toFixed(2));

    rawPoints.push(createCandle(date, open, close, high, low, false));
  }
  return { data: rawPoints, lastPrice: currentPrice };
};

// --- COMPONENTS ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default" }) => {
  const styles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {children}
    </span>
  );
};

const Button = ({ children, onClick, variant = "primary", disabled = false, className = "" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    outline: "bg-transparent border border-slate-600 text-slate-300 hover:border-purple-500 hover:text-purple-400",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200",
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// --- CHAT WIDGET ---
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am StockAI. Ask me about market trends, specific stocks, or financial concepts.' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const systemPrompt = "You are a helpful financial assistant for the Indian Stock Market. Keep answers concise (under 50 words if possible). Use emojis occasionally. Disclaimer: Not financial advice.";
    const aiResponseText = await callGemini(input, systemPrompt);
    
    setMessages(prev => [...prev, { role: 'bot', text: aiResponseText }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="w-80 md:w-96 h-[450px] bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">StockAI Assistant</h3>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> Online
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-tr-sm' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-sm border border-slate-700 flex gap-1">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-slate-950/50 border-t border-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about stocks..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
              Powered by <Sparkles className="w-3 h-3 text-yellow-500" /> Gemini
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 group"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white group-hover:animate-bounce" />}
      </button>
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'markets', 'news'
  const [selectedStock, setSelectedStock] = useState(ALL_STOCKS[0]);
  const [chartType, setChartType] = useState('area'); // 'area' or 'candle'
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Dashboard Specific State
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionComplete, setPredictionComplete] = useState(false);
  const [modelMetrics, setModelMetrics] = useState({ accuracy: 0, confidence: 0 });
  const [predictionResult, setPredictionResult] = useState(null);

  // Markets View State
  const [marketData, setMarketData] = useState([]);

  // Initialize Dashboard Data
  useEffect(() => {
    const { data, lastPrice } = generateHistory(selectedStock.basePrice);
    setChartData(data);
    setCurrentPrice(lastPrice);
    setPredictionComplete(false);
    setPredictionResult(null);
  }, [selectedStock]);

  // Initialize Market Data (Simulated live market)
  useEffect(() => {
    // Create initial market data state
    const initialMarketData = ALL_STOCKS.map(stock => {
      const change = (Math.random() * 10 - 5);
      return {
        ...stock,
        price: stock.basePrice + change,
        change: change,
        changePercent: (change / stock.basePrice) * 100,
        volume: Math.floor(Math.random() * 1000000) + 50000,
        marketCap: (Math.random() * 100 + 10).toFixed(1) + 'T'
      };
    });
    setMarketData(initialMarketData);

    // Live update ticker for Market View
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(stock => {
        const volatility = 0.002; // Lower volatility for table updates
        const move = stock.price * (Math.random() - 0.5) * volatility;
        const newPrice = stock.price + move;
        const newChange = stock.change + move;
        return {
            ...stock,
            price: newPrice,
            change: newChange,
            changePercent: (newChange / stock.basePrice) * 100
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Simulate Live Price Feed for Dashboard
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPredicting || activeView !== 'dashboard') return;

      const volatility = selectedStock.volatility * 0.2;
      const change = currentPrice * (Math.random() - 0.5) * volatility;
      const newPrice = currentPrice + change;
      
      setCurrentPrice(newPrice);
      
      setChartData(prev => {
        if (prev.length === 0) return prev;
        const newData = [...prev];
        const lastIdx = newData.length - 1;
        const lastCandle = newData[lastIdx];
        
        // Update last candle live
        const updatedClose = parseFloat(newPrice.toFixed(2));
        const updatedHigh = Math.max(lastCandle.high, updatedClose);
        const updatedLow = Math.min(lastCandle.low, updatedClose);
        const updatedIsGreen = updatedClose >= lastCandle.open;

        newData[lastIdx] = {
          ...lastCandle,
          close: updatedClose,
          high: updatedHigh,
          low: updatedLow,
          price: updatedClose,
          bodyRange: [Math.min(lastCandle.open, updatedClose), Math.max(lastCandle.open, updatedClose)],
          wickRange: [updatedLow, updatedHigh],
          color: updatedIsGreen ? '#22c55e' : '#ef4444',
          isGreen: updatedIsGreen
        };
        return newData;
      });

    }, 2000);
    return () => clearInterval(interval);
  }, [currentPrice, isPredicting, selectedStock, activeView]);

  // Search Logic
  useEffect(() => {
    if (searchQuery.trim() === "") {
        setSearchResults([]);
        setIsSearching(false);
    } else {
        setIsSearching(true);
        const results = ALL_STOCKS.filter(stock => 
            stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(results);
    }
  }, [searchQuery]);

  const handleStockSelect = (stock) => {
      setSelectedStock(stock);
      setSearchQuery("");
      setIsSearching(false);
      setActiveView('dashboard');
  };

  const handleRunPrediction = () => {
    setIsPredicting(true);
    setPredictionComplete(false);
    setPredictionResult(null);

    setTimeout(() => {
      const lastPoint = chartData[chartData.length - 1];
      let prevClose = lastPoint.close;
      const futureDays = 10;
      const newPoints = [];
      
      const isBullish = Math.random() > 0.45; 
      
      for (let i = 1; i <= futureDays; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        // Trend logic for prediction
        const trend = isBullish ? 1.005 : 0.995; 
        const noise = (Math.random() - 0.5) * 0.02;
        
        const open = prevClose;
        const close = parseFloat((open * trend + (open * noise)).toFixed(2));
        const maxBody = Math.max(open, close);
        const minBody = Math.min(open, close);
        const high = parseFloat((maxBody * (1 + Math.random() * 0.005)).toFixed(2));
        const low = parseFloat((minBody * (1 - Math.random() * 0.005)).toFixed(2));

        newPoints.push(createCandle(date, open, close, high, low, true));
        prevClose = close;
      }

      setChartData(prev => [...prev, ...newPoints]);
      setModelMetrics({
        accuracy: (85 + Math.random() * 10).toFixed(1),
        confidence: (70 + Math.random() * 20).toFixed(1)
      });
      setPredictionResult(isBullish ? 'BULLISH' : 'BEARISH');
      setPredictionComplete(true);
      setIsPredicting(false);
    }, 2500);
  };

  const percentageChange = ((currentPrice - selectedStock.basePrice) / selectedStock.basePrice) * 100;
  const isPositive = percentageChange >= 0;

  // --- SUB-COMPONENTS ---

  const DashboardView = () => {
    // Add state for AI Analysis within DashboardView
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyzeStock = async () => {
      setIsAnalyzing(true);
      const prompt = `Analyze the stock ${selectedStock.name} (${selectedStock.symbol}). Current Price: ${currentPrice}. Sector: ${selectedStock.sector}. Give me a short technical outlook (Bullish/Bearish/Neutral) and 2 key reasons why. Limit to 3 sentences.`;
      const analysis = await callGemini(prompt, "You are a senior technical analyst.");
      setAiAnalysis(analysis);
      setIsAnalyzing(false);
    };
    
    // Reset analysis when stock changes
    useEffect(() => {
      setAiAnalysis(null);
    }, [selectedStock]);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
        {/* LEFT SIDEBAR: STOCK LIST & SEARCH */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-0 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Market Watch</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                    type="text"
                    placeholder="Search any stock..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                />
              </div>
            </div>
            <div className="divide-y divide-slate-800 overflow-y-auto custom-scrollbar flex-1">
              {(isSearching ? searchResults : ALL_STOCKS.slice(0, 10)).map((stock) => (
                  <button
                  key={stock.symbol}
                  onClick={() => handleStockSelect(stock)}
                  className={`w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-all ${selectedStock.symbol === stock.symbol ? 'bg-slate-800 border-l-2 border-purple-500' : 'border-l-2 border-transparent'}`}
                  >
                  <div className="text-left">
                      <div className="font-bold text-slate-200">{stock.symbol}</div>
                      <div className="text-xs text-slate-500">{stock.name}</div>
                  </div>
                  <div className="text-right">
                      <Badge variant={stock.type === 'NSE' ? 'purple' : 'default'}>{stock.type}</Badge>
                  </div>
                  </button>
              ))}
              {isSearching && searchResults.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                      No stocks found matching "{searchQuery}"
                  </div>
              )}
            </div>
            {!isSearching && (
                 <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-800">
                    Showing Top 10 of {ALL_STOCKS.length}
                 </div>
            )}
          </Card>

          {/* REPLACED: Static Pro Insights with Dynamic Gemini Integration */}
          <Card className="bg-gradient-to-br from-purple-900/20 to-slate-900/50 border-purple-500/20 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold text-purple-100">Gemini Market Analyst</h3>
            </div>
            
            {!aiAnalysis ? (
              <>
                <p className="text-sm text-slate-400 mb-4">
                  Generate instant AI-powered technical analysis for <span className="text-white font-medium">{selectedStock.symbol}</span> based on current market conditions.
                </p>
                <Button 
                  variant="primary" 
                  className="w-full text-sm bg-gradient-to-r from-yellow-600/20 to-purple-600/20 border border-purple-500/30 hover:border-purple-400"
                  onClick={handleAnalyzeStock}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin"/> Analyzing...</> : "✨ Analyze with Gemini"}
                </Button>
              </>
            ) : (
              <div className="animate-in fade-in duration-500">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-700/50 text-xs text-slate-300 leading-relaxed mb-3 italic">
                  "{aiAnalysis}"
                </div>
                <Button 
                  variant="outline" 
                  className="w-full text-xs h-8"
                  onClick={() => setAiAnalysis(null)}
                >
                  Clear Analysis
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* CENTER: CHART & ANALYSIS */}
        <div className="lg:col-span-9 space-y-6">
          {/* HEADER AREA */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
              <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white tracking-tight">{selectedStock.name}</h1>
                  <Badge variant="default" className="text-xs">{selectedStock.type}:{selectedStock.symbol}</Badge>
                  <Badge variant="default" className="text-xs">{selectedStock.sector}</Badge>
              </div>
              <div className="flex items-end gap-3 mt-1">
                  <span className="text-4xl font-light text-white">
                  ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <div className={`flex items-center gap-1 mb-1.5 font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(percentageChange).toFixed(2)}%</span>
                  </div>
              </div>
              </div>
              
              <div className="flex items-center gap-4">
                  <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                      <button 
                          onClick={() => setChartType('area')}
                          className={`p-1.5 rounded ${chartType === 'area' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                          title="Area/Line Chart"
                      >
                          <LineIcon className="w-4 h-4" />
                      </button>
                      <button 
                          onClick={() => setChartType('candle')}
                          className={`p-1.5 rounded ${chartType === 'candle' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                          title="Candlestick Chart"
                      >
                          <CandlestickChart className="w-4 h-4" />
                      </button>
                  </div>

                  <div className="flex gap-2">
                  {['1D', '1W', '1M', '1Y', 'ALL'].map((tf) => (
                      <button key={tf} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${tf === '1M' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                      {tf}
                      </button>
                  ))}
                  </div>
              </div>
          </div>

          {/* CHART CARD */}
          <Card className="h-[400px] relative group">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
              
              <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                  <AreaChart data={chartData}>
                      <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" hide={true} />
                      <YAxis 
                          domain={['auto', 'auto']} 
                          orientation="right" 
                          tick={{fill: '#64748b', fontSize: 11}} 
                          tickFormatter={(val) => `₹${val}`}
                          axisLine={false}
                          tickLine={false}
                      />
                      <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                          formatter={(value, name) => [
                              `₹${value}`, 
                              name === 'predicted' ? 'AI Prediction' : 'Price'
                          ]}
                      />
                      <Area type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                      <Area type="monotone" dataKey="predicted" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" connectNulls={true} />
                      {predictionComplete && (
                          <ReferenceLine x={chartData[chartData.length - 11].date} stroke="#475569" strokeDasharray="3 3" label={{ position: 'top', value: 'PREDICTION START', fill: '#94a3b8', fontSize: 10 }} />
                      )}
                  </AreaChart>
              ) : (
                  <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" hide={true} />
                      <YAxis 
                          domain={['auto', 'auto']} 
                          orientation="right" 
                          tick={{fill: '#64748b', fontSize: 11}} 
                          tickFormatter={(val) => `₹${val}`}
                          axisLine={false}
                          tickLine={false}
                      />
                      <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                          cursor={{stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4'}}
                          formatter={(value, name, props) => {
                              if (name === 'wickRange' || name === 'bodyRange') return []; // Hide internal data keys
                              const { open, close, high, low } = props.payload;
                              return [
                                  <div key="tooltip" className="space-y-1 font-mono text-xs">
                                      <div>O: {open}</div>
                                      <div>H: {high}</div>
                                      <div>L: {low}</div>
                                      <div>C: {close}</div>
                                  </div>,
                                  ''
                              ];
                          }}
                      />
                      {/* Layer 1: Wicks (Thin Bars) */}
                      <Bar dataKey="wickRange" barSize={1}>
                          {chartData.map((entry, index) => (
                              <Cell key={`cell-wick-${index}`} fill={entry.color} />
                          ))}
                      </Bar>
                      {/* Layer 2: Bodies (Thicker Bars) */}
                      <Bar dataKey="bodyRange" barSize={8} minPointSize={1}>
                          {chartData.map((entry, index) => (
                              <Cell 
                                  key={`cell-body-${index}`} 
                                  fill={entry.color} 
                                  stroke={entry.isPredicted ? '#fff' : 'none'} // White border for predicted candles
                                  strokeWidth={entry.isPredicted ? 1 : 0}
                                  strokeDasharray={entry.isPredicted ? '2 2' : ''}
                              />
                          ))}
                      </Bar>
                       {predictionComplete && (
                          <ReferenceLine x={chartData[chartData.length - 11].date} stroke="#475569" strokeDasharray="3 3" label={{ position: 'top', value: 'AI FORECAST', fill: '#94a3b8', fontSize: 10 }} />
                      )}
                  </ComposedChart>
              )}
              </ResponsiveContainer>
          </Card>

          {/* CONTROL PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-emerald-500"></div>
              <div className="flex justify-between items-start mb-4">
                  <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-purple-400" /> AI Forecaster
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Model: LSTM-Recurrent Neural Net v2.4</p>
                  </div>
                  <Badge variant="purple">v2.0.1 Beta</Badge>
              </div>
              <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                      <div className="text-xs text-slate-500 mb-1">Epochs</div>
                      <div className="font-mono text-slate-300">500</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                      <div className="text-xs text-slate-500 mb-1">Layers</div>
                      <div className="font-mono text-slate-300">4</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                      <div className="text-xs text-slate-500 mb-1">Horizon</div>
                      <div className="font-mono text-slate-300">10D</div>
                  </div>
                  </div>
                  <Button onClick={handleRunPrediction} disabled={isPredicting} className="w-full h-12 text-sm relative overflow-hidden group">
                  {isPredicting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</> : <><Zap className="w-4 h-4" /> Generate Prediction</>}
                  {!isPredicting && <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>}
                  </Button>
              </div>
              </Card>

              <Card className={`${predictionComplete ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-slate-800'}`}>
              {!predictionComplete ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                      <BarChart2 className="w-12 h-12 opacity-20" />
                      <p className="text-sm">Run the model to see future projections.</p>
                  </div>
              ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-slate-200">Prediction Results</h3>
                      <Badge variant={predictionResult === 'BULLISH' ? 'success' : 'danger'}>{predictionResult} SIGNAL</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                      <div className="text-xs text-slate-500">Model Confidence</div>
                      <div className="text-xl font-bold text-white">{modelMetrics.confidence}%</div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${modelMetrics.confidence}%` }}></div>
                      </div>
                      </div>
                      <div>
                      <div className="text-xs text-slate-500">Accuracy</div>
                      <div className="text-xl font-bold text-white">{modelMetrics.accuracy}%</div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${modelMetrics.accuracy}%` }}></div>
                      </div>
                      </div>
                  </div>
                  <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 flex items-start gap-3">
                      {predictionResult === 'BULLISH' ? <ArrowUpRight className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <ArrowDownRight className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                      <div>
                      <div className="text-sm font-medium text-slate-200">{predictionResult === 'BULLISH' ? 'Positive Trend Detected' : 'Correction Likely'}</div>
                      <p className="text-xs text-slate-400 mt-1">Model predicts a {predictionResult === 'BULLISH' ? 'breakout' : 'pullback'} in the next 5 trading sessions.</p>
                      </div>
                  </div>
                  </div>
              )}
              </Card>
          </div>
        </div>
      </div>
    );
  };

  const MarketsView = () => {
      const [sortKey, setSortKey] = useState('changePercent');
      const sortedData = [...marketData].sort((a, b) => {
          if (sortKey === 'changePercent') return Math.abs(b.changePercent) - Math.abs(a.changePercent); // Volatility
          if (sortKey === 'price') return b.price - a.price;
          return 0;
      });

      return (
        <div className="animate-in fade-in zoom-in duration-300 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Live Markets</h2>
                <div className="flex gap-2">
                    <Button variant="secondary" className="text-xs h-8" onClick={() => setSortKey('changePercent')}>Most Active</Button>
                    <Button variant="ghost" className="text-xs h-8" onClick={() => setSortKey('price')}>Price</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { title: 'NIFTY 50', val: '22,120.50', change: '+0.45%' },
                    { title: 'SENSEX', val: '73,145.20', change: '+0.38%' },
                    { title: 'NIFTY BANK', val: '46,500.10', change: '-0.12%' },
                    { title: 'VIX', val: '15.20', change: '-1.45%' },
                ].map((idx) => (
                    <Card key={idx.title} className="p-4">
                        <div className="text-xs text-slate-500 font-medium">{idx.title}</div>
                        <div className="flex justify-between items-end mt-2">
                            <span className="text-lg font-bold text-slate-200">{idx.val}</span>
                            <span className={`text-xs font-medium ${idx.change.includes('+') ? 'text-emerald-400' : 'text-red-400'}`}>{idx.change}</span>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="overflow-hidden border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="p-4 text-xs font-medium text-slate-500 uppercase">Symbol</th>
                                <th className="p-4 text-xs font-medium text-slate-500 uppercase text-right">Price</th>
                                <th className="p-4 text-xs font-medium text-slate-500 uppercase text-right">Change</th>
                                <th className="p-4 text-xs font-medium text-slate-500 uppercase text-right">Volume</th>
                                <th className="p-4 text-xs font-medium text-slate-500 uppercase text-right hidden md:table-cell">Mkt Cap</th>
                                <th className="p-4 text-xs font-medium text-slate-500 uppercase text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {sortedData.map((stock) => (
                                <tr key={stock.symbol} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${stock.change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {stock.symbol[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-200">{stock.symbol}</div>
                                                <div className="text-xs text-slate-500">{stock.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-300">₹{stock.price.toFixed(2)}</td>
                                    <td className="p-4 text-right">
                                        <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stock.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                                        </div>
                                    </td>
                                    <td className="p-4 text-right text-slate-400 text-sm">{(stock.volume / 100000).toFixed(2)}L</td>
                                    <td className="p-4 text-right text-slate-400 text-sm hidden md:table-cell">{stock.marketCap}</td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => handleStockSelect(stock)}
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-purple-500 hover:text-white rounded-lg transition-all text-slate-400"
                                            title="Analyze"
                                        >
                                            <Activity className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
      );
  };

  const NewsView = () => (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
          <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Market Intelligence</h2>
              <p className="text-slate-400">Real-time updates from NSE, BSE and global markets.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
              {NEWS_ITEMS.map((news) => (
                  <Card key={news.id} className="group hover:border-slate-700 transition-all">
                      <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={news.category === 'Economy' ? 'purple' : news.category === 'Markets' ? 'success' : 'default'}>
                                      {news.category}
                                  </Badge>
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {news.time}
                                  </span>
                              </div>
                              <h3 className="text-lg font-bold text-slate-200 group-hover:text-purple-400 transition-colors mb-2">
                                  {news.title}
                              </h3>
                              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                  {news.summary}
                              </p>
                              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                                  <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                      <Globe className="w-3 h-3" /> Source: {news.source}
                                  </span>
                                  <button className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1">
                                      Read Analysis <ArrowUpRight className="w-3 h-3" />
                                  </button>
                              </div>
                          </div>
                      </div>
                  </Card>
              ))}
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
      
      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('dashboard')}>
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-emerald-400 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden md:block">
                StockAI
              </span>
            </div>
            
            {/* Global Search Bar (Visible on Markets/News views) */}
            {activeView !== 'dashboard' && (
                 <div className="hidden md:flex relative w-96 mx-4">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                        type="text"
                        placeholder="Search for companies, sectors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && searchResults.length > 0) {
                                handleStockSelect(searchResults[0]);
                            }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-full pl-9 pr-4 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600 transition-all"
                    />
                 </div>
            )}
            
            <div className="flex items-center gap-1 md:gap-6 bg-slate-900/50 p-1 rounded-full border border-slate-800">
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeView === 'dashboard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveView('markets')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeView === 'markets' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Markets
              </button>
              <button 
                onClick={() => setActiveView('news')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeView === 'news' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                News
              </button>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-400">LIVE</span>
              </div>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all">
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-700 to-slate-600 border border-slate-500"></div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'markets' && <MarketsView />}
        {activeView === 'news' && <NewsView />}
      </main>
      
      {/* ADDED: Chat Widget to Main Layout */}
      <ChatWidget />
    </div>
  );
}
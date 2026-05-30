import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  MapPin, 
  Bell, 
  ChevronRight, 
  Search, 
  Sparkles, 
  Plus, 
  Minus, 
  Send, 
  Utensils, 
  Check, 
  Coffee, 
  TrendingUp, 
  Map, 
  Navigation, 
  ShoppingBag, 
  User, 
  ChevronDown, 
  Bot, 
  Clock, 
  ClipboardCheck, 
  AlertCircle, 
  Heart,
  Share2,
  Trash2,
  Loader2,
  Bookmark,
  Compass,
  Lock,
  LogOut,
  Shield,
  PlusCircle,
  Edit2,
  Save,
  Activity,
  Zap
} from "lucide-react";
import { MEAL_ITEMS } from "./data";
import { MealItem, CartItem, ChatMessage, Order } from "./types";

const renderUserProfileAvatar = (avatarUrl: string | undefined, email: string | undefined, name: string | undefined, sizeClass = "w-10 h-10") => {
  const isGmail = email?.toLowerCase().includes("@gmail.com");
  const initial = (name || email || "U").charAt(0).toUpperCase();

  if (avatarUrl && avatarUrl.trim() !== "") {
    return (
      <div className={`${sizeClass} rounded-full border border-white/15 overflow-hidden bg-black shrink-0 relative flex items-center justify-center`}>
        <img 
          src={avatarUrl} 
          alt={name || "Avatar"} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            const siblingSpan = (e.target as HTMLImageElement).nextElementSibling as HTMLSpanElement;
            if (siblingSpan) {
              siblingSpan.className = "flex items-center justify-center w-full h-full text-[#c5a059] font-mono font-bold";
            }
          }}
        />
        <span className="hidden text-xs font-extrabold text-[#c5a059] font-mono">{initial}</span>
      </div>
    );
  }

  if (isGmail && email) {
    const googleDpUrl = `https://unavatar.io/google/${encodeURIComponent(email)}`;
    return (
      <div className={`${sizeClass} rounded-full border border-white/15 overflow-hidden bg-black shrink-0 relative flex items-center justify-center`}>
        <img 
          src={googleDpUrl} 
          alt={name || "Google Avatar"} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            const siblingSpan = (e.target as HTMLImageElement).nextElementSibling as HTMLSpanElement;
            if (siblingSpan) {
              siblingSpan.className = "flex items-center justify-center w-full h-full text-[#c5a059] font-mono font-bold";
            }
          }}
        />
        <span className="hidden text-xs font-extrabold text-[#c5a059] font-mono">{initial}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full border border-white/15 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black shrink-0 flex items-center justify-center text-[#c5a059] font-semibold uppercase font-mono tracking-wider`}>
      <span className="text-xs font-extrabold">{initial}</span>
    </div>
  );
};

export default function App() {
  // Authentication & session management states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("campus_hub_logged_in") === "true";
  });

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    avatar: string;
    role: "admin" | "student";
    studentId: string;
    balance: number;
    preferences: string[];
  } | null>(() => {
    const saved = localStorage.getItem("campus_hub_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Dynamic menu list to allow editing by Admin (synced with server)
  const [menuItems, setMenuItems] = useState<MealItem[]>([]);

  // All active campus orders (synced so Admin can configure/advance their status)
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (err) {
      console.error("Error fetching menu:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setAllOrders(data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const syncUserProfile = async () => {
    if (!currentUser?.email) return;
    try {
      const res = await fetch(`/api/users/profile?email=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        localStorage.setItem("campus_hub_user", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error syncing profile:", err);
    }
  };

  // On mount: Load everything and set up real-time polling to sync across screens!
  useEffect(() => {
    fetchMenu();
    fetchOrders();

    if (currentUser?.email) {
      syncUserProfile();
    }

    // Periodic polling to simulate WebSocket/Real-time updates!
    const interval = setInterval(() => {
      fetchMenu();
      fetchOrders();
      if (currentUser?.email) {
        syncUserProfile();
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [currentUser?.email]);

  // Synchronous compatible wrapper matching original student state
  const userProfile = currentUser || {
    name: "Alex",
    email: "alex.mercer@campus.edu",
    avatar: "",
    balance: 74.50,
    studentId: "STUDENT-39029193",
    preferences: ["Vegan", "High Protein"],
    role: "student" as const
  };

  const setUserProfile = (updateFnOrObj: any) => {
    setCurrentUser(prev => {
      const active = prev || {
        name: "Alex",
        email: "alex.mercer@campus.edu",
        avatar: "",
        balance: 74.50,
        studentId: "STUDENT-39029193",
        preferences: ["Vegan", "High Protein"],
        role: "student" as const
      };
      const updated = typeof updateFnOrObj === 'function' ? updateFnOrObj(active) : { ...active, ...updateFnOrObj };
      localStorage.setItem("campus_hub_user", JSON.stringify(updated));
      return updated;
    });
  };

  // High-fidelity tab management for student view
  const [activeTab, setActiveTab ] = useState<"home" | "menu" | "cart" | "orders" | "chat" | "profile">("home");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // High-fidelity tab management for admin view
  const [adminActiveTab, setAdminActiveTab] = useState<"admin_analytics" | "admin_orders" | "admin_menu" | "admin_profile">("admin_analytics");

  // Shopping Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Set default pre-loaded cart when menu items are fetched
  useEffect(() => {
    if (menuItems.length > 0 && cart.length === 0) {
      setCart([
        {
          meal: menuItems.find(m => m.id === "quinoa-power-bowl") || menuItems[4] || menuItems[0],
          quantity: 1
        },
        {
          meal: menuItems.find(m => m.id === "med-zest-platter") || menuItems[5] || menuItems[0],
          quantity: 1
        }
      ]);
    }
  }, [menuItems]);

  // Active Menu Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>(""); // simple state hook

  // Smart Filters State (Dietary Preference, Goal Oriented)
  const [dietarySelection, setDietarySelection] = useState<string[]>(["Veg"]);
  const [goalSelection, setGoalSelection] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedPlan, setOptimizedPlan] = useState<{
    title: string;
    explanation: string;
    recommendedItems: string[];
    nutrientsSummary: {
      calories: number;
      protein: string;
      benefits: string;
    };
  } | null>(null);

  // Track the student's ongoing active order dynamically using allOrders!
  const ongoingOrder = allOrders.find(o => o.status !== "Completed") || allOrders[allOrders.length - 1] || {
    id: "ord-initial",
    token: "000",
    items: [],
    subtotal: 0,
    total: 0,
    status: "Received",
    statusText: "Welcome to Quick Canteen Logistics",
    estWait: 0,
    queuePosition: 0,
    canteen: "Central Canteen",
    pickupPoint: "Side Wing Terminal",
    walkTime: 1,
    botMapImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_P7rRat1P2SFjrfNkgsixSRV9_9ZI3VdzXMyTP7yYTmBQPh2e_XUbayb19wKo1tGfTrBi8T8a2wvq5DQQo9NNhkCechIVlxzbpsdxsPihqVmeWBEcnXe2KDvAfuLGAXcftuJpiZU4ot7Ix6ZxhMnqtT_9AOHyhKnXTq1jqX3mgFb2Pw1X8HpbVQBTloL7ZmXd07A7Ql_QPYw3FtGExMbERQ-7UZwDz-z0QPSXoqzH_tkzuUfmEJNkueZ6wpGKW0lN9m-Z-rrhHCw"
  };

  const setOngoingOrder = (updatedOrder: Order | ((prev: Order) => Order)) => {
    // Standard backplane updater calls fetchOrders internally on mutations
  };

  const [navigationActive, setNavigationActive] = useState(false);
  const [isChefAdded, setIsChefAdded] = useState(false);

  // Login form field states
  const [loginActiveTab, setLoginActiveTab] = useState<"student" | "admin">("student");
  const [loginStudentName, setLoginStudentName] = useState("");
  const [loginStudentEmail, setLoginStudentEmail] = useState("");
  const [loginAdminEmail, setLoginAdminEmail] = useState("");
  const [loginAdminPassword, setLoginAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSelectedAvatar, setLoginSelectedAvatar] = useState(0);

  const studentAvatars = [
    "", // Blank Customize Placeholder / Initial DP Circle
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80", // Female student (alternate)
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80", // Male academic (alternate)
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80"  // Casual scholar (alternate)
  ];

  const handleStudentLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    const email = loginStudentEmail.trim();
    const name = loginStudentName.trim() || email.split("@")[0] || "Student User";

    if (!email) {
      setLoginError("Please enter your Gmail address.");
      return;
    }
    if (!email.toLowerCase().includes("@gmail.com")) {
      setLoginError("Verification failed: Please enter a Google-registered Gmail address (@gmail.com).");
      return;
    }

    // Capitalize name
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

    try {
      const res = await fetch("/api/auth/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formattedName,
          email: email,
          avatar: studentAvatars[loginSelectedAvatar]
        })
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem("campus_hub_logged_in", "true");
        localStorage.setItem("campus_hub_user", JSON.stringify(user));
        setCurrentUser(user);
        setIsLoggedIn(true);
      } else {
        const data = await res.json();
        setLoginError(data.error || "Gateway student token validation failed.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Failed to reach local server instance.");
    }
  };

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const email = loginAdminEmail.trim().toLowerCase();
    const pass = loginAdminPassword.trim();

    if (!email || !pass) {
      setLoginError("Please fill in both Email and Passkey fields.");
      return;
    }

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      });
      if (res.ok) {
        const adminUser = await res.json();
        localStorage.setItem("campus_hub_logged_in", "true");
        localStorage.setItem("campus_hub_user", JSON.stringify(adminUser));
        setCurrentUser(adminUser);
        setIsLoggedIn(true);
      } else {
        const data = await res.json();
        setLoginError(data.error || "Invalid supervisor authorizations.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Server logistics network timeout.");
    }
  };

  const handleLogout = () => {
    // Clear storage keys
    localStorage.removeItem("campus_hub_logged_in");
    localStorage.removeItem("campus_hub_user");
    
    // Clear state
    setCurrentUser(null);
    setIsLoggedIn(false);
    setLoginStudentEmail("");
    setLoginStudentName("");
    setLoginAdminEmail("");
    setLoginAdminPassword("");
    setLoginError("");
  };

  // Admin form state for meal item modification / CRUD
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealFormName, setMealFormName] = useState("");
  const [mealFormPrice, setMealFormPrice] = useState("");
  const [mealFormCanteen, setMealFormCanteen] = useState("Central Canteen");
  const [mealFormCategory, setMealFormCategory] = useState("Gluten-Free");
  const [mealFormCalories, setMealFormCalories] = useState("");
  const [mealFormProtein, setMealFormProtein] = useState("");
  const [mealFormDescription, setMealFormDescription] = useState("");
  const [mealFormTags, setMealFormTags] = useState<string[]>(["Veg"]);
  const [mealFormImage, setMealFormImage] = useState("");

  const resetMealForm = () => {
    setEditingMealId(null);
    setMealFormName("");
    setMealFormPrice("");
    setMealFormCanteen("Central Canteen");
    setMealFormCategory("Gluten-Free");
    setMealFormCalories("");
    setMealFormProtein("");
    setMealFormDescription("");
    setMealFormTags(["Veg"]);
    setMealFormImage("");
    setIsAdminFormOpen(false);
  };

  const handleEditMealClick = (meal: MealItem) => {
    setEditingMealId(meal.id);
    setMealFormName(meal.name);
    setMealFormPrice(meal.price.toString());
    setMealFormCanteen(meal.canteen);
    setMealFormCategory(meal.category);
    setMealFormCalories((meal.calories || 300).toString());
    setMealFormProtein(meal.protein || "12g");
    setMealFormDescription(meal.description);
    setMealFormTags(meal.tags);
    setMealFormImage(meal.image || "");
    setIsAdminFormOpen(true);
  };

  const handleDeleteMealClick = async (mealId: string) => {
    if (confirm("Are you sure you want to delete this meal item from the master campus catalog? This will affect live student views.")) {
      try {
        const res = await fetch(`/api/menu/${mealId}`, { method: "DELETE" });
        if (res.ok) {
          fetchMenu();
        }
      } catch (err) {
        console.error("Delete menu item failed:", err);
      }
    }
  };

  const handleSaveMealSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!mealFormName || !mealFormPrice || !mealFormCalories || !mealFormProtein) {
      alert("Please fill in all core meal parameters (Name, Price, Calories, Protein).");
      return;
    }

    const priceNum = parseFloat(mealFormPrice);
    const calNum = parseInt(mealFormCalories);
    if (isNaN(priceNum) || isNaN(calNum)) {
      alert("Please enter valid numeric parameters for Price and Calories.");
      return;
    }

    try {
      if (editingMealId) {
        // Edit mode
        const res = await fetch(`/api/menu/${editingMealId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: mealFormName,
            price: priceNum,
            canteen: mealFormCanteen,
            category: mealFormCategory,
            calories: calNum,
            protein: mealFormProtein,
            description: mealFormDescription || "Specially formulated on-campus nutrition.",
            tags: mealFormTags,
            image: mealFormImage || undefined
          })
        });
        if (res.ok) {
          fetchMenu();
        }
      } else {
        // Create mode
        const res = await fetch(`/api/menu`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: mealFormName,
            price: priceNum,
            canteen: mealFormCanteen,
            category: mealFormCategory,
            calories: calNum,
            protein: mealFormProtein,
            description: mealFormDescription || "Specially formulated on-campus nutrition.",
            tags: mealFormTags,
            image: mealFormImage || undefined
          })
        });
        if (res.ok) {
          fetchMenu();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Action failed to transmit successfully.");
    }

    resetMealForm();
  };

  const toggleFormTag = (tag: string) => {
    setMealFormTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Chat History: Starts with the detailed conversation from mockup 2
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      sender: "user",
      text: "What's the healthiest option for lunch at the Engineering Canteen?",
      timestamp: "12:35 PM"
    },
    {
      id: "m2",
      sender: "ai",
      text: "Based on today's menu at the Engineering Canteen, the **Quinoa & Roasted Mediterranean Vegetable Bowl** is your best bet! It contains 420 calories, is high in fiber, and follows your preference for low-sodium meals.",
      timestamp: "12:35 PM",
      type: "smart_recommendation",
      tags: ["Vegan", "Gluten-Free"]
    },
    {
      id: "m3",
      sender: "user",
      text: "Is my coffee order ready for pickup yet?",
      timestamp: "12:38 PM"
    },
    {
      id: "m4",
      sender: "ai",
      text: "Your **Oat Latte** at Central Cafe is currently being freshly brewed inside the espresso machine. It should be fully ready for in-person counter handoff in approximately **2 minutes**.",
      timestamp: "12:38 PM"
    }
  ]);

  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Order status live decrement simulation (decreases minutes every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setOngoingOrder(prev => {
        if (prev.estWait > 1) {
          return {
            ...prev,
            estWait: prev.estWait - 1,
            queuePosition: Math.max(1, prev.queuePosition - 1)
          };
        } else if (prev.estWait === 1) {
          return {
            ...prev,
            estWait: 0,
            status: "Ready",
            statusText: "Your order is ready to collect!"
          };
        }
        return prev;
      });
    }, 45000); // decrement wait time
    return () => clearInterval(interval);
  }, []);

  // Format Helper for currency
  const formatPrice = (num: number) => `₹${num.toFixed(2)}`;

  // Cart Handlers
  const addToCart = (meal: MealItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.meal.id === meal.id);
      if (existing) {
        return prev.map(item => 
          item.meal.id === meal.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { meal, quantity: 1 }];
    });
  };

  const removeFromCart = (mealId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.meal.id === mealId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter(item => item.meal.id !== mealId);
      }
      return prev.map(item =>
        item.meal.id === mealId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.meal.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const sub = getCartTotal();
    const totalWithFee = sub + 0.70;
    const tokenNum = Math.floor(Math.random() * 800) + 100;
    
    // Deduct user balance validation
    if (userProfile.balance < totalWithFee) {
      alert("Insufficient account balance. Please top up your meal card!");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          subtotal: sub,
          total: totalWithFee,
          canteen: cart[0].meal.canteen,
          pickupPoint: "North Terminal",
          email: userProfile.email,
          token: tokenNum
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local session details with returned balance
        setUserProfile(p => ({ ...p, balance: data.balance }));
        setCart([]);
        await fetchOrders();
        setActiveTab("orders");
        alert("Quick Canteen Order Submitted Successfully! Please proceed directly to the restaurant counter to collect your meal once it is ready.");
      } else {
        const data = await res.json();
        alert(data.error || "Order dispatch failure.");
      }
    } catch (err) {
      console.error("Checkout dispatch error:", err);
      alert("Failed to submit active payload to network node.");
    }
  };

  const handleDirectOrder = async (meal: MealItem) => {
    const sub = meal.price;
    const totalWithFee = sub + 0.70;
    const tokenNum = Math.floor(Math.random() * 800) + 100;
    
    // Deduct user balance validation
    if (userProfile.balance < totalWithFee) {
      alert("Insufficient account balance. Please top up your meal card!");
      return;
    }

    if (confirm(`Confirm instant order of "${meal.name}" for ${formatPrice(totalWithFee)} (including ₹0.70 convenience fee)?`)) {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [{ meal, quantity: 1 }],
            subtotal: sub,
            total: totalWithFee,
            canteen: meal.canteen || "Central Canteen",
            pickupPoint: "North Terminal",
            email: userProfile.email,
            token: tokenNum
          })
        });

        if (res.ok) {
          const data = await res.json();
          // Update local session details with returned balance
          setUserProfile(p => ({ ...p, balance: data.balance }));
          await fetchOrders();
          setActiveTab("orders");
          alert("Quick Canteen Direct Order Submitted Successfully! Please proceed directly to the restaurant counter to collect your meal once it is ready.");
        } else {
          const data = await res.json();
          alert(data.error || "Order dispatch failure.");
        }
      } catch (err) {
        console.error("Direct checkout dispatch error:", err);
        alert("Failed to submit active payload to network node.");
      }
    }
  };

  // Chat Query Submission to Gemini
  const handleSendChat = async (directText?: string) => {
    const textToSend = directText || chatInput;
    if (!textToSend.trim()) return;

    // Append User Message
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!directText) setChatInput("");
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          message: textToSend
        })
      });

      const data = await response.json();
      if (response.ok) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.text,
          type: data.type || "text",
          tags: data.tags || [],
          image: data.type === "live_tracking" ? ongoingOrder.botMapImage : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || "Failed server response");
      }
    } catch (err: any) {
      console.error(err);
      // Fallback message display
      const fallbackAi: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: "**System Notification**: Connect an API Key via the Secrets panel to fully enable Gemini. The simulated chatbot answered: That's a great choice today!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, fallbackAi]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Perform AI Meal Plan Optimization
  const handleOptimizeMealPlan = async () => {
    setIsOptimizing(true);
    setOptimizedPlan(null);

    try {
      const response = await fetch("/api/optimize-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dietaryPreferences: dietarySelection,
          goalPreferences: goalSelection
        })
      });

      const data = await response.json();
      if (response.ok) {
        setOptimizedPlan(data);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      // fallback
      setOptimizedPlan({
        title: "Nutrient Sync Plate",
        explanation: "Based on Veg criteria, we suggest a Pairing of **Quinoa Power Bowl** and **Berry Omega Bowl** for clean slow-burning glycemic fuels.",
        recommendedItems: ["quinoa-power-bowl", "berry-omega-bowl"],
        nutrientsSummary: {
          calories: 700,
          protein: "34g",
          benefits: "High dietary fiber with rich brain-boosting antioxidants."
        }
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Filtering Menu Items
  const filteredMenuItems = menuItems.filter(meal => {
    // Category check
    const matchesCategory = selectedCategory === "All" || meal.category === selectedCategory;
    
    // Search query check
    const matchesSearch = searchQuery === "" || 
      meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    // Smart Filter toggle matches
    const matchesDiets = dietarySelection.length === 0 || dietarySelection.every(diet => {
      // Veg, Halal, Vegan
      if (diet === "Veg") return meal.tags.includes("Veg") || meal.tags.includes("Vegan");
      return meal.tags.includes(diet);
    });

    const matchesGoals = goalSelection.length === 0 || goalSelection.every(goal => {
      // High Protein, Low Calorie, Brain Food
      return meal.tags.includes(goal);
    });

    return matchesCategory && matchesSearch && matchesDiets && matchesGoals;
  });

  // --- BREATHTAKING AUTHENTICATION INTERFACE ---
  if (!isLoggedIn) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen text-white font-sans flex items-center justify-center p-4 sm:p-8 relative overflow-hidden select-none">
        
        {/* Glowing background highlights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#c5a059]/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c0a060]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl w-full bg-[#111]/90 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-10 z-10 relative">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 bg-[#c5a059]/10 text-[#c5a059] text-[9.5px] font-mono font-bold tracking-[0.25em] px-4 py-1.5 rounded-full border border-[#c5a059]/20 uppercase">
              <Shield className="w-3.5 h-3.5 animate-pulse" />
              Secure Campus Core Gateway
            </div>
            <h1 className="font-serif font-light text-3xl sm:text-5xl text-white tracking-[0.1em] uppercase">
              QUICK <span className="text-[#c5a059] italic">CANTEEN</span>
            </h1>
            <p className="text-xs text-white/50 tracking-wide max-w-md mx-auto">
              Access the campus smart culinary compiler, real-time autonomous rover routing grid, and high-fidelity dining services.
            </p>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="mb-6 bg-red-400/10 border border-red-500/20 text-red-300 text-xs py-3.5 px-4 rounded-xl flex items-center gap-3 animate-fade-in max-w-xl mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Navigation/Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-black/40 rounded-xl border border-white/5 text-sm max-w-sm mx-auto mb-8">
            <button 
              type="button"
              onClick={() => { setLoginActiveTab("student"); setLoginError(""); }} 
              className={`py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-2 ${
                loginActiveTab === "student" 
                  ? "bg-[#c5a059] text-black shadow-md font-extrabold" 
                  : "text-white/50 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Gmail Student Pass
            </button>
            <button 
              type="button"
              onClick={() => { setLoginActiveTab("admin"); setLoginError(""); }} 
              className={`py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-2 ${
                loginActiveTab === "admin" 
                  ? "bg-[#c5a059] text-black shadow-md font-extrabold" 
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Staff Gate
            </button>
          </div>

          {/* Login Columns / Form */}
          <div className="max-w-3xl mx-auto">
            
            {loginActiveTab === "student" ? (
              <div className="max-w-md mx-auto space-y-6">
                
                {/* One-click Google/Gmail Sign-in Accent bar */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-3 text-center">
                  <span className="text-[10px] font-mono text-[#c5a059] tracking-wider block font-bold">SECURE PASS GATEWAY</span>
                  <p className="text-white/60">Connect instantly using Google Identity Services to access personalized smart dietary catalogs.</p>
                  
                  <button
                    type="button"
                    onClick={async () => {
                      // Sign in seamlessly using the user's Gmail account 
                      const studentEmail = "raghavendrabhavikatti43@gmail.com";
                      const studentName = "Raghavendra";
                      try {
                        const res = await fetch("/api/auth/student-login", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: studentName,
                            email: studentEmail,
                            avatar: studentAvatars[loginSelectedAvatar]
                          })
                        });
                        if (res.ok) {
                          const user = await res.json();
                          localStorage.setItem("campus_hub_logged_in", "true");
                          localStorage.setItem("campus_hub_user", JSON.stringify(user));
                          setCurrentUser(user);
                          setIsLoggedIn(true);
                        } else {
                          const data = await res.json();
                          setLoginError(data.error || "Gmail credentials validation failed.");
                        }
                      } catch (err) {
                        setLoginError("Failed to connect with Google Identity instance.");
                      }
                    }}
                    className="w-full bg-white text-black hover:bg-white/90 font-extrabold text-xs tracking-wider py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
                  >
                    {/* Inline Google SVG Icon */}
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.183-2.773-6.183-6.183S10.58 6.15 13.99 6.15c1.479 0 2.83.528 3.89 1.401l3.07-3.07C19.14 2.82 16.71 1.8 13.99 1.8 8.16 1.8 3.42 6.54 3.42 12.37s4.74 10.57 10.57 10.57c6.12 0 10.15-4.3 10.15-10.33 0-.6-.05-1.1-.15-1.57l-11.75.245z"
                      />
                    </svg>
                    Continue with Google Workspace
                  </button>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-white/30 font-mono uppercase tracking-wide">or enter manually</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Your Display Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Raghavendra"
                      value={loginStudentName}
                      onChange={(e) => setLoginStudentName(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Gmail Address <span className="text-[#c5a059]">*</span></label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. raghavendra@gmail.com"
                      value={loginStudentEmail}
                      onChange={(e) => setLoginStudentEmail(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#c5a059] hover:bg-[#b59049] text-black font-extrabold uppercase tracking-widest py-3.5 px-6 rounded-xl transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    Authorize Gmail Account
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleAdminLogin} className="max-w-md mx-auto space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Admin Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="admin@campus.edu"
                    value={loginAdminEmail}
                    onChange={(e) => setLoginAdminEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Security Password / Key</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={loginAdminPassword}
                    onChange={(e) => setLoginAdminPassword(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#c5a059] hover:bg-[#b59049] text-black font-extrabold uppercase tracking-widest py-3 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Shield className="w-4 h-4 text-black" />
                  Secure Staff Authentication
                </button>
              </form>
            )}

          </div>

        </div>
      </div>
    );
  }

  // --- STAFF ADMIN INTEGRATED MANAGEMENT PANEL ---
  if (isLoggedIn && userProfile.role === "admin") {
    return (
      <div className="bg-[#0a0a0a] min-h-screen text-white font-sans overflow-x-hidden flex flex-col pb-24 md:pb-6 relative select-none">
        
        {/* Top Header */}
        <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md py-4 px-6 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            
            <div className="flex items-center gap-3">
              <div className="bg-[#111] border border-[#c5a059]/40 p-2 rounded-full text-[#c5a059]">
                <Shield className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-[0.25em] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    LOGISTICS CONTROL ACTIVE
                  </span>
                </div>
                <h1 className="font-serif font-light text-lg md:text-xl text-white tracking-[0.1em] uppercase mt-1">Quick Canteen Staff Panel</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[9px] text-white/40 uppercase tracking-widest">Admin Authorization</span>
                <span className="font-mono font-bold text-[#c5a059] text-xs">Campus Supervisor</span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 rounded-xl p-2.5 text-white/70 transition-colors cursor-pointer"
                title="Disconnect staff keys"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">

          {/* Tab Dock selection */}
          <div className="flex gap-2 overflow-x-auto select-none border-b border-white/15 pb-4 whitespace-nowrap scrollbar-none">
            {[
              { id: "admin_analytics", label: "Analytics & Canteens", icon: Activity },
              { id: "admin_orders", label: "Live Orders Dispatch", icon: ShoppingBag },
              { id: "admin_menu", label: "Menu Catalogue Config", icon: Utensils },
              { id: "admin_profile", label: "System Profiles", icon: User }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs uppercase tracking-widest font-extrabold transition-all relative cursor-pointer ${
                    adminActiveTab === tab.id 
                      ? "bg-[#c5a059]/10 border-[#c5a059]/30 text-[#c5a059]" 
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* VIEW 1: ADMIN ANALYTICS */}
          {adminActiveTab === "admin_analytics" && (
            <div className="space-y-6 animate-fade-in">
              {/* Stats Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="bg-[#111] p-5 rounded-2xl border border-white/10 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Today's Transactions</span>
                    <p className="text-3xl font-serif font-light text-white font-mono">₹1,424.80</p>
                  </div>
                  <TrendingUp className="w-7 h-7 text-[#c5a059]" />
                </div>

                <div className="bg-[#111] p-5 rounded-2xl border border-white/10 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Active Cooking Backlog</span>
                    <p className="text-3xl font-serif font-light text-[#c5a059] font-mono">
                      {allOrders.filter(o => o.status !== "Completed").length} Orders
                    </p>
                  </div>
                  <ShoppingBag className="w-7 h-7 text-[#c5a059]" />
                </div>

                <div className="bg-[#111] p-5 rounded-2xl border border-white/10 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Active Kitchens</span>
                    <p className="text-3xl font-serif font-light text-white font-mono">3 Branches</p>
                  </div>
                  <Bot className="w-7 h-7 text-[#c5a059]" />
                </div>

              </div>

              {/* Bot Monitor list */}
              <div className="bg-[#111] rounded-2xl border border-white/10 p-5 space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                  <div>
                    <h3 className="font-serif text-lg text-white">Campus Kitchen Operations Monitor</h3>
                    <p className="text-xs text-white/40">Tracking active queue times and meal preparation lines.</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                    KITCHEN-STREAM ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: "Central Cafe", mission: "Preparing 4x Oat Latte & Bowls", power: "92% Efficiency", mode: "Head Chef: Clara", status: "Cooking Active" },
                    { id: "Central Canteen", mission: "Preparing 12x Harvest & Quinoa Bowls", power: "96% Efficiency", mode: "Head Chef: James", status: "Queue Steady" },
                    { id: "Library Cafe", mission: "Espresso machine preheat cycle completed", power: "100% Ready", mode: "Head Chef: Sarah", status: "Counter Ready" }
                  ].map(unit => (
                    <div key={unit.id} className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3 font-sans text-xs">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-[#c5a059] font-bold">{unit.id}</span>
                        <span className="text-white/40 font-bold">{unit.power}</span>
                      </div>
                      <p className="text-white/80 leading-relaxed font-sans">{unit.mission}</p>
                      <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-white/40">
                        <span>Staff: {unit.mode}</span>
                        <span className="text-emerald-400 uppercase font-bold tracking-wider">{unit.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: ADMIN LIVE ORDERS VIEW */}
          {adminActiveTab === "admin_orders" && (
            <div className="space-y-6 animate-fade-in bg-[#111] rounded-2xl border border-white/10 p-5">
              <div>
                <h3 className="font-serif text-lg text-white">Active Dispatch Center</h3>
                <p className="text-xs text-white/40">Synchronize meal compilation by setting status in real-time. Students' order state will adjust immediately.</p>
              </div>

              {allOrders.length === 0 ? (
                <div className="p-8 border border-white/10 border-dashed rounded-xl text-center">
                  <p className="text-xs text-white/40">No ongoing orders in system buffer right now.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 space-y-4">
                  {allOrders.map(order => (
                    <div key={order.id} className="pt-4 first:pt-0 space-y-3">
                      
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 font-sans">
                          <span className="text-[#c5a059] font-mono font-bold uppercase text-xs px-2.5 py-1 rounded bg-[#c5a059]/10 border border-[#c5a059]/20">
                            Token #{order.token}
                          </span>
                          <span className="text-xs text-white/40 font-mono">
                            ID: {order.id} • {order.canteen} origins
                          </span>
                        </div>

                        {/* Status indicators */}
                        <div>
                          <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${
                            order.status === "Preparing" 
                              ? "bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/20 animate-pulse"
                              : order.status === "Ready"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-white/5 text-white/40 border-white/10"
                          }`}>
                            Status: {order.status} ({order.statusText})
                          </span>
                        </div>
                      </div>

                      {/* Items Listed */}
                      <div className="bg-black/30 border border-white/5 p-3.5 rounded-xl font-mono text-xs text-white/70">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span>{it.quantity}x {it.meal.name}</span>
                            <span className="text-white/50">{formatPrice(it.meal.price * it.quantity)}</span>
                          </div>
                        ))}
                        <div className="border-t border-white/5 mt-2.5 pt-2 flex justify-between items-center font-bold text-white">
                          <span>Subtotal:</span>
                          <span className="text-[#c5a059]">{formatPrice(order.total)}</span>
                        </div>
                      </div>

                      {/* Status controllers */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[9px] font-bold">
                        <span className="text-white/40 uppercase tracking-widest text-[9px] mr-2">Set Dispatch Control:</span>
                        
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/orders/${order.id}/status`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  status: "Preparing",
                                  statusText: "Chefs are finalizing compiling raw nutrients.",
                                  estWait: 6
                                })
                              });
                              if (res.ok) {
                                await fetchOrders();
                              }
                            } catch (err) {
                              console.error("Status update error:", err);
                            }
                          }}
                          className={`px-3 py-1.5 rounded transition-all border cursor-pointer ${
                            order.status === "Preparing" 
                              ? "bg-[#c5a059] text-black border-transparent" 
                              : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                          }`}
                        >
                          PREPARING
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/orders/${order.id}/status`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  status: "Ready",
                                  statusText: "Secure food lock primed on Unit #42. Awaiting transit.",
                                  estWait: 0
                                })
                              });
                              if (res.ok) {
                                await fetchOrders();
                              }
                            } catch (err) {
                              console.error("Status update error:", err);
                            }
                          }}
                          className={`px-3 py-1.5 rounded transition-all border cursor-pointer ${
                            order.status === "Ready" 
                              ? "bg-emerald-500 text-black border-transparent" 
                              : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                          }`}
                        >
                          READY
                        </button>

                        <button 
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/orders/${order.id}/status`, {
                                                        method: "PATCH",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                          status: "Completed",
                                                          statusText: "Order handed off successfully. Connection terminated.",
                                                          estWait: 0
                                                        })
                                                      });
                                                      if (res.ok) {
                                                        await fetchOrders();
                                                      }
                                                    } catch (err) {
                                                      console.error("Status update error:", err);
                                                    }
                                                  }}
                                                  className="px-3 py-1.5 rounded hover:bg-red-500/10 hover:text-red-400 bg-white/5 border border-white/10 text-white/60 transition-all cursor-pointer"
                                                >
                                                  COMPLETE & ARCHIVE
                                                </button>
                                              </div>

                                            </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: ADMIN MENU DIRECTORY CONFIG */}
          {adminActiveTab === "admin_menu" && (
            <div className="space-y-6 animate-fade-in bg-[#111] rounded-2xl border border-white/10 p-5 font-sans">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5 font-sans">
                <div>
                  <h3 className="font-serif text-lg text-white">Culinary Catalogue Configurer</h3>
                  <p className="text-xs text-white/40">Modify active menu items or insert new options on student canteens instantly.</p>
                </div>
                <button
                  onClick={() => {
                    if (isAdminFormOpen) {
                      resetMealForm();
                    } else {
                      setIsAdminFormOpen(true);
                    }
                  }}
                  className="bg-[#c5a059] hover:bg-[#b08e4d] text-black text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-black" />
                  {isAdminFormOpen ? "Close Compiler" : "Add Custom Meal Option"}
                </button>
              </div>

              {/* Edit/Create Form */}
              {isAdminFormOpen && (
                <form onSubmit={handleSaveMealSubmit} className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4 animate-fade-in text-xs font-sans">
                  <h4 className="font-serif text-sm text-[#c5a059] tracking-wider uppercase">
                    {editingMealId ? "Modify Existing Core Nutrient Parameter" : "Compile Brand New Academic Formula"}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    
                    <div className="sm:col-span-6 space-y-1">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold block">Meal Option Name</label>
                      <input 
                        type="text" 
                        required
                        value={mealFormName}
                        onChange={(e) => setMealFormName(e.target.value)}
                        placeholder="e.g. Protein Core Protein Shake"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold block">Voucher Price (₹)</label>
                      <input 
                        type="text" 
                        required
                        value={mealFormPrice}
                        onChange={(e) => setMealFormPrice(e.target.value)}
                        placeholder="e.g. 8.90"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold block">Calorie Rating (kcal)</label>
                      <input 
                        type="text" 
                        required
                        value={mealFormCalories}
                        onChange={(e) => setMealFormCalories(e.target.value)}
                        placeholder="e.g. 450"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1 font-sans">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold block">Campus Canteen Gate</label>
                      <select 
                        value={mealFormCanteen}
                        onChange={(e) => setMealFormCanteen(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[#c5a059] font-sans"
                      >
                        <option value="Central Canteen">Central Canteen</option>
                        <option value="Engineering Canteen">Engineering Canteen</option>
                        <option value="Science Canteen">Science Canteen</option>
                        <option value="Quad Cafe">Quad Cafe</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4 space-y-1 font-sans">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold block">Functional Section</label>
                      <select 
                        value={mealFormCategory}
                        onChange={(e) => setMealFormCategory(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[#c5a059] font-sans"
                      >
                        <option value="Entrees">Entrees</option>
                        <option value="Bowls">Bowls</option>
                        <option value="Snacks">Snacks</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Gluten-Free">Gluten-Free</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold block">Protein Quotient (g)</label>
                      <input 
                        type="text" 
                        required
                        value={mealFormProtein}
                        onChange={(e) => setMealFormProtein(e.target.value)}
                        placeholder="e.g. 24g"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                      />
                    </div>

                    <div className="sm:col-span-12 space-y-2 border-t border-b border-white/5 py-4 my-2">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold block">Respective Food Identification Picture</label>
                      
                      {/* Presets Grid */}
                      <p className="text-[10px] text-white/50 mb-1.5">Select a pre-configured elegant culinary photo preset:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { label: "Pasta & Noodles", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=150&h=150&q=80" },
                          { label: "Salads & Bowls", url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=150&h=150&q=80" },
                          { label: "Burgers & Sandwiches", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=150&h=150&q=80" },
                          { label: "Ramen & Soup", url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=150&h=150&q=80" },
                          { label: "Pizza & Bread", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=150&h=150&q=80" },
                          { label: "Breakfast & Dessert", url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=150&h=150&q=80" },
                          { label: "Smoothies & Shakes", url: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=150&h=150&q=80" },
                          { label: "Avocado Toast", url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=150&h=150&q=80" }
                        ].map(preset => {
                          const isSelected = mealFormImage === preset.url;
                          return (
                            <button
                              key={preset.url}
                              type="button"
                              onClick={() => setMealFormImage(preset.url)}
                              className={`relative rounded-xl overflow-hidden border-2 aspect-[4/3] transition-all bg-black flex flex-col justify-end text-left p-1.5 group cursor-pointer ${
                                isSelected 
                                  ? "border-[#c5a059] scale-[1.02] shadow-md shadow-[#c5a059]/10" 
                                  : "border-white/10 hover:border-white/30"
                              }`}
                            >
                              <img src={preset.url} alt={preset.label} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                              <span className="relative text-[9px] font-bold text-white z-10 leading-tight truncate w-full">{preset.label}</span>
                              {isSelected && (
                                <span className="absolute top-1 right-1 bg-[#c5a059] text-black rounded-full p-0.5 z-20">
                                  <Check className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom image URL input */}
                      <div className="pt-2">
                        <p className="text-[10px] text-white/50 mb-1">Or paste custom food photography link (images.unsplash.com / web URL):</p>
                        <input 
                          type="url" 
                          value={mealFormImage}
                          onChange={(e) => setMealFormImage(e.target.value)}
                          placeholder="e.g. https://images.unsplash.com/photo-... or custom JPEG/PNG URL"
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-12 space-y-1">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold block">Nutrient Composition Description</label>
                      <textarea 
                        value={mealFormDescription}
                        onChange={(e) => setMealFormDescription(e.target.value)}
                        placeholder="Describe target proteins, glycemic indexes or ingredient components..."
                        className="w-full h-16 bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                      />
                    </div>

                    {/* Tag selectors */}
                    <div className="sm:col-span-12 space-y-2">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold block">Dietary & Classification Filters</label>
                      <div className="flex flex-wrap gap-2">
                        {["Veg", "Vegan", "Halal", "Low Calorie", "High Protein", "Brain Food", "Chef's Choice"].map(tag => {
                          const isActive = mealFormTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleFormTag(tag)}
                              className={`px-3 py-1.5 rounded-lg border font-bold text-[9px] uppercase tracking-wide transition-colors cursor-pointer ${
                                isActive 
                                  ? "bg-[#c5a059]/20 border-[#c5a059] text-[#c5a059]" 
                                  : "bg-black/30 border-white/10 text-white/55 hover:text-white"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  <div className="flex items-center justify-end gap-3.5 pt-3 border-t border-white/5 font-mono">
                    <button
                      type="button"
                      onClick={resetMealForm}
                      className="text-white/60 hover:text-white text-[10px] uppercase tracking-wider font-bold cursor-pointer"
                    >
                      Cancel Compilation
                    </button>
                    <button
                      type="submit"
                      className="bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Nutrient Spec
                    </button>
                  </div>
                </form>
              )}

              {/* Active Items Table-style Inventory */}
              <div className="space-y-3 font-sans">
                <span className="text-[10px] font-mono tracking-widest uppercase text-white/40 block font-bold">Active Campus Catalog Stock ({menuItems.length} formulary rows)</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
                  {menuItems.map(meal => (
                    <div key={meal.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group font-sans">
                      
                      {/* Edit context label */}
                      <span className="absolute top-3 right-3 text-[9px] font-mono text-[#c5a059] uppercase bg-[#c5a059]/5 px-1.5 py-0.5 rounded border border-[#c5a059]/10">
                        {meal.category}
                      </span>

                      <div className="space-y-1.5 pr-12 font-sans">
                        <h5 className="font-serif text-sm text-white font-medium group-hover:text-[#c5a059] transition-colors">{meal.name}</h5>
                        <p className="text-[10px] text-white/50 leading-normal line-clamp-2">{meal.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 text-[9px] font-mono text-[#c5a059] pt-1">
                          <span>{meal.calories} kcal</span>
                          <span>•</span>
                          <span>{meal.protein} Protein</span>
                          <span>•</span>
                          <span className="text-white/40">{meal.canteen}</span>
                        </div>
                      </div>

                      {/* Options controls */}
                      <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs font-sans">
                        <span className="font-mono text-white text-sm font-bold">{formatPrice(meal.price)}</span>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditMealClick(meal)}
                            className="bg-white/5 hover:bg-[#c5a059]/10 text-white/70 hover:text-[#c5a059] px-2.5 py-1 rounded border border-white/10 hover:border-[#c5a059]/20 font-bold font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 inline mr-1" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMealClick(meal.id)}
                            className="bg-white/5 hover:bg-red-500/10 text-white/70 hover:text-red-400 px-2.5 py-1 rounded border border-white/10 hover:border-red-500/20 font-bold font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 inline mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* VIEW 4: SYSTEM PROFILE / SWAP TESTING */}
          {adminActiveTab === "admin_profile" && (
            <div className="space-y-6 animate-fade-in bg-[#111] rounded-2xl border border-white/10 p-6 max-w-xl mx-auto font-sans">
              
              <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-white/10">
                <div className="w-20 h-20 rounded-full border-2 border-[#c5a059]/30 overflow-hidden bg-black/40 flex items-center justify-center p-1 text-[#c5a059]">
                  <Shield className="w-10 h-10 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl font-light text-white tracking-wide">Campus Supervisor</h3>
                  <p className="text-xs text-emerald-400 tracking-widest font-mono uppercase font-bold mt-1">Status: Secured Administrator</p>
                  <p className="text-xs text-white/50 leading-relaxed font-sans pt-1">Primary Security Session: {userProfile.studentId}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3.5 text-xs text-white/80 font-mono">
                <span className="text-[9.5px] uppercase font-mono tracking-widest text-[#c5a059] block font-bold text-center">Operation Shortcuts</span>
                
                <button
                  type="button"
                  onClick={() => {
                    // Login back instantly as default student mock
                    const studentUser = {
                      name: "Alex",
                      email: "alex.mercer@campus.edu",
                      avatar: "",
                      role: "student" as const,
                      studentId: "STUDENT-39029193",
                      balance: 74.50,
                      preferences: ["Vegan", "High Protein"]
                    };

                    localStorage.setItem("campus_hub_logged_in", "true");
                    localStorage.setItem("campus_hub_user", JSON.stringify(studentUser));

                    setCurrentUser(studentUser);
                    setIsLoggedIn(true);
                  }}
                  className="w-full bg-[#c5a059] hover:bg-[#b08e4d] text-black py-3 rounded-xl font-bold uppercase tracking-widest transition-all text-[10px] text-center block shadow-md active:scale-95 cursor-pointer"
                >
                  Impersonate Student Workspace
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-bold uppercase tracking-widest transition-all text-[10px] text-center block border border-red-500/20 active:scale-95 cursor-pointer"
                >
                  Disconnect Staff Token (Logout)
                </button>
              </div>

            </div>
          )}

        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-sans overflow-x-hidden flex flex-col pb-24 md:pb-6">
      
      {/* Top App Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md py-4 px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#111] border border-[#c5a059]/40 p-2 rounded-full text-[#c5a059]">
              <MapPin className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold text-[#c5a059] uppercase tracking-[0.25em] bg-[#c5a059]/10 px-2.5 py-1 rounded-full border border-[#c5a059]/20">
                  Quick Canteen
                </span>
              </div>
              <h1 className="font-serif font-light text-xl md:text-2xl text-white tracking-[0.1em] uppercase mt-1">Quick Canteen</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Balance Readout */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[9px] text-white/40 uppercase tracking-widest">Meal Card Balance</span>
              <span className="font-mono font-bold text-[#c5a059] text-sm">{formatPrice(userProfile.balance)}</span>
            </div>

            {/* Notification Badge */}
            <button className="relative bg-[#111] border border-white/10 p-2.5 rounded-full hover:bg-white/5 transition-all text-white/80">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 bg-[#c5a059] w-2 h-2 rounded-full border border-[#0a0a0a]"></span>
            </button>

            {/* Profile Avatar Trigger with Dynamic Dropdown */}
            <div className="relative">
              <div 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} 
                className="cursor-pointer active:scale-95 transition-all shrink-0"
                id="profile-dropdown-trigger"
              >
                {renderUserProfileAvatar(userProfile.avatar, userProfile.email, userProfile.name, "w-10 h-10")}
              </div>

              {isProfileDropdownOpen && (
                <>
                  {/* Transparent Click-away Backdrop */}
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsProfileDropdownOpen(false)}></div>
                  
                  {/* High-Fidelity Dropdown */}
                  <div className="absolute right-0 top-12 mt-2 w-64 bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-fade-in divide-y divide-white/5 text-left">
                    {/* User Info Capsule */}
                    <div className="pb-3 text-left">
                      <p className="text-xs font-semibold text-white truncate">{userProfile.name}</p>
                      <p className="text-[10px] text-white/40 truncate mt-0.5">{userProfile.email}</p>
                      <div className="flex justify-between items-center mt-2.5 bg-black/40 border border-white/5 rounded-lg px-2.5 py-1.5">
                        <span className="text-[9px] text-[#c5a059]/80 uppercase tracking-wider font-bold">Meal Balance</span>
                        <span className="text-xs font-bold font-mono text-[#c5a059]">{formatPrice(userProfile.balance)}</span>
                      </div>
                    </div>

                    {/* Menu links */}
                    <div className="py-2 space-y-1">
                      <button 
                        onClick={() => {
                          setActiveTab("profile");
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-white/80 hover:text-white rounded-lg hover:bg-white/5 transition-all text-left"
                      >
                        <User className="w-4 h-4 text-[#c5a059]" />
                        <span>Dining Profile</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setActiveTab("orders");
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-white/80 hover:text-white rounded-lg hover:bg-white/5 transition-all text-left"
                      >
                        <ClipboardCheck className="w-4 h-4 text-[#c5a059]" />
                        <span>My Diet Log / Orders</span>
                      </button>
                    </div>

                    {/* Sign Out Trigger */}
                    <div className="pt-2">
                      <button 
                        onClick={() => {
                          handleLogout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-red-400 hover:text-red-300 font-medium rounded-lg hover:bg-red-500/10 transition-all text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out of Session</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* VIEW 1: HOME */}
        {activeTab === "home" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Ongoing Order Micro Status Card (matches screenshot 1) */}
            {ongoingOrder && ongoingOrder.status !== "Completed" && (
              <section 
                onClick={() => setActiveTab("orders")}
                className="bg-[#111] hover:bg-[#161616] text-[#e0e0ff] rounded-2xl p-5 flex items-center justify-between border border-[#c5a059]/30 shadow-lg cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#1a1a1a] border border-[#c5a059]/20 p-3 rounded-full flex items-center justify-center animate-pulse">
                    <Utensils className="w-6 h-6 text-[#c5a059]" />
                  </div>
                  <div>
                    <h3 className="font-serif tracking-wide text-white flex items-center gap-2 text-base">
                      Ongoing Order
                      <span className="inline-block w-2-h-2 rounded-full bg-[#c5a059] w-2 h-2 animate-ping"></span>
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      {ongoingOrder.estWait > 0 
                        ? `Arriving in ${ongoingOrder.estWait} mins • ${ongoingOrder.canteen}`
                        : `Ready to collect • ${ongoingOrder.canteen}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#c5a059]">
                  <span className="text-[10px] uppercase font-bold tracking-widest">Track Live</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </section>
            )}

            {/* Greetings Header */}
            <div>
              <h2 className="text-4xl font-light font-serif text-white tracking-wide italic">Good morning, {userProfile.name}!</h2>
              <p className="text-white/40 text-xs uppercase tracking-[0.2em] mt-1.5">Hungry for something new today?</p>

              {/* Sparkling AI Search Bar */}
              <div className="mt-6 max-w-2xl relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActiveTab("menu");
                    }
                  }}
                  placeholder="Search for meals, cafes, or diets..."
                  className="w-full bg-[#111] pl-12 pr-12 py-3.5 rounded-2xl border border-white/10 shadow-lg focus:outline-none focus:ring-1 focus:ring-[#c5a059]/40 text-sm placeholder:text-white/30 text-white"
                />
                <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-white/40 w-4.5 h-4.5" />
                <button 
                  onClick={() => setActiveTab("chat")} 
                  title="Ask AI Concierge"
                  className="absolute right-4.5 top-1/2 -translate-y-1/2 text-[#c5a059] hover:text-white transition-colors"
                >
                  <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                </button>
              </div>
            </div>

            {/* Dynamic Interactive Horizontal Categories Row */}
            <div>
              <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none">
                {["All", "Breakfast", "Meals", "Drinks", "Snacks"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setActiveTab("menu");
                    }}
                    className={`px-5 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                      cat === selectedCategory || (cat === "All" && selectedCategory === "All")
                        ? "bg-[#c5a059] text-black shadow-md hover:bg-[#b08e4d]"
                        : "bg-[#111] hover:bg-white/5 text-white/60 border border-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Today's Special Hero Banner (Mediterranean Harvest Bowl) */}
            <section className="relative h-64 md:h-72 rounded-2xl overflow-hidden group cursor-pointer shadow-xl border border-white/10 bg-[#111]">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHZqQYgBuWq3_7fpIMwTNzH6eT6sr9cJfDnCjUzZnyakDjOYXKY1N6E7CNP6MRgXS56QQbh6gfSpfS7STntiwr6hYfkjJedIzRUayn5pUInxvZa8pRqIe_F1wBFTl2LqcDOJolK_KF_7g2fCO8uor9UG9Nvy9ajMQKmdcjv5p0ggUxgeL2Y0MtsqcJZM9zWdN740SopEn-M9upkEFN3sndNc1ZJSQOF8SroMSU0JHM-rXXaZkbKZ4n2O-xX0HSByJkuWLCQmi-0ks" 
                alt="Mediterranean Harvest Bowl today special" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-6">
                <div>
                  <span className="inline-block bg-[#c5a059] text-black text-[9px] font-bold px-3 py-1 rounded-md uppercase tracking-[0.25em] mb-2.5 border border-[#c5a059]">
                    Chef's Choice
                  </span>
                  <h3 className="text-white text-2xl md:text-3xl font-serif font-light italic tracking-wide">Mediterranean Harvest Bowl</h3>
                  <p className="text-white/60 text-[11px] uppercase tracking-widest mt-1">Low calorie, high protein breakfast option.</p>
                </div>
                <div className="mt-4 flex flex-wrap justify-between items-center gap-3">
                  <span className="text-[#c5a059] font-serif font-light italic text-2xl">{formatPrice(11.50)}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const item = MEAL_ITEMS.find(m => m.id === "med-harvest-bowl");
                        if (item) {
                          addToCart(item);
                          setIsChefAdded(true);
                          setTimeout(() => setIsChefAdded(false), 1500);
                        }
                      }} 
                      className="bg-white hover:bg-white/95 text-black px-4 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
                    >
                      {isChefAdded ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{isChefAdded ? "Added" : "Add to Tray"}</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const item = MEAL_ITEMS.find(m => m.id === "med-harvest-bowl");
                        if (item) handleDirectOrder(item);
                      }} 
                      className="bg-[#c5a059] hover:bg-[#b08e4d] text-black px-4 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-extrabold flex items-center gap-1 shadow-md transition-transform active:scale-95 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 animate-pulse" />
                      <span>Instant Buy</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* AI Suggestions For You section with sparkles */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c5a059]" />
                <h3 className="font-serif text-xl font-light italic text-white tracking-wide">AI Suggestions for You</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* AI Card 1: Energizing Bowl */}
                <div className="bg-[#111] rounded-2xl p-4 border border-white/10 shadow-lg flex flex-col justify-between hover:border-[#c5a059]/30 transition-all group">
                  <div>
                    <div className="h-36 rounded-xl overflow-hidden mb-3 relative">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9E2sFB6qnCbzlQEJdAMyKJCesWRGQh_l5raXuAAuORk7i-IxNSTTQBb_ui2ZaFDspx7a6kOsI_s4YZujn78Yd-OfVOpRTV02d7yfel4ivaRhnHj_71JSzjVFsI0FEzBV9YcNI-JGORX_tEavjyEMBQax5Rz_d3J2qt0akmlE3HTlP_xU4OSEh0JtpjtNgR_49GASSCAQyQWPSMNHh5l3qCpKOzDZ09gK_rE0UVeovE02oAdkYDZzRk0rtJ-06HoMOjBOeh3Kznvc" alt="Energizing bowl" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                      <span className="absolute top-2 right-2 bg-black/80 text-[#c5a059] text-[8px] font-bold px-2.5 py-1 rounded-md tracking-widest uppercase border border-[#c5a059]/30">
                        Refuel Option
                      </span>
                    </div>
                    <h4 className="font-semibold text-white tracking-wide text-base">Energizing Bowl</h4>
                    <p className="text-white/40 text-[11px] uppercase tracking-wider mt-1">Matches your Friday gym habit</p>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 gap-2">
                    <span className="font-serif italic text-base text-[#c5a059] font-mono shrink-0">{formatPrice(9.50)}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => addToCart(MEAL_ITEMS.find(m => m.id === "energizing-bowl") || MEAL_ITEMS[1])}
                        className="bg-white/5 hover:bg-[#c5a059] hover:text-black border border-white/10 text-[#c5a059] p-2 rounded-full transition-colors active:scale-95 cursor-pointer flex items-center justify-center.5"
                        title="Add to Tray"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDirectOrder(MEAL_ITEMS.find(m => m.id === "energizing-bowl") || MEAL_ITEMS[1])}
                        className="bg-[#c5a059] hover:bg-[#b08e4d] text-black px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>Buy</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Card 2: Avocado Toast */}
                <div className="bg-[#111] rounded-2xl p-4 border border-white/10 shadow-lg flex flex-col justify-between hover:border-[#c5a059]/30 transition-all group">
                  <div>
                    <div className="h-36 rounded-xl overflow-hidden mb-3 relative">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh294gj6vV-4GlBmcTukUkb2bvWh1Z-bZwx9NS94792wXxFRWzW2jrStZ6Dvk0gUj6M4a5LYqNsC0ITnhEc83l6NI-f5C-Q_5o3YYOkZeDXI2P8ugHlq0nSXk3kC88_MiaN9LtoA4AvigPRdmGxUQZwQ_VcHDYQk5mCjdYrsQ5WUmjOzTiGzKC3UbGg6LdOe3LF1yHoGf-_vbtnnxrFlTUUjN0L8bXh3PzR1SuJ9ZMvE7GScSTyTrjChzwPRv__YrXmwyb1yr0mAo" alt="Avocado Toast" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                      <span className="absolute top-2 right-2 bg-black/80 text-[#c5a059] text-[8px] font-bold px-2.5 py-1 rounded-md tracking-widest uppercase border border-[#c5a059]/30">
                        Student Favorite
                      </span>
                    </div>
                    <h4 className="font-semibold text-white tracking-wide text-base">Avocado Toast</h4>
                    <p className="text-white/40 text-[11px] uppercase tracking-wider mt-1">Top choice among students</p>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 gap-2">
                    <span className="font-serif italic text-base text-[#c5a059] font-mono shrink-0">{formatPrice(7.80)}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => addToCart(MEAL_ITEMS.find(m => m.id === "avocado-toast") || MEAL_ITEMS[2])}
                        className="bg-white/5 hover:bg-[#c5a059] hover:text-black border border-white/10 text-[#c5a059] p-2 rounded-full transition-colors active:scale-95 cursor-pointer flex items-center justify-center.5"
                        title="Add to Tray"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDirectOrder(MEAL_ITEMS.find(m => m.id === "avocado-toast") || MEAL_ITEMS[2])}
                        className="bg-[#c5a059] hover:bg-[#b08e4d] text-black px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>Buy</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* Popular Items Row */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-2xl font-light italic text-white tracking-wide">Popular Items</h3>
                <button onClick={() => setActiveTab("menu")} className="text-[#c5a059] hover:text-white font-bold text-xs uppercase tracking-widest">
                  View All
                </button>
              </div>

              {/* Burger List Item Card */}
              <div className="bg-[#111] rounded-2xl p-4 border border-white/10 shadow-lg flex justify-between items-center hover:scale-[1.005] active:scale-[0.995] hover:border-[#c5a059]/35 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSYF5wTQXPv73lOnBTSg6qxpqYnPE5UrdOCTiSiopaoGTSBsfpILZhxrm14ySkivCkwDUjSY5DridIP8F7orH-qu7cIwzps8egqZfs3YT5xq1watGAbPkuXWfXzMMO8fupo-Eb2knMaSE0EQGeGU2bD-A9gacqPH7j8Te2XssPxonwFnrPLHGyIrxXe591SKPJ9x-sZStCWrh1FjoN0aZ3gljgGRnlvG0GzY7qM1uvx45BCiO0AFcHxhbe5I-3q9elZSSH1n2U9ko" 
                      alt="Burger item" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">Classic Double Burger</h4>
                    <p className="text-[11px] text-white/40 uppercase tracking-widest mt-1">North Canteen • 4.8★</p>
                    <span className="inline-block bg-[#c5a059] text-black text-[8px] font-bold px-2 py-0.5 rounded mt-2 uppercase tracking-widest border border-[#c5a059]">
                      BEST SELLER
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2.5">
                  <span className="font-serif italic text-base text-[#c5a059] font-mono">{formatPrice(8.50)}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => addToCart(MEAL_ITEMS.find(m => m.id === "classic-burger") || MEAL_ITEMS[3])}
                      className="bg-white hover:bg-[#c5a059] text-black p-2 rounded-full hover:brightness-110 active:scale-90 transition-transform cursor-pointer flex items-center justify-center"
                      title="Add to Tray"
                    >
                      <Plus className="w-4 h-4 text-black" />
                    </button>
                    <button 
                      onClick={() => handleDirectOrder(MEAL_ITEMS.find(m => m.id === "classic-burger") || MEAL_ITEMS[3])}
                      className="bg-[#c5a059] hover:bg-[#b08e4d] text-black px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Order</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Reorder */}
            <section className="space-y-4">
              <h3 className="font-serif text-2xl font-light italic text-white tracking-wide">Quick Reorder</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                
                {/* Oat Latte */}
                <div className="min-w-[150px] bg-[#111] border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg hover:border-[#c5a059]/30 transition-all">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c5a059] shadow-inner mb-3">
                    <Coffee className="w-5.5 h-5.5 text-[#c5a059]" />
                  </div>
                  <h4 className="font-semibold text-sm text-white">Oat Latte</h4>
                  <p className="text-xs font-serif italic text-[#c5a059] mt-1 font-mono">{formatPrice(4.20)}</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-4 w-full">
                    <button 
                      onClick={() => addToCart(MEAL_ITEMS.find(m => m.id === "oat-latte") || MEAL_ITEMS[8])}
                      className="bg-white hover:bg-white/95 text-black text-[9px] uppercase tracking-wider font-bold py-2 px-1 rounded-lg transition-all cursor-pointer"
                    >
                      + Tray
                    </button>
                    <button 
                      onClick={() => handleDirectOrder(MEAL_ITEMS.find(m => m.id === "oat-latte") || MEAL_ITEMS[8])}
                      className="bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[9px] uppercase tracking-wider font-extrabold py-2 px-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5"
                    >
                      ⚡ Buy
                    </button>
                  </div>
                </div>

                {/* Acai Cup */}
                <div className="min-w-[150px] bg-[#111] border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg hover:border-[#c5a059]/30 transition-all">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-rose-400 shadow-inner mb-3">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  </div>
                  <h4 className="font-semibold text-sm text-white">Acai Cup</h4>
                  <p className="text-xs font-serif italic text-[#c5a059] mt-1 font-mono">{formatPrice(6.50)}</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-4 w-full">
                    <button 
                      onClick={() => addToCart(MEAL_ITEMS.find(m => m.id === "acai-cup") || MEAL_ITEMS[9])}
                      className="bg-white hover:bg-white/95 text-black text-[9px] uppercase tracking-wider font-bold py-2 px-1 rounded-lg transition-all cursor-pointer"
                    >
                      + Tray
                    </button>
                    <button 
                      onClick={() => handleDirectOrder(MEAL_ITEMS.find(m => m.id === "acai-cup") || MEAL_ITEMS[9])}
                      className="bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[9px] uppercase tracking-wider font-extrabold py-2 px-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5"
                    >
                      ⚡ Buy
                    </button>
                  </div>
                </div>

                {/* Croissant */}
                <div className="min-w-[150px] bg-[#111] border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg hover:border-[#c5a059]/30 transition-all">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c5a059] shadow-inner mb-3">
                    <Utensils className="w-5 h-5 text-[#c5a059]" />
                  </div>
                  <h4 className="font-semibold text-sm text-white">Croissant</h4>
                  <p className="text-xs font-serif italic text-[#c5a059] mt-1 font-mono">{formatPrice(3.00)}</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-4 w-full">
                    <button 
                      onClick={() => addToCart(MEAL_ITEMS.find(m => m.id === "croissant") || MEAL_ITEMS[10])}
                      className="bg-white hover:bg-white/95 text-black text-[9px] uppercase tracking-wider font-bold py-2 px-1 rounded-lg transition-all cursor-pointer"
                    >
                      + Tray
                    </button>
                    <button 
                      onClick={() => handleDirectOrder(MEAL_ITEMS.find(m => m.id === "croissant") || MEAL_ITEMS[10])}
                      className="bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[9px] uppercase tracking-wider font-extrabold py-2 px-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5"
                    >
                      ⚡ Buy
                    </button>
                  </div>
                </div>

              </div>
            </section>

          </div>
        )}

        {/* VIEW 2: MENU & MINDFUL FILTERS */}
        {activeTab === "menu" && (
          <div className="animate-fade-in space-y-8">
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Smart Filter Sidebar */}
              <aside className="w-full lg:w-72 shrink-0">
                <div className="bg-[#111] border border-white/10 rounded-2xl p-5 shadow-lg space-y-6">
                  
                  {/* Smart Filters Header */}
                  <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                    <Sparkles className="w-4.5 h-4.5 text-[#c5a059] animate-pulse" />
                    <h3 className="font-serif text-base text-white tracking-wide">Smart Filters</h3>
                  </div>

                  {/* Dietary Preferences Selector */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Dietary Preference</h4>
                    <div className="flex flex-wrap gap-2">
                      {["Veg", "Halal", "Vegan"].map(diet => {
                        const isChosen = dietarySelection.includes(diet);
                        return (
                          <button
                            key={diet}
                            onClick={() => {
                              setDietarySelection(prev => 
                                prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet]
                              );
                            }}
                            className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border ${
                              isChosen 
                                ? "bg-[#c5a059] border-none text-black" 
                                : "bg-white/5 hover:bg-white/10 text-white/70 border-white/10"
                            }`}
                          >
                            {diet}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Goal Oriented Checker */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Goal Oriented</h4>
                    <div className="flex flex-col gap-2">
                      {["High Protein", "Low Calorie", "Brain Food"].map(goal => {
                        const isChosen = goalSelection.includes(goal);
                        return (
                          <label 
                            key={goal}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <input 
                              type="checkbox"
                              checked={isChosen}
                              onChange={() => {
                                setGoalSelection(prev => 
                                  prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
                                );
                              }}
                              className="rounded border-white/25 bg-black text-[#c5a059] focus:ring-[#c5a059] w-4.5 h-4.5 transition-all focus:ring-offset-0"
                            />
                            <span className="text-sm font-medium text-white/80">{goal}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optimize Meal psychology builder trigger */}
                  <div className="pt-4 border-t border-white/10">
                    <button 
                      onClick={handleOptimizeMealPlan}
                      disabled={isOptimizing}
                      className={`w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition-transform ${
                        isOptimizing
                          ? "bg-[#1c1c1c] text-white/40 border border-white/10"
                          : "bg-white hover:bg-neutral-200 text-black active:scale-[0.98]"
                      }`}
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                          <span>Optimizing Meal...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-black" />
                          <span>Optimize My Meal</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Optimized AI plan drawer display */}
                  {optimizedPlan && (
                    <div className="bg-gradient-to-br from-[#c5a059]/10 to-[#141414] border border-[#c5a059]/30 rounded-2xl p-4 mt-4 text-xs space-y-3 animate-fade-in shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-black bg-[#c5a059] px-2.5 py-1 rounded-full uppercase tracking-wider">
                          AI Nutrient Plan
                        </span>
                        <button onClick={() => setOptimizedPlan(null)} className="text-white/40 hover:text-white font-bold text-base">×</button>
                      </div>
                      <h5 className="font-serif italic text-sm text-white">{optimizedPlan.title}</h5>
                      <p className="text-white/75 leading-relaxed font-sans">{optimizedPlan.explanation}</p>
                      
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5 divide-y divide-white/5 text-[11px]">
                        <div className="flex justify-between py-1">
                          <span className="text-white/50">Est. Calories Sum:</span>
                          <span className="font-bold text-[#c5a059] font-mono">{optimizedPlan.nutrientsSummary.calories} kcal</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-white/50">Combined Protein:</span>
                          <span className="font-bold text-[#c5a059] font-mono">{optimizedPlan.nutrientsSummary.protein}</span>
                        </div>
                        <div className="text-[10px] text-[#c5a059] font-medium pt-1.5">
                          {optimizedPlan.nutrientsSummary.benefits}
                        </div>
                      </div>

                      {/* Auto add recommended recipe list items to cart if desired */}
                      <button 
                        onClick={() => {
                          optimizedPlan.recommendedItems.forEach(id => {
                            const found = MEAL_ITEMS.find(m => m.id === id);
                            if (found) addToCart(found);
                          });
                          alert("All recommended items added to your tray!");
                        }}
                        className="w-full bg-[#111] hover:bg-white hover:text-black border border-[#c5a059]/40 text-[#c5a059] py-2.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all"
                      >
                        Add Plan Items to Tray
                      </button>
                    </div>
                  )}

                </div>
              </aside>

              {/* Bento Food Grid list of items */}
              <div className="flex-1 space-y-6">
                
                {/* Search / Nutrient lookup */}
                <div className="bg-[#111] p-2 rounded-2xl flex items-center shadow-lg border border-white/10">
                  <Search className="ml-3 text-white/40 w-4.5 h-4.5 shrink-0" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for meals, cuisines, or nutrients..."
                    className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 px-4 py-3 text-white text-base placeholder:text-white/30"
                  />
                  <button 
                    onClick={() => {
                      setSearchQuery("");
                      setDietarySelection([]);
                      setGoalSelection([]);
                      setOptimizedPlan(null);
                    }}
                    className="mr-2 bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-white/10"
                  >
                    Clear Filters
                  </button>
                </div>

                {/* Displaying Results Banner */}
                <div className="flex justify-between items-center text-xs font-semibold px-1 text-white/50 uppercase tracking-widest">
                  <span>Found {filteredMenuItems.length} optimal campus meals</span>
                  {selectedCategory !== "All" && (
                    <span className="bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059] px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">
                      Category: {selectedCategory}
                    </span>
                  )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                  {filteredMenuItems.map(meal => {
                    const isLandscape = meal.id === "med-zest-platter";
                    // Custom style landscape col span
                    return (
                      <div 
                        key={meal.id} 
                        className={`bg-[#111] rounded-2xl overflow-hidden border border-white/10 shadow-lg flex flex-col justify-between hover:border-[#c5a059]/35 hover:shadow-2xl transition-all duration-300 group ${
                          isLandscape ? "md:col-span-2 md:flex-row" : ""
                        }`}
                      >
                        {/* Image banner */}
                        <div className={`relative overflow-hidden ${isLandscape ? "md:w-1/2 h-64 md:h-auto" : "h-48"}`}>
                          {meal.image ? (
                            <img 
                              src={meal.image} 
                              alt={meal.name} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02] opacity-90" 
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-white/40 border border-white/5">
                              <Coffee className="w-10 h-10 stroke-1 text-[#c5a059]" />
                            </div>
                          )}
                          
                          {/* Tags / Overlays */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                            {meal.tags.includes("Chef's Choice") && (
                              <span className="bg-[#c5a059] text-black text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-[#c5a059]">
                                Chef's Choice
                              </span>
                            )}
                            {meal.tags.includes("Best Seller") && (
                              <span className="bg-white/10 text-white border border-white/15 text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                                Best Seller
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Text and interaction content */}
                        <div className={`p-5 flex flex-col justify-between flex-1 ${isLandscape ? "md:w-1/2" : ""}`}>
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-semibold text-white text-base tracking-wide leading-tight">{meal.name}</h4>
                              {meal.rating && (
                                <div className="flex items-center gap-0.5 text-amber-400 font-bold text-sm shrink-0 font-mono">
                                  <span>★</span>
                                  <span>{meal.rating}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-white/50 text-xs lines-clamp-2 leading-relaxed">{meal.description}</p>
                            
                            {/* Nutritional indicators */}
                            <div className="flex flex-wrap gap-1.5 pt-1.5">
                              {meal.calories && (
                                <span className="text-[10px] font-semibold text-white/50 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md font-mono">
                                  {meal.calories} kcal
                                </span>
                              )}
                              {meal.protein && (
                                <span className="text-[10px] font-semibold text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/20 px-2.5 py-0.5 rounded-md font-mono">
                                  {meal.protein} Protein
                                </span>
                              )}
                              <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded font-medium">
                                {meal.canteen}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/10 gap-2">
                            <span className="font-serif font-light italic text-xl text-[#c5a059] font-mono shrink-0">{formatPrice(meal.price)}</span>
                            
                            {/* Dual action block */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                onClick={() => addToCart(meal)}
                                className="bg-white hover:bg-[#c5a059] hover:text-black text-black px-3.5 py-2.5 rounded-lg text-[9px] uppercase tracking-wider font-bold flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
                              >
                                <Plus className="w-3 h-3 text-current" />
                                <span>Add To Tray</span>
                              </button>
                              
                              <button 
                                onClick={() => handleDirectOrder(meal)}
                                className="bg-[#c5a059] hover:bg-[#b08e4d] text-black px-3.5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-extrabold flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5 fill-current" />
                                <span>Instant Buy</span>
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {filteredMenuItems.length === 0 && (
                  <div className="text-center p-12 bg-[#111] rounded-2xl border border-white/15">
                    <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-3 animate-pulse" />
                    <h4 className="font-bold text-white/80 text-base">No meals match your active filters</h4>
                    <p className="text-white/40 text-xs mt-1">Try to deselect dietary parameters or clear the smart goals above.</p>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* VIEW: SEPARATE TRAY / CART DETAILS VIEW */}
        {activeTab === "cart" && (
          <div className="space-y-6 animate-fade-in text-sm text-white/90">
            {/* Quick summary banner with a clean, high-contrast title */}
            <div className="border-b border-white/10 pb-4">
              <h2 className="font-serif text-3xl font-light text-white font-medium italic">Your Campus Food Tray</h2>
              <p className="text-xs text-white/50 tracking-wide mt-1 uppercase font-mono text-[#c5a059]">Review your selected items, nutrition statistics, and process your online purchase counter ticket.</p>
            </div>

            {cart.length === 0 ? (
              <div className="text-center p-16 bg-[#111] rounded-2xl border border-white/10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 mx-auto">
                  <ShoppingBag className="w-8 h-8 text-white/30 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg text-white">Your dining tray is empty</h3>
                  <p className="text-xs text-white/40 max-w-sm mx-auto">Browse our campus menu, add healthy cuisines, and make secure transactions.</p>
                </div>
                <button 
                  onClick={() => setActiveTab("menu")}
                  className="bg-[#c5a059] hover:bg-[#b08e4d] text-black font-bold text-[10px] uppercase tracking-widest py-3 px-6 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Explore Canteen Menu
                </button>
              </div>
            ) : (
              <section id="detailed-tray-summary" className="bg-neutral-900/60 rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#c5a059]/10 text-[#c5a059] p-2.5 rounded-xl border border-[#c5a059]/20">
                      <ShoppingBag className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-white font-medium">Selected Tray Items</h3>
                      <p className="text-xs text-white/50">Detailed nutrition profiling & checkout preview for added foods</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to empty your entire tray?")) {
                        setCart([]);
                      }
                    }}
                    className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-widest font-mono font-bold bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Clear All Tray Items
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {cart.map((item) => (
                    <div 
                      key={item.meal.id} 
                      className="bg-[#111] rounded-xl border border-white/5 hover:border-white/15 p-4 flex flex-col md:flex-row gap-4 transition-all duration-300"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full md:w-32 h-32 md:h-auto rounded-lg overflow-hidden shrink-0 bg-neutral-800 relative">
                        {item.meal.image ? (
                          <img 
                            src={item.meal.image} 
                            alt={item.meal.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            <Utensils className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-xs text-white text-[9px] uppercase tracking-wide px-2 py-0.5 rounded border border-white/10 font-mono">
                          {item.meal.category}
                        </span>
                      </div>

                      {/* Detail Body */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-semibold text-sm text-white font-serif">{item.meal.name}</h4>
                              <p className="text-[10px] text-[#c5a059] font-mono tracking-wider mt-0.5 uppercase">
                                Supplied by {item.meal.canteen}
                              </p>
                            </div>
                            <span className="text-[#c5a059] font-serif font-light text-base font-mono">
                              {formatPrice(item.meal.price)}
                            </span>
                          </div>

                          <p className="text-white/60 text-xs mt-2 leading-relaxed font-sans">
                            {item.meal.description}
                          </p>

                          {/* Nutrition Parameters */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {item.meal.calories && (
                              <span className="text-[9px] font-bold text-white/50 bg-white/5 border border-white/5 px-2 py-0.5 rounded font-mono">
                                {item.meal.calories} kcal
                              </span>
                            )}
                            {item.meal.protein && (
                              <span className="text-[9px] font-bold text-[#c5a059] bg-[#c5a059]/5 border border-[#c5a059]/15 px-2 py-0.5 rounded font-mono">
                                {item.meal.protein} Protein
                              </span>
                            )}
                            {item.meal.rating && (
                              <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded flex items-center gap-0.5 border border-amber-400/10">
                                <span className="text-amber-400">★</span>
                                <span>{item.meal.rating}</span>
                              </span>
                            )}
                            {item.meal.tags.map(tag => (
                              <span key={tag} className="text-[9px] font-sans font-medium text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                         {/* Quantity Counter & Price calculations row */}
                         <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 flex-wrap gap-2.5">
                           <div className="flex items-center gap-3">
                             <div className="flex items-center gap-1">
                               <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono">Quantity:</span>
                               <div className="flex items-center bg-black rounded-lg border border-white/10 overflow-hidden">
                                 <button 
                                   onClick={() => removeFromCart(item.meal.id)}
                                   className="px-2.5 py-1 text-white/50 hover:bg-white/5 hover:text-white transition-colors cursor-pointer font-bold font-mono"
                                 >
                                   -
                                 </button>
                                 <span className="px-3 text-xs font-bold font-mono text-white">
                                   {item.quantity}
                                 </span>
                                 <button 
                                   onClick={() => addToCart(item.meal)}
                                   className="px-2.5 py-1 text-white/50 hover:bg-white/5 hover:text-white transition-colors cursor-pointer font-bold font-mono"
                                 >
                                   +
                                 </button>
                               </div>
                             </div>

                             {/* Instant individual Order Button */}
                             <button 
                               onClick={() => handleDirectOrder(item.meal)}
                               className="bg-[#c5a059]/10 hover:bg-[#c5a059] border border-[#c5a059]/20 text-[#c5a059] hover:text-black px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                             >
                               <Zap className="w-3 h-3 fill-current" />
                               <span>Order Direct</span>
                             </button>
                           </div>

                           <div className="text-right">
                             <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono block">Subtotal</span>
                             <span className="text-[#c5a059] font-bold font-serif font-mono text-sm">
                               {formatPrice(item.meal.price * item.quantity)}
                             </span>
                           </div>
                         </div>

                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotals & Proceed block */}
                <div className="mt-4 p-5 bg-black/40 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-center md:text-left space-y-1">
                    <p className="text-xs text-white/60 font-sans">
                      Total items in tray: <span className="font-bold text-white font-mono">{getCartCount()}</span>
                    </p>
                    <p className="text-[10px] text-white/40 font-mono">
                      Quick Canteen digital transactions include a minor service fee (₹0.70).
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest block font-mono">Total Meal Canteen Sum</span>
                      <span className="text-[#c5a059] text-2xl font-serif font-light font-mono">
                        {formatPrice(getCartTotal() + 0.70)}
                      </span>
                    </div>
                    <button 
                      onClick={handleCheckout}
                      className="bg-[#c5a059] hover:bg-[#b08e4d] text-black font-bold text-[10px] uppercase tracking-widest py-3 px-8 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Process Checkout Receipt
                    </button>
                  </div>
                </div>

              </section>
            )}
          </div>
        )}

        {/* VIEW 3: LIVE ORDER TRACKING (mockup 4) */}
        {activeTab === "orders" && (
          <div className="space-y-8 animate-fade-in text-sm text-white/90">
            
            {/* Bento details layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Order Token card */}
              <div className="bg-[#111] rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col items-center justify-center text-center relative group overflow-hidden">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Order Token</span>
                <span className="text-5xl font-serif font-light text-[#c5a059] mt-3 tracking-wide">#{ongoingOrder.token}</span>
                <span className="bg-[#c5a059] text-black text-[8px] font-bold px-3 py-1 rounded mt-4 uppercase tracking-widest border border-[#c5a059]">
                  Priority Access
                </span>
              </div>

              {/* Countdown/Wait card */}
              <div className="bg-[#111] border border-white/10 text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex justify-between items-start w-full">
                  <Clock className="w-5 h-5 text-[#c5a059]" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Est. Wait</span>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-serif font-light italic text-[#c5a059]">
                    {ongoingOrder.estWait > 0 ? `${ongoingOrder.estWait} mins` : "Ready!"}
                  </h3>
                  <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">
                    {ongoingOrder.estWait > 0 ? `${ongoingOrder.queuePosition}rd in Queue` : "Please proceed to terminal"}
                  </p>
                </div>
                {/* Simulated Wait Counter Progress Bar */}
                <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="bg-[#c5a059] h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(15, (10 - ongoingOrder.estWait) * 10)}%` }}
                  ></div>
                </div>
              </div>

              {/* Status helper actions */}
              <div className="bg-[#111] rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#c5a059] animate-ping"></span>
                    <span className="text-xs font-semibold text-[#c5a059]">{ongoingOrder.statusText}</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed font-sans">
                    Your order from <span className="font-bold text-white">{ongoingOrder.canteen}</span> is being handcrafted by our specialized kitchen staff.
                  </p>
                </div>
                
                <button 
                  onClick={() => {
                    alert("Campus concierge support alerted. Assisting with Order ID: #" + ongoingOrder.token);
                  }}
                  className="mt-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2.5 px-4 rounded-lg font-bold text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                >
                  <Bot className="w-4 h-4 text-[#c5a059]" />
                  <span>Need Help?</span>
                </button>
              </div>

            </div>

            {/* Stepper tracking progress pipeline */}
            <section className="bg-[#111] p-6 rounded-2xl border border-white/10 shadow-lg">
              <h3 className="font-serif text-lg font-light italic text-white mb-6 tracking-wide flex items-center gap-2">
                <ClipboardCheck className="w-4.5 h-4.5 text-[#c5a059]" />
                <span>Live Progress</span>
              </h3>

              {/* Responsive horizontal pipeline tracks */}
              <div className="relative flex justify-between items-start pt-2">
                
                <div className="absolute top-[21px] left-[10%] right-[10%] h-[2px] bg-white/10 -z-0">
                  <div 
                    className="h-full bg-[#c5a059] transition-all duration-1000"
                    style={{ 
                      width: ongoingOrder.status === "Received" ? "15%" :
                             ongoingOrder.status === "Preparing" ? "50%" : 
                             ongoingOrder.status === "Ready" ? "85%" : "100%" 
                    }}
                  ></div>
                </div>

                {/* Step 1 */}
                <div className="flex flex-col items-center gap-2 text-center w-1/4 z-10">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border border-[#c5a059] bg-[#c5a059] text-black font-semibold text-xs shadow-md">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-xs">Received</h5>
                    <p className="text-[10px] text-white/40">12:40 PM</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`flex flex-col items-center gap-2 text-center w-1/4 z-10 ${
                  ongoingOrder.status !== "Received" ? "" : "opacity-40"
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs shadow-md transition-all ${
                    ongoingOrder.status === "Preparing" || ongoingOrder.status === "Ready" || ongoingOrder.status === "Completed"
                      ? "border-[#c5a059] bg-[#c5a059] text-black ring-4 ring-[#c5a059]/10" 
                      : "border-white/15 bg-white/5 text-white/30"
                  }`}>
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs">Preparing</h5>
                    <p className="text-[10px] text-white/40">In Progress</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`flex flex-col items-center gap-2 text-center w-1/4 z-10 ${
                  ongoingOrder.status === "Ready" || ongoingOrder.status === "Completed" ? "" : "opacity-40"
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs shadow-md transition-all ${
                    ongoingOrder.status === "Ready" || ongoingOrder.status === "Completed"
                      ? "border-[#c5a059] bg-white text-black" 
                      : "border-white/15 bg-white/5 text-white/30"
                  }`}>
                    ⚿
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs">Ready</h5>
                    <p className="text-[10px] text-white/40">Pending</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`flex flex-col items-center gap-2 text-center w-1/4 z-10 ${
                  ongoingOrder.status === "Completed" ? "" : "opacity-40"
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs shadow-md transition-all ${
                    ongoingOrder.status === "Completed"
                      ? "border-white bg-[#c5a059] text-black" 
                      : "border-white/15 bg-white/5 text-white/30"
                  }`}>
                    ★
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs">Completed</h5>
                    <p className="text-[10px] text-white/40">Final Step</p>
                  </div>
                </div>

              </div>
            </section>

            {/* Layout blueprint map segment */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              <div className="lg:col-span-3 bg-neutral-900/40 rounded-2xl p-8 border border-white/10 shadow-lg relative flex flex-col justify-between min-h-[350px] overflow-hidden">
                {/* Decorative secure design stripes watermarked */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#c5a059]/5 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-[60px] pointer-events-none"></div>
                
                <div>
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="bg-[#c5a059]/10 text-[#c5a059] p-3 rounded-xl border border-[#c5a059]/20">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-light text-white">Official Canteen Purchase Receipt</h3>
                      <p className="text-xs text-[#c5a059] font-mono tracking-wider">SECURE DIGITAL TRANSACTION TICKET</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5 text-sans text-xs text-white/70 leading-relaxed max-w-2xl">
                    <p>
                      This electronic order has been logged successfully and is routed to the kitchen queue of the <strong className="text-white bg-white/5 px-2 py-0.5 rounded font-mono font-medium">{ongoingOrder.canteen || "Central Canteen"}</strong> counter.
                    </p>
                    <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059] mt-1.5"></div>
                      <p className="flex-1 text-white/80 font-sans">
                        <strong className="text-[#c5a059]">Direct Canteen Collection:</strong> Please walk over to the selected restaurant location directly. Present this screen displaying your live token number <strong className="text-white font-mono">#{ongoingOrder.token}</strong> to the service counter attendee to collect your cooked food once ready.
                      </p>
                    </div>
                    <p className="text-white/40 italic">
                      There are no robotic or automatic delivery configurations active. Full visual verification of your meal status and real-time prep queues are rendered to the right.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#c5a059] animate-pulse"></span>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#c5a059]">Awaiting in-person pickup counter handoff</span>
                  </div>
                  <span className="text-white/30 font-mono text-[9px] uppercase tracking-widest">Connection Live • Secure Collection</span>
                </div>
              </div>

              {/* Order Items Summary panel */}
              <div className="bg-[#111] rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col justify-between h-full space-y-4">
                <div>
                  <h4 className="font-serif text-base text-white pb-3 border-b border-white/10">Order Details</h4>
                  <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                    {ongoingOrder.items.map((cartItem, idx) => (
                      <div key={idx} className="flex justify-between py-3">
                        <div>
                          <p className="font-bold text-white text-sm">{cartItem.meal.name}</p>
                          <span className="text-[10px] text-white/40">Extra Avocado, No Onions</span>
                        </div>
                        <span className="font-bold text-[#c5a059] font-mono text-sm">x{cartItem.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 text-xs text-white/50 font-medium space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-white/95 font-mono">{formatPrice(ongoingOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packaging fee:</span>
                    <span className="font-semibold text-white/95 font-mono">₹0.70</span>
                  </div>
                  <div className="flex justify-between pt-2.5 border-t border-dashed border-white/10">
                    <span className="font-serif text-sm text-white">Total Paid:</span>
                    <span className="font-serif font-light text-xl text-[#c5a059] font-mono">{formatPrice(ongoingOrder.total)}</span>
                  </div>
                </div>
              </div>

            </section>

            {/* Smart purchase tips instead of pick-up routing */}
            {ongoingOrder.aiSuggestion && (
              <div className="bg-[#111] border border-[#c5a059]/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4.5 shadow-lg">
                <div className="w-12 h-12 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059] shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5 text-[#c5a059]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-serif text-base text-white">Smart Purchase Insights</h4>
                  <p className="text-white/60 text-xs leading-relaxed mt-1 font-sans">
                    {ongoingOrder.aiSuggestion.text || "Your optimal energy plate has been compiled to feed your physical and cognitive goals today! Enjoy your meal."}
                  </p>
                </div>
                <div className="text-white/30 font-mono text-[9px] uppercase tracking-widest shrink-0 whitespace-nowrap bg-white/5 py-1.5 px-3 rounded">
                  AI Nutrition Checked
                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 4: CHAT (AI CONCIERGE ASSISTANT DRAWER - mockup 2) */}
        {activeTab === "chat" && (
          <div className="animate-fade-in flex flex-col min-h-[500px] bg-[#111] rounded-2xl border border-white/10 shadow-lg overflow-hidden border-b-6 border-[#c5a059]/30">
            
            {/* Assistance banner */}
            <div className="bg-gradient-to-r from-[#111] to-[#161616] p-6 text-center border-b border-white/10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c5a059] shadow-inner mb-3">
                <Bot className="w-7 h-7 text-[#c5a059]" />
              </div>
              <h2 className="text-xl font-serif font-light italic text-white tracking-wide">How can I help you today?</h2>
              <p className="text-xs text-white/50 mt-1 max-w-sm">Your AI campus concierge is ready. Get smart nutrition advice and canteen catalog highlights.</p>
            </div>

            {/* Chat History content scroll */}
            <div className="flex-grow p-6 space-y-6 overflow-y-auto max-h-[350px] min-h-[250px] bg-black/40">
              {chatMessages.map((msg, i) => {
                const isAi = msg.sender === "ai";
                return (
                  <div 
                    key={msg.id || i}
                    className={`flex ${isAi ? "justify-start" : "justify-end"} animate-fade-in`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-md ${
                      isAi 
                        ? "bg-white/5 border border-white/10 text-white/90 rounded-tl-none" 
                        : "bg-[#c5a059] text-black font-semibold rounded-tr-none"
                    }`}>
                      
                      {isAi && (
                        <div className="flex items-center gap-1.5 text-[#c5a059] font-bold text-[9px] uppercase tracking-widest mb-1.5">
                          {msg.type === "live_tracking" ? "❇ Purchase Verification" : "❇ Smart Recommendation"}
                        </div>
                      )}

                      <p className="text-sm leading-relaxed">
                        {msg.text.split("**").map((text, idx) => idx % 2 === 1 ? <strong key={idx} className={`font-bold ${isAi ? "text-[#c5a059]" : "text-black bg-white/10 px-1 rounded"}`}>{text}</strong> : text)}
                      </p>

                      {/* Pill labels tags */}
                      {msg.tags && msg.tags.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap border-t border-white/5 pt-2">
                          {msg.tags.map(t => (
                            <span key={t} className="bg-white/10 border border-white/15 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Delivery interactive map overlay if attached */}
                      {msg.image && (
                        <div className="mt-3.5 rounded-xl overflow-hidden border border-white/10 relative max-w-sm">
                          <img src={msg.image} className="w-full h-28 object-cover opacity-80" alt="Delivery Bot Map navigation" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/80 px-3 py-1.5 flex justify-between items-center text-[10px] text-white font-medium border-t border-white/5">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#c5a059] animate-ping inline-block"></span>
                              Bot #42 moving
                            </span>
                            <span className="text-[#c5a059]">ETA: 6 mins</span>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

              {isAiLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#c5a059] animate-spin" />
                    <span className="text-xs text-white/50 font-semibold">AI Assistant is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Suggested quick chips */}
            <div className="flex gap-2 overflow-x-auto p-4 border-t border-white/10 bg-black/30 select-none whitespace-nowrap scrollbar-none">
              {[
                "What's healthy today?",
                "Where is my order?",
                "Show meal balance",
                "High protein snacks"
              ].map(chip => (
                <button
                  key={chip}
                  onClick={() => handleSendChat(chip)}
                  className="bg-white/5 hover:bg-white/10 text-white/70 text-[10px] uppercase tracking-wider font-bold px-4 py-2 rounded-full border border-white/10 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Dynamic Chat Input Bar */}
            <div className="p-4 bg-[#111] border-t border-white/10">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-2"
              >
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything about campus services..."
                  className="flex-grow pl-5 pr-4 py-3 rounded-xl border border-white/10 bg-black/30 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#c5a059]/40 text-sm"
                />
                
                <button 
                  type="submit"
                  disabled={isAiLoading || !chatInput.trim()}
                  className="bg-white hover:bg-[#c5a059] disabled:bg-white/10 disabled:text-white/30 text-black rounded-xl p-3 shadow-md transition-all active:scale-95"
                >
                  <Send className="w-5 h-5 text-black" />
                </button>
              </form>
            </div>

          </div>
        )}

        {/* VIEW 5: USER PROFILE & MEAL CARD SETTINGS */}
        {activeTab === "profile" && (
          <div className="animate-fade-in bg-[#111] rounded-2xl border border-white/10 p-6 space-y-6 shadow-lg">
            
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-white/10">
              <div className="shrink-0">
                {renderUserProfileAvatar(userProfile.avatar, userProfile.email, userProfile.name, "w-20 h-20")}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="font-serif text-2xl font-light italic text-white tracking-wide">{userProfile.name} Mercer</h3>
                <p className="text-xs text-white/50 tracking-wide mt-1 uppercase font-semibold">Active Student • {userProfile.studentId}</p>
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1.5 font-mono">
                  {userProfile.preferences.map(pref => (
                    <span key={pref} className="bg-[#c5a059]/10 text-[#c5a059] text-[9px] font-bold px-2.5 py-1 rounded border border-[#c5a059]/20 uppercase tracking-wider">
                      {pref} Goal
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Account Card details */}
              <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-white/10">
                <div className="space-y-1">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Meal balance</span>
                  <p className="text-3xl font-serif font-light text-[#c5a059] font-mono">{formatPrice(userProfile.balance)}</p>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/users/topup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: userProfile.email,
                          amount: 25
                        })
                      });
                      if (res.ok) {
                        const updatedUser = await res.json();
                        setUserProfile(updatedUser);
                        alert("Added ₹25.00 to your student dining credentials!");
                      } else {
                        const errData = await res.json();
                        alert(errData.error || "Topup failed.");
                      }
                    } catch (err) {
                      console.error("Top-up error:", err);
                      alert("Unable to dispatch wallet loading request.");
                    }
                  }}
                  className="bg-[#c5a059] hover:bg-[#b08e4d] text-black py-2 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md"
                >
                  + Add ₹25
                </button>
              </div>

              {/* History Statistics */}
              <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-white/10">
                <div className="space-y-1">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Today's Calorie Intake</span>
                  <p className="text-3xl font-serif font-light text-white font-mono">1,130 <span className="text-xs font-sans font-light text-white/40">kcal</span></p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#c5a059]" />
              </div>

            </div>

            {/* Profile Settings list */}
            <div>
              <h4 className="font-serif text-base text-white mb-3 tracking-wide">Dining Profile</h4>
              <div className="divide-y divide-white/5 border border-white/10 rounded-2xl bg-black/40 overflow-hidden text-sm">
                
                <div className="flex justify-between items-center p-4">
                  <div>
                    <p className="font-bold text-white">Automatic Dietary Tagging</p>
                    <p className="text-xs text-white/50 leading-relaxed font-sans">Allow AI to highlight Gluten-Free and Low-Calorie options automatically based on your gym schedule.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded border-white/20 bg-black text-[#c5a059] focus:ring-[#c5a059] w-5 h-5 focus:ring-offset-0" />
                </div>

                <div className="flex justify-between items-center p-4">
                  <div>
                    <p className="font-bold text-white">Email Receipt Notifications</p>
                    <p className="text-xs text-white/50 leading-relaxed font-sans">Send a companion email invoice after picking up cooked meals from the store counter.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded border-white/20 bg-black text-[#c5a059] focus:ring-[#c5a059] w-5 h-5 focus:ring-offset-0" />
                </div>

              </div>
            </div>

            {/* Customization & Personalization */}
            <div>
              <h4 className="font-serif text-base text-white mb-3 tracking-wide">Personalize Your ID Display</h4>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const nameVal = (form.elements.namedItem("profileName") as HTMLInputElement).value;
                  const avatarVal = (form.elements.namedItem("profileAvatar") as HTMLInputElement).value;
                  try {
                    const res = await fetch("/api/users/profile/update", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: userProfile.email,
                        name: nameVal,
                        avatar: avatarVal
                      })
                    });
                    if (res.ok) {
                      const updatedUser = await res.json();
                      setUserProfile(updatedUser);
                      alert("Display credentials updated successfully!");
                    } else {
                      alert("Failure saving settings.");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Failure updating details.");
                  }
                }}
                className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold block">Display Name</label>
                    <input 
                      type="text" 
                      name="profileName"
                      defaultValue={userProfile.name}
                      placeholder="e.g. Alex"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold block">Custom Photo Address URL</label>
                    <input 
                      type="url" 
                      name="profileAvatar"
                      defaultValue={userProfile.avatar}
                      placeholder="Paste Unspslash / JPEG / PNG link"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-3">
                  <p className="text-[10px] text-white/45 max-w-md bg-black/20 p-2.5 rounded-lg border border-white/5">
                    💡 If custom URL is empty, we automatically fetch the Google DP of your Gmail ID: <span className="font-mono text-[#c5a059]">{userProfile.email}</span>
                  </p>
                  <button 
                    type="submit"
                    className="bg-[#c5a059] hover:bg-[#b08e4d] text-black py-2 px-5 rounded-lg font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md self-end cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Session Actions Block */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 px-5 py-3 rounded-xl font-medium text-xs tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Disconnect Account / Log Out
              </button>
            </div>

          </div>
        )}

      </main>
      
      {/* Bottom floating Checkout Tray Indicator */}
      {getCartCount() > 0 && activeTab !== "cart" && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-xl z-40">
          <div className="bg-[#111]/95 backdrop-blur-md border border-[#c5a059]/35 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row gap-3 justify-between items-center transition-all animate-bounce-subtle">
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl relative">
                <ShoppingBag className="w-6 h-6 text-[#c5a059]" />
                <span className="absolute -top-1.5 -right-1.5 bg-[#c5a059] text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {getCartCount()}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{getCartCount()} Items in Tray</h4>
                <p className="text-[10px] text-[#c5a059] font-mono uppercase tracking-wider">In-person Counter Pickup</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="font-serif font-light italic text-base text-white font-mono mr-2">{formatPrice(getCartTotal())}</span>
              <button 
                onClick={() => {
                  setActiveTab("cart");
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white border border-white/15 px-3.5 py-2.5 rounded-lg font-bold text-[9px] uppercase tracking-widest shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                View Selected Tray
              </button>
              <button 
                onClick={handleCheckout}
                className="bg-[#c5a059] hover:bg-[#b08e4d] text-black px-4.5 py-2.5 rounded-lg font-bold text-[9px] uppercase tracking-widest shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant FAB Trigger button */}
      <div className="fixed right-6 bottom-24 z-50">
        <button 
          onClick={() => {
            setActiveTab("chat");
          }}
          className="w-14 h-14 rounded-full bg-[#1c1c1c] hover:bg-neutral-800 border border-[#c5a059]/40 text-[#c5a059] shadow-2xl flex items-center justify-center relative overflow-hidden group transition-all hover:scale-105 active:scale-95"
          title="Ask AI Concierge"
        >
          {/* subtle moving shimmer */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></span>
          <Sparkles className="w-5.5 h-5.5 text-[#c5a059] animate-pulse" />
        </button>
      </div>

      {/* Bottom Navigation Dock */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/10 shadow-[0px_-4px_24px_rgba(0,0,0,0.8)] z-50 py-3.5 flex justify-around items-center px-4">
        
        {/* Navigation Buttons */}
        <button 
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all scale-95 active:scale-90 ${
            activeTab === "home" 
              ? "bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20" 
              : "text-white/50 hover:text-white"
          }`}
        >
          <Utensils className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-widest font-bold">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab("menu")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all scale-95 active:scale-90 ${
            activeTab === "menu" 
              ? "bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20" 
              : "text-white/50 hover:text-white"
          }`}
        >
          <Compass className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-widest font-bold">Menu</span>
        </button>

        <button 
          onClick={() => setActiveTab("cart")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all scale-95 active:scale-90 relative ${
            activeTab === "cart" 
              ? "bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20" 
              : "text-white/50 hover:text-white"
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5.5 h-5.5" />
            {getCartCount() > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#c5a059] text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {getCartCount()}
              </span>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-widest font-bold">Tray</span>
        </button>

        <button 
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all scale-95 active:scale-90 ${
            activeTab === "orders" 
              ? "bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20" 
              : "text-white/50 hover:text-white"
          }`}
        >
          <Clock className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-widest font-bold">Orders</span>
        </button>

        <button 
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all scale-95 active:scale-90 ${
            activeTab === "profile" 
              ? "bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20" 
              : "text-white/50 hover:text-white"
          }`}
        >
          <User className="w-5.5 h-5.5" />
          <span className="text-[9px] uppercase tracking-widest font-bold">Profile</span>
        </button>

      </nav>

    </div>
  );
}

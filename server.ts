import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Standard Gemini SDK Initialization (Server-side only)
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined or is placeholder. AI suggestions will run on simulated fallback mode.");
}

const app = express();
const PORT = 3000;

app.use(express.json());

// --- ROBUST LOCAL JSON FILE DATABASE ---
const DB_FILE = path.join(process.cwd(), "db.json");

const DEFAULT_MENU_ITEMS = [
  {
    id: "med-harvest-bowl",
    name: "Mediterranean Harvest Bowl",
    description: "A high-end gourmet salad bowl featuring grilled chicken, ripe avocado slices, cherry tomatoes, and quinoa.",
    price: 11.50,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHZqQYgBuWq3_7fpIMwTNzH6eT6sr9cJfDnCjUzZnyakDjOYXKY1N6E7CNP6MRgXS56QQbh6gfSpfS7STntiwr6hYfkjJedIzRUayn5pUInxvZa8pRqIe_F1wBFTl2LqcDOJolK_KF_7g2fCO8uor9UG9Nvy9ajMQKmdcjv5p0ggUxgeL2Y0MtsqcJZM9zWdN740SopEn-M9upkEFN3sndNc1ZJSQOF8SroMSU0JHM-rXXaZkbKZ4n2O-xX0HSByJkuWLCQmi-0ks",
    rating: 4.8,
    canteen: "Central Canteen",
    category: "Breakfast",
    tags: ["Chef's Choice", "Low Calorie", "High Protein"],
    calories: 410,
    protein: "18g"
  },
  {
    id: "energizing-bowl",
    name: "Energizing Bowl",
    description: "A vibrant health-focused green smoothie bowl topped with sliced banana, blueberries, and chia seeds.",
    price: 9.50,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB9E2sFB6qnCbzlQEJdAMyKJCesWRGQh_l5raXuAAuORk7i-IxNSTTQBb_ui2ZaFDspx7a6kOsI_s4YZujn78Yd-OfVOpRTV02d7yfel4ivaRhnHj_71JSzjVFsI0FEzBV9YcNI-JGORX_tEavjyEMBQax5Rz_d3J2qt0akmlE3HTlP_xU4OSEh0JtpjtNgR_49GASSCAQyQWPSMNHh5l3qCpKOzDZ09gK_rE0UVeovE02oAdkYDZzRk0rtJ-06HoMOjBOeh3Kznvc",
    rating: 4.6,
    canteen: "Gym Cafe",
    category: "Breakfast",
    tags: ["Veg", "Vegan", "Low Calorie", "Brain Food"],
    calories: 320,
    protein: "8g"
  },
  {
    id: "avocado-toast",
    name: "Avocado Toast",
    description: "Modern avocado toast on sourdough bread with a perfectly poached egg and red pepper flakes.",
    price: 7.80,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCh294gj6vV-4GlBmcTukUkb2bvWh1Z-bZwx9NS94792wXxFRWzW2jrStZ6Dvk0gUj6M4a5LYqNsC0ITnhEc83l6NI-f5C-Q_5o3YYOkZeDXI2P8ugHlq0nSXk3kC88_MiaN9LtoA4AvigPRdmGxUQZwQ_VcHDYQk5mCjdYrsQ5WUmjOzTiGzKC3UbGg6LdOe3LF1yHoGf-_vbtnnxrFlTUUjN0L8bXh3PzR1SuJ9ZMvE7GScSTyTrjChzwPRv__YrXmwyb1yr0mAo",
    rating: 4.7,
    canteen: "Central Cafe",
    category: "Breakfast",
    tags: ["Veg", "Chef's Choice"],
    calories: 380,
    protein: "12g"
  },
  {
    id: "classic-burger",
    name: "Classic Double Burger",
    description: "A gourmet classic cheeseburger with melting cheddar, fresh lettuce, tomato, and seasoned double beef patties.",
    price: 8.50,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSYF5wTQXPv73lOnBTSg6qxpqYnPE5UrdOCTiSiopaoGTSBsfpILZhxrm14ySkivCkwDUjSY5DridIP8F7orH-qu7cIwzps8egqZfs3YT5xq1watGAbPkuXWfXzMMO8fupo-Eb2knMaSE0EQGeGU2bD-A9gacqPH7j8Te2XssPxonwFnrPLHGyIrxXe591SKPJ9x-sZStCWrh1FjoN0aZ3gljgGRnlvG0GzY7qM1uvx45BCiO0AFcHxhbe5I-3q9elZSSH1n2U9ko",
    rating: 4.8,
    canteen: "North Canteen",
    category: "Meals",
    tags: ["Best Seller", "High Protein"],
    calories: 680,
    protein: "36g"
  },
  {
    id: "quinoa-power-bowl",
    name: "Quinoa Power Bowl",
    description: "Roasted chicken, black beans, quinoa, shredded carrots, chickpeas, fresh greens, and spicy lime dressing.",
    price: 12.50,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5TaQMBHYx3Q6cUZ9WP-9H75wTycmvkwTdYG3cQzW3Q3f6bfdvJc17fSiifkRUmWYklq0W9DPUIbXvA8RoYT7Wk5uRkn7zekdrhroeP3xbvyRJBifusmow729ZGpgT87rfbuomNIeJQUPTezrN3ytnpY5ZREatxoVNsuX9_7VSezl7sTgIlYfUQNEgZdO020t9696La3RFxCxf0db5yks5V53-FUujeM__6bSssfq6fH7bOvXAWy5TyUQw1m3I1BEJpDb938gGMpg",
    rating: 4.8,
    canteen: "Engineering Canteen",
    category: "Meals",
    tags: ["High Protein", "Veg"],
    calories: 420,
    protein: "24g"
  },
  {
    id: "med-zest-platter",
    name: "Mediterranean Zest Platter",
    description: "A balanced mix of plant-based proteins, heart-healthy fats, and complex carbs. Perfect for long study sessions.",
    price: 14.00,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3sr0-j_HKi064YJ4O4Z4Ihv27S8-OhFiyWNo2G84PgJK3QPSoMLFahOATKMfO3kvWcD8zgkSCF_AF-Jgm-M5z3S0oWq96vuJXn1BboLqaMBgnxImB5QqXzkVrsnJtjAXhOxvAY9xZVboO_hbWyttJ-NvHw0rNX6p2dmVBy3ehdxHRWcP5SiwuKnmXxWbfCbkM9rufDnUbf3Qk8GWQENhtipxsgIY_QOa49GxsHN11mbrTId4A7yHSoXg46zqLan85cNUrNGfNNy0",
    rating: 4.9,
    canteen: "Central Canteen",
    category: "Meals",
    tags: ["Chef's Choice", "Daily Special"],
    calories: 540,
    protein: "24g"
  },
  {
    id: "salmon-rolls",
    name: "Salmon Zen Rolls",
    description: "Fresh Atlantic salmon with avocado, cucumber, and seaweed, served with pickled ginger on a clean dark plate.",
    price: 15.75,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBG7VLh4cSfz5lfNuFUzU8VYuNdsTYlEh-n26MlXt7sjGKCu1-A7l-jTRGeOzWX3VUIc9O9CDrmRy1NzZG-vmi6-e8WumnjMgZgNw4LBZvp-eH8veZTcpnu3nAiHhar1f2OGBBIoKNtraKsaTCpH3R4levnTpPC33gCd7MvMnIGT2ZtaqHkywra7ZEalpf-hmtLVx0QDH1RvIYVqSSk2J0yAqL_2ekKju7t6YzPNldEHZt-gPqHOo9UEgAuvLMKqxMcK_QgWB5SmC4",
    rating: 4.9,
    canteen: "North Canteen",
    category: "Meals",
    tags: ["Low Calorie", "Brain Food"],
    calories: 390,
    protein: "22g"
  },
  {
    id: "berry-omega-bowl",
    name: "Berry Omega Bowl",
    description: "Mixed berries, walnuts, almond granola, strawberries, blueberries, and probiotic Greek yogurt for cognitive support.",
    price: 8.25,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAgZaADdZKf4YAlcSUTYY7bXyoJ-LgB2yJJyTq_HiWK_z-9PyDzXfgU0uOJNRyiZ-kch_wjdItfX43YyEFbKvyVa44NU81Mg9sebcAREpGrAX0un_DCehXT4WCdfj7L54T0-xfZXrs_BqggJ9ishR6IX0aD-tKSon-gbXzmvZBnoiAr7lNW4M0qXATzEH8LbYQoOIIFvt5DL-MEXTAXqnQogAv_lPSdKm2iWYXcFrUeug4NwXgQVK_xQjJNfTb7UN3sKN6kweXYb68",
    rating: 4.7,
    canteen: "Library Cafe",
    category: "Snacks",
    tags: ["Veg", "Low Calorie", "Brain Food"],
    calories: 280,
    protein: "10g"
  },
  {
    id: "oat-latte",
    name: "Oat Latte",
    description: "Creamy espresso latte brewed with organic barista-blend oat milk.",
    price: 4.20,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 4.5,
    canteen: "Central Cafe",
    category: "Drinks",
    tags: ["Vegan", "Veg"],
    calories: 120,
    protein: "2g"
  },
  {
    id: "acai-cup",
    name: "Acai Cup",
    description: "Blended organic acai berry sorbet served with granola and sliced banana.",
    price: 6.50,
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 4.6,
    canteen: "Central Cafe",
    category: "Snacks",
    tags: ["Veg", "Vegan", "Low Calorie"],
    calories: 210,
    protein: "3g"
  },
  {
    id: "croissant",
    name: "Croissant",
    description: "Flaky, buttery French puff pastry, freshly baked.",
    price: 3.00,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 4.4,
    canteen: "Central Cafe",
    category: "Snacks",
    tags: ["Veg"],
    calories: 260,
    protein: "5g"
  },
  {
    id: "kombucha-green",
    name: "Kombucha Green",
    description: "Chilled organic green tea kombucha with probiotic flora.",
    price: 4.90,
    image: "https://images.unsplash.com/photo-1595981267035-7b04ec824f12?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 4.6,
    canteen: "Library Cafe",
    category: "Drinks",
    tags: ["Veg", "Vegan", "Low Calorie"],
    calories: 45,
    protein: "0g"
  }
];

interface DbSchema {
  menuItems: any[];
  orders: any[];
  users: Record<string, any>;
}

function loadDb(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        menuItems: parsed.menuItems || DEFAULT_MENU_ITEMS,
        orders: parsed.orders || [],
        users: parsed.users || {}
      };
    }
  } catch (err) {
    console.error("Error reading db.json, returning empty defaults:", err);
  }
  return {
    menuItems: DEFAULT_MENU_ITEMS,
    orders: [],
    users: {}
  };
}

function saveDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving to db.json:", err);
  }
}

// Initial seed
const currentDb = loadDb();
saveDb(currentDb);

// API: Check Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!ai });
});

// GET Menu catalog
app.get("/api/menu", (req, res) => {
  const db = loadDb();
  res.json(db.menuItems);
});

// POST Menu item
app.post("/api/menu", (req, res) => {
  const db = loadDb();
  const newItem = {
    id: req.body.id || "custom-" + Date.now(),
    name: req.body.name,
    description: req.body.description || "Gourmet campus nutrition.",
    price: parseFloat(req.body.price),
    image: req.body.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&h=150&q=80",
    rating: req.body.rating || 4.5,
    canteen: req.body.canteen || "Central Canteen",
    category: req.body.category || "Meals",
    tags: req.body.tags || ["Veg"],
    calories: parseInt(req.body.calories) || 350,
    protein: req.body.protein || "12g"
  };
  db.menuItems.push(newItem);
  saveDb(db);
  res.json(newItem);
});

// PUT Menu item
app.put("/api/menu/:id", (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  db.menuItems = db.menuItems.map(m => {
    if (m.id === id) {
      return {
        ...m,
        name: req.body.name !== undefined ? req.body.name : m.name,
        description: req.body.description !== undefined ? req.body.description : m.description,
        price: req.body.price !== undefined ? parseFloat(req.body.price) : m.price,
        image: req.body.image !== undefined ? req.body.image : m.image,
        canteen: req.body.canteen !== undefined ? req.body.canteen : m.canteen,
        category: req.body.category !== undefined ? req.body.category : m.category,
        tags: req.body.tags !== undefined ? req.body.tags : m.tags,
        calories: req.body.calories !== undefined ? parseInt(req.body.calories) : m.calories,
        protein: req.body.protein !== undefined ? req.body.protein : m.protein,
      };
    }
    return m;
  });
  saveDb(db);
  const updated = db.menuItems.find(m => m.id === id);
  res.json(updated || { error: "Not found" });
});

// DELETE Menu item
app.delete("/api/menu/:id", (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  db.menuItems = db.menuItems.filter(m => m.id !== id);
  saveDb(db);
  res.json({ success: true });
});

// GET All orders
app.get("/api/orders", (req, res) => {
  const db = loadDb();
  res.json(db.orders);
});

// POST Place Order
app.post("/api/orders", (req, res) => {
  const db = loadDb();
  const { items, subtotal, total, canteen, pickupPoint, email, token } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required to checkout." });
  }

  const user = db.users[email];
  if (user) {
    if (user.balance < total) {
      return res.status(400).json({ error: "Insufficient account balance." });
    }
    user.balance -= total;
  }

  const tokenNum = token || Math.floor(Math.random() * 800) + 100;
  const newOrder = {
    id: `ord-${tokenNum}-${Date.now().toString().slice(-4)}`,
    token: tokenNum.toString(),
    items: items,
    subtotal: parseFloat(subtotal),
    total: parseFloat(total),
    status: "Received",
    statusText: "Chefs are reviewing your selection.",
    estWait: 12,
    queuePosition: 5,
    canteen: canteen || "Central Canteen",
    pickupPoint: "Main Counter",
    walkTime: 0,
    aiSuggestion: {
      text: "Booking processed perfectly! Please proceed directly to the selected canteen counter for in-person handoff once your order is marked Ready."
    }
  };

  db.orders.push(newOrder);
  saveDb(db);

  res.json({ order: newOrder, balance: user ? user.balance : 0 });
});

// PATCH Order Status (Admin set status)
app.patch("/api/orders/:id/status", (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  const { status, statusText, estWait } = req.body;

  let updatedOrder = null;
  db.orders = db.orders.map(o => {
    if (o.id === id) {
      updatedOrder = {
        ...o,
        status: status !== undefined ? status : o.status,
        statusText: statusText !== undefined ? statusText : o.statusText,
        estWait: estWait !== undefined ? parseInt(estWait) : o.estWait,
        queuePosition: status === "Ready" || status === "Completed" ? 0 : Math.max(0, o.queuePosition - 1)
      };
      return updatedOrder;
    }
    return o;
  });

  saveDb(db);
  res.json(updatedOrder || { error: "Order not found" });
});

// POST Student login/auth
app.post("/api/auth/student-login", (req, res) => {
  const db = loadDb();
  const { name, email, avatar, studentId } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email target is required." });
  }

  if (!db.users[email]) {
    // New registration
    db.users[email] = {
      name: name || email.split("@")[0],
      email: email,
      avatar: avatar !== undefined ? avatar : "",
      role: "student",
      studentId: studentId || "STUDENT-" + Math.floor(100000 + Math.random() * 900000),
      balance: 100.00,
      preferences: ["Vegan", "High Protein"]
    };
  } else {
    // Update basic meta on login
    if (name) db.users[email].name = name;
    if (avatar !== undefined) db.users[email].avatar = avatar;
  }

  saveDb(db);
  res.json(db.users[email]);
});

// POST Admin login/auth
app.post("/api/auth/admin-login", (req, res) => {
  const db = loadDb();
  const { email, password } = req.body;

  if (email === "admin@campus.edu" && password === "admin2026") {
    const adminUser = {
      name: "Security Admin",
      email: "admin@campus.edu",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
      role: "admin",
      studentId: "ADMIN-CH-2026",
      balance: 9999.00,
      preferences: ["Central System", "Staff Access"]
    };
    db.users[email] = adminUser;
    saveDb(db);
    res.json(adminUser);
  } else {
    res.status(401).json({ error: "Unauthorized credentials. Unique Admin email must be admin@campus.edu and Password admin2026." });
  }
});

// GET User profile
app.get("/api/users/profile", (req, res) => {
  const db = loadDb();
  const email = req.query.email as string;
  if (email && db.users[email]) {
    res.json(db.users[email]);
  } else {
    res.status(404).json({ error: "User profile not found." });
  }
});

// POST Wallet Top Up
app.post("/api/users/topup", (req, res) => {
  const db = loadDb();
  const { email, amount } = req.body;

  if (!email || !db.users[email]) {
    return res.status(404).json({ error: "User target not found." });
  }

  const amtValue = parseFloat(amount);
  if (isNaN(amtValue) || amtValue <= 0) {
    return res.status(400).json({ error: "Please enter a valid loading amount." });
  }

  db.users[email].balance = (db.users[email].balance || 0) + amtValue;
  saveDb(db);

  res.json(db.users[email]);
});

// POST Profile Update
app.post("/api/users/profile/update", (req, res) => {
  const db = loadDb();
  const { email, name, avatar } = req.body;

  if (!email || !db.users[email]) {
    return res.status(404).json({ error: "User target not found." });
  }

  if (name !== undefined) db.users[email].name = name;
  if (avatar !== undefined) db.users[email].avatar = avatar;

  saveDb(db);
  res.json(db.users[email]);
});

// API: Conversation Assistant (Using live dynamic menu items inside the prompt context!)
app.post("/api/chat", async (req, res) => {
  const { messages, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No query message provided." });
  }

  // Load latest custom menu catalog from memory to build live custom RAG instructions
  const db = loadDb();
  const liveMenuText = db.menuItems.map((item, idx) => {
    return `${idx + 1}. **${item.name}** ($${item.price.toFixed(2)}, ${item.calories || 0} kcal, ${item.protein || "N/A"}) at ${item.canteen || "Central Canteen"}. Features: ${(item.tags || []).join(", ")}. Description: ${item.description || ""}`;
  }).join("\n");

  const SYSTEM_INSTRUCTION = `You are "Quick Canteen Assistant", a highly specialized smart campus dining concierge.
You guide university students to make the healthiest, most intelligent meal choices across the various campus canteens.

We have the following LIVE, customizable campus menu items configure in our backend system:
${liveMenuText}

Rule constraints:
- Speak in a friendly, helpful, highly intelligent, and scannable student-advisor tone. Use bold highlights for menu item names. E.g., **Quinoa Power Bowl**.
- Remind students that they go directly in-person to the respective canteen/restaurant branch counter to collect their cooked food. There are no delivery/agent options.
- Keep responses concise - students are in a hurry on campus!
- Answer queries about canteens, health ratings, specific dietary needs (Vegan, Vegetarian, Halal, Gluten-Free, High Protein, Low Calorie, Brain Food).
- Respond to order collection questions by clarifying they must bring their matching digital ticket/token number to the direct counter.
`;

  // Fallback mode if API key is not present
  if (!ai) {
    let simulatedReply = "";
    const lower = message.toLowerCase();
    
    if (lower.includes("healthy") || lower.includes("healthiest") || lower.includes("lunch")) {
      const topHealthy = db.menuItems.find(m => m.tags.includes("High Protein") || m.tags.includes("Low Calorie")) || db.menuItems[0];
      simulatedReply = `Based on today's live menu, the **${topHealthy.name}** is your best bet! It contains ${topHealthy.calories} calories, ${topHealthy.protein} of protein, and is formulated with complex carbs from **${topHealthy.canteen}**, keeping you energized for university lectures.`;
    } else if (lower.includes("where") || lower.includes("coffee") || lower.includes("order") || lower.includes("delivery")) {
      simulatedReply = "Your ordered selection is prepared inside the canteen kitchen. Please proceed directly to the restaurant counter to buy or pick up your food in-person.";
    } else {
      simulatedReply = `I am happy to assist you in making healthy campus choices! We have fantastic live options like the **Mediterranean Harvest Bowl** and **Quinoa Power Bowl** at our various campus cafes. What are your health or protein goals today?`;
    }

    return res.json({
      text: simulatedReply,
      type: "smart_recommendation",
      tags: ["Veg", "High-Protein"]
    });
  }

  try {
    // Format conversation history for Gemini SDK
    const historyPrompt = messages && messages.length > 0
      ? messages.map((m: any) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n") + `\nUser: ${message}`
      : message;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: historyPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I apologize, but I am unable to generate a recommendations draft. Please try asking again.";
    
    // Determine the return message visualization type
    let replyType: "text" | "smart_recommendation" | "live_tracking" = "text";
    if (replyText.toLowerCase().includes("recommend") || replyText.toLowerCase().includes("bowl") || replyText.toLowerCase().includes("choice")) {
      replyType = "smart_recommendation";
    }
    if (replyText.toLowerCase().includes("bot") || replyText.toLowerCase().includes("order") || replyText.toLowerCase().includes("arrive") || replyText.toLowerCase().includes("track")) {
      replyType = "live_tracking";
    }

    return res.json({
      text: replyText,
      type: replyType,
      tags: replyText.toLowerCase().includes("vegan") ? ["Vegan"] : replyText.toLowerCase().includes("vegetarian") || replyText.toLowerCase().includes("veg") ? ["Veg"] : ["Healthy"]
    });
  } catch (error: any) {
    console.error("Gemini assistant error:", error);
    return res.status(500).json({ error: "Gemini server error: " + error.message });
  }
});

// API: Smart Meal Optimizer (JSON response schema)
app.post("/api/optimize-meal", async (req, res) => {
  const { dietaryPreferences, goalPreferences } = req.body;

  const diets = dietaryPreferences || [];
  const goals = goalPreferences || [];

  const db = loadDb();

  if (diets.length === 0 && goals.length === 0) {
    return res.json({
      title: "Active Balance Plate",
      explanation: "Please select any dietary preference or goal from the smart filters side panel (e.g., Vegan, Low Calorie) to let our campus AI craft your custom nutrient breakdown!",
      recommendedItems: ["med-harvest-bowl"],
      nutrientsSummary: {
        calories: 410,
        protein: "18g",
        benefits: "Rich in multi-vitamins and unsaturated healthy fats."
      }
    });
  }

  // Find candidate matches dynamically from DB menu items
  const candidates = db.menuItems.map(m => m.id);

  const promptText = `
Given these student preferences:
- Dietary constraints/preferences chosen: ${diets.join(", ") || "None specified"}
- Health and focus goals chosen: ${goals.join(", ") || "None specified"}

Compare against actual current menu database and select 1 or 2 best matching items (choose from available ids: ${JSON.stringify(candidates)}).
Suggest an optimal explanation of why this combo meets their goal in 1-2 powerful sentences. Count up the approximate sum of calories and sum of protein for the selected combinations.
`;

  if (!ai) {
    // Elegant fallback simulation using DB items
    const recommendedSet = [];
    let sumCalories = 0;
    let sumProtein = "";
    let reason = "";

    if (goals.includes("High Protein") || goals.includes("Goal: High Protein")) {
      const match = db.menuItems.find(m => m.tags.includes("High Protein")) || db.menuItems[0];
      recommendedSet.push(match.id);
      sumCalories += match.calories || 400;
      sumProtein = match.protein || "20g";
      reason = `We selected the high-protein **${match.name}** to power up your active recovery profile and cognitive cellular repair.`;
    } else if (goals.includes("Low Calorie")) {
      const match = db.menuItems.find(m => m.tags.includes("Low Calorie")) || db.menuItems[0];
      recommendedSet.push(match.id);
      sumCalories += match.calories || 300;
      sumProtein = match.protein || "15g";
      reason = `Tuned with **${match.name}** as it provides clean vitamins inside a lean calorie envelope.`;
    } else if (goals.includes("Brain Food")) {
      const match = db.menuItems.find(m => m.tags.includes("Brain Food")) || db.menuItems[0];
      recommendedSet.push(match.id);
      sumCalories += match.calories || 280;
      sumProtein = match.protein || "10g";
      reason = `Selected the **${match.name}** featuring clean natural elements clinically optimized for sustaining focus.`;
    } else {
      const match = db.menuItems[0];
      recommendedSet.push(match.id);
      sumCalories += match.calories || 410;
      sumProtein = match.protein || "18g";
      reason = `Selected the **${match.name}** for its standard balanced slow-burning energy profile.`;
    }

    return res.json({
      title: "Smart Filter Optimized Plate",
      explanation: reason,
      recommendedItems: recommendedSet,
      nutrientsSummary: {
        calories: sumCalories,
        protein: sumProtein,
        benefits: "Frictionless AI optimization tuned for student performance schedules."
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: `You are a strict nutritionist agent. Output your response exactly matching the requested JSON structure. Select items ONLY from this list: ${JSON.stringify(candidates)}.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A motivating plan title, e.g. 'Ultimate Cognitive Stack' or 'Vegan Calorie Deficit Plan'" },
            explanation: { type: Type.STRING, description: "1-2 sentence powerful explanation of the selected pairing, e.g. combining x and y" },
            recommendedItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of recommended meal helper ids from the candidate list"
            },
            nutrientsSummary: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.INTEGER, description: "Sum of general calories" },
                protein: { type: Type.STRING, description: "Summary of combined protein weight description, e.g. 34g" },
                benefits: { type: Type.STRING, description: "Brief bullet benefits" }
              },
              required: ["calories", "protein", "benefits"]
            }
          },
          required: ["title", "explanation", "recommendedItems", "nutrientsSummary"]
        }
      }
    });

    const outputData = JSON.parse(response.text || "{}");
    return res.json(outputData);
  } catch (error: any) {
    console.error("Meal optimization agent error:", error);
    return res.status(500).json({ error: "Fails on optimizing meal: " + error.message });
  }
});

// Vite & Static file handler setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Utilize Vite's middle-tier handler
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve Vite build assets
    app.use(express.static(distPath));
    
    // Serve fallback index.html for Single Page Applications (SPA)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Quick Canteen application listening successfully: http://localhost:${PORT}`);
  });
}

startServer();


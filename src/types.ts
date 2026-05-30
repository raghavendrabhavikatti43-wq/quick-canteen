export interface MealItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  rating?: number;
  canteen: string;
  category: "Breakfast" | "Meals" | "Drinks" | "Snacks" | "All";
  tags: string[]; // e.g., "Veg", "Halal", "Vegan", "High Protein", "Low Calorie", "Brain Food", "Chef's Choice", "Best Seller"
  calories?: number;
  protein?: string;
}

export interface CartItem {
  meal: MealItem;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  type?: "text" | "smart_recommendation" | "live_tracking";
  tags?: string[]; // e.g., "Vegan", "Gluten-Free"
  image?: string; // used for map or bot delivery image
  isThinking?: boolean;
}

export interface Order {
  id: string;
  token: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  status: "Received" | "Preparing" | "Ready" | "Completed";
  statusText: string;
  estWait: number; // minutes
  queuePosition: number;
  canteen: string;
  pickupPoint: string;
  walkTime: number; // minutes
  botId?: string;
  botMapImage?: string;
  aiSuggestion?: {
    text: string;
    routeImage?: string;
  };
}

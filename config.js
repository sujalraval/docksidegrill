/* ==========================================================================
   Dockside Grill - Database Configuration & Manager (Dual Mode)
   ========================================================================== */

// 1. Enter your Supabase credentials here to connect to cloud hosting:
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL"; // Example: "https://xyz.supabase.co"
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";     // Your public anon key

// 2. Default data seeds for LocalStorage fallback
const DEFAULT_MENU_ITEMS = [
  {
    id: "m1",
    title: "Smoked Grouper Dip",
    description: "An epic, creamy smoked local grouper dip seasoned with fresh herbs and citrus, served with crispy house-made plantain chips.",
    price: 16,
    category: "starters",
    tags: ["Gluten-Free Option", "Popular"],
    image_url: "./unnamed-2.jpg"
  },
  {
    id: "m2",
    title: "Classic Conch Chowder",
    description: "Rich, mildly spicy traditional tomato-based broth packed with tender Bahamian conch, root vegetables, and aromatic spices.",
    price: 12,
    category: "starters",
    tags: ["Spicy", "Local Recipe"],
    image_url: "./unnamed-3.jpg"
  },
  {
    id: "m3",
    title: "Seafood Fettuccine",
    description: "Al dente fettuccine tossed in a rich, velvety garlic white wine cream sauce, loaded with fresh conch and sweet shrimp.",
    price: 34,
    category: "seafood",
    tags: ["Guest Favorite", "Best Seller"],
    image_url: "./unnamed-4.jpg"
  },
  {
    id: "m4",
    title: "12-Spice Curry Ribs",
    description: "Fall-off-the-bone baby back ribs seasoned with our secret 12-spice dry rub, slow-smoked and glazed with a sweet coconut curry BBQ sauce.",
    price: 28,
    category: "mains",
    tags: ["Chef Recommended", "Signature"],
    image_url: "./unnamed.jpg"
  },
  {
    id: "m5",
    title: "Grouper Grilled Cheese",
    description: "Flaky, grilled local grouper fillet layered with melted Swiss cheese, caramelized onions, and remoulade sauce on toasted brioche.",
    price: 19,
    category: "seafood",
    tags: ["Seafood Lunch", "Specialty"],
    image_url: "./unnamed-1.jpg"
  },
  {
    id: "m6",
    title: "Your Catch, Cooked",
    description: "Bring in the fish you caught today! Our kitchen will clean and cook it anyway you like (grilled, blackened, or fried) paired with family-style sides.",
    price: 22,
    category: "seafood",
    tags: ["Custom", "Fresh"],
    image_url: "./unnamed-2.jpg"
  }
];

const DEFAULT_REVIEWS = [
  {
    id: "r1",
    author_name: "David Dingler",
    author_initials: "DD",
    rating: 5,
    review_text: "We were here a week and dined here almost every night. Everything was fantastic! The grouper dip, seafood fettuccine, the 12 spice ribs... All of it is fabulous! Recommend everything on the menu. Also, the people are fabulous as well.",
    approved: true
  },
  {
    id: "r2",
    author_name: "Anna Ha",
    author_initials: "AH",
    rating: 5,
    review_text: "Got the seafood fettuccine and grouper grilled cheese and they were both delicious. Another night the kitchen cooked a variety of fish we caught and we paired it with family-style sides.",
    approved: true
  },
  {
    id: "r3",
    author_name: "Check a Resto",
    author_initials: "CR",
    rating: 5,
    review_text: "Best conch chowder and seafood fettuccine ever. Service was friendly and impeccable, many thanks to Nelson who waited a table of 10 to perfection.",
    approved: true
  },
  {
    id: "r4",
    author_name: "Dan Kunz",
    author_initials: "DK",
    rating: 5,
    review_text: "Conch chowder. Curry Ribs!!!!! I don't even know what to say but more please! If you don't eat here and you don't visit you are missing an iconic Bahamian experience.",
    approved: true
  }
];

// Initialize local storage database structure if empty
if (!localStorage.getItem('dg_menu_items')) {
  localStorage.setItem('dg_menu_items', JSON.stringify(DEFAULT_MENU_ITEMS));
}
if (!localStorage.getItem('dg_reviews')) {
  localStorage.setItem('dg_reviews', JSON.stringify(DEFAULT_REVIEWS));
}
if (!localStorage.getItem('dg_reservations')) {
  localStorage.setItem('dg_reservations', JSON.stringify([]));
}

// 3. Database Manager Wrapper
class Database {
  constructor() {
    this.isCloud = false;
    this.client = null;

    // Check if Supabase client library is loaded and keys are customized
    if (typeof supabase !== 'undefined' && 
        SUPABASE_URL !== "YOUR_SUPABASE_PROJECT_URL" && 
        SUPABASE_KEY !== "YOUR_SUPABASE_ANON_KEY") {
      try {
        this.client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        this.isCloud = true;
        console.log("Database Mode: Cloud (Supabase Connected)");
      } catch (e) {
        console.warn("Supabase init failed, falling back to LocalStorage:", e);
      }
    } else {
      console.log("Database Mode: Demo Local (LocalStorage)");
    }
  }

  // --- Menu CRUD ---
  async getMenuItems() {
    if (this.isCloud) {
      const { data, error } = await this.client
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      return JSON.parse(localStorage.getItem('dg_menu_items'));
    }
  }

  async saveMenuItem(item) {
    if (this.isCloud) {
      if (item.id && !item.id.startsWith('m')) {
        // Update
        const { data, error } = await this.client
          .from('menu_items')
          .update(item)
          .eq('id', item.id)
          .select();
        if (error) throw error;
        return data[0];
      } else {
        // Insert (omit local string id)
        const newItem = { ...item };
        delete newItem.id;
        const { data, error } = await this.client
          .from('menu_items')
          .insert([newItem])
          .select();
        if (error) throw error;
        return data[0];
      }
    } else {
      const items = JSON.parse(localStorage.getItem('dg_menu_items'));
      if (item.id && item.id.startsWith('m') && items.some(i => i.id === item.id)) {
        // Update local
        const idx = items.findIndex(i => i.id === item.id);
        items[idx] = item;
      } else {
        // Insert local
        item.id = 'm_' + Date.now();
        items.unshift(item);
      }
      localStorage.setItem('dg_menu_items', JSON.stringify(items));
      return item;
    }
  }

  async deleteMenuItem(id) {
    if (this.isCloud) {
      const { error } = await this.client
        .from('menu_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      let items = JSON.parse(localStorage.getItem('dg_menu_items'));
      items = items.filter(i => i.id !== id);
      localStorage.setItem('dg_menu_items', JSON.stringify(items));
    }
    return true;
  }

  // --- Reviews CRUD ---
  async getReviews(onlyApproved = true) {
    if (this.isCloud) {
      let query = this.client.from('reviews').select('*').order('created_at', { ascending: false });
      if (onlyApproved) {
        query = query.eq('approved', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } else {
      const allReviews = JSON.parse(localStorage.getItem('dg_reviews'));
      return onlyApproved ? allReviews.filter(r => r.approved) : allReviews;
    }
  }

  async addReview(review) {
    if (this.isCloud) {
      const { data, error } = await this.client
        .from('reviews')
        .insert([{ ...review, approved: false }])
        .select();
      if (error) throw error;
      return data[0];
    } else {
      const reviews = JSON.parse(localStorage.getItem('dg_reviews'));
      review.id = 'r_' + Date.now();
      review.approved = false; // Requires moderation
      reviews.unshift(review);
      localStorage.setItem('dg_reviews', JSON.stringify(reviews));
      return review;
    }
  }

  async approveReview(id) {
    if (this.isCloud) {
      const { error } = await this.client
        .from('reviews')
        .update({ approved: true })
        .eq('id', id);
      if (error) throw error;
    } else {
      const reviews = JSON.parse(localStorage.getItem('dg_reviews'));
      const idx = reviews.findIndex(r => r.id === id);
      if (idx !== -1) {
        reviews[idx].approved = true;
        localStorage.setItem('dg_reviews', JSON.stringify(reviews));
      }
    }
    return true;
  }

  async deleteReview(id) {
    if (this.isCloud) {
      const { error } = await this.client
        .from('reviews')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      let reviews = JSON.parse(localStorage.getItem('dg_reviews'));
      reviews = reviews.filter(r => r.id !== id);
      localStorage.setItem('dg_reviews', JSON.stringify(reviews));
    }
    return true;
  }

  // --- Reservations CRUD ---
  async getReservations() {
    if (this.isCloud) {
      const { data, error } = await this.client
        .from('reservations')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (error) throw error;
      return data;
    } else {
      return JSON.parse(localStorage.getItem('dg_reservations'));
    }
  }

  async addReservation(res) {
    if (this.isCloud) {
      const { data, error } = await this.client
        .from('reservations')
        .insert([res])
        .select();
      if (error) throw error;
      return data[0];
    } else {
      const reservations = JSON.parse(localStorage.getItem('dg_reservations'));
      res.id = 'res_' + Date.now();
      reservations.unshift(res);
      localStorage.setItem('dg_reservations', JSON.stringify(reservations));
      return res;
    }
  }
}

// Global DB instance
const db = new Database();
window.db = db;

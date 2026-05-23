// API Configuration
// Local frontend runs on port 5000 and talks to the Express API on 3001.
// Production can override this by setting window.KLGC_API_BASE before app.js.
const API_BASE =
  window.KLGC_API_BASE ||
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : 'https://klg-qxsg.onrender.com');

// Store token in sessionStorage
export const apiStore = {
  get token() {
    return sessionStorage.getItem('iam-token');
  },
  set token(value) {
    if (value) {
      sessionStorage.setItem('iam-token', value);
    } else {
      sessionStorage.removeItem('iam-token');
    }
  },
  get user() {
    return JSON.parse(sessionStorage.getItem('iam-user') || 'null');
  },
  set user(value) {
    if (value) {
      sessionStorage.setItem('iam-user', JSON.stringify(value));
    } else {
      sessionStorage.removeItem('iam-user');
    }
  },
  get adminToken() {
    return sessionStorage.getItem('iam-admin-token');
  },
  set adminToken(value) {
    if (value) {
      sessionStorage.setItem('iam-admin-token', value);
    } else {
      sessionStorage.removeItem('iam-admin-token');
    }
  },
};

function getHeaders(isAdmin = false) {
  const headers = { 'Content-Type': 'application/json' };
  const token = isAdmin ? apiStore.adminToken : apiStore.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function apiCall(endpoint, options = {}, isAdmin = false) {
  const url = `${API_BASE}${endpoint}`;
  const headers = getHeaders(isAdmin);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// AUTH API
export const authAPI = {
  signin: async (name, email, password) => {
    const data = await apiCall('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    apiStore.token = data.token;
    apiStore.user = data.user;
    return data;
  },
  
  getMe: async () => {
    return apiCall('/auth/me', {}, false);
  },
  
  logout: () => {
    apiStore.token = null;
    apiStore.user = null;
  },
};

// PRAYER API
export const prayerAPI = {
  getAll: async () => {
    return apiCall('/prayers', {});
  },
  
  create: async (request) => {
    return apiCall('/prayers', {
      method: 'POST',
      body: JSON.stringify({ request }),
    });
  },
  
  approve: async (id) => {
    return apiCall(`/prayers/${id}/approve`, {
      method: 'POST',
    }, true);
  },
  
  decline: async (id) => {
    return apiCall(`/prayers/${id}`, {
      method: 'DELETE',
    }, true);
  },
};

// CHAT API
export const chatAPI = {
  getAll: async () => {
    return apiCall('/chat', {});
  },
  
  send: async (text) => {
    return apiCall('/chat', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
  
  remove: async (id) => {
    return apiCall(`/chat/${id}`, {
      method: 'DELETE',
    }, true);
  },
};

// NOTES API
export const notesAPI = {
  getAll: async () => {
    return apiCall('/notes', {});
  },
  
  create: async (note) => {
    return apiCall('/notes', {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },
};

// SERMON API
export const sermonAPI = {
  getAll: async () => {
    return apiCall('/sermons', {});
  },
  
  create: async (title, speaker, file = '') => {
    return apiCall('/sermons', {
      method: 'POST',
      body: JSON.stringify({ title, speaker, file }),
    }, true);
  },
};

// DEVOTIONAL API
export const devotionalAPI = {
  getAll: async () => {
    return apiCall('/devotionals', {});
  },
  
  create: async (title, verse, body) => {
    return apiCall('/devotionals', {
      method: 'POST',
      body: JSON.stringify({ title, verse, body }),
    }, true);
  },
};

// EVENT API
export const eventAPI = {
  getAll: async () => {
    return apiCall('/events', {});
  },
  
  create: async (name, date, venue) => {
    return apiCall('/events', {
      method: 'POST',
      body: JSON.stringify({ name, date, venue }),
    }, true);
  },
};

// ADMIN API
export const adminAPI = {
  hasToken: () => Boolean(apiStore.adminToken),

  signin: async (email, passcode, remember = false) => {
    const data = await apiCall('/admin/signin', {
      method: 'POST',
      body: JSON.stringify({ email, passcode, remember }),
    });
    apiStore.adminToken = data.token;
    return data;
  },
  
  getStats: async () => {
    return apiCall('/admin/stats', {}, true);
  },
  
  logout: () => {
    apiStore.adminToken = null;
  },
};

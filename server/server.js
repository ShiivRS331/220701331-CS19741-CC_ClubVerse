require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Import Gemini SDK
const app = express();

// Restrict CORS to the frontend client URL (set CLIENT_URL in env or default to localhost)
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: CLIENT_URL }));
// allow preflight for complex requests
app.options('*', cors({ origin: CLIENT_URL }));
app.use(express.json());

// Secret key for JWT (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database file paths
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ADMINS_FILE = path.join(__dirname, 'data', 'admins.json');
const LIKES_FILE = path.join(__dirname, 'data', 'likes.json');
const SAVES_FILE = path.join(__dirname, 'data', 'saves.json');
const POSTS_FILE = path.join(__dirname, 'data', 'posts.json');
const COMMENTS_FILE = path.join(__dirname, 'data', 'comments.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}


// --- Azure SQL Setup (for future use) ---
// const sql = require('mssql');
// const sqlConfig = {
//   user: process.env.AZURE_SQL_USER,
//   password: process.env.AZURE_SQL_PASSWORD,
//   database: process.env.AZURE_SQL_DATABASE,
//   server: process.env.AZURE_SQL_SERVER,
//   pool: {
//     max: 10,
//     min: 0,
//     idleTimeoutMillis: 30000
//   },
//   options: {
//     encrypt: true, // for Azure
//     trustServerCertificate: false // change to true for local dev / self-signed certs
//   }
// };
// async function getUsersFromAzureSQL() {
//   try {
//     await sql.connect(sqlConfig);
//     const result = await sql.query`SELECT * FROM Users`;
//     return result.recordset;
//   } catch (err) {
//     console.error('Azure SQL error:', err);
//     return [];
//   }
// }
// Example usage in an endpoint:
// app.get('/azure/users', async (req, res) => {
//   const users = await getUsersFromAzureSQL();
//   res.json(users);
// });

// Load data from files (current dummy DB)
let users = [];
let admins = [];
let likes = [];
let saves = [];
let posts = [];
let comments = [];

// Load users from file
if (fs.existsSync(USERS_FILE)) {
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (error) {
    console.log('Error loading users:', error.message);
    users = [];
  }
}

// Load admins from file
if (fs.existsSync(ADMINS_FILE)) {
  try {
    admins = JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8'));
  } catch (error) {
    console.log('Error loading admins:', error.message);
    admins = [];
  }
}

// Load likes from file
if (fs.existsSync(LIKES_FILE)) {
  try {
    likes = JSON.parse(fs.readFileSync(LIKES_FILE, 'utf8'));
  } catch (error) {
    console.log('Error loading likes:', error.message);
    likes = [];
  }
}

// Load saves from file
if (fs.existsSync(SAVES_FILE)) {
  try {
    saves = JSON.parse(fs.readFileSync(SAVES_FILE, 'utf8'));
  } catch (error) {
    console.log('Error loading saves:', error.message);
    saves = [];
  }
}

// Load posts from file
if (fs.existsSync(POSTS_FILE)) {
  try {
    posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  } catch (error) {
    console.log('Error loading posts:', error.message);
    posts = [];
  }
}

// Load comments from file
if (fs.existsSync(COMMENTS_FILE)) {
  try {
    comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
  } catch (error) {
    console.log('Error loading comments:', error.message);
    comments = [];
  }
}

// Save data to files
const saveUsers = () => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const saveAdmins = () => {
  fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2));
};

const saveLikes = () => {
  fs.writeFileSync(LIKES_FILE, JSON.stringify(likes, null, 2));
};

const saveSaves = () => {
  fs.writeFileSync(SAVES_FILE, JSON.stringify(saves, null, 2));
};

const savePosts = () => {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
};

const saveComments = () => {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
};

// Security key for admin creation (use environment variable in production)
const ADMIN_SECURITY_KEY = process.env.ADMIN_SECURITY_KEY || 'admin-secret-key-2024';
if (!process.env.ADMIN_SECURITY_KEY) {
  console.warn('Warning: ADMIN_SECURITY_KEY not set. Using default insecure key. Set ADMIN_SECURITY_KEY in environment for production.');
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ auth: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ auth: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// User Registration endpoint (only for regular users)
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ auth: false, error: 'All fields are required.' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ auth: false, error: 'User already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date()
    };

    users.push(newUser);
    saveUsers(); // Save to file

    // Return user data (without password) - no token for registration
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      auth: true,
      user: userWithoutPassword,
      message: 'User registered successfully'
    });
  } catch (error) {
    res.status(500).json({ auth: false, error: 'Server error during registration' });
  }
});

// Private Admin Creation endpoint (requires security key)
app.post('/super/createAdmin', async (req, res) => {
  try {
    const { name, email, password, clubName, securityKey } = req.body;

    if (!name || !email || !password || !clubName || !securityKey) {
      return res.status(400).json({ auth: false, error: 'All fields are required.' });
    }

    // Verify security key
    if (securityKey !== ADMIN_SECURITY_KEY) {
      return res.status(403).json({ auth: false, error: 'Invalid security key.' });
    }

    // Check if admin already exists
    const existingAdmin = admins.find(a => a.email === email);
    if (existingAdmin) {
      return res.status(400).json({ auth: false, error: 'Admin already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      clubName,
      createdAt: new Date()
    };

    admins.push(newAdmin);
    saveAdmins(); // Save to file

    // Generate token
    const token = generateToken(newAdmin);

    // Return admin data (without password)
    const { password: _, ...adminWithoutPassword } = newAdmin;

    res.status(201).json({
      auth: true,
      user: adminWithoutPassword,
      token,
      message: 'Admin created successfully'
    });
  } catch (error) {
    res.status(500).json({ auth: false, error: 'Server error during admin creation' });
  }
});

// Login endpoint (handles both users and admins)
app.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role });
    console.log('Current users:', users.length);
    console.log('Current admins:', admins.length);

    if (!email || !password || !role) {
      return res.status(400).json({ auth: false, error: 'All fields are required.' });
    }

    let user = null;

    // Find user based on role
    if (role === 'user') {
      user = users.find(u => u.email === email);
    } else if (role === 'admin') {
      user = admins.find(a => a.email === email);
    } else {
      return res.status(400).json({ auth: false, error: 'Invalid role specified.' });
    }

    if (!user) {
      return res.status(401).json({ auth: false, error: 'Invalid credentials.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ auth: false, error: 'Invalid credentials.' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      auth: true,
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    res.status(500).json({ auth: false, error: 'Server error during login' });
  }
});

// Protected route to get user profile
app.get('/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Get user details for likes and saves
app.get('/user/getUserDetails/like/save', authenticateToken, (req, res) => {
  const { userID } = req.query;

  if (req.user.id !== userID) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const likedPostIds = likes.filter(l => l.userID === userID).map(l => l.postID);
  const savedPostIds = saves.filter(s => s.userID === userID).map(s => s.postID);

  res.json({ likedPostIds, savedPostIds });
});

// Get club posts for users
app.get('/user/clubPosts', authenticateToken, (req, res) => {
  res.json(posts);
});

// Get single club post by ID
app.get('/user/clubPosts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const post = posts.find(p => p._id === id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// Get a single admin post by ID (admin only)
app.get('/admin/clubPost/:postId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  const { postId } = req.params;
  const post = posts.find(p => p._id === postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// Update an admin post by ID (admin only)
app.put('/admin/update/:postId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  const { postId } = req.params;
  const { title, description, coordinators, image } = req.body;
  const idx = posts.findIndex(p => p._id === postId);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  const updated = {
    ...posts[idx],
    title: title ?? posts[idx].title,
    description: description ?? posts[idx].description,
    coordinators: Array.isArray(coordinators) ? coordinators : posts[idx].coordinators,
    image: image !== undefined ? image : posts[idx].image,
    updatedAt: new Date().toISOString()
  };
  posts[idx] = updated;
  savePosts();
  res.json(updated);
});

// Create a club post (admin only)
app.post('/admin/addClubPost', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  const { adminID, clubName, title, description, coordinators, image } = req.body;
  if (!adminID || !clubName || !title || !description || !Array.isArray(coordinators)) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const newPost = {
    _id: Date.now().toString(),
    adminID,
    clubName,
    title,
    description,
    coordinators,
    image: image || null,
    createdAt: new Date().toISOString()
  };

  posts.unshift(newPost);
  savePosts();
  res.status(201).json({ message: 'Post created successfully', post: newPost });
});

// List clubs (derived from admins.json)
app.get('/user/clubs', authenticateToken, (req, res) => {
  const clubs = admins.map(a => ({
    id: a.id,
    clubName: a.clubName,
    admin: a.name,
    email: a.email
  }));
  res.json(clubs);
});

// Like/Unlike a post
app.post('/user/userLike', authenticateToken, (req, res) => {
  const { userID, postID, clubName, title } = req.body;

  if (req.user.id !== userID) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const key = `${userID}:${postID}`;
  const existingIndex = likes.findIndex(l => l.key === key);

  if (existingIndex !== -1) {
    likes.splice(existingIndex, 1);
    saveLikes();
    return res.json({ success: true, message: 'Post unliked', postID, userID });
  }

  const likeEntry = { key, userID, postID, clubName, title, likedAt: new Date().toISOString() };
  likes.push(likeEntry);
  saveLikes();
  res.json({ success: true, message: 'Post liked', postID, userID });
});

// Save/Unsave a post
app.post('/user/saveUserPost', authenticateToken, (req, res) => {
  const { userID, postID, clubName, title } = req.body;

  if (req.user.id !== userID) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const key = `${userID}:${postID}`;
  const existingIndex = saves.findIndex(s => s.key === key);

  if (existingIndex !== -1) {
    saves.splice(existingIndex, 1);
    saveSaves();
    return res.json({ success: true, message: 'Post unsaved', postID, userID });
  }

  const saveEntry = { key, userID, postID, clubName, title, savedAt: new Date().toISOString() };
  saves.push(saveEntry);
  saveSaves();
  res.json({ success: true, message: 'Post saved', postID, userID });
});

// Get comments for a post
app.get('/user/comment/getComments/:postId', authenticateToken, (req, res) => {
  const { postId } = req.params;

  // Get comments for this specific post
  const postComments = comments
    .filter(comment => comment.postId === postId)
    .map(comment => ({
      _id: comment.commentId,
      userId: comment.userId,
      name: comment.userName,
      comment: comment.comment,
      date: comment.createdAt
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

  res.json(postComments);
});

// Add comment to a post
app.post('/user/comment/addComment/:postId', authenticateToken, (req, res) => {
  const { postId } = req.params;
  const { userId, name, comment } = req.body;

  if (!userId || !name || !comment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Create new comment
  const newComment = {
    commentId: Date.now().toString(),
    postId,
    userId,
    userName: name,
    comment,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  saveComments();

  res.json({
    success: true,
    message: 'Comment added successfully',
    comment: {
      _id: newComment.commentId,
      userId: newComment.userId,
      name: newComment.userName,
      comment: newComment.comment,
      date: newComment.createdAt
    }
  });
});

// Delete comment
app.delete('/user/comment/deleteComment/:commentId', authenticateToken, (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const commentIndex = comments.findIndex(comment =>
    comment.commentId === commentId && comment.userId === userId
  );

  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comment not found or access denied' });
  }

  comments.splice(commentIndex, 1);
  saveComments();

  res.json({ success: true, message: 'Comment deleted successfully' });
});

// Initialize Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
if (!GEMINI_API_KEY) {
  console.error('Gemini API key not set! Set GEMINI_API_KEY as an environment variable.');
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// FIX 1: Use a current model name like 'gemini-2.5-flash'
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// AI Summarization endpoint (using Gemini)
app.post('/user/summarize-post', authenticateToken, async (req, res) => {
  const { postTitle, postDescription, coordinators } = req.body;

  if (!postTitle || !postDescription) {
    return res.status(400).json({ error: 'Post title and description are required' });
  }

  const prompt = `Please provide a concise summary of this club post:

Title: ${postTitle}
Description: ${postDescription}
Coordinators: ${Array.isArray(coordinators) ? coordinators.join(', ') : coordinators}

Please summarize the key points, main activities, and important details in 2-3 sentences.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    res.json({
      success: true,
      summary: summary
    });
  } catch (error) {
    console.error('Gemini API Error (Summarization):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate summary. Please try again later.',
      details: error.message
    });
  }
});

// AI Chat endpoint (using Gemini)
app.post('/user/ai-chat', authenticateToken, async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  console.log("Received chat message:", message);
  console.log("Conversation history:", conversationHistory);

  const systemInstructionText = 'You are a helpful AI assistant for ClubVerse, a platform for college clubs and organizations. Help users with questions about clubs, events, and general information. Keep responses concise and helpful.';

  // ✅ Formatter to convert Markdown to HTML
  function formatToHTML(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
      .replace(/\*\s*/g, '<br>• ')                      // bullets
      .replace(/-\s*(\w+ Club:)/g, '<br><br><strong>$1</strong>') // section headers
      .replace(/\n{2,}/g, '<br><br>')                   // spacing
      .replace(/\n/g, '<br>')                           // single line breaks
      .trim();
  }

  try {
    const cleanedHistory = conversationHistory
      .filter(entry => entry.role === 'user' || entry.role === 'assistant')
      .map(entry => ({
        role: entry.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: entry.content }]
      }));

    if (cleanedHistory.length > 0 && cleanedHistory[0].role !== 'user') {
      console.log('⚠️ History started with assistant; removing it to comply with Gemini');
      cleanedHistory.shift();
    }

    const chatSession = await model.startChat({
      history: cleanedHistory,
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    const rawResponse = response.text();
    const formattedResponse = formatToHTML(rawResponse);

    console.log("AI response:", formattedResponse);

    res.json({
      success: true,
      response: formattedResponse
    });
  } catch (error) {
    console.error('Gemini Chat API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI response. Please try again later.',
      details: error.message
    });
  }
});


// Join club form submission
app.post('/user/joinClub', authenticateToken, (req, res) => {
  const { clubName, reason, contactInfo } = req.body;

  // Mock response for now
  res.json({
    success: true,
    message: 'Join request submitted successfully',
    clubName,
    reason,
    contactInfo
  });
});

// Get liked posts for a user
app.get('/user/posts/like/:userID', authenticateToken, (req, res) => {
  const { userID } = req.params;

  if (req.user.id !== userID) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const userLikes = likes
    .filter(l => l.userID === userID)
    .map(l => ({ postID: l.postID, clubName: l.clubName, title: l.title, likedAt: l.likedAt }));

  res.json(userLikes);
});

// Get saved posts for a user
app.get('/user/posts/save/:userID', authenticateToken, (req, res) => {
  const { userID } = req.params;

  if (req.user.id !== userID) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const userSaves = saves
    .filter(s => s.userID === userID)
    .map(s => ({ postID: s.postID, clubName: s.clubName, title: s.title, savedAt: s.savedAt }));

  res.json(userSaves);
});

// GET all posts for an admin (protected route)
app.get('/admin/get/adminPosts/:adminID', authenticateToken, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  const { adminID } = req.params;
  // Filter posts by adminID
  const adminPosts = posts.filter(post => post.adminID === adminID);
  res.json({ posts: adminPosts });
});

// DELETE a club post (protected route)
app.delete('/admin/delete/clubPosts/:postId', authenticateToken, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  const { postId } = req.params;
  const initialLength = posts.length;
  const nextPosts = posts.filter(post => post._id !== postId);
  if (nextPosts.length < initialLength) {
    posts = nextPosts;
    savePosts();
    res.json({ message: "Post deleted successfully." });
  } else {
    res.status(404).json({ error: "Post not found." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
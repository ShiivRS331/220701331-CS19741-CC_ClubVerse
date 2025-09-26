const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory user store (for demo only)
const users = [];

// Registration endpoint
app.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.json({ auth: false, error: 'All fields are required.' });
  }
  if (users.find(u => u.email === email)) {
    return res.json({ auth: false, error: 'User already exists.' });
  }
  const user = { name, email, password, role };
  users.push(user);
  const token = 'fake-jwt-token';
  res.json({ auth: true, user, auth: token });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = users.find(u => u.email === email && u.password === password && u.role === role);
  if (!user) {
    return res.json({ auth: false, error: 'Invalid credentials.' });
  }
  const token = 'fake-jwt-token';
  res.json({ auth: true, user, auth: token });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// In-memory posts store (for demo only)
let posts = [
  { srno: 1, postId: "1", title: "Post 1", date: "2023-01-01", adminID: "admin1", clubName: "clubA" },
  { srno: 2, postId: "2", title: "Post 2", date: "2023-02-01", adminID: "admin1", clubName: "clubA" },
  // Add more sample posts as needed
];

// GET all posts for an admin
app.get('/admin/get/adminPosts/:adminID', (req, res) => {
  const { adminID } = req.params;
  // Filter posts by adminID
  const adminPosts = posts.filter(post => post.adminID === adminID);
  res.json({ posts: adminPosts });
});

// DELETE a club post
app.delete('/admin/delete/clubPosts/:postId', (req, res) => {
  const { postId } = req.params;
  const initialLength = posts.length;
  posts = posts.filter(post => post.postId !== postId);
  if (posts.length < initialLength) {
    res.json({ message: "Post deleted successfully." });
  } else {
    res.status(404).json({ error: "Post not found." });
  }
});
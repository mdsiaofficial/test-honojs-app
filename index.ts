import { Hono } from 'hono';

const app = new Hono();

// In-memory data store
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
];

let nextId = 4;

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'OK', 
    runtime: 'Bun',
    timestamp: new Date().toISOString() 
  });
});

// Endpoint 1: GET /api/users - Get all users
app.get('/api/users', (c) => {
  return c.json({
    success: true,
    data: users,
    count: users.length
  });
});

// Endpoint 2: GET /api/users/:id - Get user by ID
app.get('/api/users/:id', (c) => {
  const userId = parseInt(c.req.param('id'));
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return c.json({
      success: false,
      message: 'User not found'
    }, 404);
  }
  
  return c.json({
    success: true,
    data: user
  });
});

// Endpoint 3: POST /api/users - Create new user
app.post('/api/users', async (c) => {
  const body = await c.req.json();
  const { name, email } = body;
  
  if (!name || !email) {
    return c.json({
      success: false,
      message: 'Name and email are required'
    }, 400);
  }
  
  const newUser = {
    id: nextId++,
    name,
    email
  };
  
  users.push(newUser);
  
  return c.json({
    success: true,
    data: newUser,
    message: 'User created successfully'
  }, 201);
});

// Endpoint 4: PUT /api/users/:id - Update user
app.put('/api/users/:id', async (c) => {
  const userId = parseInt(c.req.param('id'));
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return c.json({
      success: false,
      message: 'User not found'
    }, 404);
  }
  
  const body = await c.req.json();
  const { name, email } = body;
  
  if (!name || !email) {
    return c.json({
      success: false,
      message: 'Name and email are required'
    }, 400);
  }
  
  users[userIndex] = {
    ...users[userIndex],
    name,
    email
  };
  
  return c.json({
    success: true,
    data: users[userIndex],
    message: 'User updated successfully'
  });
});

// Endpoint 5: DELETE /api/users/:id - Delete user
app.delete('/api/users/:id', (c) => {
  const userId = parseInt(c.req.param('id'));
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return c.json({
      success: false,
      message: 'User not found'
    }, 404);
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  
  return c.json({
    success: true,
    data: deletedUser,
    message: 'User deleted successfully'
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Route not found'
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({
    success: false,
    message: 'Something went wrong!'
  }, 500);
});

const port = Number(process.env.PORT) || 3000;

console.log(`Server is running on port ${port}`);
console.log(`Runtime: Bun ${Bun.version}`);

export default {
  port,
  fetch: app.fetch,
};
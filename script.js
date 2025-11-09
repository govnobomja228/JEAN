const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Путь к файлам данных
const DATA_FILE = path.join(__dirname, 'data.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const USERS_FILE = path.join(__dirname, 'users.json');

// Загрузка данных
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE));
    }
  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
  }
  
  return [
    { id: 'p1', name: 'СНЮС', price: 500, image: 'https://i.pinimg.com/736x/bf/ef/40/bfef4084b193214a0a130ed2e00b87d3.jpg', stock: 15 },
    { id: 'p2', name: 'PODONKI', price: 500, image: 'https://i.pinimg.com/736x/bf/ef/40/bfef4084b193214a0a130ed2e00b87d3.jpg', stock: 12 },
    { id: 'p3', name: 'PASITO2', price: 3000, image: 'https://i.pinimg.com/736x/bf/ef/40/bfef4084b193214a0a130ed2e00b87d3.jpg', stock: 20 },
    { id: 'p4', name: 'WAKA', price: 1500, image: 'https://i.pinimg.com/736x/bf/ef/40/bfef4084b193214a0a130ed2e00b87d3.jpg', stock: 10 }
  ];
}

function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE));
    }
  } catch (err) {
    console.error('Ошибка загрузки заказов:', err);
  }
  return [];
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE));
    }
  } catch (err) {
    console.error('Ошибка загрузки пользователей:', err);
  }
  return [];
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

let products = loadData();
let orders = loadOrders();
let users = loadUsers();

// API: Получение товаров
app.get('/api/products', (req, res) => {
  res.json(products);
});

// API: Обновление остатков
app.post('/api/update-stocks', (req, res) => {
  try {
    const { updates } = req.body;
    
    products = products.map(product => {
      const update = updates.find(u => u.id === product.id);
      if (update) {
        return { ...product, stock: Math.max(0, update.newStock) };
      }
      return product;
    });

    saveData(products);
    res.json({ success: true, products });
  } catch (error) {
    console.error('Ошибка обновления:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// API: Регистрация/авторизация
app.post('/api/auth', (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Некорректный email' });
    }
    
    let user = users.find(u => u.email === email);
    if (!user) {
      user = { email, id: Date.now().toString() };
      users.push(user);
      saveUsers(users);
    }
    
    res.json({ success: true, email: user.email });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// API: Создание заказа
app.post('/api/orders', (req, res) => {
  try {
    const order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: 'В обработке',
      ...req.body
    };
    
    orders.push(order);
    saveOrders(orders);
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// API: Получение заказов пользователя
app.get('/api/orders', (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' });
    }
    
    const userOrders = orders.filter(order => order.email === email);
    res.json(userOrders);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Статические файлы
app.use(express.static('public'));

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`API доступно по:`);
  console.log(`- GET  /api/products`);
  console.log(`- POST /api/update-stocks`);
  console.log(`- POST /api/auth`);
  console.log(`- POST /api/orders`);
  console.log(`- GET  /api/orders?email=...`);
});
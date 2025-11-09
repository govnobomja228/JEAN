const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const basicAuth = require('basic-auth');
const bodyParser = require('body-parser');

const app = express();

// Конфигурация Telegram
const TELEGRAM_BOT_TOKEN = '8082201989:AAEOWxVzIEHfwgwIwxKWYlhuo-aJruuIvEs';
const TELEGRAM_CHAT_ID = '7885873416';

// Настройки CORS для Railway
app.use(cors({
  origin: ['https://jean-smoke-shop.railway.app', 'https://your-custom-domain.com'], // Замените на ваш домен
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname)); // Обслуживаем статические файлы

// Конфигурация
const DATA_FILE = path.join(__dirname, 'data.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'DanyaJEANsmoke';

// Загрузка данных
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
  }
  
  // Данные по умолчанию
  return [
    { id: 'p1', name: 'СНЮС', price: 500, image: 'https://i.pinimg.com/736x/bf/ef/40/bfef4084b193214a0a130ed2e00b87d3.jpg', stock: 150 },
    { id: 'p2', name: 'PODONKI', price: 500, image: 'https://i.pinimg.com/736x/bf/ef/40/bfef4084b193214a0a130ed2e00b87d3.jpg', stock: 120 },
    { id: 'p3', name: 'PASITO2', price: 3000, image: 'https://i.pinimg.com/736x/bf/ef/40/bfef4084b193214a0a130ed2e00b87d3.jpg', stock: 200 },
    { id: 'p4', name: 'WAKA', price: 1500, image: 'https://i.pinimg.com/736x/bf/ef/40/bfef4084b193214a0a130ed2e00b87d3.jpg', stock: 10 }
  ];
}

function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Ошибка загрузки заказов:', err);
  }
  return [];
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Ошибка загрузки пользователей:', err);
  }
  return [];
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Ошибка сохранения данных:', err);
  }
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error('Ошибка сохранения заказов:', err);
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Ошибка сохранения пользователей:', err);
  }
}

let products = loadData();
let orders = loadOrders();
let users = loadUsers();

// Middleware для базовой авторизации
const auth = (req, res, next) => {
  const user = basicAuth(req);
  
  if (!user || user.name !== ADMIN_USER || user.pass !== ADMIN_PASS) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  next();
};

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check для Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Jean Smoke Shop API'
  });
});

// API Endpoints

// Получение товаров
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Регистрация клиента
app.post('/api/register', (req, res) => {
  const clientId = 'cli_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  res.json({ clientId });
});

// Получение заказов пользователя
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

// Создание заказа
app.post('/api/orders', async (req, res) => {
  try {
    const { email, items, total, address, username, comment, deliveryTime } = req.body;
    
    // 1. Проверяем наличие товаров и обновляем остатки
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) {
        return res.status(400).json({ error: `Товар с ID ${item.id} не найден` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Недостаточно товара "${product.name}" на складе` });
      }
      product.stock -= item.quantity;
    }
    
    saveData(products);
    
    // 2. Создаем заказ
    const order = {
      id: 'ord_' + Date.now().toString(36),
      date: new Date().toISOString(),
      status: 'В обработке',
      email,
      items,
      total,
      address,
      username,
      comment: comment || '',
      deliveryTime: Number(deliveryTime),
      statusHistory: [
        { 
          status: 'В обработке', 
          date: new Date().toISOString(), 
          changedBy: 'system' 
        }
      ]
    };
    
    orders.push(order);
    saveOrders(orders);
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ========== АДМИН-ПАНЕЛЬ ========== //

// Получение всех заказов (админ)
app.get('/api/admin/orders', auth, (req, res) => {
  res.json(orders);
});

// Обновление статуса заказа (админ)
app.put('/api/admin/orders/:id/status', auth, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['В обработке', 'В сборке', 'В пути', 'Ожидает получения', 'Доставлен'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }
    
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    
    orders[orderIndex].status = status;
    orders[orderIndex].statusHistory.push({
      status,
      date: new Date().toISOString(),
      changedBy: 'admin'
    });
    
    saveOrders(orders);
    
    res.json({ success: true, order: orders[orderIndex] });
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Управление товарами (админ)
app.get('/api/admin/products', auth, (req, res) => {
  res.json(products);
});

app.post('/api/admin/products', auth, (req, res) => {
  try {
    console.log('Adding product:', req.body);
    const { name, price, stock, image } = req.body;
    
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    }
    
    const newProduct = {
      id: 'p' + Date.now().toString(36),
      name: name.toString(),
      price: Number(price),
      stock: Number(stock),
      image: image || 'https://i.pinimg.com/736x/bf/ef/40/bfef4084b193214a0a130ed2e00b87d3.jpg'
    };
    
    products.push(newProduct);
    saveData(products);
    
    console.log('Product added successfully:', newProduct);
    res.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Ошибка добавления товара:', error);
    res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
});

app.put('/api/admin/products/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, image } = req.body;
    
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    products[productIndex] = {
      ...products[productIndex],
      name: name || products[productIndex].name,
      price: price !== undefined ? Number(price) : products[productIndex].price,
      stock: stock !== undefined ? Number(stock) : products[productIndex].stock,
      image: image || products[productIndex].image
    };
    
    saveData(products);
    res.json({ success: true, product: products[productIndex] });
  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/products/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    products = products.filter(p => p.id !== id);
    saveData(products);
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обслуживание статических файлов
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'cart.html'));
});

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((error, req, res, next) => {
  console.error('Необработанная ошибка:', error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log('📊 Админ-доступ:');
  console.log(`   Логин: ${ADMIN_USER}`);
  console.log(`   Пароль: ${ADMIN_PASS}`);
  console.log(`🌐 Web App доступен по: http://localhost:${PORT}`);
  console.log(`🔧 API доступно по: http://localhost:${PORT}/api`);
  console.log(`⚙️  Админ-панель: http://localhost:${PORT}/admin`);
});
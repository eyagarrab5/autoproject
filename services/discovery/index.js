const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// In-memory registry
const registry = {};

app.post('/register', (req, res) => {
  const { serviceName, url } = req.body;
  if (!serviceName || !url) {
    return res.status(400).json({ message: 'Service name and URL are required' });
  }

  registry[serviceName] = {
    url,
    timestamp: Date.now()
  };

  console.log(`Registered service: ${serviceName} at ${url}`);
  res.json({ message: 'Registered successfully' });
});

app.get('/:serviceName', (req, res) => {
  const { serviceName } = req.params;
  const service = registry[serviceName];

  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  res.json(service);
});

app.get('/', (req, res) => {
    res.json(registry);
});

app.listen(PORT, () => {
  console.log(`Discovery Service running on port ${PORT}`);
});
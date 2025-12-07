const http = require('http');
const express = require('express');
const mongo = require('mongoose');
const cors = require('cors');
const axios = require("axios");
const path = require('path');
const db = require('./config/dbconnection.json');

mongo.connect(db.url)
  .then(
    console.log('database connected')
  )
  .catch((err) => {
    console.log(err);
  });

const testRouter = require('./routes/test');
const voitureRouter = require('./routes/voiture');
const entretienRouter = require('./routes/entretien');
const notificationsRouter = require('./routes/notifications');
const { startScheduler } = require('./services/scheduler');

const app = express();
const serviceName = "monservice voiture";
const discovryserviceurl = "http://localhost:4000/register";
const registerService = async () => {
  try {
    await axios.post(discovryserviceurl, {
      name: "service-voiture",
      address: "http://localhost",
      port: 3000,
    });
    console.log(serviceName + "bien enregistre");
  } catch (error) {
    console.log("erreur dans d'enregistrement :" + error.message);
  }
};
registerService();

// Configuration CORS
app.use(cors({
  origin: '*', // Autoriser toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Pour les navigateurs plus anciens
}));

// Gestion des requêtes OPTIONS (prévol)
app.options('*', cors());

app.use(express.json());

// Middleware pour les en-têtes CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Répondre aux requêtes OPTIONS
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Configuration du moteur de vues EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../views'));

app.use('/test', testRouter);
app.use("/api/voitures", voitureRouter);  // ✅ Correspond au frontend
app.use('/api/entretiens', entretienRouter);
app.use('/notifications', notificationsRouter);
app.get("/voiture", (req, res) => {
  res.render('voiture');
});

app.get("/", (req, res) => {
  res.send("bienvenue dans votre service : " + serviceName + ". <a href='/voiture'>Accéder à la gestion des voitures</a>");
});

const server = http.createServer(app);
console.log('Serveur en cours de démarrage...');

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

// start optional cron scheduler
startScheduler();

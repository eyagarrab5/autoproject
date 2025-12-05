const http = require('http');
const express = require('express');
const mongo = require('mongoose');
const axios = require("axios");
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

app.use(express.json());

app.use('/test', testRouter);
app.use("/api/voitures", voitureRouter);  // ✅ Correspond au frontend
app.use('/entretiens', entretienRouter);
app.use('/notifications', notificationsRouter);
app.get("/", (req, res) => {
  res.send("bienvenue dans votre service : " + serviceName);
});

const server = http.createServer(app);
console.log('Serveur en cours de démarrage...');

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

// start optional cron scheduler
startScheduler();

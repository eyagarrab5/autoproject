const http = require('http');
const express = require('express');
const mongo = require('mongoose');
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

const app = express();
app.use(express.json());

app.use('/test', testRouter);
app.use('/voitures', voitureRouter);
app.use('/entretiens', entretienRouter);

const server = http.createServer(app);
console.log('Serveur en cours de démarrage...');

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

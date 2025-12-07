const mongoose = require('mongoose');
const Entretien = require('../microservice/service-voiture/model/entretien');

async function cleanUpEntretiens() {
  try {
    // Connexion à la base de données avec timeout augmenté
    console.log('🔄 Connexion à la base de données...');
    await mongoose.connect('mongodb://localhost:27017/voiture', {
      serverSelectionTimeoutMS: 30000, // 30 secondes de timeout
      socketTimeoutMS: 45000, // 45 secondes de timeout
    });
    
    console.log('✅ Connecté à la base de données');

    // Vérifier la connexion
    const db = mongoose.connection;
    db.on('error', (err) => {
      console.error('❌ Erreur de connexion MongoDB:', err);
      process.exit(1);
    });

    console.log('🔍 Recherche des entretiens...');
    
    // Trouver tous les entretiens avec un timeout
    const entretiens = await Entretien.find({}).maxTimeMS(30000);
    console.log(`✅ ${entretiens.length} entretiens trouvés`);

    // Filtrer les entretiens sans ID valide
    const entretiensInvalides = entretiens.filter(e => !e._id || !mongoose.Types.ObjectId.isValid(e._id));
    
    if (entretiensInvalides.length === 0) {
      console.log('✅ Aucun entretien invalide trouvé');
      return;
    }

    console.log(`⚠️  ${entretiensInvalides.length} entretiens sans ID valide trouvés`);
    
    // Afficher les entretiens invalides
    console.log('\n📋 Liste des entretiens invalides :');
    entretiensInvalides.forEach((e, index) => {
      console.log(`\n${index + 1}.`);
      console.log(`   ID: ${e._id || 'N/A'}`);
      console.log(`   Voiture: ${e.car || 'N/A'}`);
      console.log(`   Type: ${e.type || 'N/A'}`);
      console.log(`   Date: ${e.date || 'N/A'}`);
    });

    // Demander confirmation avant suppression
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\nVoulez-vous supprimer ces entretiens ? (o/n) ', async (answer) => {
      if (answer.toLowerCase() === 'o') {
        try {
          const ids = entretiensInvalides.map(e => e._id).filter(id => id);
          const result = await Entretien.deleteMany({ _id: { $in: ids } });
          console.log(`\n✅ ${result.deletedCount} entretiens supprimés avec succès`);
        } catch (err) {
          console.error('\n❌ Erreur lors de la suppression des entretiens :', err);
        }
      } else {
        console.log('\nOpération annulée');
      }
      
      rl.close();
      mongoose.connection.close();
    });
  } catch (err) {
    console.error('❌ Erreur :', err);
    process.exit(1);
  }
}

cleanUpEntretiens();

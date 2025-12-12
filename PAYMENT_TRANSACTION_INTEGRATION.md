# Intégration de la Table PaymentTransaction

## Vue d'ensemble

Une nouvelle table `PaymentTransaction` a été ajoutée au projet pour suivre en détail toutes les transactions liées aux paiements. Cette table complémentaire est essentielle pour :

- Auditer chaque événement de paiement
- Suivre les tentatives de paiement multiples
- Gérer les remboursements partiels et complets
- Enregistrer les erreurs et les raisons d'échec

## Structure de la Table PaymentTransaction

```javascript
{
    paymentId: ObjectId,           // Référence au paiement principal
    transactionId: String,         // ID de la gateway (Stripe, PayPal, etc.)
    gateway: String,               // Nom de la gateway utilisée
    eventType: String,             // Type d'événement (initiated, succeeded, failed, etc.)
    amount: Number,                // Montant concerné
    currency: String,              // Devise (EUR, USD, etc.)
    status: String,                // Statut retourné par la gateway
    metadata: Mixed,               // Données supplémentaires
    errorMessage: String,          // Raison d'erreur le cas échéant
    processedAt: Date              // Date de traitement
}
```

## Champs Importants

### paymentId
- Type: ObjectId avec référence au modèle `payment`
- Lien 1-N : Un paiement peut avoir plusieurs transactions

### eventType - Énumération
- `initiated` : Paiement initié
- `succeeded` : Paiement réussi
- `failed` : Paiement échoué
- `refunded` : Remboursement complet
- `partially_refunded` : Remboursement partiel
- `captured` : Paiement capturé
- `canceled` : Paiement annulé

### gateway
Exemples : `stripe`, `paypal`, `bank_transfer`, `apple_pay`, `google_pay`

## Routes API Disponibles

### Créer une transaction
```
POST /api/payment-transactions
Body: {
    paymentId: "xxx",
    transactionId: "pi_xxx",
    gateway: "stripe",
    eventType: "succeeded",
    amount: 99.99,
    currency: "EUR",
    status: "completed",
    metadata: {},
    errorMessage: null
}
```

### Récupérer toutes les transactions
```
GET /api/payment-transactions
```

### Récupérer les transactions d'un paiement
```
GET /api/payment-transactions/payment/:paymentId
```

### Récupérer les transactions par gateway
```
GET /api/payment-transactions/gateway/:gateway
```

### Récupérer les transactions par type d'événement
```
GET /api/payment-transactions/event/:eventType
```

### Récupérer les transactions par statut
```
GET /api/payment-transactions/status/:status
```

### Transactions récentes
```
GET /api/payment-transactions/recent/list?limit=10
```

### Transactions échouées
```
GET /api/payment-transactions/failed/list
```

### Transactions réussies
```
GET /api/payment-transactions/successful/list
```

### Transactions dans une plage de dates
```
GET /api/payment-transactions/daterange/list?startDate=2024-01-01&endDate=2024-12-31
```

### Mettre à jour une transaction
```
PUT /api/payment-transactions/:id
```

### Supprimer une transaction
```
DELETE /api/payment-transactions/:id
```

### Statistiques par gateway
```
GET /api/payment-transactions/stats/gateway
```
Exemple de réponse:
```json
[
    { "_id": "stripe", "count": 150, "totalAmount": 5000.00 },
    { "_id": "paypal", "count": 75, "totalAmount": 2500.00 }
]
```

### Statistiques par type d'événement
```
GET /api/payment-transactions/stats/event-type
```

### Statistiques par statut
```
GET /api/payment-transactions/stats/status
```

### Paiement complet avec toutes ses transactions
```
GET /api/payment-transactions/complete/:paymentId
```
Réponse:
```json
{
    "payment": { /* détails du paiement */ },
    "transactions": [ /* liste des transactions */ ]
}
```

## Indexes de Base de Données

Deux indexes ont été créés pour optimiser les recherches :

```javascript
paymentTransactionSchema.index({ paymentId: 1 });
paymentTransactionSchema.index({ transactionId: 1 });
```

Cela garantit des recherches rapides par paymentId et transactionId.

## Fichiers Modifiés et Créés

### Fichiers créés (Microservice)
- `/microservice/service-payment/model/paymentTransaction.js` - Modèle Mongoose
- `/microservice/service-payment/controller/paymentTransactionController.js` - Logique métier
- `/microservice/service-payment/routes/paymentTransaction.js` - Routes API

### Fichiers modifiés (Microservice)
- `/microservice/service-payment/app.js` - Intégration des routes

### Fichiers créés (Root)
- `/model/paymentTransaction.js` - Modèle Mongoose
- `/controller/paymentTransactionController.js` - Logique métier
- `/routes/paymentTransaction.js` - Routes API

### Fichiers modifiés (Root)
- `/app.js` - Intégration des routes

## Cas d'Usage

### 1. Suivi d'un paiement avec plusieurs tentatives
```
Payment (1 document) :
- ID: 123
- userId: user1
- orderId: order1
- amount: 100
- status: completed

PaymentTransactions (3 documents) :
- Transaction 1: initiated
- Transaction 2: failed (raison: carte expirée)
- Transaction 3: succeeded
```

### 2. Remboursement partiel
```
Payment (1 document) :
- ID: 124
- status: partially_refunded

PaymentTransactions (2 documents) :
- Transaction 1: succeeded (100€)
- Transaction 2: partially_refunded (40€)
```

### 3. Audit complet
```
GET /api/payment-transactions/complete/124
Retourne le paiement avec l'historique complet des transactions
```

## Intégration avec les Services Existants

La table `PaymentTransaction` est complètement intégrée avec :

- **Payment Service** : Chaque transaction référence un paiement parent
- **Controllers** : Gestion complète des opérations CRUD
- **Routes** : Endpoints RESTful pour toutes les opérations
- **App.js** : Routes montées sous `/api/payment-transactions`

## Prochaines Étapes Recommandées

1. **Webhooks** : Intégrer les webhooks des gateways (Stripe, PayPal) pour créer automatiquement les transactions
2. **Validations** : Ajouter des validations métier (ex: montant cohérent)
3. **Notifications** : Envoyer des notifications lors de changements de statut
4. **Rapports** : Créer des rapports récapitulatifs
5. **Archivage** : Implémenter une stratégie d'archivage des anciennes transactions

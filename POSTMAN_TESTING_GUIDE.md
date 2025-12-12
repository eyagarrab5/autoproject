# Guide Complet des Tests Postman - Système de Paiement

## 📋 Vue d'ensemble

Ce guide explique comment utiliser les collections Postman pour tester l'ensemble du système de paiement avec ses 4 tables complémentaires :
- **Payment** : Paiements principaux
- **PaymentTransaction** : Transactions détaillées
- **PaymentMethod** : Méthodes de paiement sauvegardées
- **Refund** : Gestion des remboursements
- **Invoice** : Génération de factures

## 🚀 Configuration Initiale

### 1. Importer la Collection

Deux fichiers Postman sont disponibles :

- **Pour l'API Root (Port 3000)** : `/payment-postman-collection.json`
- **Pour le Microservice (Port 3010)** : `/microservice/service-payment/payment-postman-collection.json`

#### Étapes d'import :
1. Ouvrir Postman
2. Cliquer sur **Import** en haut à gauche
3. Sélectionner **Upload Files**
4. Choisir le fichier JSON approprié
5. Cliquer sur **Import**

### 2. Configurer les Variables

Les collections contiennent 5 variables principales :

| Variable | Description | Format |
|----------|-------------|--------|
| `paymentId` | ID du paiement créé | MongoDB ObjectId |
| `transactionId` | ID de la transaction | chaîne alphanumérique |
| `methodId` | ID de la méthode de paiement | MongoDB ObjectId |
| `refundId` | ID du remboursement | MongoDB ObjectId |
| `invoiceId` | ID de la facture | MongoDB ObjectId |

**Pour définir une variable :**
1. Aller dans l'onglet **Variables** en bas à gauche
2. Remplir la colonne **Current value**
3. Les variables persisteront pour toutes les requêtes

## 📦 Structure des Collections

### 1. Payment Management (13 requêtes)

Gestion complète des paiements principaux.

#### Requêtes disponibles :
- `POST /api/payments` - Créer un paiement
- `GET /api/payments` - Récupérer tous les paiements
- `GET /api/payments/id/:id` - Paiement par ID
- `GET /api/payments/user/:userId` - Paiements par utilisateur
- `GET /api/payments/order/:orderId` - Paiements par commande
- `GET /api/payments/method/:method` - Paiements par méthode
- `GET /api/payments/status/:status` - Paiements par statut
- `GET /api/payments/recent/list` - Paiements récents
- `GET /api/payments/daterange/list` - Plage de dates
- `PUT /api/payments/:id` - Mettre à jour le statut
- `DELETE /api/payments/:id` - Supprimer un paiement
- `GET /api/payments/stats/total` - Total des montants
- `GET /api/payments/stats/count` - Nombre de paiements

**Exemple de création :**
```json
{
  "userId": "user123",
  "orderId": "order456",
  "amount": 150.50,
  "paymentMethod": "card",
  "paymentStatus": "pending"
}
```

---

### 2. Payment Transactions (9 requêtes)

Suivi détaillé des événements de paiement.

#### Requêtes disponibles :
- `POST /api/payment-transactions` - Créer une transaction
- `GET /api/payment-transactions` - Toutes les transactions
- `GET /api/payment-transactions/id/:id` - Transaction par ID
- `GET /api/payment-transactions/payment/:paymentId` - Par paiement
- `GET /api/payment-transactions/gateway/:gateway` - Par gateway
- `GET /api/payment-transactions/event/:eventType` - Par type d'événement
- `GET /api/payment-transactions/failed/list` - Transactions échouées
- `GET /api/payment-transactions/successful/list` - Transactions réussies
- `GET /api/payment-transactions/stats/gateway` - Statistiques par gateway

**Types d'événements supportés :**
- `initiated` - Initié
- `succeeded` - Succès
- `failed` - Échoué
- `refunded` - Remboursé
- `partially_refunded` - Partiellement remboursé
- `captured` - Capturé
- `canceled` - Annulé

**Exemple de création :**
```json
{
  "paymentId": "{{paymentId}}",
  "transactionId": "pi_1A2b3C4d5E",
  "gateway": "stripe",
  "eventType": "succeeded",
  "amount": 150.50,
  "currency": "EUR",
  "status": "completed",
  "metadata": {
    "card_brand": "visa"
  }
}
```

---

### 3. Payment Methods (7 requêtes)

Gestion des méthodes de paiement sauvegardées.

#### Requêtes disponibles :
- `POST /api/payment-methods` - Créer une méthode
- `GET /api/payment-methods/user/:userId` - Méthodes de l'utilisateur
- `GET /api/payment-methods/user/:userId/default` - Méthode par défaut
- `GET /api/payment-methods/user/:userId/gateway/:gateway` - Par gateway
- `PUT /api/payment-methods/:id/set-default` - Définir comme défaut
- `PUT /api/payment-methods/:id/disable` - Désactiver
- `GET /api/payment-methods/expired/list` - Cartes expirées
- `GET /api/payment-methods/stats/all` - Statistiques

**Gateways supportés :**
- `stripe`
- `paypal`
- `bank_transfer`
- `apple_pay`
- `google_pay`

**Marques supportées :**
- Visa, Mastercard, Amex, Discover, Diners, JCB

**Exemple de création :**
```json
{
  "userId": "user123",
  "gatewayCustomerId": "cus_1A2b3C4d5E",
  "gateway": "stripe",
  "type": "card",
  "last4": "4242",
  "brand": "Visa",
  "expiryMonth": 12,
  "expiryYear": 2025,
  "holderName": "John Doe",
  "isDefault": true
}
```

---

### 4. Refunds (9 requêtes)

Gestion complète des remboursements.

#### Requêtes disponibles :
- `POST /api/refunds` - Créer un remboursement
- `GET /api/refunds` - Tous les remboursements
- `GET /api/refunds/id/:id` - Remboursement par ID
- `GET /api/refunds/payment/:paymentId` - Par paiement
- `GET /api/refunds/status/:status` - Par statut
- `GET /api/refunds/pending/list` - Remboursements en attente
- `PUT /api/refunds/:id/approve` - Approuver
- `PUT /api/refunds/:id/reject` - Rejeter
- `GET /api/refunds/stats/all` - Statistiques

**Raisons de remboursement :**
- `requested_by_customer` - Demandé par le client
- `duplicate` - Doublon
- `fraudulent` - Frauduleux
- `unrecognized_transaction` - Transaction non reconnue
- `service_issue` - Problème de service
- `other` - Autre

**Statuts :**
- `pending` - En attente
- `processing` - En cours de traitement
- `succeeded` - Réussi
- `failed` - Échoué
- `canceled` - Annulé

**Exemple de création :**
```json
{
  "paymentId": "{{paymentId}}",
  "amount": 50.00,
  "currency": "EUR",
  "reason": "requested_by_customer",
  "reasonDetails": "Client a changé d'avis",
  "gateway": "stripe",
  "initiatedBy": "user123"
}
```

---

### 5. Invoices (15 requêtes)

Génération et suivi des factures.

#### Requêtes disponibles :
- `POST /api/invoices` - Créer une facture
- `GET /api/invoices` - Toutes les factures
- `GET /api/invoices/id/:id` - Facture par ID
- `GET /api/invoices/number/:number` - Par numéro
- `GET /api/invoices/user/:userId` - Par utilisateur
- `GET /api/invoices/order/:orderId` - Par commande
- `GET /api/invoices/status/:status` - Par statut
- `GET /api/invoices/overdue/list` - Factures échues
- `PUT /api/invoices/:id/mark-paid` - Marquer payée
- `PUT /api/invoices/:id/mark-sent` - Marquer envoyée
- `PUT /api/invoices/:id/mark-partial` - Partiellement payée
- `PUT /api/invoices/:id/cancel` - Annuler
- `GET /api/invoices/stats/all` - Statistiques

**Statuts :**
- `draft` - Brouillon
- `sent` - Envoyée
- `viewed` - Vue
- `paid` - Payée
- `partially_paid` - Partiellement payée
- `overdue` - Échue
- `canceled` - Annulée

**Exemple de création :**
```json
{
  "paymentId": "{{paymentId}}",
  "orderId": "order456",
  "userId": "user123",
  "items": [
    {
      "description": "Produit A",
      "quantity": 2,
      "unitPrice": 50,
      "amount": 100
    }
  ],
  "subtotal": 100,
  "taxRate": 20,
  "discountAmount": 10,
  "total": 118,
  "currency": "EUR",
  "dueDate": "2024-01-31",
  "billingAddress": {
    "name": "John Doe",
    "street": "123 Rue de la Paix",
    "city": "Paris",
    "zipCode": "75000",
    "country": "France",
    "email": "john@example.com"
  }
}
```

---

## 🧪 Workflow de Test Recommandé

### Test Complet du Système

#### 1. **Phase de Création**

1. **Créer un paiement** (Payment Management)
   - Copier l'ID depuis la réponse
   - Coller dans la variable `paymentId`

2. **Créer une méthode de paiement** (Payment Methods)
   - Utiliser le même `userId`
   - Copier l'ID comme `methodId`

3. **Créer une transaction** (Payment Transactions)
   - Utiliser le `paymentId` créé
   - Coller l'ID comme `transactionId`

#### 2. **Phase de Vérification**

4. **Récupérer les détails** (chaque module)
   - Vérifier que les IDs correspondent
   - Valider les montants et statuts

5. **Créer une facture** (Invoices)
   - Utiliser le `paymentId`
   - Générer la facture

#### 3. **Phase de Gestion**

6. **Créer un remboursement** (Refunds)
   - Montant ≤ paiement original
   - Approuver ou rejeter

7. **Consulter les statistiques**
   - Stats Payment Management
   - Stats Payment Transactions
   - Stats Refunds
   - Stats Invoices

---

## 📊 Exemples de Requêtes Avancées

### Exemple 1 : Remboursement partiel

```
1. POST /api/payments → {amount: 150, ...}
   → Récupérer paymentId_1

2. POST /api/refunds → {paymentId: paymentId_1, amount: 50, reason: "requested_by_customer"}
   → Récupérer refundId_1

3. PUT /api/refunds/{{refundId}}/approve
   → Approuver le remboursement partiel
```

### Exemple 2 : Suivi complet d'une commande

```
1. POST /api/payments → créer paiement pour order123
2. POST /api/payment-transactions → enregistrer l'événement
3. POST /api/invoices → générer facture
4. GET /api/invoices/order/order123 → voir toutes les factures
5. GET /api/payments/order/order123 → voir tous les paiements
```

### Exemple 3 : Gestion des cartes expirées

```
1. GET /api/payment-methods/expired/list → liste des cartes expirées
2. PUT /api/payment-methods/{{methodId}}/disable → désactiver la carte
3. POST /api/payment-methods → ajouter une nouvelle carte
4. PUT /api/payment-methods/{{newMethodId}}/set-default → la définir par défaut
```

---

## 🔍 Vérifications d'Intégrité

### Après chaque création, vérifier :

- ✅ Code HTTP 201 (créé) ou 200 (succès)
- ✅ Message de succès dans la réponse
- ✅ ID généré et retourné
- ✅ Champs requis présents
- ✅ Types de données corrects

### Erreurs courantes :

| Erreur | Cause | Solution |
|--------|-------|----------|
| 400 Bad Request | Données invalides | Vérifier le format JSON |
| 404 Not Found | ID inexistant | Vérifier l'ID utilisé |
| 422 Unprocessable | Montant refund > payment | Réduire le montant |
| 500 Server Error | Erreur serveur | Vérifier les logs |

---

## 💾 Sauvegarde et Partage

### Exporter une collection :
1. Cliquer sur la collection
2. Cliquer sur les **...** (trois points)
3. Sélectionner **Export**
4. Choisir le format v2.1
5. Télécharger le fichier

### Partager avec l'équipe :
1. Utiliser la fonction **Share** de Postman
2. Ou envoyer le fichier JSON directement

---

## 📱 Port Configuration

| Environnement | URL Base | Port | Usage |
|---------------|----------|------|-------|
| Root Application | http://localhost:3000 | 3000 | Tests locaux directs |
| Microservice | http://localhost:3010 | 3010 | Tests microservice |
| Production | À définir | 443 | Déploiement |

---

## 🛠️ Dépannage

### Collection ne s'affiche pas
- Actualiser Postman (Ctrl+R)
- Réimporter la collection

### Variables ne fonctionnent pas
- Vérifier l'onglet **Variables** en bas
- S'assurer que **Current value** est remplie
- Utiliser la syntaxe `{{variableName}}`

### Erreurs de connexion
- Vérifier que le serveur est en cours d'exécution
- Confirmer le port (3000 ou 3010)
- Tester avec `GET /api/payments`

---

## 📖 Documentation Supplémentaire

- Voir `PAYMENT_TRANSACTION_INTEGRATION.md` pour l'architecture
- Consulter les fichiers contrôleurs pour la logique métier
- Référencer les fichiers modèles pour les schémas

---

**Version** : 1.0  
**Dernière mise à jour** : 2024  
**Statut** : ✅ Production Ready

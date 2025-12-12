# Workflow de Test Complet - Système de Paiement

## 🎯 Objectif

Tester l'ensemble du système de paiement en suivant un flux réaliste de création de paiement, suivi des transactions, gestion des remboursements et génération de factures.

## 📋 Prérequis

- ✅ Postman installé
- ✅ Collections importées (voir `POSTMAN_TESTING_GUIDE.md`)
- ✅ Serveur en cours d'exécution (port 3000 ou 3010)
- ✅ Base de données MongoDB connectée

---

## 🚀 Exécution du Workflow

### Phase 1 : Initialisation (5 minutes)

#### ✅ Étape 1.1 : Créer un Paiement

**Requête** : `Payment Management` → `Créer un paiement`

**Body à envoyer** :
```json
{
  "userId": "customer_001",
  "orderId": "ORDER_20240115_001",
  "amount": 250.00,
  "paymentMethod": "card",
  "paymentStatus": "pending"
}
```

**Actions après réponse 201** :
1. Copier l'`_id` de la réponse
2. Dans Variables (en bas) → Coller dans `paymentId` (Current value)
3. Sauvegarder (Cmd+S ou Ctrl+S)

**Réponse attendue** :
```json
{
  "_id": "abc123def456...",
  "userId": "customer_001",
  "orderId": "ORDER_20240115_001",
  "amount": 250.00,
  "paymentMethod": "card",
  "paymentStatus": "pending",
  "transactions": [],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

✅ **Validation** :
- [ ] Code 201 reçu
- [ ] `_id` non vide
- [ ] `paymentStatus` = "pending"
- [ ] `transactions` array vide

---

#### ✅ Étape 1.2 : Créer une Méthode de Paiement

**Requête** : `Payment Methods` → `Créer méthode de paiement`

**Body à envoyer** :
```json
{
  "userId": "customer_001",
  "gatewayCustomerId": "cus_stripe_12345",
  "gateway": "stripe",
  "type": "card",
  "last4": "4242",
  "brand": "Visa",
  "expiryMonth": 12,
  "expiryYear": 2026,
  "holderName": "Jean Dupont",
  "isDefault": true
}
```

**Actions après réponse 201** :
1. Copier l'`_id`
2. Coller dans Variables → `methodId`

✅ **Validation** :
- [ ] Code 201 reçu
- [ ] `gateway` = "stripe"
- [ ] `isDefault` = true
- [ ] `brand` = "Visa"

---

### Phase 2 : Transactions (10 minutes)

#### ✅ Étape 2.1 : Créer une Transaction Initiée

**Requête** : `Payment Transactions` → `Créer une transaction`

**Body à envoyer** :
```json
{
  "paymentId": "{{paymentId}}",
  "transactionId": "pi_stripe_initiated_001",
  "gateway": "stripe",
  "eventType": "initiated",
  "amount": 250.00,
  "currency": "EUR",
  "status": "pending",
  "metadata": {
    "card_brand": "visa",
    "last4": "4242"
  }
}
```

**Actions après réponse 201** :
1. Copier l'`_id` comme `transactionId`

✅ **Validation** :
- [ ] Code 201 reçu
- [ ] `eventType` = "initiated"
- [ ] `status` = "pending"
- [ ] `paymentId` correspond

---

#### ✅ Étape 2.2 : Créer une Transaction Réussie

**Requête** : `Payment Transactions` → `Créer une transaction`

**Body à envoyer** :
```json
{
  "paymentId": "{{paymentId}}",
  "transactionId": "pi_stripe_success_001",
  "gateway": "stripe",
  "eventType": "succeeded",
  "amount": 250.00,
  "currency": "EUR",
  "status": "completed",
  "metadata": {
    "card_brand": "visa",
    "receipt_url": "https://receipts.stripe.com/...",
    "charge_id": "ch_stripe_12345"
  }
}
```

✅ **Validation** :
- [ ] Code 201 reçu
- [ ] `eventType` = "succeeded"
- [ ] `status` = "completed"

---

#### ✅ Étape 2.3 : Vérifier les Transactions du Paiement

**Requête** : `Payment Transactions` → `Transactions par paiement`

**Vérifier l'URL** : `/api/payment-transactions/payment/{{paymentId}}`

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] 2 transactions retournées
- [ ] Statuts corrects (initiated, succeeded)

---

### Phase 3 : Factures (15 minutes)

#### ✅ Étape 3.1 : Générer une Facture

**Requête** : `Invoices` → `Créer une facture`

**Body à envoyer** :
```json
{
  "paymentId": "{{paymentId}}",
  "orderId": "ORDER_20240115_001",
  "userId": "customer_001",
  "items": [
    {
      "description": "Laptop Dell XPS 15",
      "quantity": 1,
      "unitPrice": 200,
      "amount": 200
    },
    {
      "description": "AppleCare+ Protection",
      "quantity": 1,
      "unitPrice": 50,
      "amount": 50
    }
  ],
  "subtotal": 250,
  "taxRate": 0,
  "discountAmount": 0,
  "total": 250,
  "currency": "EUR",
  "dueDate": "2024-02-15",
  "billingAddress": {
    "name": "Jean Dupont",
    "street": "123 Avenue des Champs",
    "city": "Paris",
    "zipCode": "75008",
    "country": "France",
    "email": "jean.dupont@example.com",
    "phone": "+33612345678"
  }
}
```

**Actions après réponse 201** :
1. Copier l'`_id` comme `invoiceId`
2. Noter le `invoiceNumber` (ex: INV-2024-000001)

✅ **Validation** :
- [ ] Code 201 reçu
- [ ] `invoiceNumber` formaté correctement
- [ ] `status` = "draft"
- [ ] `total` = 250

---

#### ✅ Étape 3.2 : Marquer la Facture comme Envoyée

**Requête** : `Invoices` → `Marquer comme envoyée`

**URL** : `/api/invoices/{{invoiceId}}/mark-sent`

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] `status` = "sent"
- [ ] `createdAt` présent

---

#### ✅ Étape 3.3 : Marquer la Facture comme Payée

**Requête** : `Invoices` → `Marquer comme payée`

**URL** : `/api/invoices/{{invoiceId}}/mark-paid`

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] `status` = "paid"
- [ ] `paidDate` défini

---

### Phase 4 : Remboursements (10 minutes)

#### ✅ Étape 4.1 : Créer un Remboursement Partiel

**Requête** : `Refunds` → `Créer un remboursement`

**Body à envoyer** :
```json
{
  "paymentId": "{{paymentId}}",
  "amount": 50.00,
  "currency": "EUR",
  "reason": "requested_by_customer",
  "reasonDetails": "Le client a demandé un remboursement partiel pour l'AppleCare",
  "gateway": "stripe",
  "initiatedBy": "admin_user_001"
}
```

**Actions après réponse 201** :
1. Copier l'`_id` comme `refundId`

✅ **Validation** :
- [ ] Code 201 reçu
- [ ] `status` = "pending"
- [ ] `amount` = 50.00
- [ ] `reason` correct

---

#### ✅ Étape 4.2 : Approuver le Remboursement

**Requête** : `Refunds` → `Approuver remboursement`

**URL** : `/api/refunds/{{refundId}}/approve`

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] `status` = "processing"
- [ ] `processedAt` défini

---

#### ✅ Étape 4.3 : Vérifier les Remboursements du Paiement

**Requête** : `Refunds` → `Remboursements par paiement`

**Vérifier l'URL** : `/api/refunds/payment/{{paymentId}}`

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] 1 remboursement retourné
- [ ] Montant = 50.00

---

### Phase 5 : Statistiques (5 minutes)

#### ✅ Étape 5.1 : Statistiques des Paiements

**Requête** : `Payment Management` → `Statistiques - Montant total`

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] `totalAmount` ≥ 250

---

#### ✅ Étape 5.2 : Statistiques des Transactions

**Requête** : `Payment Transactions` → `Statistiques par gateway`

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] `stripe` avec count ≥ 2

---

#### ✅ Étape 5.3 : Statistiques des Remboursements

**Requête** : `Refunds` → `Statistiques remboursements`

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] `totalRefundAmount` = 50.00

---

#### ✅ Étape 5.4 : Statistiques des Factures

**Requête** : `Invoices` → `Statistiques factures`

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] `totalInvoices` ≥ 1

---

### Phase 6 : Vérifications Finales (5 minutes)

#### ✅ Étape 6.1 : Récupérer le Paiement Complet

**Requête** : `Payment Management` → `Récupérer paiement par ID`

**URL** : `/api/payments/id/{{paymentId}}`

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] `transactions[]` contient les IDs
- [ ] `paymentStatus` à jour

---

#### ✅ Étape 6.2 : Récupérer la Facture Complète

**Requête** : `Invoices` → `Facture par ID`

**URL** : `/api/invoices/id/{{invoiceId}}`

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] `status` = "paid"
- [ ] Tous les items présents

---

#### ✅ Étape 6.3 : Recherche par Numéro de Facture

**Requête** : `Invoices` → `Facture par numéro`

**URL** : `/api/invoices/number/INV-2024-000001` (adapter le numéro)

✅ **Validation** :
- [ ] Code 200 reçu
- [ ] Même facture retournée

---

## 📊 Résumé du Workflow

```
START
  ↓
[Phase 1] Créer paiement, méthode, initialiser variables
  ↓
[Phase 2] Créer transactions (initiated → succeeded)
  ↓
[Phase 3] Créer facture → Envoyer → Marquer payée
  ↓
[Phase 4] Créer remboursement partiel → Approuver
  ↓
[Phase 5] Consulter statistiques (5 endpoints)
  ↓
[Phase 6] Vérifications finales complètes
  ↓
END ✅ TEST RÉUSSI
```

---

## ⏱️ Temps Total

| Phase | Durée | Étapes |
|-------|-------|--------|
| 1 - Initialisation | 5 min | 2 requêtes |
| 2 - Transactions | 10 min | 3 requêtes |
| 3 - Factures | 15 min | 3 requêtes |
| 4 - Remboursements | 10 min | 3 requêtes |
| 5 - Statistiques | 5 min | 4 requêtes |
| 6 - Vérifications | 5 min | 3 requêtes |
| **TOTAL** | **50 min** | **18 requêtes** |

---

## 🔄 Cas d'Erreurs à Tester

Après la complétion du workflow nominal, tester les cas d'erreur :

### Erreur 1 : Montant de remboursement > paiement
```json
// Body
{
  "paymentId": "{{paymentId}}",
  "amount": 300,  // > 250
  "currency": "EUR",
  "reason": "test_error"
}

// Résultat attendu
Code 422: "Refund amount cannot exceed payment amount"
```

### Erreur 2 : ID inexistant
```
GET /api/payments/id/invalid_id_12345

// Résultat attendu
Code 404: "Payment not found"
```

### Erreur 3 : Données invalides
```json
{
  "userId": "customer_001",
  "orderId": "ORDER_001",
  "amount": -100,  // Montant négatif
  "paymentMethod": "card"
}

// Résultat attendu
Code 400: "Amount must be positive"
```

---

## 💾 Export du Rapport de Test

Après complétion :

1. **Exporter les résultats** :
   - Cliquer sur la collection
   - "..."  → Export
   - Sauvegarder le fichier

2. **Générer un rapport** :
   - CLI: `newman run collection.json > report.html`
   - Ou utiliser l'onglet Tests dans Postman

3. **Partager** :
   - Envoyer le rapport à l'équipe
   - Documenter les anomalies

---

## ✅ Checklist Finale

- [ ] Toutes les phases complétées
- [ ] Aucune erreur 500
- [ ] Tous les codes HTTP corrects
- [ ] Variables correctement remplies
- [ ] Montants cohérents
- [ ] Statuts progressifs respectés
- [ ] Statistiques correctes
- [ ] Remboursement approuvé

---

**Créé** : 2024  
**Durée estimée** : 50 minutes  
**Difficultés** : ⭐☆☆☆☆ Facile  
**Statut** : ✅ Prêt à l'emploi

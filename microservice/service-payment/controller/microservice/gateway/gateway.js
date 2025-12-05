const express = require('express');
const paymentServiceClient = require('../services/paymentService');
const orderServiceClient = require('../services/orderService');
const notificationServiceClient = require('../services/notificationService');

const router = express.Router();

// Mock service clients

// Gateway middleware
router.use(express.json());

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'Gateway is healthy' });
});

// Process payment
router.post('/payments', async (req, res) => {
    try {
        const { orderId, amount, method, userId } = req.body;

        // Validate input
        if (!orderId || !amount || !method || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Call payment service
        const paymentResult = await paymentServiceClient.processPayment({
            orderId,
            amount,
            method,
            userId
        });

        // Update order status
        await orderServiceClient.updateOrderStatus(orderId, 'paid');

        // Send notification
        await notificationServiceClient.sendNotification(userId, {
            type: 'payment_success',
            orderId,
            amount
        });

        res.status(200).json({
            success: true,
            transactionId: paymentResult.transactionId,
            orderId
        });
    } catch (error) {
        console.error('Payment gateway error:', error);
        res.status(500).json({ error: 'Payment processing failed' });
    }
});

// Get payment status
router.get('/payments/:transactionId', async (req, res) => {
    try {
        const status = await paymentServiceClient.getPaymentStatus(req.params.transactionId);
        res.status(200).json(status);
    } catch (error) {
        res.status(404).json({ error: 'Transaction not found' });
    }
});

module.exports = router;
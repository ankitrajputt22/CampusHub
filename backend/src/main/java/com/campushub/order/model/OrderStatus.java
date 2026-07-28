package com.campushub.order.model;

public enum OrderStatus {
    PENDING_PAYMENT,
    PAID,
    READY_FOR_PICKUP,
    COMPLETED,
    CANCELLED,
    REFUNDED,
    PAYMENT_FAILED,
    EXPIRED,
    // Kept for compatibility with orders created before the lifecycle was expanded.
    PENDING,
    CONFIRMED
}

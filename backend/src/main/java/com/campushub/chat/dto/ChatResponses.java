package com.campushub.chat.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class ChatResponses {

    private ChatResponses() {
    }

    public record UserSummary(
            Long id,
            String fullName,
            String profilePhotoUrl,
            boolean verifiedStudent,
            int trustScore,
            double sellerRating,
            String collegeName
    ) {
    }

    public record ListingSummary(
            Long id,
            String title,
            BigDecimal price,
            String condition,
            String imageUrl,
            String status
    ) {
    }

    public record OrderSummary(
            Long id,
            String orderNumber,
            String status
    ) {
    }

    public record LastMessage(
            Long id,
            String message,
            String type,
            Long senderId,
            Instant createdAt
    ) {
    }

    public record ConversationSummary(
            Long id,
            String conversationNumber,
            String status,
            UserSummary otherUser,
            ListingSummary listing,
            OrderSummary order,
            LastMessage lastMessage,
            Instant lastMessageAt,
            int unreadCount,
            boolean archived,
            boolean muted
    ) {
    }

    public record ConversationPage(
            List<ConversationSummary> conversations,
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean hasMore
    ) {
    }

    public record ConversationDetails(
            ConversationSummary conversation,
            String participantRole
    ) {
    }

    public record MessageItem(
            Long id,
            String type,
            String message,
            String status,
            boolean sentByMe,
            Long senderId,
            Instant createdAt,
            Instant readAt,
            boolean reportable
    ) {
    }

    public record MessagePage(
            List<MessageItem> messages,
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean hasMore
    ) {
    }

    public record UnreadCount(long unreadCount) {
    }

    public record ConversationAction(
            Long conversationId,
            boolean archived,
            Instant updatedAt
    ) {
    }

    public record ReadReceipt(
            Long conversationId,
            int readMessages,
            long unreadCount,
            Instant readAt
    ) {
    }

    public record ReportResult(
            Long reportId,
            String status,
            Instant createdAt
    ) {
    }
}

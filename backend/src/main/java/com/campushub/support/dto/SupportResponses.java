package com.campushub.support.dto;

import com.campushub.support.model.SupportCategory;
import com.campushub.support.model.SupportPriority;
import com.campushub.support.model.SupportRelatedEntityType;
import com.campushub.support.model.SupportSenderType;
import com.campushub.support.model.SupportStatus;
import java.time.Instant;
import java.util.List;

public final class SupportResponses {

    private SupportResponses() {
    }

    public record TicketStats(
            long total,
            long open,
            long inProgress,
            long resolved,
            long closed
    ) {
    }

    public record Pagination(
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean hasMore
    ) {
    }

    public record TicketSummary(
            Long id,
            String ticketNumber,
            SupportCategory category,
            String subject,
            SupportStatus status,
            SupportPriority priority,
            Instant createdAt,
            Instant updatedAt,
            String lastReplyBy,
            String submittedBy,
            String userEmail,
            String collegeName,
            String assignedAdmin
    ) {
    }

    public record TicketPage(
            TicketStats stats,
            List<TicketSummary> tickets,
            Pagination pagination
    ) {
    }

    public record ReplyItem(
            Long id,
            SupportSenderType senderType,
            String senderName,
            String message,
            boolean internalNote,
            Instant createdAt
    ) {
    }

    public record AttachmentItem(
            Long id,
            String fileName,
            String fileType,
            long fileSize,
            String downloadUrl,
            Long replyId,
            Instant createdAt
    ) {
    }

    public record StatusHistoryItem(
            Long id,
            SupportStatus oldStatus,
            SupportStatus newStatus,
            String changedBy,
            String changedByRole,
            String note,
            Instant createdAt
    ) {
    }

    public record Submitter(
            Long userId,
            String name,
            String email,
            String collegeName,
            boolean guest
    ) {
    }

    public record TicketDetails(
            Long id,
            String ticketNumber,
            SupportCategory category,
            String subject,
            String description,
            SupportStatus status,
            SupportPriority priority,
            SupportRelatedEntityType relatedEntityType,
            Long relatedEntityId,
            Instant createdAt,
            Instant updatedAt,
            Instant resolvedAt,
            Instant closedAt,
            Submitter submitter,
            String assignedAdmin,
            List<ReplyItem> replies,
            List<AttachmentItem> attachments,
            List<StatusHistoryItem> statusHistory
    ) {
    }

    public record TicketCreated(
            Long id,
            String ticketNumber,
            SupportStatus status,
            SupportPriority priority,
            Instant createdAt
    ) {
    }

    public record TicketAction(
            Long id,
            String ticketNumber,
            SupportStatus status,
            Instant updatedAt
    ) {
    }

    public record PublicSubmission(String ticketNumber, Instant submittedAt) {
    }
}

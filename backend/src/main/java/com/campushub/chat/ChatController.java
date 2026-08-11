package com.campushub.chat;

import com.campushub.chat.dto.ChatMessageReportRequest;
import com.campushub.chat.dto.ChatMessageRequest;
import com.campushub.chat.dto.ChatResponses.ConversationAction;
import com.campushub.chat.dto.ChatResponses.ConversationDetails;
import com.campushub.chat.dto.ChatResponses.ConversationPage;
import com.campushub.chat.dto.ChatResponses.MessageItem;
import com.campushub.chat.dto.ChatResponses.MessagePage;
import com.campushub.chat.dto.ChatResponses.ReadReceipt;
import com.campushub.chat.dto.ChatResponses.ReportResult;
import com.campushub.chat.dto.ChatResponses.UnreadCount;
import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/conversations")
    public ApiResponse<ConversationPage> conversations(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean archived,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(
                "Conversations loaded",
                chatService.getConversations(
                        userId(authenticatedUser), search, archived, page, size
                )
        );
    }

    @PostMapping("/conversations/listing/{listingId}")
    public ApiResponse<ConversationDetails> createForListing(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Conversation ready",
                chatService.createForListing(userId(authenticatedUser), listingId)
        );
    }

    @PostMapping("/conversations/order/{orderId}")
    public ApiResponse<ConversationDetails> createForOrder(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long orderId
    ) {
        return ApiResponse.success(
                "Order conversation ready",
                chatService.createForOrder(userId(authenticatedUser), orderId)
        );
    }

    @GetMapping("/conversations/{conversationId}")
    public ApiResponse<ConversationDetails> conversation(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long conversationId
    ) {
        return ApiResponse.success(
                "Conversation loaded",
                chatService.getConversation(userId(authenticatedUser), conversationId)
        );
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ApiResponse<MessagePage> messages(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ) {
        return ApiResponse.success(
                "Messages loaded",
                chatService.getMessages(
                        userId(authenticatedUser), conversationId, page, size
                )
        );
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ApiResponse<MessageItem> sendMessage(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long conversationId,
            @Valid @RequestBody ChatMessageRequest request
    ) {
        return ApiResponse.success(
                "Message sent",
                chatService.sendMessage(
                        userId(authenticatedUser), conversationId, request.message()
                )
        );
    }

    @PatchMapping("/conversations/{conversationId}/read")
    public ApiResponse<ReadReceipt> markRead(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long conversationId
    ) {
        return ApiResponse.success(
                "Conversation marked as read",
                chatService.markRead(userId(authenticatedUser), conversationId)
        );
    }

    @PatchMapping("/conversations/{conversationId}/archive")
    public ApiResponse<ConversationAction> archive(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long conversationId
    ) {
        return ApiResponse.success(
                "Conversation archived",
                chatService.setArchived(userId(authenticatedUser), conversationId, true)
        );
    }

    @PatchMapping("/conversations/{conversationId}/unarchive")
    public ApiResponse<ConversationAction> unarchive(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long conversationId
    ) {
        return ApiResponse.success(
                "Conversation restored",
                chatService.setArchived(userId(authenticatedUser), conversationId, false)
        );
    }

    @GetMapping("/unread-count")
    public ApiResponse<UnreadCount> unreadCount(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(
                "Unread chat count loaded",
                chatService.getUnreadCount(userId(authenticatedUser))
        );
    }

    @PostMapping("/messages/{messageId}/report")
    public ApiResponse<ReportResult> reportMessage(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long messageId,
            @Valid @RequestBody ChatMessageReportRequest request
    ) {
        return ApiResponse.success(
                "Message reported for moderation",
                chatService.reportMessage(userId(authenticatedUser), messageId, request)
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}

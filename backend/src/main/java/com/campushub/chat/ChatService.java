package com.campushub.chat;

import com.campushub.chat.dto.ChatMessageReportRequest;
import com.campushub.chat.dto.ChatResponses.ConversationAction;
import com.campushub.chat.dto.ChatResponses.ConversationDetails;
import com.campushub.chat.dto.ChatResponses.ConversationPage;
import com.campushub.chat.dto.ChatResponses.ConversationSummary;
import com.campushub.chat.dto.ChatResponses.LastMessage;
import com.campushub.chat.dto.ChatResponses.ListingSummary;
import com.campushub.chat.dto.ChatResponses.MessageItem;
import com.campushub.chat.dto.ChatResponses.MessagePage;
import com.campushub.chat.dto.ChatResponses.OrderSummary;
import com.campushub.chat.dto.ChatResponses.ReadReceipt;
import com.campushub.chat.dto.ChatResponses.ReportResult;
import com.campushub.chat.dto.ChatResponses.UnreadCount;
import com.campushub.chat.dto.ChatResponses.UserSummary;
import com.campushub.chat.model.ChatConversation;
import com.campushub.chat.model.ChatMessage;
import com.campushub.chat.model.ChatMessageReport;
import com.campushub.chat.model.ChatMessageStatus;
import com.campushub.chat.model.ChatMessageType;
import com.campushub.chat.model.ChatReportReason;
import com.campushub.chat.model.ConversationParticipant;
import com.campushub.chat.model.ConversationParticipantRole;
import com.campushub.chat.model.ConversationStatus;
import com.campushub.chat.repository.ChatConversationRepository;
import com.campushub.chat.repository.ChatMessageReportRepository;
import com.campushub.chat.repository.ChatMessageRepository;
import com.campushub.chat.repository.ConversationParticipantRepository;
import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceConflictException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.notification.NotificationService;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.order.model.MarketplaceOrder;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.review.repository.SellerReviewRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {

    private static final int MAX_CONVERSATION_PAGE_SIZE = 50;
    private static final int MAX_MESSAGE_PAGE_SIZE = 100;
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "(?i)\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b"
    );
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "(?<!\\d)(?:\\+?91[-\\s]?)?[6-9]\\d{9}(?!\\d)"
    );
    private static final Pattern PAYMENT_SECRET_PATTERN = Pattern.compile(
            "(?i)\\b(?:otp|password|upi\\s*pin|pin|cvv)\\b\\s*[:=\\-]?\\s*[A-Z0-9@!#$%^&*]{3,}"
    );
    private static final Pattern CARD_PATTERN = Pattern.compile(
            "(?<!\\d)(?:\\d[ -]?){13,19}(?!\\d)"
    );

    private final ChatConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatMessageReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final MarketplaceOrderRepository orderRepository;
    private final SellerReviewRepository reviewRepository;
    private final NotificationService notificationService;
    private final ChatMessageRateLimiter rateLimiter;

    public ChatService(
            ChatConversationRepository conversationRepository,
            ConversationParticipantRepository participantRepository,
            ChatMessageRepository messageRepository,
            ChatMessageReportRepository reportRepository,
            UserRepository userRepository,
            ListingRepository listingRepository,
            MarketplaceOrderRepository orderRepository,
            SellerReviewRepository reviewRepository,
            NotificationService notificationService,
            ChatMessageRateLimiter rateLimiter
    ) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.notificationService = notificationService;
        this.rateLimiter = rateLimiter;
    }

    @Transactional
    public ConversationDetails createForListing(Long userId, Long listingId) {
        User buyer = loadEligibleStudent(userId);
        Listing listing = listingRepository.findChatListingById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing was not found."));
        User seller = listing.getSeller();
        ensureEligibleStudent(seller);
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new BadRequestException("Only active listings can start a conversation.");
        }
        validateListingConversation(buyer, seller, listing);
        ChatConversation conversation = findOrCreate(listing, null, buyer, seller);
        return details(conversation, buyer.getId());
    }

    @Transactional
    public ConversationDetails createForOrder(Long userId, Long orderId) {
        User user = loadEligibleStudent(userId);
        MarketplaceOrder order = orderRepository.findChatOrderById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order was not found."));
        boolean buyerAccess = order.getBuyer().getId().equals(user.getId());
        boolean sellerAccess = order.getSeller().getId().equals(user.getId());
        if (!buyerAccess && !sellerAccess) {
            throw new ForbiddenException("You are not a participant in this order.");
        }
        ensureEligibleStudent(order.getBuyer());
        ensureEligibleStudent(order.getSeller());
        if (!order.getBuyer().getCollege().getId().equals(order.getSeller().getCollege().getId())) {
            throw new ForbiddenException("Cross-college conversations are not available.");
        }
        ChatConversation conversation = findOrCreate(
                order.getListing(),
                order,
                order.getBuyer(),
                order.getSeller()
        );
        conversation.linkOrder(order);
        conversationRepository.save(conversation);
        participant(conversation.getId(), user.getId()).setArchived(false);
        return details(conversation, user.getId());
    }

    @Transactional(readOnly = true)
    public ConversationPage getConversations(
            Long userId,
            String search,
            boolean archived,
            int page,
            int size
    ) {
        User user = loadEligibleStudent(userId);
        validatePage(page, size, MAX_CONVERSATION_PAGE_SIZE);
        String safeSearch = normalizeSearch(search);
        Page<ChatConversation> result = conversationRepository.findForUser(
                user.getId(),
                archived,
                safeSearch,
                PageRequest.of(page, size)
        );
        List<Long> ids = result.getContent().stream().map(ChatConversation::getId).toList();
        Map<Long, ConversationParticipant> participants = ids.isEmpty()
                ? Map.of()
                : participantRepository.findAllByConversationIdInAndUserId(ids, user.getId())
                        .stream()
                        .collect(Collectors.toMap(
                                item -> item.getConversation().getId(),
                                Function.identity()
                        ));
        List<ConversationSummary> conversations = result.getContent().stream()
                .map(item -> toSummary(item, user.getId(), participants.get(item.getId())))
                .toList();
        return new ConversationPage(
                conversations,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext()
        );
    }

    @Transactional(readOnly = true)
    public ConversationDetails getConversation(Long userId, Long conversationId) {
        User user = loadEligibleStudent(userId);
        ChatConversation conversation = accessibleConversation(conversationId, user.getId());
        return details(conversation, user.getId());
    }

    @Transactional(readOnly = true)
    public MessagePage getMessages(
            Long userId,
            Long conversationId,
            int page,
            int size
    ) {
        User user = loadEligibleStudent(userId);
        accessibleConversation(conversationId, user.getId());
        validatePage(page, size, MAX_MESSAGE_PAGE_SIZE);
        Page<ChatMessage> result = messageRepository
                .findByConversationIdAndDeletedFalseOrderByCreatedAtDesc(
                        conversationId,
                        PageRequest.of(page, size)
                );
        List<ChatMessage> ordered = new ArrayList<>(result.getContent());
        Collections.reverse(ordered);
        List<MessageItem> messages = ordered.stream()
                .map(item -> toMessage(item, user.getId()))
                .toList();
        return new MessagePage(
                messages,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext()
        );
    }

    @Transactional
    public MessageItem sendMessage(Long userId, Long conversationId, String rawMessage) {
        User sender = loadEligibleStudent(userId);
        ChatConversation conversation = accessibleConversation(conversationId, sender.getId());
        if (conversation.getStatus() != ConversationStatus.ACTIVE) {
            throw new ForbiddenException("This conversation is not accepting new messages.");
        }
        String message = normalizeMessage(rawMessage);
        rateLimiter.checkAllowed(sender.getId());
        User receiver = otherUser(conversation, sender.getId());
        ensureEligibleStudent(receiver);
        ChatMessage saved = messageRepository.save(new ChatMessage(
                conversation,
                sender,
                receiver,
                ChatMessageType.TEXT,
                message
        ));
        conversation.recordMessage(saved.getId(), saved.getCreatedAt());
        conversationRepository.save(conversation);
        ConversationParticipant senderParticipant = participant(
                conversation.getId(), sender.getId()
        );
        senderParticipant.setArchived(false);
        ConversationParticipant receiverParticipant = participant(
                conversation.getId(), receiver.getId()
        );
        receiverParticipant.incrementUnread();
        receiverParticipant.setArchived(false);
        notificationService.notify(
                receiver,
                NotificationType.CHAT,
                NotificationPriority.MEDIUM,
                "New message from " + sender.getFullName(),
                "You have a new message about " + conversation.getListing().getTitle() + ".",
                RelatedEntityType.CHAT,
                conversation.getId(),
                "/student/chats/" + conversation.getId()
        );
        return toMessage(saved, sender.getId());
    }

    @Transactional
    public ReadReceipt markRead(Long userId, Long conversationId) {
        User user = loadEligibleStudent(userId);
        accessibleConversation(conversationId, user.getId());
        Instant readAt = Instant.now();
        int updated = messageRepository.markReceivedMessagesRead(
                conversationId,
                user.getId(),
                ChatMessageStatus.READ,
                readAt
        );
        Long lastMessageId = messageRepository
                .findTopByConversationIdAndDeletedFalseOrderByCreatedAtDesc(conversationId)
                .map(ChatMessage::getId)
                .orElse(null);
        ConversationParticipant participant = participant(conversationId, user.getId());
        participant.markRead(lastMessageId, readAt);
        return new ReadReceipt(
                conversationId,
                updated,
                participantRepository.sumUnreadCountByUserId(user.getId()),
                readAt
        );
    }

    @Transactional(readOnly = true)
    public UnreadCount getUnreadCount(Long userId) {
        User user = loadEligibleStudent(userId);
        return new UnreadCount(participantRepository.sumUnreadCountByUserId(user.getId()));
    }

    @Transactional
    public ConversationAction setArchived(
            Long userId,
            Long conversationId,
            boolean archived
    ) {
        User user = loadEligibleStudent(userId);
        accessibleConversation(conversationId, user.getId());
        ConversationParticipant participant = participant(conversationId, user.getId());
        participant.setArchived(archived);
        return new ConversationAction(conversationId, archived, participant.getUpdatedAt());
    }

    @Transactional
    public ReportResult reportMessage(
            Long userId,
            Long messageId,
            ChatMessageReportRequest request
    ) {
        User reporter = loadEligibleStudent(userId);
        ChatMessage message = messageRepository.findReportableById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message was not found."));
        accessibleConversation(message.getConversation().getId(), reporter.getId());
        if (message.getType() != ChatMessageType.TEXT || message.getSender() == null) {
            throw new BadRequestException("This message cannot be reported.");
        }
        if (message.getSender().getId().equals(reporter.getId())) {
            throw new BadRequestException("You cannot report your own message.");
        }
        if (reportRepository.existsByMessageIdAndReporterId(messageId, reporter.getId())) {
            throw new ResourceConflictException("You have already reported this message.");
        }
        ChatReportReason reason = parseReason(request.reason());
        String description = normalizeDescription(request.description());
        if (reason == ChatReportReason.OTHER && description == null) {
            throw new BadRequestException("Please describe why you are reporting this message.");
        }
        ChatMessageReport report = reportRepository.save(new ChatMessageReport(
                message,
                reporter,
                message.getSender(),
                reason,
                description
        ));
        userRepository.findAllByRoleIn(List.of(UserRole.ADMIN, UserRole.SUPER_ADMIN))
                .stream()
                .filter(admin -> admin.getStatus() == AccountStatus.ACTIVE)
                .forEach(admin -> notificationService.notify(
                        admin,
                        NotificationType.REPORT,
                        NotificationPriority.HIGH,
                        "Chat safety report received",
                        "A private chat message was reported for moderation.",
                        RelatedEntityType.CHAT,
                        report.getId(),
                        null
                ));
        return new ReportResult(
                report.getId(),
                report.getStatus().name(),
                report.getCreatedAt()
        );
    }

    private ChatConversation findOrCreate(
            Listing listing,
            MarketplaceOrder order,
            User buyer,
            User seller
    ) {
        ChatConversation existing = conversationRepository
                .findByBuyerIdAndSellerIdAndListingId(
                        buyer.getId(), seller.getId(), listing.getId()
                )
                .orElse(null);
        if (existing != null) {
            participant(existing.getId(), buyer.getId()).setArchived(false);
            return existing;
        }
        ChatConversation conversation = conversationRepository.save(
                new ChatConversation(listing, order, buyer, seller)
        );
        participantRepository.saveAll(List.of(
                new ConversationParticipant(
                        conversation, buyer, ConversationParticipantRole.BUYER
                ),
                new ConversationParticipant(
                        conversation, seller, ConversationParticipantRole.SELLER
                )
        ));
        ChatMessage systemMessage = messageRepository.save(new ChatMessage(
                conversation,
                null,
                null,
                ChatMessageType.SYSTEM,
                "Conversation started for " + listing.getTitle() + "."
        ));
        conversation.recordMessage(systemMessage.getId(), systemMessage.getCreatedAt());
        return conversationRepository.save(conversation);
    }

    private ConversationDetails details(ChatConversation conversation, Long userId) {
        ConversationParticipant participant = participant(conversation.getId(), userId);
        return new ConversationDetails(
                toSummary(conversation, userId, participant),
                participant.getRole().name()
        );
    }

    private ConversationSummary toSummary(
            ChatConversation conversation,
            Long userId,
            ConversationParticipant participant
    ) {
        User other = otherUser(conversation, userId);
        ChatMessage last = conversation.getLastMessageId() == null
                ? null
                : messageRepository.findById(conversation.getLastMessageId()).orElse(null);
        return new ConversationSummary(
                conversation.getId(),
                conversation.getConversationNumber(),
                conversation.getStatus().name(),
                toUser(other),
                toListing(conversation.getListing()),
                toOrder(conversation.getOrder()),
                last == null ? null : new LastMessage(
                        last.getId(),
                        last.getMessage(),
                        last.getType().name(),
                        last.getSender() == null ? null : last.getSender().getId(),
                        last.getCreatedAt()
                ),
                conversation.getLastMessageAt(),
                participant == null ? 0 : participant.getUnreadCount(),
                participant != null && participant.isArchived(),
                participant != null && participant.isMuted()
        );
    }

    private UserSummary toUser(User user) {
        int trustScore = user.getTrustScore() == null ? 0 : user.getTrustScore().getScore();
        double rating = Math.round(reviewRepository.averageRatingByRevieweeId(user.getId()) * 10.0)
                / 10.0;
        return new UserSummary(
                user.getId(),
                user.getFullName(),
                user.getProfilePhotoUrl(),
                user.isEmailVerified() && user.isPhoneVerified(),
                trustScore,
                rating,
                user.getCollege().getName()
        );
    }

    private ListingSummary toListing(Listing listing) {
        return new ListingSummary(
                listing.getId(),
                listing.getTitle(),
                listing.getPrice(),
                listing.getCondition().name(),
                listing.getPrimaryImageUrl(),
                listing.getStatus().name()
        );
    }

    private OrderSummary toOrder(MarketplaceOrder order) {
        if (order == null) return null;
        return new OrderSummary(order.getId(), order.getOrderNumber(), order.getStatus().name());
    }

    private MessageItem toMessage(ChatMessage message, Long userId) {
        boolean sentByMe = message.getSender() != null
                && message.getSender().getId().equals(userId);
        return new MessageItem(
                message.getId(),
                message.getType().name(),
                message.getMessage(),
                message.getStatus().name(),
                sentByMe,
                message.getSender() == null ? null : message.getSender().getId(),
                message.getCreatedAt(),
                message.getReadAt(),
                message.getType() == ChatMessageType.TEXT && !sentByMe
        );
    }

    private User loadEligibleStudent(Long userId) {
        User user = userRepository.findChatUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Campus Hub account was not found."
                ));
        ensureEligibleStudent(user);
        return user;
    }

    private void ensureEligibleStudent(User user) {
        if (user.getRole() != UserRole.STUDENT
                || user.getStatus() != AccountStatus.ACTIVE
                || !user.isEmailVerified()
                || !user.isPhoneVerified()) {
            throw new ForbiddenException(
                    "Chat is available only to active students with verified email and phone."
            );
        }
    }

    private void validateListingConversation(User buyer, User seller, Listing listing) {
        if (buyer.getId().equals(seller.getId())) {
            throw new BadRequestException("You cannot message yourself about your own listing.");
        }
        if (!buyer.getCollege().getId().equals(listing.getCollege().getId())
                || !seller.getCollege().getId().equals(listing.getCollege().getId())) {
            throw new ForbiddenException("Cross-college conversations are not available.");
        }
    }

    private ChatConversation accessibleConversation(Long conversationId, Long userId) {
        return conversationRepository.findAccessibleById(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Conversation was not found."
                ));
    }

    private ConversationParticipant participant(Long conversationId, Long userId) {
        return participantRepository.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Conversation participant was not found."
                ));
    }

    private User otherUser(ChatConversation conversation, Long userId) {
        if (conversation.getBuyer().getId().equals(userId)) return conversation.getSeller();
        if (conversation.getSeller().getId().equals(userId)) return conversation.getBuyer();
        throw new ForbiddenException("You are not a participant in this conversation.");
    }

    private String normalizeMessage(String value) {
        if (value == null) throw new BadRequestException("Message is required.");
        String safe = value.replaceAll("(?s)<[^>]*>", "")
                .replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "")
                .replace("\r\n", "\n")
                .trim();
        if (safe.isBlank()) throw new BadRequestException("Message cannot be empty.");
        if (safe.length() > 1000) {
            throw new BadRequestException("Message must be 1000 characters or fewer.");
        }
        if (EMAIL_PATTERN.matcher(safe).find()
                || PHONE_PATTERN.matcher(safe).find()
                || PAYMENT_SECRET_PATTERN.matcher(safe).find()
                || CARD_PATTERN.matcher(safe).find()) {
            throw new BadRequestException(
                    "For your safety, do not share contact details, passwords, OTPs, PINs, or card information in chat."
            );
        }
        return safe;
    }

    private String normalizeDescription(String value) {
        if (value == null || value.isBlank()) return null;
        String safe = value.replaceAll("(?s)<[^>]*>", "")
                .replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "")
                .trim();
        if (safe.length() > 500) {
            throw new BadRequestException("Report details must be 500 characters or fewer.");
        }
        if (EMAIL_PATTERN.matcher(safe).find() || PHONE_PATTERN.matcher(safe).find()) {
            throw new BadRequestException("Do not include private contact details in reports.");
        }
        return safe.isBlank() ? null : safe;
    }

    private ChatReportReason parseReason(String value) {
        try {
            return ChatReportReason.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new BadRequestException("Unsupported chat report reason.");
        }
    }

    private String normalizeSearch(String value) {
        if (value == null || value.isBlank()) return "";
        String safe = value.trim().replaceAll("[\\p{Cntrl}]", "");
        return safe.substring(0, Math.min(100, safe.length()));
    }

    private void validatePage(int page, int size, int maximumSize) {
        if (page < 0 || size < 1 || size > maximumSize) {
            throw new BadRequestException(
                    "Page must be 0 or greater and size must be between 1 and "
                            + maximumSize + "."
            );
        }
    }
}

package com.campushub.support;

import com.campushub.admin.AdminAccessService;
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
import com.campushub.payment.model.Payment;
import com.campushub.payment.repository.PaymentRepository;
import com.campushub.report.model.Report;
import com.campushub.report.repository.ReportRepository;
import com.campushub.review.model.SellerReview;
import com.campushub.review.repository.SellerReviewRepository;
import com.campushub.support.attachment.StoredSupportAttachment;
import com.campushub.support.attachment.SupportAttachmentStorage;
import com.campushub.support.dto.PublicSupportRequest;
import com.campushub.support.dto.SupportInternalNoteRequest;
import com.campushub.support.dto.SupportReplyRequest;
import com.campushub.support.dto.SupportResponses.AttachmentItem;
import com.campushub.support.dto.SupportResponses.Pagination;
import com.campushub.support.dto.SupportResponses.PublicSubmission;
import com.campushub.support.dto.SupportResponses.ReplyItem;
import com.campushub.support.dto.SupportResponses.StatusHistoryItem;
import com.campushub.support.dto.SupportResponses.Submitter;
import com.campushub.support.dto.SupportResponses.TicketAction;
import com.campushub.support.dto.SupportResponses.TicketCreated;
import com.campushub.support.dto.SupportResponses.TicketDetails;
import com.campushub.support.dto.SupportResponses.TicketPage;
import com.campushub.support.dto.SupportResponses.TicketStats;
import com.campushub.support.dto.SupportResponses.TicketSummary;
import com.campushub.support.dto.SupportStatusUpdateRequest;
import com.campushub.support.dto.SupportTicketRequest;
import com.campushub.support.model.SupportCategory;
import com.campushub.support.model.SupportPriority;
import com.campushub.support.model.SupportRelatedEntityType;
import com.campushub.support.model.SupportSenderType;
import com.campushub.support.model.SupportStatus;
import com.campushub.support.model.SupportTicket;
import com.campushub.support.model.SupportTicketAttachment;
import com.campushub.support.model.SupportTicketReply;
import com.campushub.support.model.SupportTicketStatusHistory;
import com.campushub.support.repository.SupportTicketAttachmentRepository;
import com.campushub.support.repository.SupportTicketReplyRepository;
import com.campushub.support.repository.SupportTicketRepository;
import com.campushub.support.repository.SupportTicketStatusHistoryRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SupportService {

    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_ATTACHMENTS = 3;
    private static final Set<SupportStatus> TERMINAL_STATUSES = Set.of(
            SupportStatus.CLOSED,
            SupportStatus.REJECTED,
            SupportStatus.SPAM
    );
    private static final Set<SupportStatus> ADMIN_STATUSES = Set.of(
            SupportStatus.OPEN,
            SupportStatus.IN_PROGRESS,
            SupportStatus.WAITING_FOR_USER,
            SupportStatus.RESOLVED,
            SupportStatus.CLOSED,
            SupportStatus.REJECTED,
            SupportStatus.SPAM
    );
    private static final Pattern HTML_TAG = Pattern.compile("<[^>]*>");
    private static final Pattern PASSWORD_SECRET = Pattern.compile(
            "(?i)(password|passcode|upi\\s*pin|otp)\\s*(is|:|=)\\s*\\S+"
    );
    private static final Pattern CARD_NUMBER = Pattern.compile("(?:\\d[ -]*?){13,19}");

    private final UserRepository userRepository;
    private final SupportTicketRepository ticketRepository;
    private final SupportTicketReplyRepository replyRepository;
    private final SupportTicketAttachmentRepository attachmentRepository;
    private final SupportTicketStatusHistoryRepository historyRepository;
    private final ListingRepository listingRepository;
    private final MarketplaceOrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ReportRepository reportRepository;
    private final SellerReviewRepository reviewRepository;
    private final SupportAttachmentStorage attachmentStorage;
    private final NotificationService notificationService;
    private final AdminAccessService adminAccessService;
    private final PublicSupportRateLimiter publicRateLimiter;

    public SupportService(
            UserRepository userRepository,
            SupportTicketRepository ticketRepository,
            SupportTicketReplyRepository replyRepository,
            SupportTicketAttachmentRepository attachmentRepository,
            SupportTicketStatusHistoryRepository historyRepository,
            ListingRepository listingRepository,
            MarketplaceOrderRepository orderRepository,
            PaymentRepository paymentRepository,
            ReportRepository reportRepository,
            SellerReviewRepository reviewRepository,
            SupportAttachmentStorage attachmentStorage,
            NotificationService notificationService,
            AdminAccessService adminAccessService,
            PublicSupportRateLimiter publicRateLimiter
    ) {
        this.userRepository = userRepository;
        this.ticketRepository = ticketRepository;
        this.replyRepository = replyRepository;
        this.attachmentRepository = attachmentRepository;
        this.historyRepository = historyRepository;
        this.listingRepository = listingRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.reportRepository = reportRepository;
        this.reviewRepository = reviewRepository;
        this.attachmentStorage = attachmentStorage;
        this.notificationService = notificationService;
        this.adminAccessService = adminAccessService;
        this.publicRateLimiter = publicRateLimiter;
    }

    @Transactional(readOnly = true)
    public TicketPage getStudentTickets(
            Long authenticatedUserId,
            String status,
            String search,
            Integer requestedPage,
            Integer requestedSize
    ) {
        User student = requireActiveStudent(authenticatedUserId);
        PageRequest pageRequest = pageRequest(requestedPage, requestedSize);
        SupportStatus parsedStatus = parseStatus(status);
        String normalizedSearch = cleanOptional(search, 120);
        Specification<SupportTicket> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("user").get("id"), student.getId()));
            if (parsedStatus != null) {
                predicates.add(builder.equal(root.get("status"), parsedStatus));
            }
            if (normalizedSearch != null) {
                String keyword = "%" + normalizedSearch.toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("ticketNumber")), keyword),
                        builder.like(builder.lower(root.get("subject")), keyword)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        Page<SupportTicket> result = ticketRepository.findAll(specification, pageRequest);
        return new TicketPage(
                studentStats(student.getId()),
                result.getContent().stream().map(this::toSummary).toList(),
                pagination(result)
        );
    }

    @Transactional
    public TicketCreated createStudentTicket(
            Long authenticatedUserId,
            SupportTicketRequest request,
            List<MultipartFile> files
    ) {
        User student = requireActiveStudent(authenticatedUserId);
        String subject = sanitizeRequired(request.subject(), 120);
        String description = sanitizeRequired(request.description(), 2000);
        rejectSecrets(subject + " " + description);
        SupportRelatedEntityType relatedType = request.relatedEntityType() == null
                ? SupportRelatedEntityType.NONE
                : request.relatedEntityType();
        validateRelatedEntity(student, relatedType, request.relatedEntityId());
        SupportTicket ticket = ticketRepository.save(new SupportTicketBuilder()
                .student(student)
                .request(request, subject, description)
                .build());
        historyRepository.save(new SupportTicketStatusHistory(
                ticket, null, SupportStatus.OPEN, student, UserRole.STUDENT.name(),
                "Support ticket created"
        ));
        storeAttachments(ticket, null, student, files);
        notificationService.notify(
                student,
                NotificationType.SUPPORT,
                notificationPriority(ticket.getPriority()),
                "Support ticket created",
                ticket.getTicketNumber() + " has been submitted to Campus Hub support.",
                RelatedEntityType.SUPPORT,
                ticket.getId(),
                "/student/support/" + ticket.getId()
        );
        notifyAdmins(ticket);
        return created(ticket);
    }

    @Transactional
    public PublicSubmission createPublicTicket(
            PublicSupportRequest request,
            List<MultipartFile> files,
            String remoteAddress
    ) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        publicRateLimiter.check(remoteAddress, email);
        String name = sanitizeRequired(request.fullName(), 120);
        String subject = sanitizeRequired(request.subject(), 120);
        String description = sanitizeRequired(request.description(), 2000);
        rejectSecrets(subject + " " + description);
        SupportTicket ticket = ticketRepository.save(SupportTicket.forGuest(
                name,
                email,
                request.category(),
                subject,
                description,
                priorityFor(request.category())
        ));
        historyRepository.save(new SupportTicketStatusHistory(
                ticket, null, SupportStatus.OPEN, null, SupportSenderType.GUEST.name(),
                "Public support request created"
        ));
        storeAttachments(ticket, null, null, files);
        notifyAdmins(ticket);
        return new PublicSubmission(ticket.getTicketNumber(), ticket.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public TicketDetails getStudentTicket(Long authenticatedUserId, Long ticketId) {
        User student = requireActiveStudent(authenticatedUserId);
        SupportTicket ticket = ticketRepository
                .findDetailedByIdAndUserId(ticketId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket was not found."));
        return details(ticket, false);
    }

    @Transactional
    public TicketAction addStudentReply(
            Long authenticatedUserId,
            Long ticketId,
            SupportReplyRequest request,
            List<MultipartFile> files
    ) {
        User student = requireActiveStudent(authenticatedUserId);
        SupportTicket ticket = ticketRepository
                .findDetailedByIdAndUserId(ticketId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket was not found."));
        ensureReplyAllowed(ticket);
        String message = sanitizeRequired(request.message(), 2000);
        rejectSecrets(message);
        SupportTicketReply reply = replyRepository.save(new SupportTicketReply(
                ticket, student, SupportSenderType.STUDENT, message, false
        ));
        ticket.recordReply(SupportSenderType.STUDENT);
        ticketRepository.save(ticket);
        storeAttachments(ticket, reply, student, files);
        notifyAdminsOfReply(ticket);
        return action(ticket);
    }

    @Transactional
    public TicketAction closeStudentTicket(Long authenticatedUserId, Long ticketId) {
        User student = requireActiveStudent(authenticatedUserId);
        SupportTicket ticket = ticketRepository
                .findDetailedByIdAndUserId(ticketId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket was not found."));
        if (ticket.getStatus() == SupportStatus.CLOSED) {
            throw new ResourceConflictException("This ticket is already closed.");
        }
        SupportStatus previous = ticket.getStatus();
        ticket.transitionTo(SupportStatus.CLOSED);
        ticketRepository.save(ticket);
        historyRepository.save(new SupportTicketStatusHistory(
                ticket, previous, SupportStatus.CLOSED, student, UserRole.STUDENT.name(),
                "Closed by student"
        ));
        return action(ticket);
    }

    @Transactional(readOnly = true)
    public TicketPage getAdminTickets(
            Long authenticatedAdminId,
            String status,
            String priority,
            String category,
            String search,
            Long collegeId,
            Integer requestedPage,
            Integer requestedSize
    ) {
        adminAccessService.requireActiveAdmin(authenticatedAdminId);
        SupportStatus parsedStatus = parseStatus(status);
        SupportPriority parsedPriority = parsePriority(priority);
        SupportCategory parsedCategory = parseCategory(category);
        String normalizedSearch = cleanOptional(search, 120);
        Specification<SupportTicket> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (parsedStatus != null) predicates.add(builder.equal(root.get("status"), parsedStatus));
            if (parsedPriority != null) predicates.add(builder.equal(root.get("priority"), parsedPriority));
            if (parsedCategory != null) predicates.add(builder.equal(root.get("category"), parsedCategory));
            if (collegeId != null) predicates.add(builder.equal(root.get("user").get("college").get("id"), collegeId));
            if (normalizedSearch != null) {
                String keyword = "%" + normalizedSearch.toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("ticketNumber")), keyword),
                        builder.like(builder.lower(root.get("subject")), keyword),
                        builder.like(builder.lower(root.get("guestName")), keyword),
                        builder.like(builder.lower(root.get("guestEmail")), keyword),
                        builder.like(builder.lower(root.get("user").get("fullName")), keyword),
                        builder.like(builder.lower(root.get("user").get("email")), keyword)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        Page<SupportTicket> result = ticketRepository.findAll(
                specification,
                pageRequest(requestedPage, requestedSize)
        );
        return new TicketPage(
                adminStats(),
                result.getContent().stream().map(this::toSummary).toList(),
                pagination(result)
        );
    }

    @Transactional(readOnly = true)
    public TicketDetails getAdminTicket(Long authenticatedAdminId, Long ticketId) {
        adminAccessService.requireActiveAdmin(authenticatedAdminId);
        SupportTicket ticket = ticketRepository.findDetailedById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket was not found."));
        return details(ticket, true);
    }

    @Transactional
    public TicketAction addAdminReply(
            Long authenticatedAdminId,
            Long ticketId,
            SupportReplyRequest request,
            List<MultipartFile> files
    ) {
        User admin = adminAccessService.requireActiveAdmin(authenticatedAdminId);
        SupportTicket ticket = loadTicket(ticketId);
        ensureReplyAllowed(ticket);
        String message = sanitizeRequired(request.message(), 2000);
        rejectSecrets(message);
        if (ticket.getAssignedAdmin() == null) ticket.assignTo(admin);
        SupportTicketReply reply = replyRepository.save(new SupportTicketReply(
                ticket, admin, SupportSenderType.ADMIN, message, false
        ));
        ticket.recordReply(SupportSenderType.ADMIN);
        ticketRepository.save(ticket);
        storeAttachments(ticket, reply, admin, files);
        notifyStudent(ticket, "Support replied to your ticket",
                "A support team member replied to " + ticket.getTicketNumber() + ".");
        return action(ticket);
    }

    @Transactional
    public TicketAction updateAdminStatus(
            Long authenticatedAdminId,
            Long ticketId,
            SupportStatusUpdateRequest request
    ) {
        User admin = adminAccessService.requireActiveAdmin(authenticatedAdminId);
        SupportTicket ticket = loadTicket(ticketId);
        if (!ADMIN_STATUSES.contains(request.status())) {
            throw new BadRequestException("Unsupported support ticket status.");
        }
        if (ticket.getStatus() == request.status()) {
            throw new ResourceConflictException("Ticket already has this status.");
        }
        SupportStatus previous = ticket.getStatus();
        String note = cleanOptional(request.note(), 500);
        ticket.transitionTo(request.status());
        if (ticket.getAssignedAdmin() == null) ticket.assignTo(admin);
        ticketRepository.save(ticket);
        historyRepository.save(new SupportTicketStatusHistory(
                ticket, previous, request.status(), admin, admin.getRole().name(), note
        ));
        notifyStudentForStatus(ticket);
        return action(ticket);
    }

    @Transactional
    public TicketAction addInternalNote(
            Long authenticatedAdminId,
            Long ticketId,
            SupportInternalNoteRequest request
    ) {
        User admin = adminAccessService.requireActiveAdmin(authenticatedAdminId);
        SupportTicket ticket = loadTicket(ticketId);
        String message = sanitizeRequired(request.message(), 2000);
        replyRepository.save(new SupportTicketReply(
                ticket, admin, SupportSenderType.ADMIN, message, true
        ));
        if (ticket.getAssignedAdmin() == null) ticket.assignTo(admin);
        ticketRepository.save(ticket);
        return action(ticket);
    }

    @Transactional(readOnly = true)
    public AttachmentDownload getAttachment(Long authenticatedUserId, Long attachmentId) {
        User viewer = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new ForbiddenException("Authenticated account was not found."));
        SupportTicketAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment was not found."));
        SupportTicket ticket = attachment.getTicket();
        boolean admin = viewer.getRole() == UserRole.ADMIN || viewer.getRole() == UserRole.SUPER_ADMIN;
        boolean owner = ticket.getUser() != null
                && ticket.getUser().getId().equals(viewer.getId());
        if (!admin && !owner) {
            throw new ForbiddenException("You do not have permission to view this attachment.");
        }
        Path path = attachmentStorage.resolve(attachment.getStorageKey());
        return new AttachmentDownload(
                path,
                attachment.getFileName(),
                attachment.getFileType(),
                attachment.getFileSize()
        );
    }

    private void validateRelatedEntity(
            User student,
            SupportRelatedEntityType type,
            Long entityId
    ) {
        if (type == SupportRelatedEntityType.NONE) {
            if (entityId != null) {
                throw new BadRequestException("Related entity ID is not allowed when Related To is None.");
            }
            return;
        }
        if (entityId == null || entityId < 1) {
            throw new BadRequestException("Related entity ID is required for the selected type.");
        }
        boolean allowed = switch (type) {
            case LISTING -> {
                Listing listing = listingRepository.findMarketplaceListingById(entityId)
                        .orElseThrow(() -> new ResourceNotFoundException("Related listing was not found."));
                yield listing.getSeller().getId().equals(student.getId())
                        || (listing.getStatus() != ListingStatus.BLOCKED
                        && listing.getStatus() != ListingStatus.DELETED);
            }
            case ORDER -> {
                MarketplaceOrder order = orderRepository.findOrderDetailsById(entityId)
                        .orElseThrow(() -> new ResourceNotFoundException("Related order was not found."));
                yield order.getBuyer().getId().equals(student.getId())
                        || order.getSeller().getId().equals(student.getId());
            }
            case PAYMENT -> {
                Payment payment = paymentRepository.findPaymentDetailsById(entityId)
                        .orElseThrow(() -> new ResourceNotFoundException("Related payment was not found."));
                yield payment.getBuyer().getId().equals(student.getId());
            }
            case REPORT -> {
                Report report = reportRepository.findDetailedById(entityId)
                        .orElseThrow(() -> new ResourceNotFoundException("Related report was not found."));
                yield report.getReporter().getId().equals(student.getId());
            }
            case REVIEW -> {
                SellerReview review = reviewRepository.findAdminReviewById(entityId)
                        .orElseThrow(() -> new ResourceNotFoundException("Related review was not found."));
                yield review.getReviewer().getId().equals(student.getId())
                        || review.getReviewee().getId().equals(student.getId());
            }
            case USER -> entityId.equals(student.getId());
            case NONE -> true;
        };
        if (!allowed) {
            throw new ForbiddenException("You cannot link this record to your support ticket.");
        }
    }

    private void storeAttachments(
            SupportTicket ticket,
            SupportTicketReply reply,
            User uploadedBy,
            List<MultipartFile> files
    ) {
        List<MultipartFile> safeFiles = files == null
                ? List.of()
                : files.stream().filter(file -> file != null && !file.isEmpty()).toList();
        if (safeFiles.size() > MAX_ATTACHMENTS) {
            throw new BadRequestException("A maximum of 3 attachments is allowed.");
        }
        for (MultipartFile file : safeFiles) {
            StoredSupportAttachment stored = attachmentStorage.store(file, ticket.getTicketNumber());
            attachmentRepository.save(new SupportTicketAttachment(
                    ticket,
                    reply,
                    stored.storageKey(),
                    stored.originalFileName(),
                    stored.contentType(),
                    stored.size(),
                    uploadedBy
            ));
        }
    }

    private TicketDetails details(SupportTicket ticket, boolean includeInternal) {
        List<SupportTicketReply> replies = includeInternal
                ? replyRepository.findAllByTicketIdOrderByCreatedAtAscIdAsc(ticket.getId())
                : replyRepository.findAllByTicketIdAndInternalNoteFalseOrderByCreatedAtAscIdAsc(ticket.getId());
        List<StatusHistoryItem> history = includeInternal
                ? historyRepository.findAllByTicketIdOrderByCreatedAtAscIdAsc(ticket.getId())
                .stream().map(this::toHistory).toList()
                : List.of();
        return new TicketDetails(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getCategory(),
                ticket.getSubject(),
                ticket.getDescription(),
                ticket.getStatus(),
                ticket.getPriority(),
                ticket.getRelatedEntityType(),
                ticket.getRelatedEntityId(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getResolvedAt(),
                ticket.getClosedAt(),
                submitter(ticket),
                ticket.getAssignedAdmin() == null ? null : ticket.getAssignedAdmin().getFullName(),
                replies.stream().map(this::toReply).toList(),
                attachmentRepository.findAllByTicketIdOrderByCreatedAtAscIdAsc(ticket.getId())
                        .stream().map(this::toAttachment).toList(),
                history
        );
    }

    private TicketSummary toSummary(SupportTicket ticket) {
        Submitter submitter = submitter(ticket);
        return new TicketSummary(
                ticket.getId(), ticket.getTicketNumber(), ticket.getCategory(), ticket.getSubject(),
                ticket.getStatus(), ticket.getPriority(), ticket.getCreatedAt(), ticket.getUpdatedAt(),
                ticket.getLastReplyBy(), submitter.name(), submitter.email(), submitter.collegeName(),
                ticket.getAssignedAdmin() == null ? null : ticket.getAssignedAdmin().getFullName()
        );
    }

    private Submitter submitter(SupportTicket ticket) {
        if (ticket.getUser() == null) {
            return new Submitter(null, ticket.getGuestName(), ticket.getGuestEmail(), null, true);
        }
        return new Submitter(
                ticket.getUser().getId(),
                ticket.getUser().getFullName(),
                ticket.getUser().getEmail(),
                ticket.getUser().getCollege().getName(),
                false
        );
    }

    private ReplyItem toReply(SupportTicketReply reply) {
        String senderName = reply.getSender() == null
                ? reply.getSenderType().name()
                : reply.getSender().getFullName();
        return new ReplyItem(
                reply.getId(), reply.getSenderType(), senderName, reply.getMessage(),
                reply.isInternalNote(), reply.getCreatedAt()
        );
    }

    private AttachmentItem toAttachment(SupportTicketAttachment attachment) {
        return new AttachmentItem(
                attachment.getId(), attachment.getFileName(), attachment.getFileType(),
                attachment.getFileSize(), "/api/support/attachments/" + attachment.getId(),
                attachment.getReply() == null ? null : attachment.getReply().getId(),
                attachment.getCreatedAt()
        );
    }

    private StatusHistoryItem toHistory(SupportTicketStatusHistory history) {
        return new StatusHistoryItem(
                history.getId(), history.getOldStatus(), history.getNewStatus(),
                history.getChangedBy() == null ? null : history.getChangedBy().getFullName(),
                history.getChangedByRole(), history.getNote(), history.getCreatedAt()
        );
    }

    private TicketStats studentStats(Long userId) {
        return new TicketStats(
                ticketRepository.countByUserId(userId),
                ticketRepository.countByUserIdAndStatus(userId, SupportStatus.OPEN),
                ticketRepository.countByUserIdAndStatus(userId, SupportStatus.IN_PROGRESS),
                ticketRepository.countByUserIdAndStatus(userId, SupportStatus.RESOLVED),
                ticketRepository.countByUserIdAndStatus(userId, SupportStatus.CLOSED)
        );
    }

    private TicketStats adminStats() {
        return new TicketStats(
                ticketRepository.count(),
                ticketRepository.countByStatus(SupportStatus.OPEN),
                ticketRepository.countByStatus(SupportStatus.IN_PROGRESS),
                ticketRepository.countByStatus(SupportStatus.RESOLVED),
                ticketRepository.countByStatus(SupportStatus.CLOSED)
        );
    }

    private PageRequest pageRequest(Integer requestedPage, Integer requestedSize) {
        int page = requestedPage == null ? 0 : requestedPage;
        int size = requestedSize == null ? DEFAULT_PAGE_SIZE : requestedSize;
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Invalid support ticket page request.");
        }
        return PageRequest.of(page, size, Sort.by(
                Sort.Order.desc("updatedAt"),
                Sort.Order.desc("id")
        ));
    }

    private Pagination pagination(Page<SupportTicket> page) {
        return new Pagination(
                page.getNumber(), page.getSize(), page.getTotalElements(),
                page.getTotalPages(), page.hasNext()
        );
    }

    private User requireActiveStudent(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ForbiddenException("Student account was not found."));
        if (user.getRole() != UserRole.STUDENT
                || user.getStatus() != AccountStatus.ACTIVE
                || !user.isEmailVerified()
                || !user.isPhoneVerified()) {
            throw new ForbiddenException("An active verified student account is required.");
        }
        return user;
    }

    private SupportTicket loadTicket(Long ticketId) {
        return ticketRepository.findDetailedById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket was not found."));
    }

    private void ensureReplyAllowed(SupportTicket ticket) {
        if (TERMINAL_STATUSES.contains(ticket.getStatus())) {
            throw new ResourceConflictException("This ticket is closed and cannot receive replies.");
        }
    }

    private void notifyAdmins(SupportTicket ticket) {
        userRepository.findAllByRoleIn(List.of(UserRole.ADMIN, UserRole.SUPER_ADMIN))
                .forEach(admin -> notificationService.notify(
                        admin,
                        NotificationType.SUPPORT,
                        notificationPriority(ticket.getPriority()),
                        ticket.getPriority() == SupportPriority.URGENT
                                ? "Urgent support ticket submitted"
                                : "New support ticket submitted",
                        ticket.getTicketNumber() + ": " + ticket.getSubject(),
                        RelatedEntityType.SUPPORT,
                        ticket.getId(),
                        "/admin/support/" + ticket.getId()
                ));
    }

    private void notifyAdminsOfReply(SupportTicket ticket) {
        userRepository.findAllByRoleIn(List.of(UserRole.ADMIN, UserRole.SUPER_ADMIN))
                .forEach(admin -> notificationService.notify(
                        admin,
                        NotificationType.SUPPORT,
                        NotificationPriority.MEDIUM,
                        "User replied to a support ticket",
                        ticket.getTicketNumber() + " has a new student reply.",
                        RelatedEntityType.SUPPORT,
                        ticket.getId(),
                        "/admin/support/" + ticket.getId()
                ));
    }

    private void notifyStudent(SupportTicket ticket, String title, String message) {
        if (ticket.getUser() == null) return;
        notificationService.notify(
                ticket.getUser(), NotificationType.SUPPORT, notificationPriority(ticket.getPriority()),
                title, message, RelatedEntityType.SUPPORT, ticket.getId(),
                "/student/support/" + ticket.getId()
        );
    }

    private void notifyStudentForStatus(SupportTicket ticket) {
        String title = switch (ticket.getStatus()) {
            case WAITING_FOR_USER -> "Support needs more information";
            case RESOLVED -> "Your support ticket has been resolved";
            case CLOSED -> "Your support ticket has been closed";
            case REJECTED -> "Your support ticket was reviewed";
            default -> "Support ticket status updated";
        };
        notifyStudent(ticket, title,
                ticket.getTicketNumber() + " is now " + ticket.getStatus().name().replace('_', ' ') + ".");
    }

    private SupportPriority priorityFor(SupportCategory category) {
        return switch (category) {
            case SAFETY_CONCERN -> SupportPriority.URGENT;
            case OTP_VERIFICATION, ORDER, PAYMENT, REFUND_REQUEST, REPORT_MODERATION -> SupportPriority.HIGH;
            case LISTING, REVIEW_RATING, TECHNICAL_BUG, COLLEGE_VERIFICATION -> SupportPriority.MEDIUM;
            default -> SupportPriority.LOW;
        };
    }

    private NotificationPriority notificationPriority(SupportPriority priority) {
        return switch (priority) {
            case LOW -> NotificationPriority.LOW;
            case MEDIUM -> NotificationPriority.MEDIUM;
            case HIGH -> NotificationPriority.HIGH;
            case URGENT -> NotificationPriority.CRITICAL;
        };
    }

    private String sanitizeRequired(String value, int maxLength) {
        if (value == null) return "";
        String clean = HTML_TAG.matcher(value).replaceAll("")
                .replaceAll("[\\p{Cc}&&[^\\r\\n\\t]]", "")
                .trim();
        return clean.length() > maxLength ? clean.substring(0, maxLength) : clean;
    }

    private String cleanOptional(String value, int maxLength) {
        if (value == null || value.isBlank()) return null;
        return sanitizeRequired(value, maxLength);
    }

    private void rejectSecrets(String value) {
        if (PASSWORD_SECRET.matcher(value).find() || CARD_NUMBER.matcher(value).find()) {
            throw new BadRequestException(
                    "Remove passwords, OTPs, PINs, or full card details before submitting."
            );
        }
    }

    private SupportStatus parseStatus(String value) {
        return parseEnum(value, SupportStatus.class, "support status");
    }

    private SupportPriority parsePriority(String value) {
        return parseEnum(value, SupportPriority.class, "support priority");
    }

    private SupportCategory parseCategory(String value) {
        return parseEnum(value, SupportCategory.class, "support category");
    }

    private <T extends Enum<T>> T parseEnum(String value, Class<T> type, String label) {
        if (value == null || value.isBlank()) return null;
        try {
            return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid " + label + ".");
        }
    }

    private TicketCreated created(SupportTicket ticket) {
        return new TicketCreated(
                ticket.getId(), ticket.getTicketNumber(), ticket.getStatus(),
                ticket.getPriority(), ticket.getCreatedAt()
        );
    }

    private TicketAction action(SupportTicket ticket) {
        return new TicketAction(
                ticket.getId(), ticket.getTicketNumber(), ticket.getStatus(), ticket.getUpdatedAt()
        );
    }

    public record AttachmentDownload(
            Path path,
            String fileName,
            String contentType,
            long size
    ) {
    }

    private final class SupportTicketBuilder {
        private User student;
        private SupportTicketRequest request;
        private String subject;
        private String description;

        private SupportTicketBuilder student(User value) {
            this.student = value;
            return this;
        }

        private SupportTicketBuilder request(
                SupportTicketRequest value,
                String cleanSubject,
                String cleanDescription
        ) {
            this.request = value;
            this.subject = cleanSubject;
            this.description = cleanDescription;
            return this;
        }

        private SupportTicket build() {
            SupportRelatedEntityType type = request.relatedEntityType() == null
                    ? SupportRelatedEntityType.NONE
                    : request.relatedEntityType();
            return SupportTicket.forStudent(
                    student,
                    request.category(),
                    subject,
                    description,
                    priorityFor(request.category()),
                    type,
                    request.relatedEntityId()
            );
        }
    }
}

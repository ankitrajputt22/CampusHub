package com.campushub.support;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.security.AuthenticatedUser;
import com.campushub.support.dto.SupportInternalNoteRequest;
import com.campushub.support.dto.SupportReplyRequest;
import com.campushub.support.dto.SupportResponses.TicketAction;
import com.campushub.support.dto.SupportResponses.TicketDetails;
import com.campushub.support.dto.SupportResponses.TicketPage;
import com.campushub.support.dto.SupportStatusUpdateRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/support/tickets")
public class AdminSupportController {

    private final SupportService supportService;

    public AdminSupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    @GetMapping
    public ApiResponse<TicketPage> getTickets(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long collegeId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.success(
                "Admin support tickets loaded successfully",
                supportService.getAdminTickets(
                        userId(authenticatedUser), status, priority, category,
                        search, collegeId, page, size
                )
        );
    }

    @GetMapping("/{ticketId}")
    public ApiResponse<TicketDetails> getTicket(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long ticketId
    ) {
        return ApiResponse.success(
                "Admin support ticket loaded successfully",
                supportService.getAdminTicket(userId(authenticatedUser), ticketId)
        );
    }

    @PostMapping(value = "/{ticketId}/replies", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<TicketAction> addReply(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long ticketId,
            @Valid @RequestBody SupportReplyRequest request
    ) {
        return reply(authenticatedUser, ticketId, request, List.of());
    }

    @PostMapping(value = "/{ticketId}/replies", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TicketAction> addReplyWithAttachments(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long ticketId,
            @Valid @RequestPart("request") SupportReplyRequest request,
            @RequestPart(name = "files", required = false) List<MultipartFile> files
    ) {
        return reply(authenticatedUser, ticketId, request, files);
    }

    @PatchMapping("/{ticketId}/status")
    public ApiResponse<TicketAction> updateStatus(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long ticketId,
            @Valid @RequestBody SupportStatusUpdateRequest request
    ) {
        return ApiResponse.success(
                "Ticket status updated successfully",
                supportService.updateAdminStatus(userId(authenticatedUser), ticketId, request)
        );
    }

    @PostMapping("/{ticketId}/internal-notes")
    public ApiResponse<TicketAction> addInternalNote(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long ticketId,
            @Valid @RequestBody SupportInternalNoteRequest request
    ) {
        return ApiResponse.success(
                "Internal note added successfully",
                supportService.addInternalNote(userId(authenticatedUser), ticketId, request)
        );
    }

    private ApiResponse<TicketAction> reply(
            AuthenticatedUser authenticatedUser,
            Long ticketId,
            SupportReplyRequest request,
            List<MultipartFile> files
    ) {
        return ApiResponse.success(
                "Reply sent successfully",
                supportService.addAdminReply(
                        userId(authenticatedUser), ticketId, request, files
                )
        );
    }

    private Long userId(AuthenticatedUser user) {
        if (user == null) throw new UnauthorizedException("Authentication is required.");
        return user.userId();
    }
}

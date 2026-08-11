package com.campushub.support;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.security.AuthenticatedUser;
import com.campushub.support.dto.SupportReplyRequest;
import com.campushub.support.dto.SupportResponses.TicketAction;
import com.campushub.support.dto.SupportResponses.TicketCreated;
import com.campushub.support.dto.SupportResponses.TicketDetails;
import com.campushub.support.dto.SupportResponses.TicketPage;
import com.campushub.support.dto.SupportTicketRequest;
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
@RequestMapping("/api/support/tickets")
public class StudentSupportController {

    private final SupportService supportService;

    public StudentSupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    @GetMapping
    public ApiResponse<TicketPage> getTickets(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.success(
                "Support tickets loaded successfully",
                supportService.getStudentTickets(
                        userId(authenticatedUser), status, search, page, size
                )
        );
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<TicketCreated> createTicket(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody SupportTicketRequest request
    ) {
        return created(authenticatedUser, request, List.of());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TicketCreated> createTicketWithAttachments(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestPart("request") SupportTicketRequest request,
            @RequestPart(name = "files", required = false) List<MultipartFile> files
    ) {
        return created(authenticatedUser, request, files);
    }

    @GetMapping("/{ticketId}")
    public ApiResponse<TicketDetails> getTicket(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long ticketId
    ) {
        return ApiResponse.success(
                "Support ticket loaded successfully",
                supportService.getStudentTicket(userId(authenticatedUser), ticketId)
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

    @PatchMapping("/{ticketId}/close")
    public ApiResponse<TicketAction> closeTicket(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long ticketId
    ) {
        return ApiResponse.success(
                "Ticket closed successfully",
                supportService.closeStudentTicket(userId(authenticatedUser), ticketId)
        );
    }

    private ApiResponse<TicketCreated> created(
            AuthenticatedUser authenticatedUser,
            SupportTicketRequest request,
            List<MultipartFile> files
    ) {
        return ApiResponse.success(
                "Support ticket submitted successfully",
                supportService.createStudentTicket(userId(authenticatedUser), request, files)
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
                supportService.addStudentReply(
                        userId(authenticatedUser), ticketId, request, files
                )
        );
    }

    private Long userId(AuthenticatedUser user) {
        if (user == null) throw new UnauthorizedException("Authentication is required.");
        return user.userId();
    }
}

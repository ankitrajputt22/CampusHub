package com.campushub.support;

import com.campushub.common.api.ApiResponse;
import com.campushub.support.dto.PublicSupportRequest;
import com.campushub.support.dto.SupportResponses.PublicSubmission;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/public/support")
public class PublicSupportController {

    private final SupportService supportService;

    public PublicSupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    @PostMapping(value = "/contact", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<PublicSubmission> submit(
            @Valid @RequestBody PublicSupportRequest request,
            HttpServletRequest httpRequest
    ) {
        return submitted(request, List.of(), httpRequest);
    }

    @PostMapping(value = "/contact", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PublicSubmission> submitWithAttachments(
            @Valid @RequestPart("request") PublicSupportRequest request,
            @RequestPart(name = "files", required = false) List<MultipartFile> files,
            HttpServletRequest httpRequest
    ) {
        return submitted(request, files, httpRequest);
    }

    private ApiResponse<PublicSubmission> submitted(
            PublicSupportRequest request,
            List<MultipartFile> files,
            HttpServletRequest httpRequest
    ) {
        return ApiResponse.success(
                "Your support request has been submitted. Please check your email for updates.",
                supportService.createPublicTicket(request, files, clientAddress(httpRequest))
        );
    }

    private String clientAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

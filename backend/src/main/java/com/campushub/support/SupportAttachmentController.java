package com.campushub.support;

import com.campushub.common.exception.UnauthorizedException;
import com.campushub.security.AuthenticatedUser;
import com.campushub.support.SupportService.AttachmentDownload;
import java.net.MalformedURLException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support/attachments")
public class SupportAttachmentController {

    private final SupportService supportService;

    public SupportAttachmentController(SupportService supportService) {
        this.supportService = supportService;
    }

    @GetMapping("/{attachmentId}")
    public ResponseEntity<Resource> download(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long attachmentId
    ) throws MalformedURLException {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        AttachmentDownload download = supportService.getAttachment(
                authenticatedUser.userId(), attachmentId
        );
        Resource resource = new UrlResource(download.path().toUri());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.contentType()))
                .contentLength(download.size())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(download.fileName()).build().toString()
                )
                .body(resource);
    }
}

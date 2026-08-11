package com.campushub.support.attachment;

import com.campushub.common.exception.BadRequestException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class FileSystemSupportAttachmentStorage implements SupportAttachmentStorage {

    private static final long MAX_FILE_SIZE = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf"
    );

    private final Path root;

    public FileSystemSupportAttachmentStorage(
            @Value("${app.support-attachment.storage-directory:uploads/support}") String directory
    ) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
    }

    @Override
    public StoredSupportAttachment store(MultipartFile file, String ticketNumber) {
        validate(file);
        String contentType = file.getContentType().toLowerCase(Locale.ROOT);
        String extension = extensionFor(contentType);
        String safeTicket = ticketNumber.replaceAll("[^A-Za-z0-9-]", "");
        String storageKey = safeTicket + "/" + UUID.randomUUID() + extension;
        Path destination = root.resolve(storageKey).normalize();
        if (!destination.startsWith(root)) {
            throw new BadRequestException("Invalid attachment path.");
        }
        try {
            Files.createDirectories(destination.getParent());
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException("Unable to store the attachment. Please try again.");
        }
        return new StoredSupportAttachment(
                storageKey,
                safeOriginalName(file.getOriginalFilename()),
                contentType,
                file.getSize()
        );
    }

    @Override
    public Path resolve(String storageKey) {
        Path resolved = root.resolve(storageKey).normalize();
        if (!resolved.startsWith(root) || !Files.isRegularFile(resolved)) {
            throw new BadRequestException("Attachment file is unavailable.");
        }
        return resolved;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Attachment file is empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Attachment file size is too large.");
        }
        String contentType = file.getContentType();
        if (contentType == null
                || !ALLOWED_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Unsupported attachment type.");
        }
    }

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "application/pdf" -> ".pdf";
            default -> throw new BadRequestException("Unsupported attachment type.");
        };
    }

    private String safeOriginalName(String name) {
        if (name == null || name.isBlank()) {
            return "attachment";
        }
        String safe = Path.of(name).getFileName().toString().replaceAll("[\\r\\n]", "").trim();
        return safe.length() > 255 ? safe.substring(safe.length() - 255) : safe;
    }
}

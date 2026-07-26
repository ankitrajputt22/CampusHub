package com.campushub.listing.image;

import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ResourceNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileSystemListingImageStorage implements ListingImageStorage {

    private static final long MAX_IMAGE_BYTES = 2L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final Path storageDirectory;

    public FileSystemListingImageStorage(
            @Value("${app.listing-image.storage-directory:./data/listing-images}")
            String storageDirectory
    ) {
        this.storageDirectory = Path.of(storageDirectory).toAbsolutePath().normalize();
    }

    @Override
    public StoredListingImage store(Long listingId, MultipartFile file) {
        validate(file);
        String extension = EXTENSIONS.get(file.getContentType());
        String fileName = "listing-" + listingId + "-" + UUID.randomUUID() + extension;
        Path target = safeResolve(fileName);

        try {
            Files.createDirectories(storageDirectory);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new BadRequestException("Unable to store the listing image. Please try again.");
        }

        return new StoredListingImage(
                fileName,
                "/api/listings/images/" + fileName
        );
    }

    @Override
    public Resource load(String fileName) {
        if (fileName == null
                || !fileName.matches("listing-\\d+-[a-f0-9-]+\\.(jpg|png|webp)")) {
            throw new ResourceNotFoundException("Listing image was not found.");
        }
        Path file = safeResolve(fileName);
        if (!Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Listing image was not found.");
        }
        return new FileSystemResource(file);
    }

    @Override
    public String contentType(String fileName) {
        if (fileName.endsWith(".png")) {
            return "image/png";
        }
        if (fileName.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    @Override
    public void delete(String fileName) {
        try {
            Files.deleteIfExists(safeResolve(fileName));
        } catch (IOException ignored) {
            // A failed cleanup must not hide the original listing creation error.
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Every listing image must contain image data.");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new BadRequestException("Each listing image must be less than 2 MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !EXTENSIONS.containsKey(contentType)) {
            throw new BadRequestException(
                    "Only JPG, JPEG, PNG, and WEBP listing images are allowed."
            );
        }
        if (!hasExpectedFileSignature(file)) {
            throw new BadRequestException(
                    "The selected file does not contain valid image data."
            );
        }
    }

    private boolean hasExpectedFileSignature(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            byte[] header = inputStream.readNBytes(12);
            return switch (file.getContentType()) {
                case "image/jpeg" -> header.length >= 3
                        && unsigned(header[0]) == 0xff
                        && unsigned(header[1]) == 0xd8
                        && unsigned(header[2]) == 0xff;
                case "image/png" -> header.length >= 8
                        && unsigned(header[0]) == 0x89
                        && header[1] == 0x50
                        && header[2] == 0x4e
                        && header[3] == 0x47
                        && header[4] == 0x0d
                        && header[5] == 0x0a
                        && header[6] == 0x1a
                        && header[7] == 0x0a;
                case "image/webp" -> header.length >= 12
                        && header[0] == 'R'
                        && header[1] == 'I'
                        && header[2] == 'F'
                        && header[3] == 'F'
                        && header[8] == 'W'
                        && header[9] == 'E'
                        && header[10] == 'B'
                        && header[11] == 'P';
                default -> false;
            };
        } catch (IOException exception) {
            throw new BadRequestException("Unable to validate the listing image.");
        }
    }

    private int unsigned(byte value) {
        return value & 0xff;
    }

    private Path safeResolve(String fileName) {
        Path target = storageDirectory.resolve(fileName).normalize();
        if (!target.startsWith(storageDirectory)) {
            throw new BadRequestException("Invalid listing image path.");
        }
        return target;
    }
}

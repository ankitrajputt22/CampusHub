package com.campushub.profile.photo;

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
public class FileSystemProfilePhotoStorage implements ProfilePhotoStorage {

    private static final long MAX_PHOTO_BYTES = 2L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final Path storageDirectory;

    public FileSystemProfilePhotoStorage(
            @Value("${app.profile-photo.storage-directory:./data/profile-photos}") String storageDirectory
    ) {
        this.storageDirectory = Path.of(storageDirectory).toAbsolutePath().normalize();
    }

    @Override
    public StoredProfilePhoto store(Long userId, MultipartFile file) {
        validate(file);
        String contentType = file.getContentType();
        String extension = EXTENSIONS.get(contentType);
        String fileName = "user-" + userId + "-" + UUID.randomUUID() + extension;
        Path target = safeResolve(fileName);

        try {
            Files.createDirectories(storageDirectory);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new BadRequestException("Unable to store the profile photo. Please try again.");
        }

        return new StoredProfilePhoto(
                fileName,
                "/api/user/profile/photo/content/" + fileName
        );
    }

    @Override
    public Resource load(String fileName) {
        if (fileName == null || !fileName.matches("user-\\d+-[a-f0-9-]+\\.(jpg|png|webp)")) {
            throw new ResourceNotFoundException("Profile photo was not found.");
        }
        Path file = safeResolve(fileName);
        if (!Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Profile photo was not found.");
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

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a profile photo.");
        }
        if (file.getSize() > MAX_PHOTO_BYTES) {
            throw new BadRequestException("Profile photo size should be less than 2 MB.");
        }
        if (!EXTENSIONS.containsKey(file.getContentType())) {
            throw new BadRequestException("Only JPG, JPEG, PNG, and WEBP image files are allowed.");
        }
    }

    private Path safeResolve(String fileName) {
        Path target = storageDirectory.resolve(fileName).normalize();
        if (!target.startsWith(storageDirectory)) {
            throw new BadRequestException("Invalid profile photo path.");
        }
        return target;
    }
}

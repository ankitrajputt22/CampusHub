package com.campushub.profile.photo;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface ProfilePhotoStorage {

    StoredProfilePhoto store(Long userId, MultipartFile file);

    Resource load(String fileName);

    String contentType(String fileName);
}

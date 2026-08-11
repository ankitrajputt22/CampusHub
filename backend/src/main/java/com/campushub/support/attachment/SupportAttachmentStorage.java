package com.campushub.support.attachment;

import java.nio.file.Path;
import org.springframework.web.multipart.MultipartFile;

public interface SupportAttachmentStorage {

    StoredSupportAttachment store(MultipartFile file, String ticketNumber);

    Path resolve(String storageKey);
}

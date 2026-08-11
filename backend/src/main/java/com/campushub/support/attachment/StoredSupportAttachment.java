package com.campushub.support.attachment;

public record StoredSupportAttachment(
        String storageKey,
        String originalFileName,
        String contentType,
        long size
) {
}

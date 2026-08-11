package com.campushub.chat.repository;

import com.campushub.chat.model.ChatMessageReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageReportRepository
        extends JpaRepository<ChatMessageReport, Long> {

    boolean existsByMessageIdAndReporterId(Long messageId, Long reporterId);
}

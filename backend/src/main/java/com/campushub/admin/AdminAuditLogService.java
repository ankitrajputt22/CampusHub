package com.campushub.admin;

import com.campushub.admin.model.AdminAuditLog;
import com.campushub.admin.repository.AdminAuditLogRepository;
import com.campushub.user.model.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AdminAuditLogService {

    private final AdminAuditLogRepository auditLogRepository;

    public AdminAuditLogService(AdminAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(
            User admin,
            String actionType,
            String targetType,
            Long targetId,
            String previousValue,
            String newValue,
            String note
    ) {
        HttpServletRequest request = currentRequest();
        auditLogRepository.save(new AdminAuditLog(
                admin,
                actionType,
                targetType,
                targetId,
                trim(previousValue, 120),
                trim(newValue, 120),
                trim(note, 500),
                request == null ? null : trim(clientIp(request), 64),
                request == null ? null : trim(request.getHeader("User-Agent"), 500)
        ));
    }

    private HttpServletRequest currentRequest() {
        if (RequestContextHolder.getRequestAttributes()
                instanceof ServletRequestAttributes attributes) {
            return attributes.getRequest();
        }
        return null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",", 2)[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String trim(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        return normalized.length() <= maxLength
                ? normalized
                : normalized.substring(0, maxLength);
    }
}

package com.campushub.superadmin;

import com.campushub.admin.model.AdminAuditLog;
import com.campushub.admin.repository.AdminAuditLogRepository;
import com.campushub.college.model.College;
import com.campushub.college.model.CollegeStatus;
import com.campushub.college.repository.CollegeRepository;
import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.report.model.Report;
import com.campushub.report.model.ReportStatus;
import com.campushub.report.repository.ReportRepository;
import com.campushub.superadmin.dto.SuperAdminDtos.AdminDetails;
import com.campushub.superadmin.dto.SuperAdminDtos.AdminItem;
import com.campushub.superadmin.dto.SuperAdminDtos.AuditLogItem;
import com.campushub.superadmin.dto.SuperAdminDtos.CategoryItem;
import com.campushub.superadmin.dto.SuperAdminDtos.CategoryOrderRequest;
import com.campushub.superadmin.dto.SuperAdminDtos.CategoryRequest;
import com.campushub.superadmin.dto.SuperAdminDtos.CollegeDetails;
import com.campushub.superadmin.dto.SuperAdminDtos.CollegeItem;
import com.campushub.superadmin.dto.SuperAdminDtos.CollegeRequest;
import com.campushub.superadmin.dto.SuperAdminDtos.CreateAdminRequest;
import com.campushub.superadmin.dto.SuperAdminDtos.DashboardResponse;
import com.campushub.superadmin.dto.SuperAdminDtos.DashboardStats;
import com.campushub.superadmin.dto.SuperAdminDtos.PageResponse;
import com.campushub.superadmin.dto.SuperAdminDtos.Pagination;
import com.campushub.superadmin.dto.SuperAdminDtos.PlatformSettingItem;
import com.campushub.superadmin.dto.SuperAdminDtos.PlatformSettingsResponse;
import com.campushub.superadmin.dto.SuperAdminDtos.PlatformSettingsUpdateRequest;
import com.campushub.superadmin.dto.SuperAdminDtos.PriorityReportItem;
import com.campushub.superadmin.dto.SuperAdminDtos.ReorderCategoriesRequest;
import com.campushub.superadmin.dto.SuperAdminDtos.SupportTicketItem;
import com.campushub.superadmin.dto.SuperAdminDtos.SystemHealthResponse;
import com.campushub.superadmin.model.PlatformCategory;
import com.campushub.superadmin.model.PlatformCategoryStatus;
import com.campushub.superadmin.model.PlatformSetting;
import com.campushub.superadmin.model.PlatformSettingType;
import com.campushub.superadmin.repository.PlatformCategoryRepository;
import com.campushub.superadmin.repository.PlatformSettingRepository;
import com.campushub.support.model.SupportStatus;
import com.campushub.support.repository.SupportTicketRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SuperAdminService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final Pattern DOMAIN_PATTERN = Pattern.compile(
            "^(?!-)([A-Za-z0-9-]{1,63}\\.)+[A-Za-z]{2,}$"
    );
    private static final Set<String> ALLOWED_SETTING_KEYS = Set.of(
            "signupEnabled",
            "marketplaceEnabled",
            "newListingCreationEnabled",
            "paymentsEnabled",
            "reviewsEnabled",
            "supportTicketCreationEnabled",
            "publicContactSupportEnabled",
            "maintenanceMode",
            "maintenanceModeMessage",
            "otpExpiryMinutes",
            "otpResendCooldownSeconds",
            "maximumOtpAttempts",
            "maximumListingImages",
            "maximumSupportAttachmentSizeMb",
            "defaultPaginationSize"
    );

    private final SuperAdminAccessService accessService;
    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;
    private final ListingRepository listingRepository;
    private final MarketplaceOrderRepository orderRepository;
    private final ReportRepository reportRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final PlatformCategoryRepository categoryRepository;
    private final PlatformSettingRepository settingRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public SuperAdminService(
            SuperAdminAccessService accessService,
            UserRepository userRepository,
            CollegeRepository collegeRepository,
            ListingRepository listingRepository,
            MarketplaceOrderRepository orderRepository,
            ReportRepository reportRepository,
            SupportTicketRepository supportTicketRepository,
            AdminAuditLogRepository auditLogRepository,
            PlatformCategoryRepository categoryRepository,
            PlatformSettingRepository settingRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.accessService = accessService;
        this.userRepository = userRepository;
        this.collegeRepository = collegeRepository;
        this.listingRepository = listingRepository;
        this.orderRepository = orderRepository;
        this.reportRepository = reportRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.auditLogRepository = auditLogRepository;
        this.categoryRepository = categoryRepository;
        this.settingRepository = settingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long superAdminId) {
        accessService.requireActiveSuperAdmin(superAdminId);
        long openSupportTickets = supportTicketRepository.countByStatus(SupportStatus.OPEN)
                + supportTicketRepository.countByStatus(SupportStatus.IN_PROGRESS);
        return new DashboardResponse(
                new DashboardStats(
                        userRepository.countByRole(UserRole.STUDENT),
                        userRepository.countByRole(UserRole.ADMIN),
                        collegeRepository.count(),
                        listingRepository.countByStatus(ListingStatus.ACTIVE),
                        orderRepository.count(),
                        reportRepository.countByStatus(ReportStatus.PENDING),
                        openSupportTickets,
                        auditLogRepository.count()
                ),
                auditLogRepository.findTop8ByOrderByCreatedAtDesc().stream()
                        .map(this::toAuditLog)
                        .toList(),
                collegeRepository.findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "id")))
                        .stream()
                        .map(this::toCollegeItem)
                        .toList(),
                reportRepository.findTop5ByStatusOrderByCreatedAtDesc(ReportStatus.PENDING)
                        .stream()
                        .map(this::toPriorityReport)
                        .toList(),
                List.of(),
                List.of()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminItem> getAdmins(
            Long superAdminId,
            String search,
            String status,
            String role,
            Integer page,
            Integer size
    ) {
        accessService.requireActiveSuperAdmin(superAdminId);
        Page<User> result = userRepository.findAll(
                adminSpecification(search, status, role),
                PageRequest.of(page(page), size(size), Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return page(result, result.getContent().stream().map(this::toAdminItem).toList());
    }

    @Transactional
    public AdminItem createAdmin(Long superAdminId, CreateAdminRequest request) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        String email = normalizeEmail(request.email());
        String username = request.username().trim();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Admin email is already registered.");
        }
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new BadRequestException("Username is already taken.");
        }
        College college = collegeRepository.findAll(PageRequest.of(0, 1, Sort.by("id")))
                .stream()
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Create a college before creating admins."));
        String generatedPhone = "ADMIN" + Instant.now().toEpochMilli();
        User admin = new User(
                clean(request.fullName()),
                username,
                email,
                passwordEncoder.encode(oneTimeSecret()),
                generatedPhone,
                college,
                "Administration",
                null,
                "Campus Operations",
                null,
                "Staff",
                null,
                "ADMIN-" + username.toUpperCase(Locale.ROOT),
                "Platform Operations",
                null
        );
        admin.activate();
        admin.changeRole(UserRole.ADMIN);
        admin.recordCreatedBy(actor);
        User saved = userRepository.save(admin);
        audit(actor, "ADMIN_CREATED", "USER", saved.getId(), null, saved.getEmail(), "Super Admin created admin account.");
        return toAdminItem(saved);
    }

    @Transactional(readOnly = true)
    public AdminDetails getAdmin(Long superAdminId, Long adminId) {
        accessService.requireActiveSuperAdmin(superAdminId);
        User admin = findAdminUser(adminId);
        List<AuditLogItem> recentAuditLogs = auditLogRepository
                .findTop20ByAdminIdOrderByCreatedAtDesc(adminId)
                .stream()
                .map(this::toAuditLog)
                .toList();
        return new AdminDetails(
                toAdminItem(admin),
                recentAuditLogs,
                auditLogRepository.countByAdminId(adminId)
        );
    }

    @Transactional
    public AdminItem suspendAdmin(Long superAdminId, Long adminId) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        User admin = findAdminUser(adminId);
        if (actor.getId().equals(admin.getId())) {
            throw new BadRequestException("This action is not allowed.");
        }
        AccountStatus previous = admin.getStatus();
        admin.changeStatus(AccountStatus.SUSPENDED);
        audit(actor, "ADMIN_SUSPENDED", "USER", admin.getId(), previous.name(), admin.getStatus().name(), "Admin account suspended.");
        return toAdminItem(admin);
    }

    @Transactional
    public AdminItem reactivateAdmin(Long superAdminId, Long adminId) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        User admin = findAdminUser(adminId);
        AccountStatus previous = admin.getStatus();
        admin.changeStatus(AccountStatus.ACTIVE);
        audit(actor, "ADMIN_REACTIVATED", "USER", admin.getId(), previous.name(), admin.getStatus().name(), "Admin account reactivated.");
        return toAdminItem(admin);
    }

    @Transactional
    public AdminItem removeAdminRole(Long superAdminId, Long adminId) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        User admin = findAdminUser(adminId);
        if (admin.getRole() == UserRole.SUPER_ADMIN) {
            throw new BadRequestException("Cannot remove the Super Admin role here.");
        }
        UserRole previous = admin.getRole();
        admin.changeRole(UserRole.STUDENT);
        audit(actor, "ADMIN_ROLE_REMOVED", "USER", admin.getId(), previous.name(), admin.getRole().name(), "Admin role removed.");
        return toAdminItem(admin);
    }

    @Transactional(readOnly = true)
    public PageResponse<CollegeItem> getColleges(Long superAdminId, String search, String status, Integer page, Integer size) {
        accessService.requireActiveSuperAdmin(superAdminId);
        Page<College> result = collegeRepository.findAll(
                collegeSpecification(search, status),
                PageRequest.of(page(page), size(size), Sort.by(Sort.Direction.ASC, "name"))
        );
        return page(result, result.getContent().stream().map(this::toCollegeItem).toList());
    }

    @Transactional
    public CollegeItem createCollege(Long superAdminId, CollegeRequest request) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        validateCollegeRequest(request, null);
        College college = new College(
                clean(request.collegeName()),
                clean(request.collegeCode()).toUpperCase(Locale.ROOT),
                cleanNullable(request.emailDomain()),
                clean(request.city()),
                clean(request.state()),
                clean(request.country()),
                cleanNullable(request.description()),
                request.status() == null ? CollegeStatus.ACTIVE : request.status()
        );
        College saved = collegeRepository.save(college);
        audit(actor, "COLLEGE_CREATED", "COLLEGE", saved.getId(), null, saved.getCode(), "College created.");
        return toCollegeItem(saved);
    }

    @Transactional(readOnly = true)
    public CollegeDetails getCollege(Long superAdminId, Long collegeId) {
        accessService.requireActiveSuperAdmin(superAdminId);
        College college = findCollege(collegeId);
        return new CollegeDetails(
                toCollegeItem(college),
                userRepository.countByCollegeIdAndRoleAndStatusAndEmailVerifiedTrueAndPhoneVerifiedTrue(collegeId, UserRole.STUDENT, AccountStatus.ACTIVE),
                userRepository.countByCollegeIdAndRoleAndStatusAndEmailVerifiedTrueAndPhoneVerifiedTrue(collegeId, UserRole.STUDENT, AccountStatus.ACTIVE),
                orderRepository.count(),
                reportRepository.count(),
                supportTicketRepository.count(),
                List.of(),
                auditLogRepository.findTop20ByTargetTypeAndTargetIdOrderByCreatedAtDesc("COLLEGE", collegeId)
                        .stream()
                        .map(this::toAuditLog)
                        .toList()
        );
    }

    @Transactional
    public CollegeItem updateCollege(Long superAdminId, Long collegeId, CollegeRequest request) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        College college = findCollege(collegeId);
        validateCollegeRequest(request, collegeId);
        String previous = college.getCode() + ":" + college.getStatus();
        college.update(
                clean(request.collegeName()),
                clean(request.collegeCode()).toUpperCase(Locale.ROOT),
                cleanNullable(request.emailDomain()),
                clean(request.city()),
                clean(request.state()),
                clean(request.country()),
                cleanNullable(request.description()),
                request.status() == null ? college.getStatus() : request.status()
        );
        audit(actor, "COLLEGE_UPDATED", "COLLEGE", college.getId(), previous, college.getCode() + ":" + college.getStatus(), "College updated.");
        return toCollegeItem(college);
    }

    @Transactional
    public CollegeItem changeCollegeStatus(Long superAdminId, Long collegeId, CollegeStatus status) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        College college = findCollege(collegeId);
        CollegeStatus previous = college.getStatus();
        college.changeStatus(status);
        audit(actor, "COLLEGE_" + status.name(), "COLLEGE", college.getId(), previous.name(), status.name(), "College status changed.");
        return toCollegeItem(college);
    }

    @Transactional(readOnly = true)
    public PageResponse<CategoryItem> getCategories(Long superAdminId, String search, String status, Integer page, Integer size) {
        accessService.requireActiveSuperAdmin(superAdminId);
        Page<PlatformCategory> result = categoryRepository.findAll(
                categorySpecification(search, status),
                PageRequest.of(page(page), size(size), Sort.by(Sort.Direction.ASC, "sortOrder"))
        );
        return page(result, result.getContent().stream().map(this::toCategoryItem).toList());
    }

    @Transactional
    public CategoryItem createCategory(Long superAdminId, CategoryRequest request) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        String slug = slug(request.slug(), request.name());
        if (categoryRepository.existsBySlugIgnoreCase(slug)) {
            throw new BadRequestException("Category slug already exists.");
        }
        PlatformCategory category = new PlatformCategory(
                clean(request.name()),
                slug,
                cleanNullable(request.description()),
                cleanNullable(request.iconUrl()),
                request.status() == null ? PlatformCategoryStatus.ACTIVE : request.status(),
                request.sortOrder() == null ? 100 : request.sortOrder(),
                actor
        );
        PlatformCategory saved = categoryRepository.save(category);
        audit(actor, "CATEGORY_CREATED", "CATEGORY", saved.getId(), null, saved.getSlug(), "Category created.");
        return toCategoryItem(saved);
    }

    @Transactional
    public CategoryItem updateCategory(Long superAdminId, Long categoryId, CategoryRequest request) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        PlatformCategory category = findCategory(categoryId);
        String slug = slug(request.slug(), request.name());
        categoryRepository.findBySlugIgnoreCase(slug)
                .filter(existing -> !existing.getId().equals(categoryId))
                .ifPresent(existing -> {
                    throw new BadRequestException("Category slug already exists.");
                });
        String previous = category.getSlug() + ":" + category.getStatus();
        category.update(
                clean(request.name()),
                slug,
                cleanNullable(request.description()),
                cleanNullable(request.iconUrl()),
                request.status() == null ? category.getStatus() : request.status(),
                request.sortOrder() == null ? category.getSortOrder() : request.sortOrder()
        );
        audit(actor, "CATEGORY_UPDATED", "CATEGORY", category.getId(), previous, category.getSlug() + ":" + category.getStatus(), "Category updated.");
        return toCategoryItem(category);
    }

    @Transactional
    public CategoryItem changeCategoryStatus(Long superAdminId, Long categoryId, PlatformCategoryStatus status) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        PlatformCategory category = findCategory(categoryId);
        PlatformCategoryStatus previous = category.getStatus();
        category.changeStatus(status);
        audit(actor, "CATEGORY_" + status.name(), "CATEGORY", category.getId(), previous.name(), status.name(), "Category status changed.");
        return toCategoryItem(category);
    }

    @Transactional
    public List<CategoryItem> reorderCategories(Long superAdminId, ReorderCategoriesRequest request) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        for (CategoryOrderRequest item : request.categories()) {
            PlatformCategory category = findCategory(item.categoryId());
            category.changeSortOrder(item.sortOrder());
        }
        audit(actor, "CATEGORIES_REORDERED", "CATEGORY", null, null, String.valueOf(request.categories().size()), "Category order updated.");
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "sortOrder"))
                .stream()
                .map(this::toCategoryItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogItem> getAuditLogs(
            Long superAdminId,
            String search,
            String actorRole,
            String actionType,
            String targetType,
            Integer page,
            Integer size
    ) {
        accessService.requireActiveSuperAdmin(superAdminId);
        Page<AdminAuditLog> result = auditLogRepository.findAll(
                auditSpecification(search, actorRole, actionType, targetType),
                PageRequest.of(page(page), size(size), Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return page(result, result.getContent().stream().map(this::toAuditLog).toList());
    }

    @Transactional(readOnly = true)
    public PlatformSettingsResponse getPlatformSettings(Long superAdminId) {
        accessService.requireActiveSuperAdmin(superAdminId);
        return new PlatformSettingsResponse(settingRepository.findAll().stream()
                .sorted(Comparator.comparing(PlatformSetting::getKey))
                .map(this::toSettingItem)
                .toList());
    }

    @Transactional
    public PlatformSettingsResponse updatePlatformSettings(Long superAdminId, PlatformSettingsUpdateRequest request) {
        User actor = accessService.requireActiveSuperAdmin(superAdminId);
        if (request.settings().isEmpty()) {
            throw new BadRequestException("At least one setting is required.");
        }
        for (Map.Entry<String, String> entry : request.settings().entrySet()) {
            if (!ALLOWED_SETTING_KEYS.contains(entry.getKey())) {
                throw new BadRequestException("Unsupported platform setting: " + entry.getKey());
            }
            PlatformSetting setting = settingRepository.findByKey(entry.getKey())
                    .orElseThrow(() -> new BadRequestException("Platform setting is not configured: " + entry.getKey()));
            String oldValue = setting.getValue();
            String newValue = validateSettingValue(setting, entry.getValue());
            setting.update(newValue, actor);
            audit(actor, "PLATFORM_SETTING_UPDATED", "PLATFORM_SETTING", setting.getId(), oldValue, newValue, "Platform setting updated: " + setting.getKey());
        }
        return getPlatformSettings(superAdminId);
    }

    @Transactional(readOnly = true)
    public SystemHealthResponse getSystemHealth(Long superAdminId) {
        accessService.requireActiveSuperAdmin(superAdminId);
        long users = userRepository.count();
        return new SystemHealthResponse(
                "UP",
                users >= 0 ? "UP" : "UNKNOWN",
                "LOCAL",
                "CONFIGURED",
                Instant.now()
        );
    }

    private User findAdminUser(Long userId) {
        User user = userRepository.findAdminUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin was not found."));
        if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.SUPER_ADMIN) {
            throw new ResourceNotFoundException("Admin was not found.");
        }
        return user;
    }

    private College findCollege(Long collegeId) {
        return collegeRepository.findById(collegeId)
                .orElseThrow(() -> new ResourceNotFoundException("College was not found."));
    }

    private PlatformCategory findCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category was not found."));
    }

    private void validateCollegeRequest(CollegeRequest request, Long existingId) {
        String domain = cleanNullable(request.emailDomain());
        if (domain != null && !DOMAIN_PATTERN.matcher(domain).matches()) {
            throw new BadRequestException("Email domain must be a valid domain.");
        }
        collegeRepository.findByCodeIgnoreCase(clean(request.collegeCode()))
                .filter(college -> existingId == null || !college.getId().equals(existingId))
                .ifPresent(college -> {
                    throw new BadRequestException("College code already exists.");
                });
    }

    private String validateSettingValue(PlatformSetting setting, String value) {
        String cleaned = value == null ? "" : value.trim();
        if (setting.getType() == PlatformSettingType.BOOLEAN) {
            if (!cleaned.equalsIgnoreCase("true") && !cleaned.equalsIgnoreCase("false")) {
                throw new BadRequestException(setting.getKey() + " must be true or false.");
            }
            return cleaned.toLowerCase(Locale.ROOT);
        }
        if (setting.getType() == PlatformSettingType.NUMBER) {
            try {
                int parsed = Integer.parseInt(cleaned);
                if (parsed < 0) {
                    throw new BadRequestException(setting.getKey() + " cannot be negative.");
                }
                return String.valueOf(parsed);
            } catch (NumberFormatException exception) {
                throw new BadRequestException(setting.getKey() + " must be a number.");
            }
        }
        if (cleaned.length() > 1000) {
            throw new BadRequestException(setting.getKey() + " is too long.");
        }
        return cleaned;
    }

    private Specification<User> adminSpecification(String search, String status, String role) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(root.get("role").in(List.of(UserRole.ADMIN, UserRole.SUPER_ADMIN)));
            if (!blank(search)) {
                String value = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("fullName")), value),
                        builder.like(builder.lower(root.get("email")), value),
                        builder.like(builder.lower(root.get("username")), value)
                ));
            }
            if (!blank(status)) {
                predicates.add(builder.equal(root.get("status"), parse(status, AccountStatus.class, "account status")));
            }
            if (!blank(role)) {
                predicates.add(builder.equal(root.get("role"), parse(role, UserRole.class, "role")));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<College> collegeSpecification(String search, String status) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!blank(search)) {
                String value = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("name")), value),
                        builder.like(builder.lower(root.get("code")), value),
                        builder.like(builder.lower(root.get("city")), value),
                        builder.like(builder.lower(root.get("state")), value),
                        builder.like(builder.lower(root.get("emailDomain")), value)
                ));
            }
            if (!blank(status)) {
                predicates.add(builder.equal(root.get("status"), parse(status, CollegeStatus.class, "college status")));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<PlatformCategory> categorySpecification(String search, String status) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!blank(search)) {
                String value = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("name")), value),
                        builder.like(builder.lower(root.get("slug")), value)
                ));
            }
            if (!blank(status)) {
                predicates.add(builder.equal(root.get("status"), parse(status, PlatformCategoryStatus.class, "category status")));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<AdminAuditLog> auditSpecification(
            String search,
            String actorRole,
            String actionType,
            String targetType
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!blank(search)) {
                String value = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("admin").get("email")), value),
                        builder.like(builder.lower(root.get("actionType")), value),
                        builder.like(builder.lower(root.get("targetType")), value)
                ));
            }
            if (!blank(actorRole)) {
                predicates.add(builder.equal(root.get("admin").get("role"), parse(actorRole, UserRole.class, "actor role")));
            }
            if (!blank(actionType)) {
                predicates.add(builder.equal(root.get("actionType"), actionType.trim().toUpperCase(Locale.ROOT)));
            }
            if (!blank(targetType)) {
                predicates.add(builder.equal(root.get("targetType"), targetType.trim().toUpperCase(Locale.ROOT)));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void audit(
            User actor,
            String actionType,
            String targetType,
            Long targetId,
            String oldValue,
            String newValue,
            String note
    ) {
        auditLogRepository.save(new AdminAuditLog(
                actor,
                actionType,
                targetType,
                targetId,
                oldValue,
                newValue,
                note,
                null,
                null
        ));
    }

    private AdminItem toAdminItem(User user) {
        return new AdminItem(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getUsername(),
                user.getRole(),
                user.getStatus(),
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getCreatedBy() == null ? null : user.getCreatedBy().getFullName()
        );
    }

    private CollegeItem toCollegeItem(College college) {
        return new CollegeItem(
                college.getId(),
                college.getName(),
                college.getCode(),
                college.getEmailDomain(),
                college.getCity(),
                college.getState(),
                college.getCountry(),
                college.getDescription(),
                college.getStatus(),
                userRepository.countByCollegeIdAndRoleAndStatusAndEmailVerifiedTrueAndPhoneVerifiedTrue(
                        college.getId(), UserRole.STUDENT, AccountStatus.ACTIVE
                ),
                listingRepository.countByCollegeIdAndStatusAndSeller_Status(
                        college.getId(), ListingStatus.ACTIVE, AccountStatus.ACTIVE
                ),
                null,
                null
        );
    }

    private CategoryItem toCategoryItem(PlatformCategory category) {
        return new CategoryItem(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getIconUrl(),
                category.getStatus(),
                category.getSortOrder(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }

    private AuditLogItem toAuditLog(AdminAuditLog log) {
        return new AuditLogItem(
                log.getId(),
                log.getAdmin().getId(),
                log.getAdmin().getFullName(),
                log.getAdmin().getRole(),
                log.getActionType(),
                log.getTargetType(),
                log.getTargetId(),
                log.getPreviousValue(),
                log.getNewValue(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getCreatedAt()
        );
    }

    private PriorityReportItem toPriorityReport(Report report) {
        return new PriorityReportItem(
                report.getId(),
                report.getType().name(),
                report.getStatus().name(),
                report.getReason().name(),
                report.getReporter().getFullName(),
                report.getReporter().getCollege().getName(),
                report.getCreatedAt()
        );
    }

    private PlatformSettingItem toSettingItem(PlatformSetting setting) {
        return new PlatformSettingItem(
                setting.getKey(),
                setting.getValue(),
                setting.getType(),
                setting.getDescription(),
                setting.getUpdatedAt()
        );
    }

    private <T> PageResponse<T> page(Page<?> result, List<T> items) {
        return new PageResponse<>(
                items,
                new Pagination(
                        result.getNumber(),
                        result.getSize(),
                        result.getTotalElements(),
                        result.getTotalPages()
                )
        );
    }

    private int page(Integer page) {
        return Math.max(0, page == null ? 0 : page);
    }

    private int size(Integer size) {
        if (size == null) return DEFAULT_PAGE_SIZE;
        return Math.max(1, Math.min(MAX_PAGE_SIZE, size));
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String cleanNullable(String value) {
        String cleaned = clean(value);
        return cleaned.isBlank() ? null : cleaned;
    }

    private String normalizeEmail(String email) {
        return clean(email).toLowerCase(Locale.ROOT);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String slug(String requestedSlug, String name) {
        String source = blank(requestedSlug) ? name : requestedSlug;
        String slug = source.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (slug.isBlank()) {
            throw new BadRequestException("Category slug is required.");
        }
        return slug;
    }

    private String oneTimeSecret() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return java.util.HexFormat.of().formatHex(bytes);
    }

    private <T extends Enum<T>> T parse(String value, Class<T> type, String label) {
        try {
            return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported " + label + ".");
        }
    }
}

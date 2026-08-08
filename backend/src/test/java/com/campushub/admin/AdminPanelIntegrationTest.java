package com.campushub.admin;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campushub.auth.service.JwtTokenService;
import com.campushub.college.model.College;
import com.campushub.college.repository.CollegeRepository;
import com.campushub.listing.model.ItemCondition;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScore;
import com.campushub.user.trustscore.TrustScoreRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url="
                + "jdbc:h2:mem:campushub-admin;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                + "DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.admin.rate-limit-per-minute=1000"
})
class AdminPanelIntegrationTest {

    private static final AtomicInteger SEQUENCE = new AtomicInteger();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CollegeRepository collegeRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private TrustScoreRepository trustScoreRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    private User admin;
    private User student;
    private String adminToken;
    private String studentToken;

    @BeforeEach
    void setUp() {
        int sequence = SEQUENCE.incrementAndGet();
        College college = collegeRepository.findByCodeIgnoreCase("RECMAINPURI")
                .orElseThrow();
        admin = createUser(
                college,
                "Admin Operator " + sequence,
                "admin.panel." + sequence + "@recmainpuri.in",
                "+91987654" + String.format("%04d", 9900 + sequence),
                "ADMIN-" + sequence,
                UserRole.ADMIN
        );
        student = createUser(
                college,
                "Marketplace Student " + sequence,
                "student.panel." + sequence + "@recmainpuri.in",
                "+91987653" + String.format("%04d", 9900 + sequence),
                "STUDENT-" + sequence,
                UserRole.STUDENT
        );
        trustScoreRepository.save(new TrustScore(admin, 90, "Admin test score"));
        trustScoreRepository.save(new TrustScore(student, 72, "Student test score"));
        adminToken = jwtTokenService.createAccessToken(admin);
        studentToken = jwtTokenService.createAccessToken(student);
    }

    @Test
    void protectsAdminRoutesAndLoadsDashboardAndManagementPages()
            throws Exception {
        Listing listing = listingRepository.saveAndFlush(new Listing(
                student,
                "Admin test calculator",
                "A calculator used to verify admin listing monitoring.",
                "Electronics",
                new BigDecimal("850.00"),
                ItemCondition.LIKE_NEW,
                ListingStatus.ACTIVE,
                null,
                "Main library",
                true
        ));

        mockMvc.perform(get("/api/admin/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, bearer(studentToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.totalUsers",
                        greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.data.stats.totalListings",
                        greaterThanOrEqualTo(1)));

        mockMvc.perform(get("/api/admin/users")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .param("search", student.getEmail())
                        .param("role", "STUDENT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].collegeEmail",
                        is(student.getEmail())))
                .andExpect(jsonPath("$.data.items[0].trustScore", is(72)));

        mockMvc.perform(get("/api/admin/listings/{listingId}", listing.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.listing.title",
                        is("Admin test calculator")));

        mockMvc.perform(get("/api/admin/orders")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(0)));

        mockMvc.perform(get("/api/admin/payments")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(0)));
    }

    @Test
    void allowsIndependentSoftModerationAndWritesImmutableAuditLogs()
            throws Exception {
        Listing firstListing = listingRepository.saveAndFlush(new Listing(
                student,
                "Unsafe listing",
                "A listing used to verify independent moderation.",
                "Others",
                new BigDecimal("500.00"),
                ItemCondition.GOOD,
                ListingStatus.ACTIVE,
                null,
                "Workshop gate",
                false
        ));

        mockMvc.perform(patch(
                        "/api/admin/listings/{listingId}/block",
                        firstListing.getId()
                )
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "note", "Listing violates campus marketplace rules."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reportId", nullValue()))
                .andExpect(jsonPath("$.data.targetStatus", is("BLOCKED")));

        Listing secondListing = listingRepository.saveAndFlush(new Listing(
                student,
                "Second active listing",
                "This listing should be hidden when the seller is blocked.",
                "Books",
                new BigDecimal("250.00"),
                ItemCondition.GOOD,
                ListingStatus.ACTIVE,
                null,
                "Hostel reception",
                false
        ));

        mockMvc.perform(patch(
                        "/api/admin/users/{userId}/block",
                        student.getId()
                )
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "note", "Repeated serious policy violations."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.targetStatus", is("BLOCKED")));

        assertEquals(
                ListingStatus.BLOCKED,
                listingRepository.findById(secondListing.getId())
                        .orElseThrow()
                        .getStatus()
        );
        assertEquals(
                AccountStatus.BLOCKED,
                userRepository.findById(student.getId())
                        .orElseThrow()
                        .getStatus()
        );

        mockMvc.perform(get("/api/admin/audit-logs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .param("targetType", "USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].actionType",
                        is("USER_BLOCKED")))
                .andExpect(jsonPath("$.data.items[0].adminName",
                        is(admin.getFullName())));
    }

    private User createUser(
            College college,
            String name,
            String email,
            String phone,
            String rollNumber,
            UserRole role
    ) {
        User user = new User(
                name,
                email.substring(0, email.indexOf('@')),
                email,
                "not-used-in-token-based-test",
                phone,
                college,
                "Computer Science and Engineering",
                null,
                "B.Tech",
                null,
                "Third Year",
                null,
                rollNumber,
                "Main Campus",
                null
        );
        user.activate();
        user.changeRole(role);
        return userRepository.saveAndFlush(user);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}

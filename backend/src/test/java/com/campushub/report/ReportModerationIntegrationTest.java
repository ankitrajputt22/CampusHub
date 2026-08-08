package com.campushub.report;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campushub.listing.model.ItemCondition;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url="
                + "jdbc:h2:mem:campushub-reports;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                + "DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
})
class ReportModerationIntegrationTest {

    private static final String PASSWORD = "Campus@123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Test
    void createsTracksAndModeratesReportsWithScopedAccessAndAuditHistory()
            throws Exception {
        Student reporter = signupVerifiedStudent(
                "Safety Reporter",
                "safety.reporter@iitd.ac.in",
                "+919876541301",
                "SAFE-REPORT"
        );
        Student seller = signupVerifiedStudent(
                "Reported Seller",
                "safety.seller@iitd.ac.in",
                "+919876541302",
                "SAFE-SELLER"
        );
        Student moderatorSignup = signupVerifiedStudent(
                "Campus Moderator",
                "safety.moderator@iitd.ac.in",
                "+919876541303",
                "SAFE-MOD"
        );
        User moderator = userRepository.findDashboardUserById(
                moderatorSignup.userId()
        ).orElseThrow();
        moderator.changeRole(UserRole.ADMIN);
        userRepository.saveAndFlush(moderator);
        String moderatorToken = login("safety.moderator@iitd.ac.in");

        User sellerUser = userRepository.findDashboardUserById(seller.userId())
                .orElseThrow();
        Listing listing = listingRepository.saveAndFlush(new Listing(
                sellerUser,
                "Suspicious sealed laptop",
                "The serial number and proof of ownership are unavailable.",
                "Electronics",
                new BigDecimal("12000.00"),
                ItemCondition.LIKE_NEW,
                ListingStatus.ACTIVE,
                null,
                "Library gate",
                false
        ));

        MvcResult submission = mockMvc.perform(post(
                        "/api/reports/listing/{listingId}",
                        listing.getId()
                )
                        .header(HttpHeaders.AUTHORIZATION, bearer(reporter.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reason", "STOLEN_ITEM_SUSPICION",
                                "description",
                                "Seller could not provide proof of ownership at pickup."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.type", is("LISTING")))
                .andExpect(jsonPath("$.data.status", is("PENDING")))
                .andExpect(jsonPath("$.data.priority", is("CRITICAL")))
                .andExpect(jsonPath("$.data.reportId", notNullValue()))
                .andReturn();
        long reportId = objectMapper.readTree(
                submission.getResponse().getContentAsString()
        ).path("data").path("reportId").asLong();

        mockMvc.perform(post("/api/reports/listing/{listingId}", listing.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(reporter.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reason", "FAKE_LISTING",
                                "description", "Duplicate submission"
                        ))))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/reports/my")
                        .header(HttpHeaders.AUTHORIZATION, bearer(reporter.accessToken()))
                        .param("type", "LISTING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.total", is(1)))
                .andExpect(jsonPath("$.data.reports", hasSize(1)))
                .andExpect(jsonPath("$.data.reports[0].id", is((int) reportId)))
                .andExpect(jsonPath(
                        "$.data.reports[0].targetTitle",
                        is("Suspicious sealed laptop")
                ));

        mockMvc.perform(get("/api/admin/reports")
                        .header(HttpHeaders.AUTHORIZATION, bearer(reporter.accessToken())))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/reports")
                        .header(HttpHeaders.AUTHORIZATION, bearer(moderatorToken))
                        .param("priority", "CRITICAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reports", hasSize(1)))
                .andExpect(jsonPath("$.data.reports[0].reporterName",
                        is("Safety Reporter")));

        mockMvc.perform(patch(
                        "/api/admin/reports/{reportId}/under-review",
                        reportId
                )
                        .header(HttpHeaders.AUTHORIZATION, bearer(moderatorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "note", "Ownership evidence is being reviewed."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reportStatus", is("UNDER_REVIEW")));

        mockMvc.perform(patch(
                        "/api/admin/listings/{listingId}/block",
                        listing.getId()
                )
                        .header(HttpHeaders.AUTHORIZATION, bearer(moderatorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reportId", reportId,
                                "note", "No ownership evidence was provided."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reportStatus", is("ACTION_TAKEN")))
                .andExpect(jsonPath("$.data.targetStatus", is("BLOCKED")));

        assertEquals(
                ListingStatus.BLOCKED,
                listingRepository.findById(listing.getId()).orElseThrow().getStatus()
        );

        mockMvc.perform(get("/api/admin/reports/{reportId}", reportId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(moderatorToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTION_TAKEN")))
                .andExpect(jsonPath("$.data.moderationHistory", hasSize(2)))
                .andExpect(jsonPath(
                        "$.data.moderationHistory[1].action",
                        is("LISTING_BLOCKED")
                ));

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, bearer(reporter.accessToken()))
                        .param("type", "REPORT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.notifications", hasSize(3)))
                .andExpect(jsonPath(
                        "$.data.notifications[0].title",
                        is("Action taken on your report")
                ));
    }

    @Test
    void validatesUserReportsAndRequiresModeratorRationaleForRejection()
            throws Exception {
        Student reporter = signupVerifiedStudent(
                "User Safety Reporter",
                "user.reporter@iitd.ac.in",
                "+919876541304",
                "USER-REPORT"
        );
        Student target = signupVerifiedStudent(
                "Reported Student",
                "user.target@iitd.ac.in",
                "+919876541305",
                "USER-TARGET"
        );
        Student moderatorSignup = signupVerifiedStudent(
                "User Moderator",
                "user.moderator@iitd.ac.in",
                "+919876541306",
                "USER-MOD"
        );
        User moderator = userRepository.findById(moderatorSignup.userId())
                .orElseThrow();
        moderator.changeRole(UserRole.ADMIN);
        userRepository.saveAndFlush(moderator);
        String moderatorToken = login("user.moderator@iitd.ac.in");

        mockMvc.perform(post("/api/reports/user/{userId}", reporter.userId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(reporter.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reason", "HARASSMENT",
                                "description", "Self report"
                        ))))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/reports/user/{userId}", target.userId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(reporter.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reason", "HARASSMENT",
                                "description",
                                "Contact me at +91 9876541304 for proof."
                        ))))
                .andExpect(status().isBadRequest());

        MvcResult submission = mockMvc.perform(post(
                        "/api/reports/user/{userId}",
                        target.userId()
                )
                        .header(HttpHeaders.AUTHORIZATION, bearer(reporter.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reason", "SUSPICIOUS_BEHAVIOR",
                                "description",
                                "The pickup messages were inconsistent and concerning."
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        long reportId = objectMapper.readTree(
                submission.getResponse().getContentAsString()
        ).path("data").path("reportId").asLong();

        mockMvc.perform(patch("/api/admin/reports/{reportId}/reject", reportId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(moderatorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "note", ""
                        ))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/admin/reports/{reportId}/reject", reportId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(moderatorToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "note",
                                "The available account and order history did not confirm a violation."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reportStatus", is("REJECTED")));
    }

    private Student signupVerifiedStudent(
            String name,
            String email,
            String phone,
            String rollNumber
    ) throws Exception {
        Map<String, Object> signupRequest = Map.ofEntries(
                Map.entry("fullName", name),
                Map.entry("collegeId", 1),
                Map.entry("username", email.substring(0, email.indexOf('@'))),
                Map.entry("email", email),
                Map.entry("password", PASSWORD),
                Map.entry("confirmPassword", PASSWORD),
                Map.entry("department", "Computer Science Engineering"),
                Map.entry("yearOfStudy", "3rd Year"),
                Map.entry("rollNumber", rollNumber),
                Map.entry("course", "B.Tech"),
                Map.entry("phoneNumber", phone),
                Map.entry("hostelOrCampusArea", "Main Campus")
        );
        MvcResult signupResult = mockMvc.perform(post("/api/auth/signup/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode signup = objectMapper.readTree(
                signupResult.getResponse().getContentAsString()
        ).path("data");
        long userId = signup.path("userId").asLong();

        com.campushub.auth.SignupTestSupport.manuallyVerifyAndComplete(mockMvc, objectMapper, userId);

        return new Student(userId, login(email));
    }

    private String login(String email) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", PASSWORD,
                                "rememberMe", true
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(
                loginResult.getResponse().getContentAsString()
        ).path("data").path("accessToken").asText();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record Student(long userId, String accessToken) {
    }
}

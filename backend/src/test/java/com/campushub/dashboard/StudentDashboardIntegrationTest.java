package com.campushub.dashboard;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campushub.listing.model.ItemCondition;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.user.model.User;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StudentDashboardIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Test
    void rejectsMissingAndInvalidAccessTokens() throws Exception {
        mockMvc.perform(get("/api/student/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));

        mockMvc.perform(get("/api/student/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void returnsOnlyAuthenticatedStudentsCollegeDashboardData() throws Exception {
        AuthSession delhiStudent = createVerifiedStudent(
                "Dashboard Delhi Student",
                1L,
                "dashboard.delhi@iitd.ac.in",
                "+919800000101"
        );
        AuthSession bombayStudent = createVerifiedStudent(
                "Dashboard Bombay Student",
                2L,
                "dashboard.bombay@iitb.ac.in",
                "+919800000102"
        );

        User delhiUser = userRepository.findDashboardUserById(delhiStudent.userId()).orElseThrow();
        User bombayUser = userRepository.findDashboardUserById(bombayStudent.userId()).orElseThrow();

        listingRepository.save(new Listing(
                delhiUser,
                "Delhi scientific calculator",
                new BigDecimal("1250.00"),
                ItemCondition.GOOD,
                ListingStatus.ACTIVE,
                "https://cdn.example.test/calculator.jpg"
        ));
        listingRepository.save(new Listing(
                delhiUser,
                "Inactive Delhi listing",
                new BigDecimal("500.00"),
                ItemCondition.FAIR,
                ListingStatus.INACTIVE,
                null
        ));
        listingRepository.save(new Listing(
                bombayUser,
                "Bombay-only textbook",
                new BigDecimal("900.00"),
                ItemCondition.LIKE_NEW,
                ListingStatus.ACTIVE,
                null
        ));

        mockMvc.perform(get("/api/student/dashboard")
                        .param("userId", bombayStudent.userId().toString())
                        .param("collegeId", "2")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + delhiStudent.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Student dashboard loaded successfully")))
                .andExpect(jsonPath("$.data.user.id", is(delhiStudent.userId().intValue())))
                .andExpect(jsonPath("$.data.user.email", is("dashboard.delhi@iitd.ac.in")))
                .andExpect(jsonPath("$.data.user.collegeId", is(1)))
                .andExpect(jsonPath("$.data.user.collegeName", is("IIT Delhi")))
                .andExpect(jsonPath("$.data.user.role", is("STUDENT")))
                .andExpect(jsonPath("$.data.user.accountStatus", is("ACTIVE")))
                .andExpect(jsonPath("$.data.user.isEmailVerified", is(true)))
                .andExpect(jsonPath("$.data.user.isPhoneVerified", is(true)))
                .andExpect(jsonPath("$.data.trustScore.score", is(30)))
                .andExpect(jsonPath("$.data.trustScore.level", is("New / Low Trust")))
                .andExpect(jsonPath("$.data.trustScore.suggestions", hasSize(4)))
                .andExpect(jsonPath("$.data.profileCompletion.percentage", is(70)))
                .andExpect(jsonPath("$.data.profileCompletion.completedFields", is(7)))
                .andExpect(jsonPath(
                        "$.data.profileCompletion.missingFields",
                        contains("profilePhoto", "bio", "linkedinOrGithub")
                ))
                .andExpect(jsonPath("$.data.stats.activeListings", is(1)))
                .andExpect(jsonPath("$.data.stats.wishlistItems", is(0)))
                .andExpect(jsonPath("$.data.stats.ordersPlaced", is(0)))
                .andExpect(jsonPath("$.data.stats.itemsSold", is(0)))
                .andExpect(jsonPath("$.data.stats.unreadNotifications", is(1)))
                .andExpect(jsonPath("$.data.latestListings", hasSize(1)))
                .andExpect(jsonPath("$.data.latestListings[0].title", is("Delhi scientific calculator")))
                .andExpect(jsonPath("$.data.latestListings[0].sellerName", is("Dashboard Delhi Student")))
                .andExpect(jsonPath("$.data.latestListings[0].sellerTrustScore", is(30)))
                .andExpect(jsonPath("$.data.latestListings[0].condition", is("Good")))
                .andExpect(jsonPath("$.data.notifications", hasSize(1)))
                .andExpect(jsonPath("$.data.notifications[0].title", is("Account verified")))
                .andExpect(jsonPath("$.data.notifications[0].isRead", is(false)))
                .andExpect(jsonPath("$.data.recentActivity", hasSize(1)))
                .andExpect(jsonPath("$.data.recentActivity[0].type", is("ACCOUNT_VERIFIED")))
                .andExpect(jsonPath("$.data.generatedAt", notNullValue()));

        Map<String, Object> refreshRequest = Map.of("refreshToken", delhiStudent.refreshToken());
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", notNullValue()));

        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Logout successful")));

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isUnauthorized());
    }

    private AuthSession createVerifiedStudent(
            String fullName,
            Long collegeId,
            String email,
            String phoneNumber
    ) throws Exception {
        Map<String, Object> signupRequest = Map.ofEntries(
                Map.entry("fullName", fullName),
                Map.entry("collegeId", collegeId),
                Map.entry("collegeEmail", email),
                Map.entry("password", "Campus@123"),
                Map.entry("confirmPassword", "Campus@123"),
                Map.entry("department", "Computer Science Engineering"),
                Map.entry("yearOfStudy", "3rd Year"),
                Map.entry("rollNumber", "DASH" + phoneNumber.substring(phoneNumber.length() - 4)),
                Map.entry("course", "B.Tech"),
                Map.entry("phoneNumber", phoneNumber),
                Map.entry("hostelOrCampusArea", "Main Campus")
        );

        MvcResult signupResult = mockMvc.perform(post("/api/auth/signup/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode signupData = objectMapper.readTree(signupResult.getResponse().getContentAsString()).get("data");
        Long userId = signupData.get("userId").asLong();

        Map<String, Object> verifyRequest = Map.of(
                "userId", userId,
                "emailOtp", signupData.get("devOtpCodes").get("emailOtp").asText(),
                "phoneOtp", signupData.get("devOtpCodes").get("phoneOtp").asText()
        );
        mockMvc.perform(post("/api/auth/verify-signup-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk());

        Map<String, Object> loginRequest = Map.of(
                "email", email,
                "password", "Campus@123",
                "rememberMe", false
        );
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginData = objectMapper
                .readTree(loginResult.getResponse().getContentAsString())
                .get("data");
        return new AuthSession(
                userId,
                loginData.get("accessToken").asText(),
                loginData.get("refreshToken").asText()
        );
    }

    private record AuthSession(Long userId, String accessToken, String refreshToken) {
    }
}

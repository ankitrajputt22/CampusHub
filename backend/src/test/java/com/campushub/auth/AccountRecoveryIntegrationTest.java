package com.campushub.auth;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.campushub.user.model.User;
import com.campushub.user.repository.UserRepository;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AccountRecoveryIntegrationTest {

    private static final String EMAIL = "recovery.student@iitd.ac.in";
    private static final String OLD_PASSWORD = "Campus@123";
    private static final String NEW_PASSWORD = "Recovered@456";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void resetsPasswordOnceRevokesSessionsAndLocksChallengeAfterFiveFailures()
            throws Exception {
        signupVerifiedStudent();
        JsonNode originalLogin = login(OLD_PASSWORD, status().isOk());
        String originalRefreshToken =
                originalLogin.path("data").path("refreshToken").asText();

        JsonNode lockedChallenge = requestReset();
        String lockedRequestId = lockedChallenge.path("requestId").asText();
        String lockedOtp = lockedChallenge.path("devOtp").asText();
        String invalidOtp = lockedOtp.equals("000000") ? "111111" : "000000";
        for (int attempt = 0; attempt < 5; attempt++) {
            mockMvc.perform(post("/api/auth/password-reset/verify")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "requestId", lockedRequestId,
                                    "otp", invalidOtp
                            ))))
                    .andExpect(status().isBadRequest());
        }
        mockMvc.perform(post("/api/auth/password-reset/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "requestId", lockedRequestId,
                                "otp", lockedOtp
                        ))))
                .andExpect(status().isBadRequest());

        JsonNode challenge = requestReset();
        MvcResult verifyResult = mockMvc.perform(post("/api/auth/password-reset/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "requestId", challenge.path("requestId").asText(),
                                "otp", challenge.path("devOtp").asText()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.resetToken", notNullValue()))
                .andReturn();
        JsonNode verified = objectMapper.readTree(
                verifyResult.getResponse().getContentAsString()
        ).path("data");

        Map<String, Object> completeRequest = Map.of(
                "requestId", verified.path("requestId").asText(),
                "resetToken", verified.path("resetToken").asText(),
                "newPassword", NEW_PASSWORD,
                "confirmPassword", NEW_PASSWORD
        );
        mockMvc.perform(post("/api/auth/password-reset/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeRequest)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/auth/password-reset/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeRequest)))
                .andExpect(status().isBadRequest());

        login(OLD_PASSWORD, status().isUnauthorized());
        JsonNode recoveredLogin = login(NEW_PASSWORD, status().isOk());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "refreshToken", originalRefreshToken
                        ))))
                .andExpect(status().isUnauthorized());

        String accessToken =
                recoveredLogin.path("data").path("accessToken").asText();
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + accessToken)
                        .param("type", "SECURITY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath(
                        "$.data.notifications[0].notificationType",
                        is("SECURITY")
                ))
                .andExpect(jsonPath(
                        "$.data.notifications[0].title",
                        is("Password reset completed")
                ));
    }

    @Test
    void passwordResetRequestDoesNotRevealWhetherAnAccountExists()
            throws Exception {
        mockMvc.perform(post("/api/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "missing.student@iitd.ac.in"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.requestId", notNullValue()))
                .andExpect(jsonPath("$.data.devOtp").doesNotExist());
    }

    @Test
    void failedLoginAttemptsPersistAndLockTheAccount() throws Exception {
        String email = "login.lock.student@iitd.ac.in";
        signupVerifiedStudent(
                email,
                "+919876540102",
                "LOGIN-LOCK-01",
                OLD_PASSWORD
        );

        for (int attempt = 0; attempt < 5; attempt++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "email", email,
                                    "password", "Wrong@123",
                                    "rememberMe", false
                            ))))
                    .andExpect(status().isUnauthorized());
        }
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", OLD_PASSWORD,
                                "rememberMe", false
                        ))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath(
                        "$.message",
                        is("Too many failed attempts. Please try again after 15 minutes.")
                ));

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        assertEquals(5, user.getFailedLoginAttempts());
        assertTrue(user.getAccountLockedUntil().isAfter(Instant.now()));
    }

    private JsonNode requestReset() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", EMAIL
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.requestId", notNullValue()))
                .andExpect(jsonPath("$.data.devOtp", notNullValue()))
                .andReturn();
        return objectMapper.readTree(
                result.getResponse().getContentAsString()
        ).path("data");
    }

    private JsonNode login(
            String password,
            org.springframework.test.web.servlet.ResultMatcher expectedStatus
    ) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", EMAIL,
                                "password", password,
                                "rememberMe", true
                        ))))
                .andExpect(expectedStatus)
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private void signupVerifiedStudent() throws Exception {
        signupVerifiedStudent(
                EMAIL,
                "+919876540101",
                "RECOVERY-01",
                OLD_PASSWORD
        );
    }

    private void signupVerifiedStudent(
            String email,
            String phone,
            String rollNumber,
            String password
    ) throws Exception {
        Map<String, Object> signupRequest = Map.ofEntries(
                Map.entry("fullName", "Recovery Student"),
                Map.entry("collegeId", 1),
                Map.entry("username", email.substring(0, email.indexOf('@'))),
                Map.entry("email", email),
                Map.entry("password", password),
                Map.entry("confirmPassword", password),
                Map.entry("department", "Computer Science Engineering"),
                Map.entry("yearOfStudy", "3rd Year"),
                Map.entry("rollNumber", rollNumber),
                Map.entry("course", "B.Tech"),
                Map.entry("phoneNumber", phone),
                Map.entry("hostelOrCampusArea", "Aravali Hostel")
        );
        MvcResult result = mockMvc.perform(post("/api/auth/signup/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode data = objectMapper.readTree(
                result.getResponse().getContentAsString()
        ).path("data");

        SignupTestSupport.manuallyVerifyAndComplete(mockMvc, objectMapper, data.path("userId").asLong());
    }
}

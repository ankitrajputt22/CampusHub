package com.campushub.profile;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StudentProfileIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void protectsUpdatesAndRespectsPublicPrivacySettings() throws Exception {
        AuthSession student = createVerifiedStudent(
                "Profile Student",
                "profile.student@iitd.ac.in",
                "+919800000301"
        );

        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/user/profile")
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email", is("profile.student@iitd.ac.in")))
                .andExpect(jsonPath("$.data.phoneNumber", is("+919800000301")))
                .andExpect(jsonPath("$.data.college.name", is("IIT Delhi")))
                .andExpect(jsonPath("$.data.isVerifiedStudent", is(true)))
                .andExpect(jsonPath("$.data.trustScore.score", is(30)))
                .andExpect(jsonPath("$.data.profileCompletion.totalFields", is(11)))
                .andExpect(jsonPath("$.data.profileCompletion.missingFields", hasItem("Profile photo")))
                .andExpect(jsonPath("$.data.privacySettings.showLinkedin", is(false)))
                .andExpect(jsonPath("$.data.privacySettings.showHostelArea", is(false)));

        Map<String, Object> updateRequest = Map.ofEntries(
                Map.entry("fullName", "Profile Student Updated"),
                Map.entry("bio", "Building secure campus marketplace tools."),
                Map.entry("hostelArea", "Aravali Hostel"),
                Map.entry("department", "Information Technology"),
                Map.entry("course", "B.Tech"),
                Map.entry("yearOfStudy", "4th Year"),
                Map.entry("rollNumber", "PROFILE301"),
                Map.entry("linkedinUrl", "https://www.linkedin.com/in/profile-student"),
                Map.entry("githubUrl", "https://github.com/profile-student"),
                Map.entry("email", "attacker@iitb.ac.in"),
                Map.entry("phoneNumber", "+919999999999"),
                Map.entry("collegeId", 2),
                Map.entry("role", "SUPER_ADMIN"),
                Map.entry("accountStatus", "BLOCKED"),
                Map.entry("trustScore", 100)
        );

        mockMvc.perform(put("/api/user/profile")
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Profile updated successfully.")))
                .andExpect(jsonPath("$.data.fullName", is("Profile Student Updated")))
                .andExpect(jsonPath("$.data.email", is("profile.student@iitd.ac.in")))
                .andExpect(jsonPath("$.data.phoneNumber", is("+919800000301")))
                .andExpect(jsonPath("$.data.college.id", is(1)))
                .andExpect(jsonPath("$.data.role", is("STUDENT")))
                .andExpect(jsonPath("$.data.accountStatus", is("ACTIVE")))
                .andExpect(jsonPath("$.data.trustScore.score", is(40)));

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.accessToken()))
                        .param("type", "SYSTEM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath(
                        "$.data.notifications[?(@.title == 'Trust score updated')]",
                        hasSize(1)
                ))
                .andExpect(jsonPath(
                        "$.data.notifications[?(@.relatedEntityType == 'TRUST_SCORE')]",
                        hasSize(1)
                ));

        Map<String, Object> privacyRequest = Map.of(
                "showBio", true,
                "showLinkedin", false,
                "showGithub", true,
                "showHostelArea", false,
                "showDepartment", true,
                "showYearOfStudy", false
        );

        mockMvc.perform(put("/api/user/privacy-settings")
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(privacyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Privacy settings updated successfully.")));

        mockMvc.perform(get("/api/user/public-profile/{userId}", student.userId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName", is("Profile Student Updated")))
                .andExpect(jsonPath("$.data.department", is("Information Technology")))
                .andExpect(jsonPath("$.data.yearOfStudy").doesNotExist())
                .andExpect(jsonPath("$.data.bio", is("Building secure campus marketplace tools.")))
                .andExpect(jsonPath("$.data.linkedinUrl").doesNotExist())
                .andExpect(jsonPath("$.data.githubUrl", is("https://github.com/profile-student")))
                .andExpect(jsonPath("$.data.hostelArea").doesNotExist());
    }

    @Test
    void uploadsPhotoChangesPasswordAndRevokesEveryRefreshToken() throws Exception {
        AuthSession student = createVerifiedStudent(
                "Security Student",
                "security.student@iitd.ac.in",
                "+919800000302"
        );
        MockMultipartFile photo = new MockMultipartFile(
                "photo",
                "avatar.png",
                MediaType.IMAGE_PNG_VALUE,
                new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47}
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/api/user/profile/photo")
                        .file(photo)
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Profile photo updated successfully.")))
                .andExpect(jsonPath("$.data.profilePhotoUrl", notNullValue()))
                .andExpect(jsonPath("$.data.trustScore", is(35)))
                .andReturn();

        String photoUrl = objectMapper.readTree(
                uploadResult.getResponse().getContentAsString()
        ).get("data").get("profilePhotoUrl").asText();
        mockMvc.perform(get(photoUrl))
                .andExpect(status().isOk())
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertEquals(
                        MediaType.IMAGE_PNG_VALUE,
                        result.getResponse().getContentType()
                ));

        Map<String, String> passwordRequest = Map.of(
                "currentPassword", "Campus@123",
                "newPassword", "Updated@456",
                "confirmPassword", "Updated@456"
        );
        mockMvc.perform(post("/api/user/change-password")
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(passwordRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Password changed successfully. Please sign in again.")));

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("refreshToken", student.refreshToken())
                        )))
                .andExpect(status().isUnauthorized());

        AuthSession signedInAgain = login(
                student.userId(),
                "security.student@iitd.ac.in",
                "Updated@456"
        );
        mockMvc.perform(post("/api/auth/logout-all-devices")
                        .header(HttpHeaders.AUTHORIZATION, bearer(signedInAgain.accessToken())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("refreshToken", signedInAgain.refreshToken())
                        )))
                .andExpect(status().isUnauthorized());

        AuthSession afterSessionReset = login(
                student.userId(),
                "security.student@iitd.ac.in",
                "Updated@456"
        );
        mockMvc.perform(get("/api/notifications")
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                bearer(afterSessionReset.accessToken())
                        )
                        .param("type", "SECURITY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath(
                        "$.data.notifications[?(@.title == 'Signed out from all devices')]",
                        hasSize(1)
                ));
    }

    @Test
    void requestsDeactivationWithoutDeletingTheAccount() throws Exception {
        AuthSession student = createVerifiedStudent(
                "Deactivate Student",
                "deactivate.student@iitd.ac.in",
                "+919800000303"
        );

        mockMvc.perform(post("/api/user/deactivate-request")
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", is("DEACTIVATION_REQUESTED")));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "deactivate.student@iitd.ac.in",
                                "password", "Campus@123",
                                "rememberMe", false
                        ))))
                .andExpect(status().isUnauthorized());
    }

    private AuthSession createVerifiedStudent(
            String fullName,
            String email,
            String phoneNumber
    ) throws Exception {
        Map<String, Object> signupRequest = Map.ofEntries(
                Map.entry("fullName", fullName),
                Map.entry("collegeId", 1),
                Map.entry("collegeEmail", email),
                Map.entry("password", "Campus@123"),
                Map.entry("confirmPassword", "Campus@123"),
                Map.entry("department", "Computer Science Engineering"),
                Map.entry("yearOfStudy", "3rd Year"),
                Map.entry("rollNumber", "PROFILE" + phoneNumber.substring(phoneNumber.length() - 3)),
                Map.entry("course", "B.Tech"),
                Map.entry("phoneNumber", phoneNumber),
                Map.entry("hostelOrCampusArea", "Main Campus")
        );

        MvcResult signupResult = mockMvc.perform(post("/api/auth/signup/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode signupData = objectMapper
                .readTree(signupResult.getResponse().getContentAsString())
                .get("data");
        Long userId = signupData.get("userId").asLong();

        mockMvc.perform(post("/api/auth/verify-signup-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "userId", userId,
                                "emailOtp", signupData.get("devOtpCodes").get("emailOtp").asText(),
                                "phoneOtp", signupData.get("devOtpCodes").get("phoneOtp").asText()
                        ))))
                .andExpect(status().isOk());

        return login(userId, email, "Campus@123");
    }

    private AuthSession login(Long userId, String email, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", password,
                                "rememberMe", true
                        ))))
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

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record AuthSession(Long userId, String accessToken, String refreshToken) {
    }
}

package com.campushub.auth;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class AuthSignupIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void completesSignupOtpVerification() throws Exception {
        mockMvc.perform(get("/api/colleges/search").param("keyword", "IIT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name", is("IIT Bombay")));

        mockMvc.perform(get("/api/colleges/search").param("keyword", "Rajkiya"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].name", hasItems(
                        "Rajkiya Engineering College, Ambedkar Nagar",
                        "Rajkiya Engineering College, Banda",
                        "Rajkiya Engineering College, Kannauj",
                        "Rajkiya Engineering College, Sonbhadra"
                )))
                .andExpect(jsonPath("$.data[*].emailDomain", hasItems(
                        "recabn.ac.in",
                        "recbanda.ac.in",
                        "reck.ac.in",
                        "recsonbhadra.ac.in"
                )));

        Map<String, Object> signupRequest = Map.ofEntries(
                Map.entry("fullName", "Ankit Rajput"),
                Map.entry("collegeId", 1),
                Map.entry("collegeEmail", "ankit@iitd.ac.in"),
                Map.entry("password", "Campus@123"),
                Map.entry("confirmPassword", "Campus@123"),
                Map.entry("department", "Computer Science Engineering"),
                Map.entry("yearOfStudy", "3rd Year"),
                Map.entry("rollNumber", "EN12345678"),
                Map.entry("course", "B.Tech"),
                Map.entry("phoneNumber", "+919876543210"),
                Map.entry("hostelOrCampusArea", "Aravali Hostel")
        );

        MvcResult signupResult = mockMvc.perform(post("/api/auth/signup/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId", notNullValue()))
                .andExpect(jsonPath("$.data.accountStatus", is("PENDING_VERIFICATION")))
                .andExpect(jsonPath("$.data.devOtpCodes.emailOtp", notNullValue()))
                .andExpect(jsonPath("$.data.devOtpCodes.phoneOtp", notNullValue()))
                .andReturn();

        JsonNode signupJson = objectMapper.readTree(signupResult.getResponse().getContentAsString());
        JsonNode data = signupJson.get("data");
        long userId = data.get("userId").asLong();
        String emailOtp = data.get("devOtpCodes").get("emailOtp").asText();
        String phoneOtp = data.get("devOtpCodes").get("phoneOtp").asText();

        Map<String, Object> verifyRequest = Map.of(
                "userId", userId,
                "emailOtp", emailOtp,
                "phoneOtp", phoneOtp
        );

        mockMvc.perform(post("/api/auth/verify-signup-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accountStatus", is("ACTIVE")))
                .andExpect(jsonPath("$.data.trustScore", is(30)));

        Map<String, Object> loginRequest = Map.of(
                "email", "ankit@iitd.ac.in",
                "password", "Campus@123",
                "rememberMe", true
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Login successful")))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("ankit@iitd.ac.in")))
                .andExpect(jsonPath("$.data.user.collegeName", is("IIT Delhi")))
                .andExpect(jsonPath("$.data.user.role", is("STUDENT")))
                .andExpect(jsonPath("$.data.user.trustScore", is(30)));
    }
}

package com.campushub.support;

import static com.campushub.auth.SignupTestSupport.manuallyVerifyAndComplete;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
                + "jdbc:h2:mem:campushub-support;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                + "DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.support.public-rate-limit-per-hour=3"
})
class SupportIntegrationTest {

    private static final String PASSWORD = "Campus@123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void supportsStudentOwnershipAdminWorkflowNotificationsAndPublicRateLimits()
            throws Exception {
        Student student = signup("Support Student", "support.student@example.com",
                "+919876542001", "SUPPORT-STUDENT");
        Student other = signup("Other Student", "support.other@example.com",
                "+919876542002", "SUPPORT-OTHER");
        Student adminSignup = signup("Support Admin", "support.admin@example.com",
                "+919876542003", "SUPPORT-ADMIN");
        User admin = userRepository.findById(adminSignup.userId()).orElseThrow();
        admin.changeRole(UserRole.ADMIN);
        userRepository.saveAndFlush(admin);
        String adminToken = login("support.admin@example.com");

        MvcResult createdResult = mockMvc.perform(post("/api/support/tickets")
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "category", "PAYMENT",
                                "subject", "Payment status did not update",
                                "description",
                                "The payment completed, but my order still shows pending payment.",
                                "relatedEntityType", "NONE"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.status", is("OPEN")))
                .andExpect(jsonPath("$.data.priority", is("HIGH")))
                .andReturn();
        long ticketId = objectMapper.readTree(
                createdResult.getResponse().getContentAsString()
        ).path("data").path("id").asLong();

        mockMvc.perform(get("/api/support/tickets/{ticketId}", ticketId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.submitter.userId", is((int) student.userId())))
                .andExpect(jsonPath("$.data.statusHistory", hasSize(0)));

        mockMvc.perform(get("/api/support/tickets/{ticketId}", ticketId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(other.token())))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/support/tickets/{ticketId}/replies", ticketId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "message", "The order reference is available in my payment history."
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/support/tickets/{ticketId}/replies", ticketId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(other.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "message", "I should not be allowed to reply."
                        ))))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/admin/support/tickets")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .param("priority", "HIGH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tickets", hasSize(1)))
                .andExpect(jsonPath("$.data.tickets[0].submittedBy", is("Support Student")));

        mockMvc.perform(post("/api/admin/support/tickets/{ticketId}/replies", ticketId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "message", "We are checking the verified payment record now."
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/admin/support/tickets/{ticketId}/internal-notes", ticketId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "message", "Payment gateway trace requested from operations."
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/admin/support/tickets/{ticketId}/status", ticketId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "RESOLVED",
                                "note", "Payment and order records are synchronized."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("RESOLVED")));

        mockMvc.perform(get("/api/support/tickets/{ticketId}", ticketId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.replies", hasSize(2)))
                .andExpect(jsonPath("$.data.statusHistory", hasSize(0)));

        mockMvc.perform(get("/api/admin/support/tickets/{ticketId}", ticketId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.replies", hasSize(3)))
                .andExpect(jsonPath("$.data.replies[2].internalNote", is(true)))
                .andExpect(jsonPath("$.data.statusHistory", hasSize(2)));

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.token()))
                        .param("type", "SUPPORT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.notifications", hasSize(3)));

        for (int request = 1; request <= 3; request++) {
            mockMvc.perform(post("/api/public/support/contact")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "fullName", "Public Student",
                                    "email", "public.support@example.com",
                                    "category", "SIGNUP_LOGIN",
                                    "subject", "Unable to finish signup",
                                    "description",
                                    "The signup screen returns an error after I submit my details."
                            ))))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(post("/api/public/support/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Public Student",
                                "email", "public.support@example.com",
                                "category", "SIGNUP_LOGIN",
                                "subject", "Unable to finish signup",
                                "description",
                                "The signup screen returns an error after I submit my details."
                        ))))
                .andExpect(status().isTooManyRequests());
    }

    private Student signup(String name, String email, String phone, String rollNumber)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/signup/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.ofEntries(
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
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode signup = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data");
        long userId = signup.path("userId").asLong();
        manuallyVerifyAndComplete(mockMvc, objectMapper, userId);
        return new Student(userId, login(email));
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", PASSWORD,
                                "rememberMe", true
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record Student(long userId, String token) {
    }
}

package com.campushub.notification;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campushub.notification.model.Notification;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.user.model.User;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Test
    void filtersOnlyTheAuthenticatedStudentsNotificationsAndScopesReadActions()
            throws Exception {
        AuthSession owner = createVerifiedStudent(
                "Notification Owner",
                "notifications.owner@iitd.ac.in",
                "+919800000111"
        );
        AuthSession otherStudent = createVerifiedStudent(
                "Notification Other",
                "notifications.other@iitd.ac.in",
                "+919800000112"
        );
        User ownerUser = userRepository.findById(owner.userId()).orElseThrow();
        User otherUser = userRepository.findById(otherStudent.userId()).orElseThrow();

        notificationService.markAllRead(owner.userId());
        notificationService.markAllRead(otherStudent.userId());

        Notification ownerOrder = notificationService.notify(
                ownerUser,
                NotificationType.ORDER,
                NotificationPriority.HIGH,
                "Item ready for pickup",
                "Your campus order is ready for pickup.",
                RelatedEntityType.ORDER,
                501L,
                "/student/orders/501"
        );
        Notification ownerPayment = notificationService.notify(
                ownerUser,
                NotificationType.PAYMENT,
                NotificationPriority.MEDIUM,
                "Payment update",
                "Your payment status was updated.",
                RelatedEntityType.PAYMENT,
                9001L,
                "/student/payments"
        );
        notificationService.markRead(owner.userId(), ownerPayment.getId());
        Notification otherOrder = notificationService.notify(
                otherUser,
                NotificationType.ORDER,
                NotificationPriority.CRITICAL,
                "Private order update",
                "This update belongs only to the other student.",
                RelatedEntityType.ORDER,
                777L,
                "/student/orders/777"
        );

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, bearer(owner.accessToken()))
                        .param("type", "ORDER")
                        .param("isRead", "false")
                        .param("priority", "HIGH")
                        .param("page", "0")
                        .param("size", "20")
                        .param("sortBy", "newest")
                        .param("userId", otherStudent.userId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.notifications", hasSize(1)))
                .andExpect(jsonPath("$.data.notifications[0].id", is(
                        ownerOrder.getId().intValue()
                )))
                .andExpect(jsonPath("$.data.notifications[0].title", is(
                        "Item ready for pickup"
                )))
                .andExpect(jsonPath("$.data.notifications[0].priority", is("HIGH")))
                .andExpect(jsonPath("$.data.notifications[0].actionUrl", is(
                        "/student/orders/501"
                )))
                .andExpect(jsonPath("$.data.stats.unreadNotifications", is(1)))
                .andExpect(jsonPath("$.data.pagination.totalElements", is(1)));

        mockMvc.perform(get("/api/notifications/preview")
                        .header(HttpHeaders.AUTHORIZATION, bearer(owner.accessToken()))
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(1)))
                .andExpect(jsonPath("$.data.notifications", hasSize(4)))
                .andExpect(jsonPath(
                        "$.data.notifications[?(@.title == 'Private order update')]"
                ).isEmpty());

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, bearer(owner.accessToken()))
                        .param("type", "SYSTEM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.notifications", hasSize(2)))
                .andExpect(jsonPath(
                        "$.data.notifications[?(@.title == 'Account verified')]"
                ).isNotEmpty())
                .andExpect(jsonPath(
                        "$.data.notifications[?(@.title == 'Complete your profile')]"
                ).isNotEmpty());

        mockMvc.perform(patch(
                        "/api/notifications/{notificationId}/read",
                        otherOrder.getId()
                )
                        .header(HttpHeaders.AUTHORIZATION, bearer(owner.accessToken())))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch(
                        "/api/notifications/{notificationId}/read",
                        ownerOrder.getId()
                )
                        .header(HttpHeaders.AUTHORIZATION, bearer(owner.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRead", is(true)))
                .andExpect(jsonPath("$.data.readAt").isNotEmpty())
                .andExpect(jsonPath("$.data.unreadCount", is(0)));

        notificationService.notify(
                ownerUser,
                NotificationType.REVIEW,
                NotificationPriority.MEDIUM,
                "Review pending",
                "Your completed order is ready to review.",
                RelatedEntityType.REVIEW,
                null,
                "/student/reviews"
        );
        mockMvc.perform(patch("/api/notifications/mark-all-read")
                        .header(HttpHeaders.AUTHORIZATION, bearer(owner.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.updatedCount", is(1)))
                .andExpect(jsonPath("$.data.unreadCount", is(0)));

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header(HttpHeaders.AUTHORIZATION, bearer(owner.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(0)));
    }

    @Test
    void rejectsAnonymousNotificationAccessAndInvalidFilters() throws Exception {
        AuthSession student = createVerifiedStudent(
                "Notification Validation",
                "notifications.validation@iitd.ac.in",
                "+919800000113"
        );

        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.accessToken()))
                        .param("type", "NOT_A_TYPE"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, bearer(student.accessToken()))
                        .param("size", "51"))
                .andExpect(status().isBadRequest());
    }

    private AuthSession createVerifiedStudent(
            String fullName,
            String email,
            String phoneNumber
    ) throws Exception {
        Map<String, Object> signupRequest = Map.ofEntries(
                Map.entry("fullName", fullName),
                Map.entry("collegeId", 1),
                Map.entry("username", email.substring(0, email.indexOf('@'))),
                Map.entry("email", email),
                Map.entry("password", "Campus@123"),
                Map.entry("confirmPassword", "Campus@123"),
                Map.entry("department", "Computer Science Engineering"),
                Map.entry("yearOfStudy", "3rd Year"),
                Map.entry("rollNumber", "NOTIFY" + phoneNumber.substring(
                        phoneNumber.length() - 3
                )),
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

        com.campushub.auth.SignupTestSupport.manuallyVerifyAndComplete(mockMvc, objectMapper, userId);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Campus@123",
                                "rememberMe", true
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode loginData = objectMapper
                .readTree(loginResult.getResponse().getContentAsString())
                .get("data");
        return new AuthSession(userId, loginData.get("accessToken").asText());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record AuthSession(Long userId, String accessToken) {
    }
}

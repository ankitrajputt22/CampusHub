package com.campushub.chat;

import static com.campushub.auth.SignupTestSupport.manuallyVerifyAndComplete;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
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
                + "jdbc:h2:mem:campushub-chat;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                + "DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.chat.max-messages-per-minute=20"
})
class ChatIntegrationTest {

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
    void enforcesOwnershipPrivacyReadStateArchiveAndMessageReporting()
            throws Exception {
        Student buyer = signup(
                "Chat Buyer", "chat.buyer@example.com", "+919876543101",
                "CHAT-BUYER", 1
        );
        Student seller = signup(
                "Chat Seller", "chat.seller@example.com", "+919876543102",
                "CHAT-SELLER", 1
        );
        Student otherStudent = signup(
                "Other Student", "chat.other@example.com", "+919876543103",
                "CHAT-OTHER", 1
        );
        Student crossCollegeSeller = signup(
                "Cross College Seller", "chat.cross@example.com", "+919876543104",
                "CHAT-CROSS", 2
        );

        Listing listing = createListing(seller.userId(), "Engineering Mathematics");
        Listing crossCollegeListing = createListing(
                crossCollegeSeller.userId(), "Cross college calculator"
        );

        mockMvc.perform(post("/api/chats/conversations/listing/{listingId}", listing.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(seller.token())))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post(
                        "/api/chats/conversations/listing/{listingId}",
                        crossCollegeListing.getId()
                ).header(HttpHeaders.AUTHORIZATION, bearer(buyer.token())))
                .andExpect(status().isForbidden());

        MvcResult created = mockMvc.perform(post(
                        "/api/chats/conversations/listing/{listingId}", listing.getId()
                ).header(HttpHeaders.AUTHORIZATION, bearer(buyer.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.conversation.id", notNullValue()))
                .andExpect(jsonPath("$.data.participantRole", is("BUYER")))
                .andReturn();
        long conversationId = objectMapper.readTree(
                created.getResponse().getContentAsString()
        ).path("data").path("conversation").path("id").asLong();

        mockMvc.perform(post(
                        "/api/chats/conversations/listing/{listingId}", listing.getId()
                ).header(HttpHeaders.AUTHORIZATION, bearer(buyer.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.conversation.id", is((int) conversationId)));

        mockMvc.perform(get("/api/chats/conversations/{id}", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(otherStudent.token())))
                .andExpect(status().isNotFound());

        MvcResult sent = mockMvc.perform(post(
                        "/api/chats/conversations/{id}/messages", conversationId
                ).header(HttpHeaders.AUTHORIZATION, bearer(buyer.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "message", "Can we meet near the library entrance?"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sentByMe", is(true)))
                .andReturn();
        long messageId = objectMapper.readTree(sent.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(get("/api/chats/unread-count")
                        .header(HttpHeaders.AUTHORIZATION, bearer(seller.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(1)));

        mockMvc.perform(get("/api/chats/conversations/{id}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(seller.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.messages", hasSize(2)))
                .andExpect(jsonPath("$.data.messages[1].reportable", is(true)));

        mockMvc.perform(patch("/api/chats/conversations/{id}/read", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(seller.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.readMessages", is(1)))
                .andExpect(jsonPath("$.data.unreadCount", is(0)));

        mockMvc.perform(post("/api/chats/messages/{messageId}/report", messageId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(seller.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reason", "UNSAFE_PICKUP_BEHAVIOR",
                                "description", "The requested meetup details feel unsafe."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PENDING")));

        mockMvc.perform(post("/api/chats/messages/{messageId}/report", messageId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(seller.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reason", "SPAM",
                                "description", "Duplicate report should be rejected."
                        ))))
                .andExpect(status().isConflict());

        mockMvc.perform(patch(
                        "/api/chats/conversations/{id}/archive", conversationId
                ).header(HttpHeaders.AUTHORIZATION, bearer(seller.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.archived", is(true)));

        mockMvc.perform(get("/api/chats/conversations")
                        .header(HttpHeaders.AUTHORIZATION, bearer(seller.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.conversations", hasSize(0)));

        mockMvc.perform(get("/api/chats/conversations")
                        .header(HttpHeaders.AUTHORIZATION, bearer(seller.token()))
                        .param("archived", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.conversations", hasSize(1)));

        mockMvc.perform(patch(
                        "/api/chats/conversations/{id}/unarchive", conversationId
                ).header(HttpHeaders.AUTHORIZATION, bearer(seller.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.archived", is(false)));

        mockMvc.perform(post(
                        "/api/chats/conversations/{id}/messages", conversationId
                ).header(HttpHeaders.AUTHORIZATION, bearer(buyer.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "message", "Call me on 9876543210"
                        ))))
                .andExpect(status().isBadRequest());
    }

    private Listing createListing(long sellerId, String title) {
        User seller = userRepository.findChatUserById(sellerId).orElseThrow();
        return listingRepository.saveAndFlush(new Listing(
                seller,
                title,
                "A verified listing created for chat integration testing.",
                "Books",
                new BigDecimal("450.00"),
                ItemCondition.GOOD,
                ListingStatus.ACTIVE,
                null,
                "Central Library",
                true
        ));
    }

    private Student signup(
            String name,
            String email,
            String phone,
            String rollNumber,
            int collegeId
    ) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/signup/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.ofEntries(
                                Map.entry("fullName", name),
                                Map.entry("collegeId", collegeId),
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

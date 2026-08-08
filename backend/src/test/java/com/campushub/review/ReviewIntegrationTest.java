package com.campushub.review;

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
import com.campushub.order.model.MarketplaceOrder;
import com.campushub.order.model.OrderStatus;
import com.campushub.order.repository.MarketplaceOrderRepository;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReviewIntegrationTest {

    private static final String PASSWORD = "Campus@123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private MarketplaceOrderRepository orderRepository;

    @Test
    void buyerCanReviewSellerOnceAfterACompletedOrder() throws Exception {
        Student seller = signupVerifiedStudent(
                "Review Seller",
                "review.seller@iitd.ac.in",
                "+919876540201",
                "REV-SELLER"
        );
        Student buyer = signupVerifiedStudent(
                "Review Buyer",
                "review.buyer@iitd.ac.in",
                "+919876540202",
                "REV-BUYER"
        );
        User sellerUser = userRepository.findDashboardUserById(seller.userId())
                .orElseThrow();
        User buyerUser = userRepository.findDashboardUserById(buyer.userId())
                .orElseThrow();
        Listing listing = listingRepository.save(new Listing(
                sellerUser,
                "Discrete Mathematics Textbook",
                "A clean copy with highlighted definitions.",
                "Books",
                new BigDecimal("650.00"),
                ItemCondition.GOOD,
                ListingStatus.SOLD,
                null,
                "Library gate",
                false
        ));
        MarketplaceOrder order = orderRepository.save(new MarketplaceOrder(
                listing,
                buyerUser,
                sellerUser,
                OrderStatus.COMPLETED
        ));

        mockMvc.perform(get("/api/reviews/my")
                        .header("Authorization", bearer(buyer.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.pendingReviews", is(1)))
                .andExpect(jsonPath("$.data.pendingReviews[0].orderId",
                        is(order.getId().intValue())))
                .andExpect(jsonPath("$.data.pendingReviews[0].listingTitle",
                        is("Discrete Mathematics Textbook")));

        Map<String, Object> review = Map.of(
                "rating", 5,
                "message", "Clear communication and a smooth campus pickup."
        );
        mockMvc.perform(post("/api/reviews/orders/{orderId}", order.getId())
                        .header("Authorization", bearer(seller.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(review)))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/reviews/orders/{orderId}", order.getId())
                        .header("Authorization", bearer(buyer.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(review)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.rating", is(5)));

        mockMvc.perform(post("/api/reviews/orders/{orderId}", order.getId())
                        .header("Authorization", bearer(buyer.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(review)))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/reviews/my")
                        .header("Authorization", bearer(buyer.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.pendingReviews", is(0)))
                .andExpect(jsonPath("$.data.stats.givenReviews", is(1)))
                .andExpect(jsonPath("$.data.givenReviews[0].revieweeName",
                        is("Review Seller")));

        mockMvc.perform(get("/api/reviews/my")
                        .header("Authorization", bearer(seller.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.averageRating", is(5.0)))
                .andExpect(jsonPath("$.data.stats.receivedReviews", is(1)))
                .andExpect(jsonPath("$.data.receivedReviews[0].reviewerName",
                        is("Review Buyer")));

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", bearer(seller.accessToken()))
                        .param("type", "REVIEW"))
                .andExpect(status().isOk())
                .andExpect(jsonPath(
                        "$.data.notifications[0].notificationType",
                        is("REVIEW")
                ))
                .andExpect(jsonPath("$.data.notifications[0].title",
                        is("New review received")));
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
                Map.entry("hostelOrCampusArea", "Aravali Hostel")
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

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", PASSWORD,
                                "rememberMe", true
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        String accessToken = objectMapper.readTree(
                loginResult.getResponse().getContentAsString()
        ).path("data").path("accessToken").asText();
        return new Student(userId, accessToken);
    }

    private String bearer(String accessToken) {
        return "Bearer " + accessToken;
    }

    private record Student(long userId, String accessToken) {
    }
}

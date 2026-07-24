package com.campushub.marketplace;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
import com.campushub.wishlist.repository.WishlistItemRepository;
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
                + "jdbc:h2:mem:campushub-marketplace;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                + "DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
})
class MarketplaceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private WishlistItemRepository wishlistRepository;

    @Test
    void returnsOnlyActiveListingsFromTheAuthenticatedStudentsCollege() throws Exception {
        AuthSession buyer = createVerifiedStudent(
                "Marketplace Buyer",
                1L,
                "marketplace.buyer@iitd.ac.in",
                "+919800001001"
        );
        AuthSession delhiSeller = createVerifiedStudent(
                "Trusted Delhi Seller",
                1L,
                "marketplace.seller@iitd.ac.in",
                "+919800001002"
        );
        AuthSession bombaySeller = createVerifiedStudent(
                "Bombay Marketplace Seller",
                2L,
                "marketplace.seller@iitb.ac.in",
                "+919800001003"
        );

        User delhiSellerUser = userRepository.findDashboardUserById(
                delhiSeller.userId()
        ).orElseThrow();
        User bombaySellerUser = userRepository.findDashboardUserById(
                bombaySeller.userId()
        ).orElseThrow();

        Listing visibleListing = listingRepository.save(new Listing(
                delhiSellerUser,
                "Graphing calculator for engineering",
                "A lightly used calculator with its cover and manual.",
                "Electronics",
                new BigDecimal("1850.00"),
                ItemCondition.LIKE_NEW,
                ListingStatus.ACTIVE,
                null,
                "Central Library",
                true
        ));
        listingRepository.save(new Listing(
                delhiSellerUser,
                "Inactive electronics listing",
                "This item must never appear.",
                "Electronics",
                new BigDecimal("1700.00"),
                ItemCondition.GOOD,
                ListingStatus.INACTIVE,
                null,
                "Central Library",
                true
        ));
        listingRepository.save(new Listing(
                bombaySellerUser,
                "Bombay graphing calculator",
                "This belongs to a different college.",
                "Electronics",
                new BigDecimal("1800.00"),
                ItemCondition.LIKE_NEW,
                ListingStatus.ACTIVE,
                null,
                "Main Gate",
                true
        ));

        mockMvc.perform(get("/api/listings/my-college")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .param("userId", bombaySeller.userId().toString())
                        .param("collegeId", "2")
                        .param("search", "calculator")
                        .param("category", "Electronics")
                        .param("minPrice", "1000")
                        .param("maxPrice", "2000")
                        .param("condition", "Like New")
                        .param("pickupLocation", "library")
                        .param("negotiable", "true")
                        .param("postedDate", "week")
                        .param("sortBy", "priceAsc")
                        .param("page", "0")
                        .param("size", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.college.id", is(1)))
                .andExpect(jsonPath("$.data.college.name", is("IIT Delhi")))
                .andExpect(jsonPath("$.data.listings", hasSize(1)))
                .andExpect(jsonPath("$.data.listings[0].id", is(visibleListing.getId().intValue())))
                .andExpect(jsonPath(
                        "$.data.listings[0].title",
                        is("Graphing calculator for engineering")
                ))
                .andExpect(jsonPath("$.data.listings[0].description", is(
                        "A lightly used calculator with its cover and manual."
                )))
                .andExpect(jsonPath("$.data.listings[0].condition", is("LIKE_NEW")))
                .andExpect(jsonPath("$.data.listings[0].pickupLocation", is("Central Library")))
                .andExpect(jsonPath("$.data.listings[0].negotiable", is(true)))
                .andExpect(jsonPath("$.data.listings[0].seller.fullName", is(
                        "Trusted Delhi Seller"
                )))
                .andExpect(jsonPath("$.data.listings[0].wishlisted", is(false)))
                .andExpect(jsonPath("$.data.listings[0].ownListing", is(false)))
                .andExpect(jsonPath("$.data.pagination.totalElements", is(1)))
                .andExpect(jsonPath("$.data.pagination.hasMore", is(false)))
                .andExpect(jsonPath("$.data.pickupLocations[0]", is("Central Library")));

        mockMvc.perform(get("/api/listings/my-college")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .param("category", "Electronics")
                        .param("sortBy", "trusted"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.listings", hasSize(1)))
                .andExpect(jsonPath("$.data.listings[0].id", is(
                        visibleListing.getId().intValue()
                )));

        Listing similarListing = listingRepository.save(new Listing(
                delhiSellerUser,
                "Scientific calculator",
                "A working calculator from the same category and college.",
                "Electronics",
                new BigDecimal("950.00"),
                ItemCondition.GOOD,
                ListingStatus.ACTIVE,
                null,
                "Student Activity Centre",
                false
        ));

        mockMvc.perform(get(
                                "/api/listings/my-college/{listingId}",
                                visibleListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(visibleListing.getId().intValue())))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.availableQuantity", is(1)))
                .andExpect(jsonPath("$.data.college.name", is("IIT Delhi")))
                .andExpect(jsonPath("$.data.seller.fullName", is("Trusted Delhi Seller")))
                .andExpect(jsonPath("$.data.seller.verifiedStudent", is(true)))
                .andExpect(jsonPath("$.data.seller.department", is(
                        "Computer Science Engineering"
                )))
                .andExpect(jsonPath("$.data.seller.yearOfStudy", is("3rd Year")))
                .andExpect(jsonPath("$.data.seller.trustLevel").isNotEmpty())
                .andExpect(jsonPath("$.data.ownListing", is(false)))
                .andExpect(jsonPath("$.data.canBuy", is(true)))
                .andExpect(jsonPath("$.data.canReport", is(true)))
                .andExpect(jsonPath("$.data.similarListings", hasSize(1)))
                .andExpect(jsonPath("$.data.similarListings[0].id", is(
                        similarListing.getId().intValue()
                )));

        Map<String, Object> reportRequest = Map.of(
                "reason", "FAKE_LISTING",
                "description", "The listing information appears misleading."
        );
        mockMvc.perform(post(
                                "/api/reports/listing/{listingId}",
                                visibleListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.listingId", is(
                        visibleListing.getId().intValue()
                )))
                .andExpect(jsonPath("$.data.reason", is("FAKE_LISTING")))
                .andExpect(jsonPath("$.data.status", is("PENDING_REVIEW")));

        mockMvc.perform(post(
                                "/api/reports/listing/{listingId}",
                                visibleListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportRequest)))
                .andExpect(status().isConflict());

        mockMvc.perform(post(
                                "/api/orders/listings/{listingId}",
                                visibleListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.listingId", is(
                        visibleListing.getId().intValue()
                )))
                .andExpect(jsonPath("$.data.listingTitle", is(
                        "Graphing calculator for engineering"
                )))
                .andExpect(jsonPath("$.data.amount", is(1850.0)))
                .andExpect(jsonPath("$.data.status", is("PENDING_PAYMENT")))
                .andExpect(jsonPath("$.data.paymentRequired", is(true)));

        mockMvc.perform(post(
                                "/api/orders/listings/{listingId}",
                                visibleListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/listings/{listingId}", visibleListing.getId())
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + bombaySeller.accessToken()
                        ))
                .andExpect(status().isNotFound());
    }

    @Test
    void persistsWishlistChangesAndRejectsOwnOrCrossCollegeListings() throws Exception {
        AuthSession buyer = createVerifiedStudent(
                "Wishlist Buyer",
                1L,
                "wishlist.buyer@iitd.ac.in",
                "+919800001011"
        );
        AuthSession seller = createVerifiedStudent(
                "Wishlist Seller",
                1L,
                "wishlist.seller@iitd.ac.in",
                "+919800001012"
        );
        AuthSession otherCollegeSeller = createVerifiedStudent(
                "Wishlist Other College",
                2L,
                "wishlist.seller@iitb.ac.in",
                "+919800001013"
        );
        User buyerUser = userRepository.findDashboardUserById(buyer.userId()).orElseThrow();
        User sellerUser = userRepository.findDashboardUserById(seller.userId()).orElseThrow();
        User otherCollegeUser = userRepository.findDashboardUserById(
                otherCollegeSeller.userId()
        ).orElseThrow();

        Listing sameCollegeListing = listingRepository.save(new Listing(
                sellerUser,
                "Wishlist test textbook",
                "A marketplace wishlist integration test item.",
                "Books",
                new BigDecimal("450.00"),
                ItemCondition.GOOD,
                ListingStatus.ACTIVE,
                null,
                "Academic Block",
                false
        ));
        Listing ownListing = listingRepository.save(new Listing(
                buyerUser,
                "Buyer own listing",
                "Students cannot wishlist their own listing.",
                "Books",
                new BigDecimal("350.00"),
                ItemCondition.FAIR,
                ListingStatus.ACTIVE,
                null,
                "Hostel Gate",
                true
        ));
        Listing crossCollegeListing = listingRepository.save(new Listing(
                otherCollegeUser,
                "Other college listing",
                "Students cannot access another college listing.",
                "Books",
                new BigDecimal("550.00"),
                ItemCondition.GOOD,
                ListingStatus.ACTIVE,
                null,
                "Main Gate",
                false
        ));

        mockMvc.perform(post("/api/wishlist/{listingId}", sameCollegeListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.wishlisted", is(true)));

        mockMvc.perform(post("/api/wishlist/{listingId}", sameCollegeListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk());

        assertTrue(wishlistRepository.existsByUserIdAndListingId(
                buyer.userId(),
                sameCollegeListing.getId()
        ));

        mockMvc.perform(post("/api/wishlist/{listingId}", ownListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/reports/listing/{listingId}", ownListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reason", "OTHER"
                        ))))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/orders/listings/{listingId}", ownListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/wishlist/{listingId}", crossCollegeListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/wishlist/{listingId}", sameCollegeListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.wishlisted", is(false)));

        assertFalse(wishlistRepository.existsByUserIdAndListingId(
                buyer.userId(),
                sameCollegeListing.getId()
        ));
    }

    @Test
    void requiresAuthenticationAndValidatesFilterRanges() throws Exception {
        mockMvc.perform(get("/api/listings/my-college"))
                .andExpect(status().isUnauthorized());

        AuthSession buyer = createVerifiedStudent(
                "Marketplace Validation Buyer",
                1L,
                "marketplace.validation@iitd.ac.in",
                "+919800001021"
        );
        mockMvc.perform(get("/api/listings/my-college")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .param("minPrice", "2000")
                        .param("maxPrice", "1000"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(
                        "$.message",
                        is("Minimum price cannot be greater than maximum price.")
                ));
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
                Map.entry("rollNumber", "MARKET" + phoneNumber.substring(phoneNumber.length() - 4)),
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

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Campus@123",
                                "rememberMe", false
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginData = objectMapper
                .readTree(loginResult.getResponse().getContentAsString())
                .get("data");
        return new AuthSession(userId, loginData.get("accessToken").asText());
    }

    private record AuthSession(Long userId, String accessToken) {
    }
}

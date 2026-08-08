package com.campushub.marketplace;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import com.campushub.wishlist.repository.WishlistItemRepository;
import com.campushub.wishlist.model.WishlistItem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.mock.web.MockMultipartFile;
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

    @Autowired
    private MarketplaceOrderRepository orderRepository;

    @Test
    void createsAListingForTheAuthenticatedStudentsVerifiedCollege() throws Exception {
        AuthSession seller = createVerifiedStudent(
                "Verified Listing Seller",
                1L,
                "listing.creator@iitd.ac.in",
                "+919800001031"
        );
        Map<String, Object> request = Map.ofEntries(
                Map.entry("title", "Casio scientific calculator"),
                Map.entry(
                        "description",
                        "Used for one semester and working properly with its original cover."
                ),
                Map.entry("category", "Electronics"),
                Map.entry("price", 850),
                Map.entry("condition", "LIKE_NEW"),
                Map.entry("pickupLocation", "Central Library Gate"),
                Map.entry("negotiable", true),
                Map.entry("availableQuantity", 2),
                Map.entry("additionalNotes", "Please inspect the calculator before handover.")
        );
        MockMultipartFile listingPart = new MockMultipartFile(
                "listing",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );
        MockMultipartFile coverImage = new MockMultipartFile(
                "images",
                "calculator-cover.png",
                MediaType.IMAGE_PNG_VALUE,
                new byte[]{
                        (byte) 0x89,
                        0x50,
                        0x4e,
                        0x47,
                        0x0d,
                        0x0a,
                        0x1a,
                        0x0a,
                        0x00
                }
        );
        MockMultipartFile secondImage = new MockMultipartFile(
                "images",
                "calculator-back.webp",
                "image/webp",
                new byte[]{
                        'R', 'I', 'F', 'F',
                        0x04, 0x00, 0x00, 0x00,
                        'W', 'E', 'B', 'P'
                }
        );

        MvcResult createResult = mockMvc.perform(multipart("/api/listings")
                        .file(listingPart)
                        .file(coverImage)
                        .file(secondImage)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken())
                        .param("collegeId", "2")
                        .param("sellerId", "999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Listing created successfully")))
                .andExpect(jsonPath("$.data.title", is("Casio scientific calculator")))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.collegeName", is("IIT Delhi")))
                .andExpect(jsonPath("$.data.sellerName", is("Verified Listing Seller")))
                .andExpect(jsonPath("$.data.availableQuantity", is(2)))
                .andExpect(jsonPath("$.data.images", hasSize(2)))
                .andReturn();

        long listingId = objectMapper
                .readTree(createResult.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();
        String coverImageUrl = objectMapper
                .readTree(createResult.getResponse().getContentAsString())
                .get("data")
                .get("images")
                .get(0)
                .asText();
        Listing listing = listingRepository.findMarketplaceListingById(listingId)
                .orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(
                seller.userId(),
                listing.getSeller().getId()
        );
        org.junit.jupiter.api.Assertions.assertEquals(1L, listing.getCollege().getId());
        org.junit.jupiter.api.Assertions.assertEquals(2, listing.getAvailableQuantity());

        mockMvc.perform(get("/api/listings/{listingId}", listingId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.additionalNotes", is(
                        "Please inspect the calculator before handover."
                )))
                .andExpect(jsonPath("$.data.availableQuantity", is(2)))
                .andExpect(jsonPath("$.data.images", hasSize(2)))
                .andExpect(jsonPath("$.data.images[0]").value(
                        org.hamcrest.Matchers.startsWith("/api/listings/images/")
                ));

        mockMvc.perform(get(coverImageUrl))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .content()
                        .contentType(MediaType.IMAGE_PNG));
    }

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
                .andExpect(jsonPath("$.data.status", is("PENDING")))
                .andExpect(jsonPath("$.data.priority", is("HIGH")));

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
        Listing soldSavedListing = listingRepository.save(new Listing(
                sellerUser,
                "Previously saved sold textbook",
                "A sold item should remain visible as unavailable in the wishlist.",
                "Books",
                new BigDecimal("300.00"),
                ItemCondition.FAIR,
                ListingStatus.SOLD,
                null,
                "Academic Block",
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
        wishlistRepository.save(new WishlistItem(buyerUser, soldSavedListing));

        mockMvc.perform(get("/api/wishlist/count")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count", is(2)));

        mockMvc.perform(get("/api/wishlist")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .param("userId", otherCollegeSeller.userId().toString())
                        .param("sortBy", "priceDesc")
                        .param("page", "0")
                        .param("size", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.totalItems", is(2)))
                .andExpect(jsonPath("$.data.stats.availableItems", is(1)))
                .andExpect(jsonPath("$.data.stats.unavailableItems", is(1)))
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andExpect(jsonPath("$.data.items[0].listing.id", is(
                        sameCollegeListing.getId().intValue()
                )))
                .andExpect(jsonPath("$.data.items[0].listing.available", is(true)))
                .andExpect(jsonPath("$.data.items[0].listing.seller.fullName", is(
                        "Wishlist Seller"
                )))
                .andExpect(jsonPath("$.data.items[1].listing.status", is("SOLD")))
                .andExpect(jsonPath("$.data.items[1].listing.available", is(false)))
                .andExpect(jsonPath("$.data.pagination.totalElements", is(2)));

        mockMvc.perform(get("/api/wishlist")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .param("status", "UNAVAILABLE")
                        .param("sortBy", "trusted"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].listing.id", is(
                        soldSavedListing.getId().intValue()
                )));

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
    void scopesOrdersAndEnforcesBuyerSellerLifecycleActions() throws Exception {
        AuthSession buyer = createVerifiedStudent(
                "Order Lifecycle Buyer",
                1L,
                "orders.lifecycle.buyer@iitd.ac.in",
                "+919800001071"
        );
        AuthSession seller = createVerifiedStudent(
                "Order Lifecycle Seller",
                1L,
                "orders.lifecycle.seller@iitd.ac.in",
                "+919800001072"
        );
        AuthSession unrelatedStudent = createVerifiedStudent(
                "Unrelated Order Student",
                1L,
                "orders.lifecycle.other@iitd.ac.in",
                "+919800001073"
        );
        User buyerUser = userRepository.findDashboardUserById(buyer.userId()).orElseThrow();
        User sellerUser = userRepository.findDashboardUserById(seller.userId()).orElseThrow();
        Listing paidListing = listingRepository.save(new Listing(
                sellerUser,
                "Lifecycle test drafting table",
                "A unique item used to verify the secured order lifecycle.",
                "Furniture",
                new BigDecimal("2400.00"),
                ItemCondition.GOOD,
                ListingStatus.ACTIVE,
                null,
                "Academic Block Gate",
                false
        ));
        MarketplaceOrder paidOrder = orderRepository.save(new MarketplaceOrder(
                paidListing,
                buyerUser,
                sellerUser,
                OrderStatus.PAID
        ));

        mockMvc.perform(get("/api/orders/buyer")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .param("userId", unrelatedStudent.userId().toString())
                        .param("search", "Lifecycle test drafting table"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orders", hasSize(1)))
                .andExpect(jsonPath("$.data.orders[0].id", is(
                        paidOrder.getId().intValue()
                )))
                .andExpect(jsonPath("$.data.orders[0].role", is("BUYER")))
                .andExpect(jsonPath("$.data.orders[0].status", is("PAID")))
                .andExpect(jsonPath("$.data.orders[0].paymentStatus", is("SUCCESS")))
                .andExpect(jsonPath("$.data.orders[0].otherParty.fullName", is(
                        "Order Lifecycle Seller"
                )))
                .andExpect(jsonPath("$.data.orders[0].otherParty.email").doesNotExist())
                .andExpect(jsonPath("$.data.orders[0].availableActions").value(
                        org.hamcrest.Matchers.hasItem("CONFIRM_PICKUP")
                ));

        mockMvc.perform(get("/api/orders/seller")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken())
                        .param("search", paidOrder.getOrderNumber()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orders", hasSize(1)))
                .andExpect(jsonPath("$.data.orders[0].role", is("SELLER")))
                .andExpect(jsonPath("$.data.orders[0].otherParty.fullName", is(
                        "Order Lifecycle Buyer"
                )))
                .andExpect(jsonPath("$.data.orders[0].availableActions").value(
                        org.hamcrest.Matchers.hasItem("MARK_READY_FOR_PICKUP")
                ));

        mockMvc.perform(get("/api/orders/{orderId}", paidOrder.getId())
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + unrelatedStudent.accessToken()
                        ))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch(
                                "/api/orders/{orderId}/ready-for-pickup",
                                paidOrder.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch(
                                "/api/orders/{orderId}/ready-for-pickup",
                                paidOrder.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("READY_FOR_PICKUP")));

        mockMvc.perform(patch(
                                "/api/orders/{orderId}/confirm-pickup",
                                paidOrder.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")));

        assertTrue(listingRepository.findById(paidListing.getId())
                .filter(listing -> listing.getStatus() == ListingStatus.SOLD)
                .isPresent());

        Listing pendingListing = listingRepository.save(new Listing(
                sellerUser,
                "Lifecycle pending order item",
                "A second unique item used to verify buyer cancellation.",
                "Books",
                new BigDecimal("600.00"),
                ItemCondition.LIKE_NEW,
                ListingStatus.ACTIVE,
                null,
                "Central Library",
                false
        ));
        MvcResult pendingResult = mockMvc.perform(post(
                                "/api/orders/listings/{listingId}",
                                pendingListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        long pendingOrderId = objectMapper
                .readTree(pendingResult.getResponse().getContentAsString())
                .get("data")
                .get("orderId")
                .asLong();

        mockMvc.perform(patch("/api/orders/{orderId}/cancel", pendingOrderId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken()))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch("/api/orders/{orderId}/cancel", pendingOrderId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CANCELLED")));

        mockMvc.perform(get("/api/orders/{orderId}", paidOrder.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.timeline", hasSize(2)))
                .andExpect(jsonPath("$.data.timeline[0].status", is(
                        "READY_FOR_PICKUP"
                )))
                .andExpect(jsonPath("$.data.timeline[1].status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.otherParty.email").doesNotExist())
                .andExpect(jsonPath("$.data.otherParty.phoneNumber").doesNotExist());
    }

    @Test
    void createsVerifiesAndRetriesSecureRazorpayPayments() throws Exception {
        AuthSession buyer = createVerifiedStudent(
                "Razorpay Payment Buyer",
                1L,
                "razorpay.buyer@iitd.ac.in",
                "+919800001091"
        );
        AuthSession seller = createVerifiedStudent(
                "Razorpay Payment Seller",
                1L,
                "razorpay.seller@iitd.ac.in",
                "+919800001092"
        );
        AuthSession unrelatedStudent = createVerifiedStudent(
                "Unrelated Razorpay Student",
                1L,
                "razorpay.unrelated@iitd.ac.in",
                "+919800001083"
        );
        User sellerUser = userRepository.findDashboardUserById(
                seller.userId()
        ).orElseThrow();
        Listing listing = listingRepository.save(new Listing(
                sellerUser,
                "Razorpay verified engineering calculator",
                "A secure payment integration test listing.",
                "Electronics",
                new BigDecimal("725.00"),
                ItemCondition.LIKE_NEW,
                ListingStatus.ACTIVE,
                null,
                "Central Library",
                false
        ));

        MvcResult checkoutResult = mockMvc.perform(post(
                                "/api/orders/create-from-listing/{listingId}",
                                listing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .param("amount", "1")
                        .param("buyerId", unrelatedStudent.userId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.order.listingId", is(
                        listing.getId().intValue()
                )))
                .andExpect(jsonPath("$.data.order.amount", is(725.0)))
                .andExpect(jsonPath("$.data.order.orderStatus", is("PENDING_PAYMENT")))
                .andExpect(jsonPath("$.data.order.paymentStatus", is("PENDING")))
                .andExpect(jsonPath("$.data.razorpay.amount", is(72500)))
                .andExpect(jsonPath("$.data.razorpay.currency", is("INR")))
                .andExpect(jsonPath("$.data.razorpay.keyId", is(
                        "rzp_test_campus_hub"
                )))
                .andExpect(jsonPath("$.data.razorpay.keySecret").doesNotExist())
                .andExpect(jsonPath("$.data.prefill.email", is(
                        "razorpay.buyer@iitd.ac.in"
                )))
                .andReturn();

        JsonNode checkout = objectMapper
                .readTree(checkoutResult.getResponse().getContentAsString())
                .get("data");
        long orderId = checkout.get("order").get("id").asLong();
        String razorpayOrderId = checkout
                .get("razorpay")
                .get("razorpayOrderId")
                .asText();
        assertTrue(razorpayOrderId.startsWith("order_test_"));
        String razorpayPaymentId = "pay_test_verified_725";
        String signature = razorpaySignature(razorpayOrderId, razorpayPaymentId);
        Map<String, Object> verification = Map.of(
                "campusHubOrderId", orderId,
                "razorpayOrderId", razorpayOrderId,
                "razorpayPaymentId", razorpayPaymentId,
                "razorpaySignature", signature
        );

        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + unrelatedStudent.accessToken()
                        )
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verification)))
                .andExpect(status().isNotFound());

        MvcResult verificationResult = mockMvc.perform(post(
                                "/api/payments/razorpay/verify"
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verification)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verified", is(true)))
                .andExpect(jsonPath("$.data.order.id", is((int) orderId)))
                .andExpect(jsonPath("$.data.order.orderStatus", is("PAID")))
                .andExpect(jsonPath("$.data.order.paymentStatus", is("SUCCESS")))
                .andExpect(jsonPath("$.data.payment.razorpayPaymentId", is(
                        razorpayPaymentId
                )))
                .andExpect(jsonPath("$.data.payment.status", is("SUCCESS")))
                .andExpect(jsonPath("$.data.listing.status", is("SOLD")))
                .andReturn();
        long paymentId = objectMapper
                .readTree(verificationResult.getResponse().getContentAsString())
                .get("data")
                .get("payment")
                .get("id")
                .asLong();

        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verification)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.payment.id", is((int) paymentId)))
                .andExpect(jsonPath("$.data.order.orderStatus", is("PAID")));

        mockMvc.perform(get("/api/payments/my")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .param("userId", unrelatedStudent.userId().toString())
                        .param("search", "engineering calculator")
                        .param("status", "SUCCESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.totalPayments", is(1)))
                .andExpect(jsonPath("$.data.stats.successfulPayments", is(1)))
                .andExpect(jsonPath("$.data.stats.totalSpent", is(725.0)))
                .andExpect(jsonPath("$.data.payments", hasSize(1)))
                .andExpect(jsonPath("$.data.payments[0].role", is("BUYER")))
                .andExpect(jsonPath("$.data.payments[0].canRetry", is(false)))
                .andExpect(jsonPath("$.data.payments[0].razorpayPaymentId", is(
                        razorpayPaymentId
                )));

        mockMvc.perform(get("/api/payments/{paymentId}", paymentId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role", is("SELLER")))
                .andExpect(jsonPath("$.data.orderId", is((int) orderId)));

        mockMvc.perform(post(
                                "/api/payments/razorpay/retry/{orderId}",
                                orderId
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isConflict());

        Listing failedListing = listingRepository.save(new Listing(
                sellerUser,
                "Razorpay failed payment notebook set",
                "A second listing used to verify failure audit and retry.",
                "Books",
                new BigDecimal("310.00"),
                ItemCondition.GOOD,
                ListingStatus.ACTIVE,
                null,
                "Academic Block",
                false
        ));
        MvcResult failedCheckoutResult = mockMvc.perform(post(
                                "/api/orders/create-from-listing/{listingId}",
                                failedListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.razorpay.amount", is(31000)))
                .andReturn();
        JsonNode failedCheckout = objectMapper
                .readTree(failedCheckoutResult.getResponse().getContentAsString())
                .get("data");
        long failedOrderId = failedCheckout.get("order").get("id").asLong();
        String failedRazorpayOrderId = failedCheckout
                .get("razorpay")
                .get("razorpayOrderId")
                .asText();

        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "campusHubOrderId", failedOrderId,
                                "razorpayOrderId", failedRazorpayOrderId,
                                "razorpayPaymentId", "pay_tampered",
                                "razorpaySignature", "invalid-signature"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(
                        "$.message",
                        is(
                                "Payment verification failed. "
                                        + "Contact support if money was deducted."
                        )
                ));

        mockMvc.perform(get("/api/orders/{orderId}", failedOrderId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PAYMENT_FAILED")))
                .andExpect(jsonPath("$.data.paymentStatus", is("FAILED")))
                .andExpect(jsonPath("$.data.availableActions").value(
                        org.hamcrest.Matchers.hasItem("PAY_NOW")
                ));

        MvcResult retryResult = mockMvc.perform(post(
                                "/api/payments/razorpay/retry/{orderId}",
                                failedOrderId
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.order.orderStatus", is("PENDING_PAYMENT")))
                .andExpect(jsonPath("$.data.order.paymentStatus", is("PENDING")))
                .andExpect(jsonPath("$.data.razorpay.amount", is(31000)))
                .andReturn();
        String retryRazorpayOrderId = objectMapper
                .readTree(retryResult.getResponse().getContentAsString())
                .get("data")
                .get("razorpay")
                .get("razorpayOrderId")
                .asText();
        assertFalse(failedRazorpayOrderId.equals(retryRazorpayOrderId));
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

    @Test
    void exploresOtherCollegesWithoutChangingIdentityOrEnablingPurchases()
            throws Exception {
        AuthSession viewer = createVerifiedStudent(
                "Cross College Explorer",
                1L,
                "cross.college.explorer@iitd.ac.in",
                "+919800001081"
        );
        AuthSession bombaySeller = createVerifiedStudent(
                "Cross College Seller",
                2L,
                "cross.college.seller@iitb.ac.in",
                "+919800001082"
        );
        User sellerUser = userRepository.findDashboardUserById(
                bombaySeller.userId()
        ).orElseThrow();

        Listing visibleListing = listingRepository.save(new Listing(
                sellerUser,
                "Unique cross campus robotics kit",
                "A complete robotics kit available for browse-only discovery.",
                "Lab Equipment",
                new BigDecimal("2450.00"),
                ItemCondition.LIKE_NEW,
                ListingStatus.ACTIVE,
                null,
                "IIT Bombay Main Gate",
                true
        ));
        listingRepository.save(new Listing(
                sellerUser,
                "Hidden sold cross campus robotics kit",
                "Sold listings must not appear in discovery.",
                "Lab Equipment",
                new BigDecimal("2100.00"),
                ItemCondition.GOOD,
                ListingStatus.SOLD,
                null,
                "IIT Bombay Main Gate",
                false
        ));

        mockMvc.perform(get("/api/colleges/explore")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewer.accessToken())
                        .param("search", "Bombay")
                        .param("collegeId", "1")
                        .param("userId", bombaySeller.userId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.viewerContext.verifiedCollegeId", is(1)))
                .andExpect(jsonPath(
                        "$.data.viewerContext.verifiedCollegeName",
                        is("IIT Delhi")
                ))
                .andExpect(jsonPath("$.data.colleges", hasSize(1)))
                .andExpect(jsonPath("$.data.colleges[0].id", is(2)))
                .andExpect(jsonPath("$.data.colleges[0].name", is("IIT Bombay")))
                .andExpect(jsonPath("$.data.colleges[0].activeListings").isNumber())
                .andExpect(jsonPath("$.data.colleges[0].verifiedStudents").isNumber());

        mockMvc.perform(get("/api/listings/explore")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewer.accessToken())
                        .param("collegeId", "2")
                        .param("search", "Unique cross campus robotics")
                        .param("category", "Lab Equipment")
                        .param("minPrice", "2000")
                        .param("maxPrice", "3000")
                        .param("condition", "LIKE_NEW")
                        .param("pickupLocation", "Bombay")
                        .param("negotiable", "true")
                        .param("postedDate", "week")
                        .param("sortBy", "priceAsc")
                        .param("page", "0")
                        .param("size", "12")
                        .param("userId", bombaySeller.userId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.viewerContext.verifiedCollegeId", is(1)))
                .andExpect(jsonPath("$.data.viewerContext.browsingCollegeId", is(2)))
                .andExpect(jsonPath("$.data.viewerContext.ownCollege", is(false)))
                .andExpect(jsonPath(
                        "$.data.viewerContext.crossCollegeBuyingEnabled",
                        is(false)
                ))
                .andExpect(jsonPath("$.data.selectedCollege.id", is(2)))
                .andExpect(jsonPath("$.data.listings", hasSize(1)))
                .andExpect(jsonPath("$.data.listings[0].id", is(
                        visibleListing.getId().intValue()
                )))
                .andExpect(jsonPath("$.data.listings[0].college.name", is("IIT Bombay")))
                .andExpect(jsonPath("$.data.listings[0].seller.fullName", is(
                        "Cross College Seller"
                )))
                .andExpect(jsonPath("$.data.listings[0].availableActions", hasSize(2)))
                .andExpect(jsonPath("$.data.listings[0].availableActions[0]", is(
                        "VIEW_DETAILS"
                )))
                .andExpect(jsonPath("$.data.listings[0].availableActions[1]", is("REPORT")))
                .andExpect(jsonPath("$.data.pagination.totalElements", is(1)));

        mockMvc.perform(get(
                                "/api/listings/explore/{listingId}",
                                visibleListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewer.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.college.id", is(2)))
                .andExpect(jsonPath("$.data.seller.fullName", is(
                        "Cross College Seller"
                )))
                .andExpect(jsonPath("$.data.wishlisted", is(false)))
                .andExpect(jsonPath("$.data.ownListing", is(false)))
                .andExpect(jsonPath("$.data.canBuy", is(false)))
                .andExpect(jsonPath("$.data.canReport", is(true)));

        mockMvc.perform(get("/api/listings/{listingId}", visibleListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewer.accessToken()))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/wishlist/{listingId}", visibleListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewer.accessToken()))
                .andExpect(status().isNotFound());

        mockMvc.perform(post(
                                "/api/orders/listings/{listingId}",
                                visibleListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewer.accessToken()))
                .andExpect(status().isNotFound());

        mockMvc.perform(post(
                                "/api/reports/listing/{listingId}",
                                visibleListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewer.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reason", "WRONG_PRODUCT_DETAILS",
                                "description", "Cross-college report integration test."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.listingId", is(
                        visibleListing.getId().intValue()
                )));

        mockMvc.perform(get("/api/listings/explore")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + viewer.accessToken())
                        .param("collegeId", "1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is(
                        "Use My College Marketplace to browse your verified college."
                )));

        User unchangedViewer = userRepository.findDashboardUserById(
                viewer.userId()
        ).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(
                1L,
                unchangedViewer.getCollege().getId()
        );
    }

    @Test
    void securelyManagesOnlyTheAuthenticatedSellersListings() throws Exception {
        AuthSession seller = createVerifiedStudent(
                "Seller Workspace Owner",
                1L,
                "seller.workspace@iitd.ac.in",
                "+919800001041"
        );
        AuthSession buyer = createVerifiedStudent(
                "Seller Workspace Buyer",
                1L,
                "seller.workspace.buyer@iitd.ac.in",
                "+919800001042"
        );
        AuthSession otherSeller = createVerifiedStudent(
                "Other Workspace Seller",
                1L,
                "other.workspace@iitd.ac.in",
                "+919800001043"
        );
        User sellerUser = userRepository.findDashboardUserById(
                seller.userId()
        ).orElseThrow();
        User buyerUser = userRepository.findDashboardUserById(
                buyer.userId()
        ).orElseThrow();
        User otherSellerUser = userRepository.findDashboardUserById(
                otherSeller.userId()
        ).orElseThrow();

        Listing activeListing = listingRepository.save(new Listing(
                sellerUser,
                "Seller workspace calculator",
                "A complete listing used to verify secure seller workspace actions.",
                "Electronics",
                new BigDecimal("900.00"),
                ItemCondition.GOOD,
                ListingStatus.ACTIVE,
                null,
                "Library Gate",
                true
        ));
        Listing inactiveListing = listingRepository.save(new Listing(
                sellerUser,
                "Seller workspace inactive book",
                "An inactive listing that remains manageable by its owner.",
                "Books",
                new BigDecimal("400.00"),
                ItemCondition.FAIR,
                ListingStatus.INACTIVE,
                null,
                "Academic Block",
                false
        ));
        Listing otherListing = listingRepository.save(new Listing(
                otherSellerUser,
                "Other seller private listing",
                "This listing must never be managed by another seller.",
                "Books",
                new BigDecimal("500.00"),
                ItemCondition.GOOD,
                ListingStatus.ACTIVE,
                null,
                "Main Gate",
                false
        ));

        mockMvc.perform(get("/api/listings/{listingId}", activeListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyer.accessToken()))
                .andExpect(status().isOk());
        wishlistRepository.save(new WishlistItem(buyerUser, activeListing));

        mockMvc.perform(get("/api/listings/my")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken())
                        .param("sellerId", otherSeller.userId().toString())
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.totalListings", is(2)))
                .andExpect(jsonPath("$.data.stats.activeListings", is(1)))
                .andExpect(jsonPath("$.data.stats.inactiveListings", is(1)))
                .andExpect(jsonPath("$.data.stats.totalViews", is(1)))
                .andExpect(jsonPath("$.data.stats.totalWishlistSaves", is(1)))
                .andExpect(jsonPath("$.data.listings", hasSize(1)))
                .andExpect(jsonPath("$.data.listings[0].id", is(
                        activeListing.getId().intValue()
                )))
                .andExpect(jsonPath("$.data.listings[0].wishlistCount", is(1)))
                .andExpect(jsonPath("$.data.listings[0].views", is(1)));

        mockMvc.perform(get("/api/listings/my/{listingId}", inactiveListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("INACTIVE")));

        mockMvc.perform(get("/api/listings/my/{listingId}", otherListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken()))
                .andExpect(status().isNotFound());

        Map<String, Object> updateRequest = Map.ofEntries(
                Map.entry("title", "Updated seller workspace calculator"),
                Map.entry(
                        "description",
                        "Updated listing details that remain owned by the authenticated seller."
                ),
                Map.entry("category", "Electronics"),
                Map.entry("price", 950),
                Map.entry("condition", "LIKE_NEW"),
                Map.entry("pickupLocation", "Central Library"),
                Map.entry("negotiable", false),
                Map.entry("availableQuantity", 1),
                Map.entry("additionalNotes", "Updated notes")
        );
        MockMultipartFile updatePart = new MockMultipartFile(
                "listing",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(updateRequest)
        );
        MockMultipartFile replacementImage = new MockMultipartFile(
                "images",
                "updated-calculator.png",
                MediaType.IMAGE_PNG_VALUE,
                new byte[]{
                        (byte) 0x89,
                        0x50,
                        0x4e,
                        0x47,
                        0x0d,
                        0x0a,
                        0x1a,
                        0x0a,
                        0x00
                }
        );
        mockMvc.perform(multipart("/api/listings/{listingId}", activeListing.getId())
                        .file(updatePart)
                        .file(replacementImage)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        })
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken())
                        .param("sellerId", otherSeller.userId().toString())
                        .param("collegeId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title", is(
                        "Updated seller workspace calculator"
                )))
                .andExpect(jsonPath("$.data.sellerName", is("Seller Workspace Owner")))
                .andExpect(jsonPath("$.data.collegeName", is("IIT Delhi")))
                .andExpect(jsonPath("$.data.images", hasSize(1)));

        mockMvc.perform(patch(
                                "/api/listings/{listingId}/mark-inactive",
                                activeListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("INACTIVE")));

        mockMvc.perform(patch(
                                "/api/listings/{listingId}/reactivate",
                                activeListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));

        mockMvc.perform(patch(
                                "/api/listings/{listingId}/mark-sold",
                                activeListing.getId()
                        )
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("SOLD")));

        mockMvc.perform(delete("/api/listings/{listingId}", inactiveListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("DELETED")));

        mockMvc.perform(delete("/api/listings/{listingId}", otherListing.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + seller.accessToken()))
                .andExpect(status().isNotFound());
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
                Map.entry("username", "student_" + phoneNumber.substring(phoneNumber.length() - 10)),
                Map.entry("email", email),
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

        com.campushub.auth.SignupTestSupport.manuallyVerifyAndComplete(mockMvc, objectMapper, userId);

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

    private String razorpaySignature(
            String razorpayOrderId,
            String razorpayPaymentId
    ) throws Exception {
        Mac hmac = Mac.getInstance("HmacSHA256");
        hmac.init(new SecretKeySpec(
                "campus-hub-test-razorpay-secret".getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
        ));
        return HexFormat.of().formatHex(hmac.doFinal(
                (razorpayOrderId + "|" + razorpayPaymentId)
                        .getBytes(StandardCharsets.UTF_8)
        ));
    }

    private record AuthSession(Long userId, String accessToken) {
    }
}

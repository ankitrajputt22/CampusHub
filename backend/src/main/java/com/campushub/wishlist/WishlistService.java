package com.campushub.wishlist;

import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.ItemCondition;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScore;
import com.campushub.user.trustscore.TrustScoreRepository;
import com.campushub.wishlist.dto.WishlistCountResponse;
import com.campushub.wishlist.dto.WishlistPageResponse;
import com.campushub.wishlist.dto.WishlistPageResponse.PaginationSummary;
import com.campushub.wishlist.dto.WishlistPageResponse.SellerSummary;
import com.campushub.wishlist.dto.WishlistPageResponse.WishlistItemSummary;
import com.campushub.wishlist.dto.WishlistPageResponse.WishlistListing;
import com.campushub.wishlist.dto.WishlistPageResponse.WishlistStats;
import com.campushub.wishlist.dto.WishlistStatusResponse;
import com.campushub.wishlist.model.WishlistItem;
import com.campushub.wishlist.repository.WishlistItemRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WishlistService {

    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_PAGE_SIZE = 24;
    private static final Set<String> CATEGORIES = Set.of(
            "Books",
            "Notes",
            "Electronics",
            "Bicycles",
            "Hostel Essentials",
            "Furniture",
            "Lab Equipment",
            "Stationery",
            "Clothing",
            "Others"
    );

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final WishlistItemRepository wishlistRepository;
    private final TrustScoreRepository trustScoreRepository;

    public WishlistService(
            UserRepository userRepository,
            ListingRepository listingRepository,
            WishlistItemRepository wishlistRepository,
            TrustScoreRepository trustScoreRepository
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.wishlistRepository = wishlistRepository;
        this.trustScoreRepository = trustScoreRepository;
    }

    @Transactional(readOnly = true)
    public WishlistPageResponse getWishlist(
            Long authenticatedUserId,
            String search,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String condition,
            String status,
            Integer minSellerTrust,
            String savedDate,
            String sortBy,
            Integer requestedPage,
            Integer requestedSize
    ) {
        User user = loadActiveStudent(authenticatedUserId);
        validatePriceRange(minPrice, maxPrice);
        validateTrustScore(minSellerTrust);

        int page = requestedPage == null ? 0 : requestedPage;
        int size = requestedSize == null ? DEFAULT_PAGE_SIZE : requestedSize;
        if (page < 0) {
            throw new BadRequestException("Page must be zero or greater.");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException(
                    "Page size must be between 1 and " + MAX_PAGE_SIZE + "."
            );
        }

        String normalizedCategory = normalize(category);
        if (normalizedCategory != null && !CATEGORIES.contains(normalizedCategory)) {
            throw new BadRequestException("Unsupported wishlist category.");
        }

        WishlistFilterStatus parsedStatus = parseStatus(status);
        ItemCondition parsedCondition = parseCondition(condition);
        Instant savedAfter = parseSavedAfter(savedDate);
        WishlistSort wishlistSort = parseSort(sortBy);
        Specification<WishlistItem> specification = wishlistSpecification(
                user.getId(),
                user.getCollege().getId(),
                search,
                normalizedCategory,
                minPrice,
                maxPrice,
                parsedCondition,
                parsedStatus,
                minSellerTrust,
                savedAfter,
                wishlistSort.trustedSellersFirst()
        );
        Page<WishlistItem> wishlistPage = wishlistRepository.findAll(
                specification,
                PageRequest.of(page, size, wishlistSort.sort())
        );

        return new WishlistPageResponse(
                getStats(user.getId(), user.getCollege().getId()),
                mapWishlistItems(wishlistPage.getContent()),
                new PaginationSummary(
                        wishlistPage.getNumber(),
                        wishlistPage.getSize(),
                        wishlistPage.getTotalElements(),
                        wishlistPage.getTotalPages(),
                        wishlistPage.hasNext()
                )
        );
    }

    @Transactional(readOnly = true)
    public WishlistCountResponse getCount(Long authenticatedUserId) {
        User user = loadActiveStudent(authenticatedUserId);
        return new WishlistCountResponse(
                wishlistRepository.countScopedWishlistItems(
                        user.getId(),
                        user.getCollege().getId()
                )
        );
    }

    @Transactional
    public WishlistStatusResponse add(Long authenticatedUserId, Long listingId) {
        User user = loadActiveStudent(authenticatedUserId);
        Listing listing = loadAvailableCollegeListing(user, listingId);
        if (listing.getSeller().getId().equals(user.getId())) {
            throw new ForbiddenException("You cannot add your own listing to your wishlist.");
        }
        if (!wishlistRepository.existsByUserIdAndListingId(user.getId(), listingId)) {
            wishlistRepository.save(new WishlistItem(user, listing));
        }
        return new WishlistStatusResponse(listingId, true);
    }

    @Transactional
    public WishlistStatusResponse remove(Long authenticatedUserId, Long listingId) {
        User user = loadActiveStudent(authenticatedUserId);
        wishlistRepository.findByUserIdAndListingId(user.getId(), listingId)
                .ifPresent(wishlistRepository::delete);
        return new WishlistStatusResponse(listingId, false);
    }

    private WishlistStats getStats(Long userId, Long collegeId) {
        long totalItems = wishlistRepository.countScopedWishlistItems(userId, collegeId);
        long availableItems = wishlistRepository.countAvailableWishlistItems(
                userId,
                collegeId,
                ListingStatus.ACTIVE,
                AccountStatus.ACTIVE
        );
        return new WishlistStats(
                totalItems,
                availableItems,
                totalItems - availableItems
        );
    }

    private List<WishlistItemSummary> mapWishlistItems(List<WishlistItem> items) {
        if (items.isEmpty()) {
            return List.of();
        }
        Set<Long> sellerIds = items.stream()
                .map(item -> item.getListing().getSeller().getId())
                .collect(Collectors.toSet());
        Map<Long, TrustScore> trustScores = trustScoreRepository.findAllByUserIdIn(sellerIds)
                .stream()
                .collect(Collectors.toMap(
                        score -> score.getUser().getId(),
                        Function.identity()
                ));

        return items.stream().map(item -> {
            Listing listing = item.getListing();
            User seller = listing.getSeller();
            TrustScore trustScore = trustScores.get(seller.getId());
            int score = trustScore == null ? 0 : trustScore.getScore();
            return new WishlistItemSummary(
                    item.getId(),
                    item.getCreatedAt(),
                    new WishlistListing(
                            listing.getId(),
                            listing.getTitle(),
                            listing.getPrice(),
                            listing.getCategory(),
                            listing.getCondition().name(),
                            listing.getPickupLocation(),
                            listing.getStatus().name(),
                            listing.getPrimaryImageUrl(),
                            isAvailable(listing),
                            new SellerSummary(
                                    seller.getId(),
                                    seller.getFullName(),
                                    score,
                                    trustLevel(score)
                            )
                    )
            );
        }).toList();
    }

    private Specification<WishlistItem> wishlistSpecification(
            Long userId,
            Long collegeId,
            String search,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            ItemCondition condition,
            WishlistFilterStatus status,
            Integer minSellerTrust,
            Instant savedAfter,
            boolean trustedSellersFirst
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            var listing = root.join("listing");
            var seller = listing.join("seller");

            predicates.add(builder.equal(root.get("user").get("id"), userId));
            predicates.add(builder.equal(listing.get("college").get("id"), collegeId));

            String normalizedSearch = normalize(search);
            if (normalizedSearch != null) {
                String likeSearch = "%" + normalizedSearch.toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(listing.get("title")), likeSearch),
                        builder.like(builder.lower(listing.get("category")), likeSearch),
                        builder.like(builder.lower(listing.get("pickupLocation")), likeSearch),
                        builder.like(builder.lower(seller.get("fullName")), likeSearch)
                ));
            }
            if (category != null) {
                predicates.add(builder.equal(listing.get("category"), category));
            }
            if (minPrice != null) {
                predicates.add(builder.greaterThanOrEqualTo(listing.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(builder.lessThanOrEqualTo(listing.get("price"), maxPrice));
            }
            if (condition != null) {
                predicates.add(builder.equal(listing.get("condition"), condition));
            }
            if (savedAfter != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), savedAfter));
            }
            applyStatusPredicate(predicates, listing, seller, status, builder);

            if (minSellerTrust != null) {
                Subquery<Long> trustedSellers = query.subquery(Long.class);
                Root<TrustScore> trustScore = trustedSellers.from(TrustScore.class);
                trustedSellers
                        .select(trustScore.get("user").get("id"))
                        .where(builder.greaterThanOrEqualTo(
                                trustScore.get("score"),
                                minSellerTrust
                        ));
                predicates.add(seller.get("id").in(trustedSellers));
            }

            if (trustedSellersFirst
                    && query.getResultType() != Long.class
                    && query.getResultType() != long.class) {
                Subquery<Integer> sellerTrustScore = query.subquery(Integer.class);
                Root<TrustScore> trustScore = sellerTrustScore.from(TrustScore.class);
                sellerTrustScore
                        .select(trustScore.get("score"))
                        .where(builder.equal(
                                trustScore.get("user").get("id"),
                                seller.get("id")
                        ));
                query.orderBy(
                        builder.desc(sellerTrustScore),
                        builder.desc(root.get("createdAt")),
                        builder.desc(root.get("id"))
                );
            }

            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void applyStatusPredicate(
            List<Predicate> predicates,
            jakarta.persistence.criteria.From<?, ?> listing,
            jakarta.persistence.criteria.From<?, ?> seller,
            WishlistFilterStatus status,
            jakarta.persistence.criteria.CriteriaBuilder builder
    ) {
        if (status == null) {
            return;
        }
        if (status.available()) {
            predicates.add(builder.equal(listing.get("status"), ListingStatus.ACTIVE));
            predicates.add(builder.equal(seller.get("status"), AccountStatus.ACTIVE));
            return;
        }
        if (status.unavailable()) {
            predicates.add(builder.or(
                    builder.notEqual(listing.get("status"), ListingStatus.ACTIVE),
                    builder.notEqual(seller.get("status"), AccountStatus.ACTIVE)
            ));
            return;
        }
        predicates.add(builder.equal(listing.get("status"), status.listingStatus()));
    }

    private Listing loadAvailableCollegeListing(User user, Long listingId) {
        return listingRepository.findMarketplaceListingById(listingId)
                .filter(listing -> listing.getStatus() == ListingStatus.ACTIVE)
                .filter(listing -> listing.getCollege().getId().equals(user.getCollege().getId()))
                .filter(listing -> listing.getSeller().getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "This listing is unavailable in your college marketplace."
                ));
    }

    private User loadActiveStudent(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student account was not found."));
        if (user.getRole() != UserRole.STUDENT || user.getStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("An active student account is required.");
        }
        if (!user.getCollege().isActive()) {
            throw new ForbiddenException("Your college marketplace is currently unavailable.");
        }
        return user;
    }

    private void validatePriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        if (minPrice != null && minPrice.signum() < 0) {
            throw new BadRequestException("Minimum price cannot be negative.");
        }
        if (maxPrice != null && maxPrice.signum() < 0) {
            throw new BadRequestException("Maximum price cannot be negative.");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new BadRequestException("Minimum price cannot be greater than maximum price.");
        }
    }

    private void validateTrustScore(Integer minSellerTrust) {
        if (minSellerTrust != null && (minSellerTrust < 0 || minSellerTrust > 100)) {
            throw new BadRequestException("Seller trust score must be between 0 and 100.");
        }
    }

    private ItemCondition parseCondition(String condition) {
        String normalized = normalize(condition);
        if (normalized == null) {
            return null;
        }
        try {
            return ItemCondition.valueOf(
                    normalized.toUpperCase(Locale.ROOT).replace(' ', '_')
            );
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported item condition.");
        }
    }

    private WishlistFilterStatus parseStatus(String status) {
        String normalized = normalize(status);
        if (normalized == null || normalized.equalsIgnoreCase("all")) {
            return null;
        }
        if (normalized.equalsIgnoreCase("available")) {
            return new WishlistFilterStatus(true, false, null);
        }
        if (normalized.equalsIgnoreCase("unavailable")) {
            return new WishlistFilterStatus(false, true, null);
        }
        try {
            return new WishlistFilterStatus(
                    false,
                    false,
                    ListingStatus.valueOf(
                            normalized.toUpperCase(Locale.ROOT).replace(' ', '_')
                    )
            );
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported wishlist status filter.");
        }
    }

    private Instant parseSavedAfter(String savedDate) {
        String normalized = normalize(savedDate);
        if (normalized == null || normalized.equalsIgnoreCase("any")) {
            return null;
        }
        return switch (normalized.toLowerCase(Locale.ROOT)) {
            case "today" -> Instant.now().minus(1, ChronoUnit.DAYS);
            case "week" -> Instant.now().minus(7, ChronoUnit.DAYS);
            case "month" -> Instant.now().minus(30, ChronoUnit.DAYS);
            default -> throw new BadRequestException("Unsupported saved date filter.");
        };
    }

    private WishlistSort parseSort(String sortBy) {
        String normalized = normalize(sortBy);
        if (normalized == null || normalized.equalsIgnoreCase("recent")) {
            return new WishlistSort(
                    Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")),
                    false
            );
        }
        return switch (normalized.toLowerCase(Locale.ROOT)) {
            case "oldest" -> new WishlistSort(
                    Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id")),
                    false
            );
            case "priceasc", "price_asc" -> new WishlistSort(
                    Sort.by(
                            Sort.Order.asc("listing.price"),
                            Sort.Order.desc("createdAt")
                    ),
                    false
            );
            case "pricedesc", "price_desc" -> new WishlistSort(
                    Sort.by(
                            Sort.Order.desc("listing.price"),
                            Sort.Order.desc("createdAt")
                    ),
                    false
            );
            case "trusted", "mosttrusted", "most_trusted" ->
                    new WishlistSort(Sort.unsorted(), true);
            default -> throw new BadRequestException("Unsupported wishlist sort option.");
        };
    }

    private boolean isAvailable(Listing listing) {
        return listing.getStatus() == ListingStatus.ACTIVE
                && listing.getSeller().getStatus() == AccountStatus.ACTIVE;
    }

    private String trustLevel(int score) {
        if (score <= 40) {
            return "New / Low Trust";
        }
        if (score <= 70) {
            return "Average Trust";
        }
        if (score <= 90) {
            return "Trusted Student";
        }
        return "Campus Verified Seller";
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private record WishlistFilterStatus(
            boolean available,
            boolean unavailable,
            ListingStatus listingStatus
    ) {
    }

    private record WishlistSort(Sort sort, boolean trustedSellersFirst) {
    }
}

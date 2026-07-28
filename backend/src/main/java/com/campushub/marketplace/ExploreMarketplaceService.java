package com.campushub.marketplace;

import com.campushub.college.model.College;
import com.campushub.college.service.ExploreCollegeService;
import com.campushub.college.service.ExploreRateLimiter;
import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.ItemCondition;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingImage;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingImageRepository;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.marketplace.dto.ExploreMarketplaceResponse;
import com.campushub.marketplace.dto.ExploreMarketplaceResponse.CollegeSummary;
import com.campushub.marketplace.dto.ExploreMarketplaceResponse.ExploreListingSummary;
import com.campushub.marketplace.dto.ExploreMarketplaceResponse.PaginationSummary;
import com.campushub.marketplace.dto.ExploreMarketplaceResponse.SellerSummary;
import com.campushub.marketplace.dto.ExploreMarketplaceResponse.ViewerContext;
import com.campushub.marketplace.dto.MarketplaceListingResponse;
import com.campushub.marketplace.dto.ProductDetailsResponse;
import com.campushub.marketplace.dto.ProductDetailsResponse.SellerDetails;
import com.campushub.order.model.OrderStatus;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.profile.model.ProfilePrivacySettings;
import com.campushub.profile.repository.ProfilePrivacySettingsRepository;
import com.campushub.review.repository.SellerReviewRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.trustscore.TrustScore;
import com.campushub.user.trustscore.TrustScoreRepository;
import jakarta.persistence.criteria.JoinType;
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
public class ExploreMarketplaceService {

    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_PAGE_SIZE = 24;

    private final ExploreCollegeService exploreCollegeService;
    private final ExploreRateLimiter rateLimiter;
    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final ProfilePrivacySettingsRepository privacyRepository;
    private final SellerReviewRepository reviewRepository;
    private final MarketplaceOrderRepository orderRepository;

    public ExploreMarketplaceService(
            ExploreCollegeService exploreCollegeService,
            ExploreRateLimiter rateLimiter,
            ListingRepository listingRepository,
            ListingImageRepository listingImageRepository,
            TrustScoreRepository trustScoreRepository,
            ProfilePrivacySettingsRepository privacyRepository,
            SellerReviewRepository reviewRepository,
            MarketplaceOrderRepository orderRepository
    ) {
        this.exploreCollegeService = exploreCollegeService;
        this.rateLimiter = rateLimiter;
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.privacyRepository = privacyRepository;
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public ExploreMarketplaceResponse exploreListings(
            Long authenticatedUserId,
            Long collegeId,
            String search,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String condition,
            String pickupLocation,
            Boolean negotiable,
            String postedDate,
            Integer minSellerTrust,
            String sortBy,
            Integer requestedPage,
            Integer requestedSize
    ) {
        User viewer = exploreCollegeService.loadVerifiedStudent(authenticatedUserId);
        rateLimiter.check(viewer.getId());
        College selectedCollege = exploreCollegeService.loadOtherCollege(viewer, collegeId);
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

        Page<Listing> listingPage = listingRepository.findAll(
                exploreSpecification(
                        selectedCollege.getId(),
                        search,
                        category,
                        minPrice,
                        maxPrice,
                        parseCondition(condition),
                        pickupLocation,
                        negotiable,
                        parsePostedAfter(postedDate),
                        minSellerTrust
                ),
                PageRequest.of(page, size, parseSort(sortBy))
        );

        return new ExploreMarketplaceResponse(
                viewerContext(viewer, selectedCollege),
                exploreCollegeService.toCard(selectedCollege),
                mapListings(listingPage.getContent()),
                new PaginationSummary(
                        listingPage.getNumber(),
                        listingPage.getSize(),
                        listingPage.getTotalElements(),
                        listingPage.getTotalPages(),
                        listingPage.hasNext()
                ),
                listingRepository.findPickupLocations(
                        selectedCollege.getId(),
                        ListingStatus.ACTIVE
                )
        );
    }

    @Transactional
    public ProductDetailsResponse getListing(
            Long authenticatedUserId,
            Long listingId
    ) {
        User viewer = exploreCollegeService.loadVerifiedStudent(authenticatedUserId);
        Listing listing = listingRepository.findMarketplaceListingById(listingId)
                .filter(item -> !item.getCollege().getId().equals(
                        viewer.getCollege().getId()
                ))
                .filter(item -> item.getCollege().isExplorable())
                .filter(item -> item.getStatus() == ListingStatus.ACTIVE)
                .filter(item -> item.getSeller().getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "This cross-college listing is no longer available."
                ));

        User seller = listing.getSeller();
        TrustScore trustScore = trustScoreRepository.findByUserId(seller.getId())
                .orElse(null);
        int trust = trustScore == null ? 0 : trustScore.getScore();
        ProfilePrivacySettings privacy = privacyRepository.findByUserId(seller.getId())
                .orElse(null);
        listing.recordView();

        List<String> imageUrls = listingImageRepository
                .findAllByListingIdOrderByDisplayOrderAsc(listing.getId())
                .stream()
                .map(ListingImage::getImageUrl)
                .toList();
        if (imageUrls.isEmpty() && hasText(listing.getPrimaryImageUrl())) {
            imageUrls = List.of(listing.getPrimaryImageUrl());
        }
        List<Listing> similar = listingRepository
                .findTop4ByCollegeIdAndCategoryIgnoreCaseAndStatusAndIdNotAndSeller_StatusOrderByCreatedAtDesc(
                        listing.getCollege().getId(),
                        listing.getCategory(),
                        ListingStatus.ACTIVE,
                        listing.getId(),
                        AccountStatus.ACTIVE
                );

        return new ProductDetailsResponse(
                listing.getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getAdditionalNotes(),
                listing.getPrice(),
                listing.getCategory(),
                listing.getCondition().name(),
                listing.getPickupLocation(),
                listing.isNegotiable(),
                listing.getAvailableQuantity(),
                listing.getStatus().name(),
                listing.getCreatedAt(),
                new ProductDetailsResponse.CollegeSummary(
                        listing.getCollege().getId(),
                        listing.getCollege().getName(),
                        listing.getCollege().getCode()
                ),
                imageUrls,
                new SellerDetails(
                        seller.getId(),
                        seller.getFullName(),
                        seller.getProfilePhotoUrl(),
                        isVerifiedStudent(seller),
                        seller.getCollege().getName(),
                        privacy == null || privacy.isShowDepartment()
                                ? effectiveDepartment(seller)
                                : null,
                        privacy == null || privacy.isShowYearOfStudy()
                                ? effectiveYearOfStudy(seller)
                                : null,
                        trust,
                        trustLevel(trust),
                        roundRating(reviewRepository.averageRatingByRevieweeId(seller.getId())),
                        reviewRepository.countByRevieweeId(seller.getId()),
                        orderRepository.countBySellerIdAndStatus(
                                seller.getId(),
                                OrderStatus.COMPLETED
                        ),
                        seller.getCreatedAt()
                ),
                false,
                false,
                false,
                true,
                mapSimilarListings(similar)
        );
    }

    private List<ExploreListingSummary> mapListings(List<Listing> listings) {
        if (listings.isEmpty()) {
            return List.of();
        }
        Set<Long> sellerIds = listings.stream()
                .map(listing -> listing.getSeller().getId())
                .collect(Collectors.toSet());
        Map<Long, TrustScore> trustScores = trustScoreRepository.findAllByUserIdIn(sellerIds)
                .stream()
                .collect(Collectors.toMap(
                        score -> score.getUser().getId(),
                        Function.identity()
                ));

        return listings.stream()
                .map(listing -> {
                    User seller = listing.getSeller();
                    TrustScore trustScore = trustScores.get(seller.getId());
                    int trust = trustScore == null ? 0 : trustScore.getScore();
                    return new ExploreListingSummary(
                            listing.getId(),
                            listing.getTitle(),
                            listing.getDescription(),
                            listing.getCategory(),
                            listing.getPrice(),
                            listing.getCondition().name(),
                            listing.getPrimaryImageUrl(),
                            listing.getPickupLocation(),
                            listing.isNegotiable(),
                            listing.getCreatedAt(),
                            new CollegeSummary(
                                    listing.getCollege().getId(),
                                    listing.getCollege().getName(),
                                    listing.getCollege().getCode()
                            ),
                            new SellerSummary(
                                    seller.getId(),
                                    seller.getFullName(),
                                    seller.getProfilePhotoUrl(),
                                    trust,
                                    trustLevel(trust)
                            ),
                            List.of("VIEW_DETAILS", "REPORT")
                    );
                })
                .toList();
    }

    private List<MarketplaceListingResponse> mapSimilarListings(List<Listing> listings) {
        if (listings.isEmpty()) {
            return List.of();
        }
        Set<Long> sellerIds = listings.stream()
                .map(listing -> listing.getSeller().getId())
                .collect(Collectors.toSet());
        Map<Long, TrustScore> trustScores = trustScoreRepository.findAllByUserIdIn(sellerIds)
                .stream()
                .collect(Collectors.toMap(
                        score -> score.getUser().getId(),
                        Function.identity()
                ));
        return listings.stream()
                .map(listing -> {
                    User seller = listing.getSeller();
                    TrustScore trustScore = trustScores.get(seller.getId());
                    return new MarketplaceListingResponse(
                            listing.getId(),
                            listing.getTitle(),
                            listing.getDescription(),
                            listing.getCategory(),
                            listing.getPrice(),
                            listing.getCondition().name(),
                            listing.getPrimaryImageUrl(),
                            listing.getPickupLocation(),
                            listing.isNegotiable(),
                            listing.getCreatedAt(),
                            new MarketplaceListingResponse.SellerSummary(
                                    seller.getId(),
                                    seller.getFullName(),
                                    seller.getProfilePhotoUrl(),
                                    trustScore == null ? 0 : trustScore.getScore()
                            ),
                            false,
                            false
                    );
                })
                .toList();
    }

    private Specification<Listing> exploreSpecification(
            Long collegeId,
            String search,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            ItemCondition condition,
            String pickupLocation,
            Boolean negotiable,
            Instant postedAfter,
            Integer minSellerTrust
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("college").get("id"), collegeId));
            predicates.add(builder.equal(root.get("status"), ListingStatus.ACTIVE));
            predicates.add(builder.equal(
                    root.get("seller").get("status"),
                    AccountStatus.ACTIVE
            ));

            String normalizedSearch = normalize(search);
            if (normalizedSearch != null) {
                if (normalizedSearch.length() > 100) {
                    throw new BadRequestException(
                            "Listing search must be 100 characters or fewer."
                    );
                }
                String likeSearch = "%" + normalizedSearch.toLowerCase(Locale.ROOT) + "%";
                var seller = root.join("seller", JoinType.INNER);
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("title")), likeSearch),
                        builder.like(builder.lower(root.get("description")), likeSearch),
                        builder.like(builder.lower(root.get("category")), likeSearch),
                        builder.like(builder.lower(root.get("pickupLocation")), likeSearch),
                        builder.like(builder.lower(seller.get("fullName")), likeSearch)
                ));
            }
            String normalizedCategory = normalize(category);
            if (normalizedCategory != null) {
                predicates.add(builder.equal(
                        builder.lower(root.get("category")),
                        normalizedCategory.toLowerCase(Locale.ROOT)
                ));
            }
            if (minPrice != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            if (condition != null) {
                predicates.add(builder.equal(root.get("condition"), condition));
            }
            String normalizedPickup = normalize(pickupLocation);
            if (normalizedPickup != null) {
                predicates.add(builder.like(
                        builder.lower(root.get("pickupLocation")),
                        "%" + normalizedPickup.toLowerCase(Locale.ROOT) + "%"
                ));
            }
            if (negotiable != null) {
                predicates.add(builder.equal(root.get("negotiable"), negotiable));
            }
            if (postedAfter != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), postedAfter));
            }
            if (minSellerTrust != null) {
                Subquery<Long> trustedSellers = query.subquery(Long.class);
                Root<TrustScore> trustScore = trustedSellers.from(TrustScore.class);
                trustedSellers
                        .select(trustScore.get("user").get("id"))
                        .where(builder.greaterThanOrEqualTo(
                                trustScore.get("score"),
                                minSellerTrust
                        ));
                predicates.add(root.get("seller").get("id").in(trustedSellers));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private ViewerContext viewerContext(User viewer, College selectedCollege) {
        return new ViewerContext(
                viewer.getCollege().getId(),
                viewer.getCollege().getName(),
                viewer.getCollege().getCode(),
                selectedCollege.getId(),
                false,
                false
        );
    }

    private void validatePriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        if (minPrice != null && minPrice.signum() < 0) {
            throw new BadRequestException("Minimum price cannot be negative.");
        }
        if (maxPrice != null && maxPrice.signum() < 0) {
            throw new BadRequestException("Maximum price cannot be negative.");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new BadRequestException(
                    "Minimum price cannot be greater than maximum price."
            );
        }
    }

    private void validateTrustScore(Integer minSellerTrust) {
        if (minSellerTrust != null && (minSellerTrust < 0 || minSellerTrust > 100)) {
            throw new BadRequestException(
                    "Seller trust score must be between 0 and 100."
            );
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

    private Instant parsePostedAfter(String postedDate) {
        String normalized = normalize(postedDate);
        if (normalized == null || normalized.equalsIgnoreCase("any")) {
            return null;
        }
        return switch (normalized.toLowerCase(Locale.ROOT)) {
            case "today" -> Instant.now().minus(1, ChronoUnit.DAYS);
            case "week" -> Instant.now().minus(7, ChronoUnit.DAYS);
            case "month" -> Instant.now().minus(30, ChronoUnit.DAYS);
            default -> throw new BadRequestException("Unsupported posted date filter.");
        };
    }

    private Sort parseSort(String sortBy) {
        String normalized = normalize(sortBy);
        if (normalized == null || normalized.equalsIgnoreCase("newest")) {
            return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        }
        return switch (normalized.toLowerCase(Locale.ROOT)) {
            case "priceasc", "price_asc" -> Sort.by(
                    Sort.Order.asc("price"),
                    Sort.Order.desc("createdAt")
            );
            case "pricedesc", "price_desc" -> Sort.by(
                    Sort.Order.desc("price"),
                    Sort.Order.desc("createdAt")
            );
            default -> throw new BadRequestException(
                    "Unsupported explore marketplace sort option."
            );
        };
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean isVerifiedStudent(User user) {
        return user.getStatus() == AccountStatus.ACTIVE
                && user.isEmailVerified()
                && user.isPhoneVerified();
    }

    private String effectiveDepartment(User user) {
        return effectiveValue(user.getDepartment(), user.getCustomDepartment());
    }

    private String effectiveYearOfStudy(User user) {
        return effectiveValue(user.getYearOfStudy(), user.getCustomYearOfStudy());
    }

    private String effectiveValue(String selectedValue, String customValue) {
        if ("Other".equalsIgnoreCase(selectedValue) && hasText(customValue)) {
            return customValue.trim();
        }
        return selectedValue;
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

    private double roundRating(double rating) {
        return Math.round(rating * 10.0) / 10.0;
    }
}

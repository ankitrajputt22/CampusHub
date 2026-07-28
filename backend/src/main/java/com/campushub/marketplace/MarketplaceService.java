package com.campushub.marketplace;

import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.image.ListingImageStorage;
import com.campushub.listing.image.StoredListingImage;
import com.campushub.listing.model.ItemCondition;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingImage;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingImageRepository;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.marketplace.dto.CollegeMarketplaceResponse;
import com.campushub.marketplace.dto.CollegeMarketplaceResponse.CollegeSummary;
import com.campushub.marketplace.dto.CollegeMarketplaceResponse.PaginationSummary;
import com.campushub.marketplace.dto.CreateListingRequest;
import com.campushub.marketplace.dto.CreatedListingResponse;
import com.campushub.marketplace.dto.ListingStatusUpdateResponse;
import com.campushub.marketplace.dto.MarketplaceListingResponse;
import com.campushub.marketplace.dto.MarketplaceListingResponse.SellerSummary;
import com.campushub.marketplace.dto.MyListingDetailsResponse;
import com.campushub.marketplace.dto.MyMarketplaceResponse;
import com.campushub.marketplace.dto.MyMarketplaceResponse.MyListingSummary;
import com.campushub.marketplace.dto.MyMarketplaceResponse.SellerStats;
import com.campushub.marketplace.dto.ProductDetailsResponse;
import com.campushub.marketplace.dto.ProductDetailsResponse.SellerDetails;
import com.campushub.notification.NotificationService;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.order.model.OrderStatus;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.profile.model.ProfilePrivacySettings;
import com.campushub.profile.repository.ProfilePrivacySettingsRepository;
import com.campushub.review.repository.SellerReviewRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScore;
import com.campushub.user.trustscore.TrustScoreRepository;
import com.campushub.wishlist.repository.WishlistItemRepository;
import com.campushub.wishlist.model.WishlistItem;
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
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MarketplaceService {

    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_PAGE_SIZE = 24;
    private static final int MAX_LISTING_IMAGES = 5;
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
    private static final List<String> PROHIBITED_TERMS = List.of(
            "alcohol",
            "drug",
            "drugs",
            "weapon",
            "weapons",
            "stolen",
            "counterfeit",
            "explosive",
            "explosives",
            "adult product",
            "adult products"
    );

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final ListingImageStorage listingImageStorage;
    private final WishlistItemRepository wishlistRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final ProfilePrivacySettingsRepository privacyRepository;
    private final SellerReviewRepository reviewRepository;
    private final MarketplaceOrderRepository orderRepository;
    private final NotificationService notificationService;

    public MarketplaceService(
            UserRepository userRepository,
            ListingRepository listingRepository,
            ListingImageRepository listingImageRepository,
            ListingImageStorage listingImageStorage,
            WishlistItemRepository wishlistRepository,
            TrustScoreRepository trustScoreRepository,
            ProfilePrivacySettingsRepository privacyRepository,
            SellerReviewRepository reviewRepository,
            MarketplaceOrderRepository orderRepository,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
        this.listingImageStorage = listingImageStorage;
        this.wishlistRepository = wishlistRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.privacyRepository = privacyRepository;
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public CreatedListingResponse createListing(
            Long authenticatedUserId,
            CreateListingRequest request,
            List<MultipartFile> images
    ) {
        User seller = loadActiveStudent(authenticatedUserId);
        if (!isVerifiedStudent(seller)) {
            throw new ForbiddenException(
                    "Email and phone verification are required before selling an item."
            );
        }
        validateCreateRequest(request, images);

        Listing listing = listingRepository.saveAndFlush(new Listing(
                seller,
                request.title().trim(),
                request.description().trim(),
                request.category().trim(),
                request.price(),
                parseCondition(request.condition()),
                ListingStatus.ACTIVE,
                null,
                request.pickupLocation().trim(),
                request.negotiable(),
                request.availableQuantity(),
                normalize(request.additionalNotes())
        ));
        List<StoredListingImage> storedImages = new ArrayList<>();

        try {
            for (int index = 0; index < images.size(); index++) {
                StoredListingImage stored = listingImageStorage.store(
                        listing.getId(),
                        images.get(index)
                );
                storedImages.add(stored);
                listingImageRepository.save(new ListingImage(
                        listing,
                        stored.publicUrl(),
                        stored.fileName(),
                        index
                ));
            }
            listing.updatePrimaryImageUrl(storedImages.getFirst().publicUrl());
            listingRepository.save(listing);
            listingImageRepository.flush();
            listingRepository.flush();
        } catch (RuntimeException exception) {
            storedImages.forEach(image -> listingImageStorage.delete(image.fileName()));
            throw exception;
        }

        notificationService.notify(
                seller,
                NotificationType.LISTING,
                NotificationPriority.LOW,
                "Listing created",
                "Your listing " + listing.getTitle() + " is now active.",
                RelatedEntityType.LISTING,
                listing.getId(),
                "/student/my-marketplace"
        );

        return new CreatedListingResponse(
                listing.getId(),
                listing.getTitle(),
                listing.getPrice(),
                listing.getCategory(),
                listing.getCondition().name(),
                listing.getPickupLocation(),
                listing.isNegotiable(),
                listing.getAvailableQuantity(),
                listing.getStatus().name(),
                seller.getCollege().getName(),
                seller.getFullName(),
                storedImages.stream().map(StoredListingImage::publicUrl).toList(),
                listing.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public CollegeMarketplaceResponse getMyCollegeMarketplace(
            Long authenticatedUserId,
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
        User user = loadActiveStudent(authenticatedUserId);
        validatePriceRange(minPrice, maxPrice);
        validateTrustScore(minSellerTrust);

        int page = requestedPage == null ? 0 : requestedPage;
        int size = requestedSize == null ? DEFAULT_PAGE_SIZE : requestedSize;
        if (page < 0) {
            throw new BadRequestException("Page must be zero or greater.");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Page size must be between 1 and " + MAX_PAGE_SIZE + ".");
        }

        ItemCondition parsedCondition = parseCondition(condition);
        Instant postedAfter = parsePostedAfter(postedDate);
        MarketplaceSort marketplaceSort = parseSort(sortBy);
        Specification<Listing> specification = marketplaceSpecification(
                user.getCollege().getId(),
                search,
                category,
                minPrice,
                maxPrice,
                parsedCondition,
                pickupLocation,
                negotiable,
                postedAfter,
                minSellerTrust,
                marketplaceSort.trustedSellersFirst()
        );

        Page<Listing> listingPage = listingRepository.findAll(
                specification,
                PageRequest.of(page, size, marketplaceSort.sort())
        );
        List<MarketplaceListingResponse> listings = mapListings(
                user.getId(),
                listingPage.getContent()
        );

        return new CollegeMarketplaceResponse(
                new CollegeSummary(
                        user.getCollege().getId(),
                        user.getCollege().getName(),
                        user.getCollege().getCode()
                ),
                listings,
                new PaginationSummary(
                        listingPage.getNumber(),
                        listingPage.getSize(),
                        listingPage.getTotalElements(),
                        listingPage.getTotalPages(),
                        listingPage.hasNext()
                ),
                listingRepository.findPickupLocations(
                        user.getCollege().getId(),
                        ListingStatus.ACTIVE
                )
        );
    }

    @Transactional(readOnly = true)
    public MyMarketplaceResponse getMyMarketplace(
            Long authenticatedUserId,
            String search,
            String status,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String condition,
            String pickupLocation,
            String postedDate,
            String sortBy,
            Integer requestedPage,
            Integer requestedSize
    ) {
        User seller = loadActiveStudent(authenticatedUserId);
        validatePriceRange(minPrice, maxPrice);

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

        ListingStatus parsedStatus = parseSellerStatus(status);
        ItemCondition parsedCondition = parseCondition(condition);
        Instant postedAfter = parsePostedAfter(postedDate);
        SellerListingSort listingSort = parseSellerSort(sortBy);
        Specification<Listing> specification = myListingSpecification(
                seller.getId(),
                search,
                parsedStatus,
                category,
                minPrice,
                maxPrice,
                parsedCondition,
                pickupLocation,
                postedAfter,
                listingSort.wishlistedFirst()
        );
        Page<Listing> listingPage = listingRepository.findAll(
                specification,
                PageRequest.of(page, size, listingSort.sort())
        );

        return new MyMarketplaceResponse(
                getSellerStats(seller.getId()),
                listingPage.getContent().stream()
                        .map(this::toMyListingSummary)
                        .toList(),
                new MyMarketplaceResponse.PaginationSummary(
                        listingPage.getNumber(),
                        listingPage.getSize(),
                        listingPage.getTotalElements(),
                        listingPage.getTotalPages(),
                        listingPage.hasNext()
                )
        );
    }

    @Transactional(readOnly = true)
    public SellerStats getMyMarketplaceStats(Long authenticatedUserId) {
        User seller = loadActiveStudent(authenticatedUserId);
        return getSellerStats(seller.getId());
    }

    @Transactional(readOnly = true)
    public MyListingDetailsResponse getMyListing(
            Long authenticatedUserId,
            Long listingId
    ) {
        loadActiveStudent(authenticatedUserId);
        return toMyListingDetails(requireOwnedListing(authenticatedUserId, listingId));
    }

    @Transactional
    public MyListingDetailsResponse updateListing(
            Long authenticatedUserId,
            Long listingId,
            CreateListingRequest request,
            List<MultipartFile> replacementImages
    ) {
        loadActiveStudent(authenticatedUserId);
        Listing listing = requireOwnedListing(authenticatedUserId, listingId);
        if (listing.getStatus() != ListingStatus.ACTIVE
                && listing.getStatus() != ListingStatus.INACTIVE) {
            throw new BadRequestException(
                    "Only active or inactive listings can be edited."
            );
        }
        validateUpdateRequest(request, replacementImages);

        listing.updateDetails(
                request.title().trim(),
                request.description().trim(),
                request.category().trim(),
                request.price(),
                parseCondition(request.condition()),
                request.pickupLocation().trim(),
                request.negotiable(),
                request.availableQuantity(),
                normalize(request.additionalNotes())
        );
        if (replacementImages != null && !replacementImages.isEmpty()) {
            replaceListingImages(listing, replacementImages);
        }
        listingRepository.saveAndFlush(listing);
        return toMyListingDetails(listing);
    }

    @Transactional
    public ListingStatusUpdateResponse markListingSold(
            Long authenticatedUserId,
            Long listingId
    ) {
        return changeOwnedListingStatus(
                authenticatedUserId,
                listingId,
                ListingStatus.ACTIVE,
                ListingStatus.SOLD,
                "Only an active listing can be marked as sold."
        );
    }

    @Transactional
    public ListingStatusUpdateResponse markListingInactive(
            Long authenticatedUserId,
            Long listingId
    ) {
        return changeOwnedListingStatus(
                authenticatedUserId,
                listingId,
                ListingStatus.ACTIVE,
                ListingStatus.INACTIVE,
                "Only an active listing can be made inactive."
        );
    }

    @Transactional
    public ListingStatusUpdateResponse reactivateListing(
            Long authenticatedUserId,
            Long listingId
    ) {
        return changeOwnedListingStatus(
                authenticatedUserId,
                listingId,
                ListingStatus.INACTIVE,
                ListingStatus.ACTIVE,
                "Only an inactive listing can be reactivated."
        );
    }

    @Transactional
    public ListingStatusUpdateResponse deleteListing(
            Long authenticatedUserId,
            Long listingId
    ) {
        loadActiveStudent(authenticatedUserId);
        Listing listing = requireOwnedListing(authenticatedUserId, listingId);
        if (listing.getStatus() == ListingStatus.DELETED) {
            throw new ResourceNotFoundException("Listing was not found.");
        }
        listing.changeStatus(ListingStatus.DELETED);
        listingRepository.save(listing);
        notifyListingStatus(listing, ListingStatus.DELETED);
        return new ListingStatusUpdateResponse(
                listing.getId(),
                listing.getStatus().name(),
                listing.getUpdatedAt()
        );
    }

    @Transactional
    public ProductDetailsResponse getListing(
            Long authenticatedUserId,
            Long listingId
    ) {
        User user = loadActiveStudent(authenticatedUserId);
        Listing listing = listingRepository.findMarketplaceListingById(listingId)
                .filter(item -> item.getCollege().getId().equals(user.getCollege().getId()))
                .filter(item -> item.getSeller().getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "This listing is unavailable in your college marketplace."
                ));
        boolean ownListing = listing.getSeller().getId().equals(user.getId());
        if (listing.getStatus() != ListingStatus.ACTIVE
                && listing.getStatus() != ListingStatus.SOLD
                && !(ownListing && listing.getStatus() == ListingStatus.INACTIVE)) {
            throw new ResourceNotFoundException("This listing is no longer available.");
        }

        User seller = listing.getSeller();
        TrustScore trustScore = trustScoreRepository.findByUserId(seller.getId())
                .orElse(null);
        int trust = trustScore == null ? 0 : trustScore.getScore();
        ProfilePrivacySettings privacy = privacyRepository.findByUserId(seller.getId())
                .orElse(null);
        boolean active = listing.getStatus() == ListingStatus.ACTIVE;
        if (active && !ownListing) {
            listing.recordView();
        }
        List<Listing> similar = listingRepository
                .findTop4ByCollegeIdAndCategoryIgnoreCaseAndStatusAndIdNotAndSeller_StatusOrderByCreatedAtDesc(
                        listing.getCollege().getId(),
                        listing.getCategory(),
                        ListingStatus.ACTIVE,
                        listing.getId(),
                        AccountStatus.ACTIVE
                );
        List<String> imageUrls = listingImageRepository
                .findAllByListingIdOrderByDisplayOrderAsc(listing.getId())
                .stream()
                .map(ListingImage::getImageUrl)
                .toList();
        if (imageUrls.isEmpty() && hasText(listing.getPrimaryImageUrl())) {
            imageUrls = List.of(listing.getPrimaryImageUrl());
        }

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
                active ? listing.getAvailableQuantity() : 0,
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
                wishlistRepository.existsByUserIdAndListingId(user.getId(), listing.getId()),
                ownListing,
                active && !ownListing,
                active && !ownListing,
                mapListings(user.getId(), similar)
        );
    }

    private SellerStats getSellerStats(Long sellerId) {
        return new SellerStats(
                listingRepository.countBySellerIdAndStatusNot(
                        sellerId,
                        ListingStatus.DELETED
                ),
                listingRepository.countBySellerIdAndStatus(
                        sellerId,
                        ListingStatus.ACTIVE
                ),
                listingRepository.countBySellerIdAndStatus(
                        sellerId,
                        ListingStatus.SOLD
                ),
                listingRepository.countBySellerIdAndStatus(
                        sellerId,
                        ListingStatus.INACTIVE
                ),
                listingRepository.sumViewsBySellerIdExcludingStatus(
                        sellerId,
                        ListingStatus.DELETED
                ),
                wishlistRepository.countSellerListingSaves(
                        sellerId,
                        ListingStatus.DELETED
                )
        );
    }

    private MyListingSummary toMyListingSummary(Listing listing) {
        return new MyListingSummary(
                listing.getId(),
                listing.getTitle(),
                listing.getPrice(),
                listing.getCategory(),
                listing.getCondition().name(),
                listing.getPickupLocation(),
                listing.getStatus().name(),
                listing.getPrimaryImageUrl(),
                listing.getViewCount(),
                wishlistRepository.countByListingId(listing.getId()),
                listing.getCreatedAt(),
                listing.getUpdatedAt(),
                listing.isNegotiable()
        );
    }

    private MyListingDetailsResponse toMyListingDetails(Listing listing) {
        return new MyListingDetailsResponse(
                listing.getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getCategory(),
                listing.getPrice(),
                listing.getCondition().name(),
                listing.getPickupLocation(),
                listing.isNegotiable(),
                listing.getAvailableQuantity(),
                listing.getAdditionalNotes(),
                listing.getStatus().name(),
                listing.getCollege().getName(),
                listing.getSeller().getFullName(),
                listingImageUrls(listing),
                listing.getViewCount(),
                wishlistRepository.countByListingId(listing.getId()),
                listing.getCreatedAt(),
                listing.getUpdatedAt()
        );
    }

    private List<String> listingImageUrls(Listing listing) {
        List<String> imageUrls = listingImageRepository
                .findAllByListingIdOrderByDisplayOrderAsc(listing.getId())
                .stream()
                .map(ListingImage::getImageUrl)
                .toList();
        if (imageUrls.isEmpty() && hasText(listing.getPrimaryImageUrl())) {
            return List.of(listing.getPrimaryImageUrl());
        }
        return imageUrls;
    }

    private Listing requireOwnedListing(Long sellerId, Long listingId) {
        return listingRepository.findMarketplaceListingById(listingId)
                .filter(listing -> listing.getSeller().getId().equals(sellerId))
                .filter(listing -> listing.getStatus() != ListingStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Listing was not found."));
    }

    private ListingStatusUpdateResponse changeOwnedListingStatus(
            Long authenticatedUserId,
            Long listingId,
            ListingStatus expectedStatus,
            ListingStatus targetStatus,
            String invalidStatusMessage
    ) {
        loadActiveStudent(authenticatedUserId);
        Listing listing = requireOwnedListing(authenticatedUserId, listingId);
        if (listing.getStatus() == targetStatus) {
            return new ListingStatusUpdateResponse(
                    listing.getId(),
                    listing.getStatus().name(),
                    listing.getUpdatedAt()
            );
        }
        if (listing.getStatus() != expectedStatus) {
            throw new BadRequestException(invalidStatusMessage);
        }
        listing.changeStatus(targetStatus);
        listingRepository.save(listing);
        notifyListingStatus(listing, targetStatus);
        return new ListingStatusUpdateResponse(
                listing.getId(),
                listing.getStatus().name(),
                listing.getUpdatedAt()
        );
    }

    private void replaceListingImages(
            Listing listing,
            List<MultipartFile> replacementImages
    ) {
        List<ListingImage> currentImages = listingImageRepository
                .findAllByListingIdOrderByDisplayOrderAsc(listing.getId());
        List<StoredListingImage> storedImages = new ArrayList<>();
        try {
            for (int index = 0; index < replacementImages.size(); index++) {
                StoredListingImage stored = listingImageStorage.store(
                        listing.getId(),
                        replacementImages.get(index)
                );
                storedImages.add(stored);
            }

            listingImageRepository.deleteAll(currentImages);
            listingImageRepository.flush();
            for (int index = 0; index < storedImages.size(); index++) {
                StoredListingImage stored = storedImages.get(index);
                listingImageRepository.save(new ListingImage(
                        listing,
                        stored.publicUrl(),
                        stored.fileName(),
                        index
                ));
            }
            listing.updatePrimaryImageUrl(storedImages.getFirst().publicUrl());
            listingImageRepository.flush();

            List<String> oldFileNames = currentImages.stream()
                    .map(ListingImage::getStorageFileName)
                    .toList();
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            oldFileNames.forEach(listingImageStorage::delete);
                        }
                    }
            );
        } catch (RuntimeException exception) {
            storedImages.forEach(image -> listingImageStorage.delete(image.fileName()));
            throw exception;
        }
    }

    private void notifyListingStatus(Listing listing, ListingStatus status) {
        String title = switch (status) {
            case SOLD -> "Listing marked sold";
            case INACTIVE -> "Listing marked inactive";
            case ACTIVE -> "Listing reactivated";
            case DELETED -> "Listing removed";
            default -> "Listing updated";
        };
        String message = switch (status) {
            case SOLD -> "Your listing " + listing.getTitle() + " has been marked sold.";
            case INACTIVE ->
                    "Your listing " + listing.getTitle() + " is now inactive.";
            case ACTIVE -> "Your listing " + listing.getTitle() + " is active again.";
            case DELETED -> "Your listing " + listing.getTitle() + " was removed.";
            default -> "Your listing " + listing.getTitle() + " was updated.";
        };
        notificationService.notify(
                listing.getSeller(),
                NotificationType.LISTING,
                NotificationPriority.MEDIUM,
                title,
                message,
                RelatedEntityType.LISTING,
                listing.getId(),
                "/student/my-marketplace"
        );
        if (status == ListingStatus.SOLD) {
            notificationService.notifyWishlistUnavailable(listing, true);
        } else if (status == ListingStatus.INACTIVE || status == ListingStatus.DELETED) {
            notificationService.notifyWishlistUnavailable(listing, false);
        }
    }

    private List<MarketplaceListingResponse> mapListings(
            Long authenticatedUserId,
            List<Listing> listings
    ) {
        if (listings.isEmpty()) {
            return List.of();
        }

        Set<Long> listingIds = listings.stream()
                .map(Listing::getId)
                .collect(Collectors.toSet());
        Set<Long> wishlistedIds = wishlistRepository.findWishlistedListingIds(
                authenticatedUserId,
                listingIds
        );
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
                            new SellerSummary(
                                    seller.getId(),
                                    seller.getFullName(),
                                    seller.getProfilePhotoUrl(),
                                    trustScore == null ? 0 : trustScore.getScore()
                            ),
                            wishlistedIds.contains(listing.getId()),
                            seller.getId().equals(authenticatedUserId)
                    );
                })
                .toList();
    }

    private Specification<Listing> myListingSpecification(
            Long sellerId,
            String search,
            ListingStatus status,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            ItemCondition condition,
            String pickupLocation,
            Instant postedAfter,
            boolean wishlistedFirst
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("seller").get("id"), sellerId));
            predicates.add(builder.notEqual(root.get("status"), ListingStatus.DELETED));

            String normalizedSearch = normalize(search);
            if (normalizedSearch != null) {
                String likeSearch = "%" + normalizedSearch.toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("title")), likeSearch),
                        builder.like(builder.lower(root.get("category")), likeSearch),
                        builder.like(builder.lower(root.get("pickupLocation")), likeSearch)
                ));
            }
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
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
            if (postedAfter != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), postedAfter));
            }

            if (wishlistedFirst
                    && query.getResultType() != Long.class
                    && query.getResultType() != long.class) {
                Subquery<Long> saveCount = query.subquery(Long.class);
                Root<WishlistItem> wishlistItem = saveCount.from(WishlistItem.class);
                saveCount.select(builder.count(wishlistItem));
                saveCount.where(builder.equal(
                        wishlistItem.get("listing").get("id"),
                        root.get("id")
                ));
                query.orderBy(
                        builder.desc(saveCount),
                        builder.desc(root.get("createdAt")),
                        builder.desc(root.get("id"))
                );
            }

            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<Listing> marketplaceSpecification(
            Long collegeId,
            String search,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            ItemCondition condition,
            String pickupLocation,
            Boolean negotiable,
            Instant postedAfter,
            Integer minSellerTrust,
            boolean trustedSellersFirst
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
            if (trustedSellersFirst
                    && query.getResultType() != Long.class
                    && query.getResultType() != long.class) {
                Subquery<Integer> sellerTrustScore = query.subquery(Integer.class);
                Root<TrustScore> trustScore = sellerTrustScore.from(TrustScore.class);
                sellerTrustScore
                        .select(trustScore.get("score"))
                        .where(builder.equal(
                                trustScore.get("user").get("id"),
                                root.get("seller").get("id")
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

    private User loadActiveStudent(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student account was not found."));
        if (user.getRole() != UserRole.STUDENT) {
            throw new ForbiddenException("Only students can use the college marketplace.");
        }
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("Your student account must be active.");
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

    private void validateCreateRequest(
            CreateListingRequest request,
            List<MultipartFile> images
    ) {
        if (!CATEGORIES.contains(request.category().trim())) {
            throw new BadRequestException("Please select a supported listing category.");
        }
        if (images == null || images.isEmpty()) {
            throw new BadRequestException("At least one product image is required.");
        }
        if (images.size() > MAX_LISTING_IMAGES) {
            throw new BadRequestException("A listing can contain at most 5 images.");
        }
        validateAllowedContent(
                request.title(),
                request.description(),
                request.additionalNotes()
        );
    }

    private void validateUpdateRequest(
            CreateListingRequest request,
            List<MultipartFile> replacementImages
    ) {
        if (!CATEGORIES.contains(request.category().trim())) {
            throw new BadRequestException("Please select a supported listing category.");
        }
        if (replacementImages != null && replacementImages.size() > MAX_LISTING_IMAGES) {
            throw new BadRequestException("A listing can contain at most 5 images.");
        }
        validateAllowedContent(
                request.title(),
                request.description(),
                request.additionalNotes()
        );
    }

    private void validateAllowedContent(String... values) {
        String content = String.join(
                " ",
                java.util.Arrays.stream(values)
                        .filter(value -> value != null && !value.isBlank())
                        .toList()
        ).toLowerCase(Locale.ROOT);
        for (String term : PROHIBITED_TERMS) {
            Pattern pattern = Pattern.compile(
                    "(?<![a-z0-9])" + Pattern.quote(term) + "(?![a-z0-9])"
            );
            if (pattern.matcher(content).find()) {
                throw new BadRequestException(
                        "This listing appears to contain a prohibited item."
                );
            }
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

    private ListingStatus parseSellerStatus(String status) {
        String normalized = normalize(status);
        if (normalized == null || normalized.equalsIgnoreCase("all")) {
            return null;
        }
        try {
            ListingStatus parsed = ListingStatus.valueOf(
                    normalized.toUpperCase(Locale.ROOT).replace(' ', '_')
            );
            if (parsed == ListingStatus.DELETED || parsed == ListingStatus.RESERVED) {
                throw new IllegalArgumentException();
            }
            return parsed;
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported listing status filter.");
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

    private MarketplaceSort parseSort(String sortBy) {
        String normalized = normalize(sortBy);
        if (normalized == null || normalized.equalsIgnoreCase("newest")) {
            return new MarketplaceSort(
                    Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")),
                    false
            );
        }
        return switch (normalized.toLowerCase(Locale.ROOT)) {
            case "priceasc", "price_asc" -> new MarketplaceSort(
                    Sort.by(
                            Sort.Order.asc("price"),
                            Sort.Order.desc("createdAt")
                    ),
                    false
            );
            case "pricedesc", "price_desc" -> new MarketplaceSort(
                    Sort.by(
                            Sort.Order.desc("price"),
                            Sort.Order.desc("createdAt")
                    ),
                    false
            );
            case "trusted", "mosttrusted", "most_trusted" ->
                    new MarketplaceSort(Sort.unsorted(), true);
            default -> throw new BadRequestException("Unsupported marketplace sort option.");
        };
    }

    private SellerListingSort parseSellerSort(String sortBy) {
        String normalized = normalize(sortBy);
        if (normalized == null || normalized.equalsIgnoreCase("newest")) {
            return new SellerListingSort(
                    Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")),
                    false
            );
        }
        return switch (normalized.toLowerCase(Locale.ROOT)) {
            case "priceasc", "price_asc" -> new SellerListingSort(
                    Sort.by(
                            Sort.Order.asc("price"),
                            Sort.Order.desc("createdAt")
                    ),
                    false
            );
            case "pricedesc", "price_desc" -> new SellerListingSort(
                    Sort.by(
                            Sort.Order.desc("price"),
                            Sort.Order.desc("createdAt")
                    ),
                    false
            );
            case "mostviewed", "most_viewed" -> new SellerListingSort(
                    Sort.by(
                            Sort.Order.desc("viewCount"),
                            Sort.Order.desc("createdAt")
                    ),
                    false
            );
            case "mostwishlisted", "most_wishlisted" ->
                    new SellerListingSort(Sort.unsorted(), true);
            default -> throw new BadRequestException("Unsupported seller listing sort option.");
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

    private record MarketplaceSort(Sort sort, boolean trustedSellersFirst) {
    }

    private record SellerListingSort(Sort sort, boolean wishlistedFirst) {
    }
}

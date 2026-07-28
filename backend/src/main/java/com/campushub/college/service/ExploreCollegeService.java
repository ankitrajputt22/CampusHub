package com.campushub.college.service;

import com.campushub.college.dto.ExploreCollegeDetailsResponse;
import com.campushub.college.dto.ExploreCollegesResponse;
import com.campushub.college.dto.ExploreCollegesResponse.CollegeCard;
import com.campushub.college.dto.ExploreCollegesResponse.ViewerContext;
import com.campushub.college.model.College;
import com.campushub.college.model.CollegeStatus;
import com.campushub.college.repository.CollegeRepository;
import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExploreCollegeService {

    private static final int MAX_COLLEGE_RESULTS = 50;
    private static final int POPULAR_COLLEGE_LIMIT = 4;

    private final CollegeRepository collegeRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ExploreRateLimiter rateLimiter;

    public ExploreCollegeService(
            CollegeRepository collegeRepository,
            UserRepository userRepository,
            ListingRepository listingRepository,
            ExploreRateLimiter rateLimiter
    ) {
        this.collegeRepository = collegeRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.rateLimiter = rateLimiter;
    }

    @Transactional(readOnly = true)
    public ExploreCollegesResponse explore(Long authenticatedUserId, String search) {
        User viewer = loadVerifiedStudent(authenticatedUserId);
        rateLimiter.check(viewer.getId());
        String normalizedSearch = normalizeSearch(search);
        List<CollegeCard> allColleges = collegeRepository.findExplorableColleges(
                        viewer.getCollege().getId(),
                        CollegeStatus.ACTIVE,
                        "",
                        PageRequest.of(0, MAX_COLLEGE_RESULTS)
                )
                .stream()
                .map(this::toCard)
                .toList();
        List<CollegeCard> matchingColleges = normalizedSearch.isBlank()
                ? allColleges
                : collegeRepository.findExplorableColleges(
                                viewer.getCollege().getId(),
                                CollegeStatus.ACTIVE,
                                normalizedSearch,
                                PageRequest.of(0, MAX_COLLEGE_RESULTS)
                        )
                        .stream()
                        .map(this::toCard)
                        .toList();
        List<CollegeCard> popularColleges = allColleges.stream()
                .sorted(Comparator
                        .comparingLong(CollegeCard::activeListings)
                        .thenComparingLong(CollegeCard::verifiedStudents)
                        .reversed()
                        .thenComparing(CollegeCard::name))
                .limit(POPULAR_COLLEGE_LIMIT)
                .toList();
        return new ExploreCollegesResponse(
                viewerContext(viewer),
                popularColleges,
                matchingColleges
        );
    }

    @Transactional(readOnly = true)
    public ExploreCollegeDetailsResponse getCollege(
            Long authenticatedUserId,
            Long collegeId
    ) {
        User viewer = loadVerifiedStudent(authenticatedUserId);
        rateLimiter.check(viewer.getId());
        return new ExploreCollegeDetailsResponse(
                viewerContext(viewer),
                toCard(loadOtherCollege(viewer, collegeId))
        );
    }

    public College loadOtherCollege(User viewer, Long collegeId) {
        if (collegeId == null || collegeId < 1) {
            throw new BadRequestException("Please select a college to explore.");
        }
        if (viewer.getCollege().getId().equals(collegeId)) {
            throw new BadRequestException(
                    "Use My College Marketplace to browse your verified college."
            );
        }
        return collegeRepository.findById(collegeId)
                .filter(College::isExplorable)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "This college is not available to explore."
                ));
    }

    public User loadVerifiedStudent(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student account was not found."
                ));
        if (user.getRole() != UserRole.STUDENT
                || user.getStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException(
                    "An active student account is required to explore colleges."
            );
        }
        if (!user.isEmailVerified() || !user.isPhoneVerified()) {
            throw new ForbiddenException(
                    "Email and phone verification are required to explore colleges."
            );
        }
        if (!user.getCollege().isExplorable()) {
            throw new ForbiddenException(
                    "Your verified college is not currently available."
            );
        }
        return user;
    }

    public ViewerContext viewerContext(User viewer) {
        return new ViewerContext(
                viewer.getCollege().getId(),
                viewer.getCollege().getName(),
                viewer.getCollege().getCode()
        );
    }

    public CollegeCard toCard(College college) {
        return new CollegeCard(
                college.getId(),
                college.getName(),
                college.getCode(),
                college.getEmailDomain(),
                college.getCity(),
                college.getState(),
                college.getLogoUrl(),
                listingRepository.countByCollegeIdAndStatusAndSeller_Status(
                        college.getId(),
                        ListingStatus.ACTIVE,
                        AccountStatus.ACTIVE
                ),
                userRepository
                        .countByCollegeIdAndRoleAndStatusAndEmailVerifiedTrueAndPhoneVerifiedTrue(
                                college.getId(),
                                UserRole.STUDENT,
                                AccountStatus.ACTIVE
                        ),
                listingRepository
                        .countByCollegeIdAndStatusAndSeller_StatusAndCreatedAtAfter(
                                college.getId(),
                                ListingStatus.ACTIVE,
                                AccountStatus.ACTIVE,
                                Instant.now().minus(30, ChronoUnit.DAYS)
                        ),
                listingRepository.findPopularCategories(
                                college.getId(),
                                ListingStatus.ACTIVE,
                                AccountStatus.ACTIVE
                        )
                        .stream()
                        .limit(3)
                        .map(row -> row[0].toString())
                        .toList()
        );
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return "";
        }
        String normalized = search.trim();
        if (normalized.length() > 100) {
            throw new BadRequestException(
                    "College search must be 100 characters or fewer."
            );
        }
        return normalized;
    }
}

package com.campushub.config;

import com.campushub.college.model.College;
import com.campushub.college.repository.CollegeRepository;
import com.campushub.listing.model.ItemCondition;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.profile.model.ProfilePrivacySettings;
import com.campushub.profile.repository.ProfilePrivacySettingsRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScore;
import com.campushub.user.trustscore.TrustScoreRepository;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("local")
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
public class LocalDemoDataSeeder implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(LocalDemoDataSeeder.class);
    private static final Pattern STRONG_PASSWORD = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$"
    );
    private static final DemoUser DEMO_ADMIN = new DemoUser(
            "Campus Hub Admin",
            "demo.admin@recmainpuri.in",
            "+919700000100",
            "Administration",
            "Campus Operations",
            "Staff",
            "CHADMIN100",
            "Administration Block",
            "Local administrator account for testing moderation workflows.",
            null,
            null,
            100
    );

    private static final List<DemoUser> DEMO_USERS = List.of(
            new DemoUser(
                    "Priya Sharma",
                    "demo.priya@recmainpuri.in",
                    "+919700000101",
                    "Computer Science Engineering",
                    "B.Tech",
                    "3rd Year",
                    "CHDEMO101",
                    "Girls Hostel",
                    "CSE student selling carefully maintained academic and hostel items.",
                    "https://www.linkedin.com/in/priya-sharma-demo",
                    null,
                    72
            ),
            new DemoUser(
                    "Rahul Verma",
                    "demo.rahul@recmainpuri.in",
                    "+919700000102",
                    "Electronics Engineering",
                    "B.Tech",
                    "4th Year",
                    "CHDEMO102",
                    "Boys Hostel A",
                    "Final-year electronics student with books, notes, and gadgets.",
                    null,
                    "https://github.com/rahul-verma-demo",
                    60
            ),
            new DemoUser(
                    "Neha Singh",
                    "demo.neha@recmainpuri.in",
                    "+919700000103",
                    "Civil Engineering",
                    "B.Tech",
                    "2nd Year",
                    "CHDEMO103",
                    "Girls Hostel",
                    "Civil engineering student sharing useful campus essentials.",
                    null,
                    null,
                    80
            ),
            new DemoUser(
                    "Aman Gupta",
                    "demo.aman@recmainpuri.in",
                    "+919700000104",
                    "Mechanical Engineering",
                    "B.Tech",
                    "3rd Year",
                    "CHDEMO104",
                    "Boys Hostel B",
                    "Mechanical engineering student and campus sports enthusiast.",
                    null,
                    null,
                    45
            )
    );

    private static final List<CrossCollegeDemoUser> EXPLORE_DEMO_USERS = List.of(
            new CrossCollegeDemoUser(
                    "IITD",
                    new DemoUser(
                            "Aarav Khanna",
                            "demo.aarav@iitd.ac.in",
                            "+919700000201",
                            "Computer Science Engineering",
                            "B.Tech",
                            "3rd Year",
                            "CHXPLORE201",
                            "Kumaon Hostel",
                            "IIT Delhi student sharing project equipment and academic books.",
                            null,
                            null,
                            88
                    )
            ),
            new CrossCollegeDemoUser(
                    "IITB",
                    new DemoUser(
                            "Mira Deshmukh",
                            "demo.mira@iitb.ac.in",
                            "+919700000202",
                            "Electrical Engineering",
                            "B.Tech",
                            "4th Year",
                            "CHXPLORE202",
                            "Hostel 10",
                            "IIT Bombay student listing electronics and hostel essentials.",
                            null,
                            null,
                            82
                    )
            ),
            new CrossCollegeDemoUser(
                    "IITK",
                    new DemoUser(
                            "Kabir Srivastava",
                            "demo.kabir@iitk.ac.in",
                            "+919700000203",
                            "Mechanical Engineering",
                            "B.Tech",
                            "2nd Year",
                            "CHXPLORE203",
                            "Hall 5",
                            "IIT Kanpur student with useful lab and campus commute items.",
                            null,
                            null,
                            76
                    )
            )
    );

    private static final List<DemoListing> DEMO_LISTINGS = List.of(
            new DemoListing(
                    "demo.priya@recmainpuri.in",
                    "Casio scientific calculator",
                    "Casio calculator used for one semester. All keys and functions work, "
                            + "and the protective cover is included.",
                    "Electronics",
                    "850.00",
                    ItemCondition.LIKE_NEW,
                    ListingStatus.ACTIVE,
                    "Central Library",
                    true
            ),
            new DemoListing(
                    "demo.priya@recmainpuri.in",
                    "Wireless headphones with carrying case",
                    "Comfortable over-ear headphones with working microphone, charging "
                            + "cable, and carrying case.",
                    "Electronics",
                    "1200.00",
                    ItemCondition.GOOD,
                    ListingStatus.ACTIVE,
                    "Academic Block",
                    true
            ),
            new DemoListing(
                    "demo.priya@recmainpuri.in",
                    "Android tablet - sold demo listing",
                    "A completed demo sale retained so the sold product-details state can "
                            + "be tested by opening its direct listing URL.",
                    "Electronics",
                    "4500.00",
                    ItemCondition.GOOD,
                    ListingStatus.SOLD,
                    "Main Gate",
                    false
            ),
            new DemoListing(
                    "demo.rahul@recmainpuri.in",
                    "Engineering Mathematics book set",
                    "Three well-kept engineering mathematics books covering the first four "
                            + "semesters. Pages are complete and readable.",
                    "Books",
                    "680.00",
                    ItemCondition.GOOD,
                    ListingStatus.ACTIVE,
                    "Central Library",
                    true
            ),
            new DemoListing(
                    "demo.rahul@recmainpuri.in",
                    "Data Structures and Algorithms textbook",
                    "Latest available campus edition with a few useful pencil annotations "
                            + "and no missing pages.",
                    "Books",
                    "520.00",
                    ItemCondition.LIKE_NEW,
                    ListingStatus.ACTIVE,
                    "CSE Department",
                    false
            ),
            new DemoListing(
                    "demo.rahul@recmainpuri.in",
                    "GATE preparation handwritten notes",
                    "Organized subject-wise notes for aptitude, mathematics, data "
                            + "structures, algorithms, and operating systems.",
                    "Notes",
                    "350.00",
                    ItemCondition.GOOD,
                    ListingStatus.ACTIVE,
                    "Academic Block",
                    true
            ),
            new DemoListing(
                    "demo.neha@recmainpuri.in",
                    "Compact hostel study table",
                    "Stable wooden study table suitable for a hostel room. Minor cosmetic "
                            + "marks, with no structural damage.",
                    "Furniture",
                    "1500.00",
                    ItemCondition.GOOD,
                    ListingStatus.ACTIVE,
                    "Girls Hostel Gate",
                    true
            ),
            new DemoListing(
                    "demo.neha@recmainpuri.in",
                    "One-litre electric kettle",
                    "Clean electric kettle with automatic shutoff. Used only for hot water "
                            + "and tested before listing.",
                    "Hostel Essentials",
                    "700.00",
                    ItemCondition.LIKE_NEW,
                    ListingStatus.ACTIVE,
                    "Girls Hostel Gate",
                    false
            ),
            new DemoListing(
                    "demo.neha@recmainpuri.in",
                    "White laboratory coat",
                    "Medium-size cotton lab coat in clean condition with working buttons "
                            + "and intact pockets.",
                    "Clothing",
                    "450.00",
                    ItemCondition.LIKE_NEW,
                    ListingStatus.ACTIVE,
                    "Civil Engineering Block",
                    false
            ),
            new DemoListing(
                    "demo.aman@recmainpuri.in",
                    "Geared bicycle for campus commute",
                    "Seven-speed bicycle with working brakes and recently serviced chain. "
                            + "Suitable for daily campus travel.",
                    "Bicycles",
                    "3500.00",
                    ItemCondition.USED,
                    ListingStatus.ACTIVE,
                    "Boys Hostel B",
                    true
            ),
            new DemoListing(
                    "demo.aman@recmainpuri.in",
                    "Engineering drawing instrument kit",
                    "Complete drawing kit containing compass, divider, set squares, scale, "
                            + "and storage case.",
                    "Lab Equipment",
                    "550.00",
                    ItemCondition.GOOD,
                    ListingStatus.ACTIVE,
                    "Mechanical Workshop",
                    true
            ),
            new DemoListing(
                    "demo.aman@recmainpuri.in",
                    "Old cricket practice kit - inactive demo",
                    "Inactive demo listing used to verify that unavailable products do not "
                            + "appear in marketplace searches.",
                    "Others",
                    "1350.00",
                    ItemCondition.FAIR,
                    ListingStatus.INACTIVE,
                    "Sports Ground",
                    true
            )
    );

    private static final List<DemoListing> EXPLORE_DEMO_LISTINGS = List.of(
            new DemoListing(
                    "demo.aarav@iitd.ac.in",
                    "Arduino robotics starter kit",
                    "Arduino Uno, breadboard, jumper wires, sensors, and a compact project "
                            + "box. All components were tested before listing.",
                    "Lab Equipment",
                    "1850.00",
                    ItemCondition.LIKE_NEW,
                    ListingStatus.ACTIVE,
                    "IIT Delhi Student Activity Centre",
                    true
            ),
            new DemoListing(
                    "demo.aarav@iitd.ac.in",
                    "Introduction to Algorithms campus edition",
                    "Well-kept algorithms textbook with a few pencil notes and no missing "
                            + "pages.",
                    "Books",
                    "780.00",
                    ItemCondition.GOOD,
                    ListingStatus.ACTIVE,
                    "IIT Delhi Central Library",
                    false
            ),
            new DemoListing(
                    "demo.mira@iitb.ac.in",
                    "Digital multimeter with probe set",
                    "Reliable digital multimeter with probes, protective cover, and a fresh "
                            + "battery for electronics lab work.",
                    "Electronics",
                    "1250.00",
                    ItemCondition.LIKE_NEW,
                    ListingStatus.ACTIVE,
                    "IIT Bombay Main Building",
                    true
            ),
            new DemoListing(
                    "demo.mira@iitb.ac.in",
                    "Compact induction cooktop",
                    "Clean induction cooktop with temperature controls and timer. Suitable "
                            + "for approved hostel common areas.",
                    "Hostel Essentials",
                    "1600.00",
                    ItemCondition.GOOD,
                    ListingStatus.ACTIVE,
                    "IIT Bombay Hostel 10 Gate",
                    true
            ),
            new DemoListing(
                    "demo.kabir@iitk.ac.in",
                    "Mechanical engineering drawing board",
                    "Portable drawing board with parallel ruler and clips, suitable for "
                            + "first-year engineering graphics.",
                    "Lab Equipment",
                    "950.00",
                    ItemCondition.GOOD,
                    ListingStatus.ACTIVE,
                    "IIT Kanpur Academic Area",
                    false
            ),
            new DemoListing(
                    "demo.kabir@iitk.ac.in",
                    "Campus commuter bicycle",
                    "Single-speed bicycle with working brakes, serviced chain, and a rear "
                            + "carrier for daily campus travel.",
                    "Bicycles",
                    "2900.00",
                    ItemCondition.GOOD,
                    ListingStatus.ACTIVE,
                    "IIT Kanpur Hall 5",
                    true
            )
    );

    private final CollegeRepository collegeRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final ProfilePrivacySettingsRepository privacyRepository;
    private final PasswordEncoder passwordEncoder;
    private final String demoPassword;
    private final String collegeCode;

    public LocalDemoDataSeeder(
            CollegeRepository collegeRepository,
            UserRepository userRepository,
            ListingRepository listingRepository,
            TrustScoreRepository trustScoreRepository,
            ProfilePrivacySettingsRepository privacyRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.demo-data.password:}") String demoPassword,
            @Value("${app.demo-data.college-code:RECMAINPURI}") String collegeCode
    ) {
        this.collegeRepository = collegeRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.privacyRepository = privacyRepository;
        this.passwordEncoder = passwordEncoder;
        this.demoPassword = demoPassword;
        this.collegeCode = collegeCode;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        validateConfiguration();
        College college = collegeRepository.findByCodeIgnoreCase(collegeCode.trim())
                .filter(College::isActive)
                .orElseThrow(() -> new IllegalStateException(
                        "Demo data college is missing or inactive: " + collegeCode
                ));

        Map<String, User> users = new LinkedHashMap<>();
        int createdUsers = 0;

        User existingAdmin = userRepository.findByEmailIgnoreCase(DEMO_ADMIN.email())
                .orElse(null);
        if (existingAdmin == null) {
            User admin = createUser(DEMO_ADMIN, college);
            admin.changeRole(UserRole.ADMIN);
            userRepository.save(admin);
            createdUsers++;
        } else {
            validateExistingUser(existingAdmin, college);
            if (existingAdmin.getRole() != UserRole.ADMIN) {
                throw new IllegalStateException(
                        "Existing demo admin email is not an administrator account."
                );
            }
        }

        for (DemoUser definition : DEMO_USERS) {
            User existing = userRepository.findByEmailIgnoreCase(definition.email())
                    .orElse(null);
            User user;
            if (existing == null) {
                user = createUser(definition, college);
                createdUsers++;
            } else {
                validateExistingUser(existing, college);
                user = existing;
            }
            users.put(definition.email(), user);
        }

        for (CrossCollegeDemoUser crossCollegeDefinition : EXPLORE_DEMO_USERS) {
            DemoUser definition = crossCollegeDefinition.user();
            College exploreCollege = collegeRepository.findByCodeIgnoreCase(
                            crossCollegeDefinition.collegeCode()
                    )
                    .filter(College::isExplorable)
                    .orElseThrow(() -> new IllegalStateException(
                            "Explore demo college is missing or inactive: "
                                    + crossCollegeDefinition.collegeCode()
                    ));
            User existing = userRepository.findByEmailIgnoreCase(definition.email())
                    .orElse(null);
            User user;
            if (existing == null) {
                user = createUser(definition, exploreCollege);
                createdUsers++;
            } else {
                validateExistingUser(existing, exploreCollege);
                user = existing;
            }
            users.put(definition.email(), user);
        }

        int createdListings = 0;
        List<DemoListing> allListings = java.util.stream.Stream.concat(
                DEMO_LISTINGS.stream(),
                EXPLORE_DEMO_LISTINGS.stream()
        ).toList();
        for (DemoListing definition : allListings) {
            User seller = users.get(definition.sellerEmail());
            if (!listingRepository.existsBySellerIdAndTitleIgnoreCase(
                    seller.getId(),
                    definition.title()
            )) {
                listingRepository.save(new Listing(
                        seller,
                        definition.title(),
                        definition.description(),
                        definition.category(),
                        new BigDecimal(definition.price()),
                        definition.condition(),
                        definition.status(),
                        null,
                        definition.pickupLocation(),
                        definition.negotiable()
                ));
                createdListings++;
            }
        }

        LOGGER.info(
                "Local demo admin and marketplace data ready for {} and Explore Other Colleges: "
                        + "{} new users and {} new listings",
                college.getCode(),
                createdUsers,
                createdListings
        );
    }

    private User createUser(DemoUser definition, College college) {
        if (userRepository.existsByPhoneNumber(definition.phoneNumber())) {
            throw new IllegalStateException(
                    "Demo phone number is already assigned: " + definition.phoneNumber()
            );
        }
        User user = new User(
                definition.fullName(),
                definition.email().substring(0, definition.email().indexOf('@')),
                definition.email(),
                passwordEncoder.encode(demoPassword),
                definition.phoneNumber(),
                college,
                definition.department(),
                null,
                definition.course(),
                null,
                definition.yearOfStudy(),
                null,
                definition.rollNumber(),
                definition.campusArea(),
                null
        );
        user.activate();
        user.updateEditableProfile(
                definition.fullName(),
                definition.bio(),
                definition.campusArea(),
                definition.department(),
                definition.course(),
                definition.yearOfStudy(),
                definition.rollNumber(),
                definition.linkedinUrl(),
                definition.githubUrl()
        );
        User savedUser = userRepository.save(user);
        trustScoreRepository.save(new TrustScore(
                savedUser,
                definition.baseTrustScore(),
                "Local demo marketplace account"
        ));
        privacyRepository.save(new ProfilePrivacySettings(savedUser));
        return savedUser;
    }

    private void validateExistingUser(User user, College college) {
        if (!user.getCollege().getId().equals(college.getId())
                || user.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Existing demo email is not an active account in " + college.getCode()
            );
        }
    }

    private void validateConfiguration() {
        if (demoPassword == null || !STRONG_PASSWORD.matcher(demoPassword).matches()) {
            throw new IllegalStateException(
                    "CAMPUSHUB_DEMO_DATA_PASSWORD must contain uppercase, lowercase, "
                            + "number, and special characters and be at least 8 characters."
            );
        }
        if (collegeCode == null || collegeCode.isBlank()) {
            throw new IllegalStateException("CAMPUSHUB_DEMO_DATA_COLLEGE_CODE is required.");
        }
    }

    private record DemoUser(
            String fullName,
            String email,
            String phoneNumber,
            String department,
            String course,
            String yearOfStudy,
            String rollNumber,
            String campusArea,
            String bio,
            String linkedinUrl,
            String githubUrl,
            int baseTrustScore
    ) {
    }

    private record CrossCollegeDemoUser(
            String collegeCode,
            DemoUser user
    ) {
    }

    private record DemoListing(
            String sellerEmail,
            String title,
            String description,
            String category,
            String price,
            ItemCondition condition,
            ListingStatus status,
            String pickupLocation,
            boolean negotiable
    ) {
    }
}

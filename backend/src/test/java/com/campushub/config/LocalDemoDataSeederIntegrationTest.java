package com.campushub.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("local")
@TestPropertySource(properties = {
        "spring.datasource.url="
                + "jdbc:h2:mem:campushub-demo-seeder;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                + "DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.demo-data.enabled=true",
        "app.demo-data.college-code=RECMAINPURI"
})
class LocalDemoDataSeederIntegrationTest {

    private static final String TEST_PASSWORD = "Aa1@" + UUID.randomUUID();
    private static final String TEST_JWT_SECRET =
            UUID.randomUUID() + UUID.randomUUID().toString();

    @DynamicPropertySource
    static void demoPassword(DynamicPropertyRegistry registry) {
        registry.add("app.demo-data.password", () -> TEST_PASSWORD);
        registry.add("app.security.jwt-secret", () -> TEST_JWT_SECRET);
    }

    @Autowired
    private LocalDemoDataSeeder seeder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void createsVerifiedDemoAccountsAndListingsWithoutDuplicates() {
        User priya = userRepository.findByEmailIgnoreCase(
                "demo.priya@recmainpuri.in"
        ).orElseThrow();

        assertEquals(AccountStatus.ACTIVE, priya.getStatus());
        assertTrue(priya.isEmailVerified());
        assertTrue(priya.isPhoneVerified());
        assertTrue(passwordEncoder.matches(TEST_PASSWORD, priya.getPasswordHash()));
        User admin = userRepository.findByEmailIgnoreCase(
                "demo.admin@recmainpuri.in"
        ).orElseThrow();
        assertEquals(AccountStatus.ACTIVE, admin.getStatus());
        assertEquals(UserRole.ADMIN, admin.getRole());
        assertTrue(admin.isEmailVerified());
        assertTrue(admin.isPhoneVerified());
        assertTrue(passwordEncoder.matches(TEST_PASSWORD, admin.getPasswordHash()));
        User superAdmin = userRepository.findByEmailIgnoreCase(
                "super.admin@campushub.local"
        ).orElseThrow();
        assertEquals(AccountStatus.ACTIVE, superAdmin.getStatus());
        assertEquals(UserRole.SUPER_ADMIN, superAdmin.getRole());
        assertTrue(superAdmin.isEmailVerified());
        assertTrue(superAdmin.isPhoneVerified());
        assertTrue(passwordEncoder.matches(TEST_PASSWORD, superAdmin.getPasswordHash()));
        User crossCollegeSeller = userRepository.findByEmailIgnoreCase(
                "demo.mira@iitb.ac.in"
        ).orElseThrow();
        assertEquals(2L, crossCollegeSeller.getCollege().getId());
        assertEquals(9, userRepository.count());
        assertEquals(18, listingRepository.count());
        assertEquals(16, listingRepository.findAll().stream()
                .filter(listing -> listing.getStatus() == ListingStatus.ACTIVE)
                .count());

        seeder.run(null);

        assertEquals(9, userRepository.count());
        assertEquals(18, listingRepository.count());
    }
}

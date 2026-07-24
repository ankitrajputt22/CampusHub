package com.campushub.profile.repository;

import com.campushub.profile.model.ProfilePrivacySettings;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfilePrivacySettingsRepository
        extends JpaRepository<ProfilePrivacySettings, Long> {

    Optional<ProfilePrivacySettings> findByUserId(Long userId);
}

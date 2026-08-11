package com.campushub.superadmin.repository;

import com.campushub.superadmin.model.PlatformSetting;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformSettingRepository
        extends JpaRepository<PlatformSetting, Long> {

    Optional<PlatformSetting> findByKey(String key);
}

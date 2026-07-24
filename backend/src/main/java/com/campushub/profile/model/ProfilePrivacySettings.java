package com.campushub.profile.model;

import com.campushub.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "profile_privacy_settings")
public class ProfilePrivacySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "show_bio", nullable = false)
    private boolean showBio;

    @Column(name = "show_linkedin", nullable = false)
    private boolean showLinkedin;

    @Column(name = "show_github", nullable = false)
    private boolean showGithub;

    @Column(name = "show_hostel_area", nullable = false)
    private boolean showHostelArea;

    @Column(name = "show_department", nullable = false)
    private boolean showDepartment;

    @Column(name = "show_year_of_study", nullable = false)
    private boolean showYearOfStudy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProfilePrivacySettings() {
    }

    public ProfilePrivacySettings(User user) {
        this.user = user;
        this.showBio = true;
        this.showLinkedin = false;
        this.showGithub = false;
        this.showHostelArea = false;
        this.showDepartment = true;
        this.showYearOfStudy = true;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public User getUser() {
        return user;
    }

    public boolean isShowBio() {
        return showBio;
    }

    public boolean isShowLinkedin() {
        return showLinkedin;
    }

    public boolean isShowGithub() {
        return showGithub;
    }

    public boolean isShowHostelArea() {
        return showHostelArea;
    }

    public boolean isShowDepartment() {
        return showDepartment;
    }

    public boolean isShowYearOfStudy() {
        return showYearOfStudy;
    }

    public void update(
            boolean showBio,
            boolean showLinkedin,
            boolean showGithub,
            boolean showHostelArea,
            boolean showDepartment,
            boolean showYearOfStudy
    ) {
        this.showBio = showBio;
        this.showLinkedin = showLinkedin;
        this.showGithub = showGithub;
        this.showHostelArea = showHostelArea;
        this.showDepartment = showDepartment;
        this.showYearOfStudy = showYearOfStudy;
        this.updatedAt = Instant.now();
    }
}

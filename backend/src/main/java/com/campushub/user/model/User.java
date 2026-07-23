package com.campushub.user.model;

import com.campushub.college.model.College;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "phone_number", nullable = false, unique = true, length = 30)
    private String phoneNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "college_id", nullable = false)
    private College college;

    @Column(nullable = false, length = 120)
    private String department;

    @Column(name = "custom_department", length = 120)
    private String customDepartment;

    @Column(nullable = false, length = 80)
    private String course;

    @Column(name = "custom_course", length = 80)
    private String customCourse;

    @Column(name = "year_of_study", nullable = false, length = 80)
    private String yearOfStudy;

    @Column(name = "custom_year_of_study", length = 80)
    private String customYearOfStudy;

    @Column(name = "roll_number", length = 80)
    private String rollNumber;

    @Column(name = "hostel_or_campus_area", nullable = false, length = 120)
    private String hostelOrCampusArea;

    @Column(name = "profile_photo_file_name", length = 255)
    private String profilePhotoFileName;

    @Column(length = 500)
    private String bio;

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "github_url", length = 255)
    private String githubUrl;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "phone_verified", nullable = false)
    private boolean phoneVerified;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts;

    @Column(name = "account_locked_until")
    private Instant accountLockedUntil;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AccountStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private UserRole role;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected User() {
    }

    public User(
            String fullName,
            String email,
            String passwordHash,
            String phoneNumber,
            College college,
            String department,
            String customDepartment,
            String course,
            String customCourse,
            String yearOfStudy,
            String customYearOfStudy,
            String rollNumber,
            String hostelOrCampusArea,
            String profilePhotoFileName
    ) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.phoneNumber = phoneNumber;
        this.college = college;
        this.department = department;
        this.customDepartment = customDepartment;
        this.course = course;
        this.customCourse = customCourse;
        this.yearOfStudy = yearOfStudy;
        this.customYearOfStudy = customYearOfStudy;
        this.rollNumber = rollNumber;
        this.hostelOrCampusArea = hostelOrCampusArea;
        this.profilePhotoFileName = profilePhotoFileName;
        this.emailVerified = false;
        this.phoneVerified = false;
        this.status = AccountStatus.PENDING_VERIFICATION;
        this.role = UserRole.STUDENT;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getDepartment() {
        return department;
    }

    public String getCustomDepartment() {
        return customDepartment;
    }

    public String getCourse() {
        return course;
    }

    public String getCustomCourse() {
        return customCourse;
    }

    public String getYearOfStudy() {
        return yearOfStudy;
    }

    public String getCustomYearOfStudy() {
        return customYearOfStudy;
    }

    public String getHostelOrCampusArea() {
        return hostelOrCampusArea;
    }

    public String getProfilePhotoFileName() {
        return profilePhotoFileName;
    }

    public String getBio() {
        return bio;
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public String getGithubUrl() {
        return githubUrl;
    }

    public College getCollege() {
        return college;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public UserRole getRole() {
        return role;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public boolean isPhoneVerified() {
        return phoneVerified;
    }

    public int getFailedLoginAttempts() {
        return failedLoginAttempts;
    }

    public Instant getAccountLockedUntil() {
        return accountLockedUntil;
    }

    public void activate() {
        this.emailVerified = true;
        this.phoneVerified = true;
        this.status = AccountStatus.ACTIVE;
        this.updatedAt = Instant.now();
    }

    public void recordFailedLogin(int maxAttempts, Instant lockedUntil) {
        this.failedLoginAttempts++;
        if (this.failedLoginAttempts >= maxAttempts) {
            this.accountLockedUntil = lockedUntil;
        }
        this.updatedAt = Instant.now();
    }

    public void recordSuccessfulLogin() {
        this.failedLoginAttempts = 0;
        this.accountLockedUntil = null;
        this.lastLoginAt = Instant.now();
        this.updatedAt = this.lastLoginAt;
    }
}

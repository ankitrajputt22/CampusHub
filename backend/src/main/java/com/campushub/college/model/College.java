package com.campushub.college.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "colleges")
public class College {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "email_domain", nullable = false, length = 120)
    private String emailDomain;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CollegeStatus status = CollegeStatus.ACTIVE;

    @Column(nullable = false)
    private boolean active = true;

    protected College() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCode() {
        return code;
    }

    public String getEmailDomain() {
        return emailDomain;
    }

    public String getCity() {
        return city;
    }

    public String getState() {
        return state;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public CollegeStatus getStatus() {
        return status;
    }

    public boolean isActive() {
        return active;
    }

    public boolean isExplorable() {
        return active && status == CollegeStatus.ACTIVE;
    }
}

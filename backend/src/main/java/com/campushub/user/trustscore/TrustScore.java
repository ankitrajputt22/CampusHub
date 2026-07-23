package com.campushub.user.trustscore;

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
@Table(name = "trust_scores")
public class TrustScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false, length = 120)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected TrustScore() {
    }

    public TrustScore(User user, int score, String reason) {
        this.user = user;
        this.score = score;
        this.reason = reason;
        this.createdAt = Instant.now();
    }

    public int getScore() {
        return score;
    }

    public User getUser() {
        return user;
    }
}

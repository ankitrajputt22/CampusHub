package com.campushub.user.trustscore;

import com.campushub.user.model.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "trust_score_history")
public class TrustScoreHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "score_before", nullable = false) private int scoreBefore;
    @Column(name = "score_after", nullable = false) private int scoreAfter;
    @Column(name = "change_value", nullable = false) private int changeValue;
    @Column(nullable = false, length = 80) private String reason;
    @Column(length = 500) private String description;
    @Column(name = "source_type", length = 40) private String sourceType;
    @Column(name = "source_id") private Long sourceId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    protected TrustScoreHistory() { }

    public TrustScoreHistory(User user, int before, int after, String reason,
                             String description, String sourceType, Long sourceId) {
        this.user = user;
        this.scoreBefore = before;
        this.scoreAfter = after;
        this.changeValue = after - before;
        this.reason = reason;
        this.description = description;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public int getScoreBefore() { return scoreBefore; }
    public int getScoreAfter() { return scoreAfter; }
    public int getChangeValue() { return changeValue; }
    public String getReason() { return reason; }
    public String getDescription() { return description; }
    public String getSourceType() { return sourceType; }
    public Long getSourceId() { return sourceId; }
    public Instant getCreatedAt() { return createdAt; }
}

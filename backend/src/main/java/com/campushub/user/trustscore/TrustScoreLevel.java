package com.campushub.user.trustscore;

public enum TrustScoreLevel {
    NEW_LOW_TRUST("New / Low Trust", 0, 40),
    AVERAGE_TRUST("Average Trust", 41, 70),
    TRUSTED_STUDENT("Trusted Student", 71, 90),
    CAMPUS_VERIFIED_SELLER("Campus Verified Seller", 91, 100);

    private final String label;
    private final int minimum;
    private final int maximum;

    TrustScoreLevel(String label, int minimum, int maximum) {
        this.label = label;
        this.minimum = minimum;
        this.maximum = maximum;
    }

    public String getLabel() { return label; }

    public static TrustScoreLevel fromScore(int score) {
        int safeScore = Math.max(0, Math.min(100, score));
        for (TrustScoreLevel value : values()) {
            if (safeScore >= value.minimum && safeScore <= value.maximum) return value;
        }
        return NEW_LOW_TRUST;
    }
}

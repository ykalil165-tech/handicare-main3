package ma.handicare.review;

public record ReviewStatsResponse(
        Double averageRating,
        Long reviewCount,
        Integer easyPercentage,
        Integer mediumPercentage,
        Integer hardPercentage,
        AppointmentDifficulty majorityDifficulty
) {
}

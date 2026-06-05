package ma.handicare.review;

public record ReviewResponse(
        Long id,
        Long resourceId,
        Long userId,
        String userName,
        Integer rating,
        String comment,
        AppointmentDifficulty appointmentDifficulty,
        String createdAt,
        String updatedAt
) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getResource().getId(),
                review.getUser().getId(),
                review.getUser().getFullName(),
                review.getRating(),
                review.getComment(),
                review.getAppointmentDifficulty(),
                review.getCreatedAt() == null ? null : review.getCreatedAt().toString(),
                review.getUpdatedAt() == null ? null : review.getUpdatedAt().toString()
        );
    }
}

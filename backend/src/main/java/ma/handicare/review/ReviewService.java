package ma.handicare.review;

import ma.handicare.auth.AuthService;
import ma.handicare.auth.UnauthorizedException;
import ma.handicare.notification.NotificationService;
import ma.handicare.resource.ResourceNotFoundException;
import ma.handicare.resource.SupportResourceRepository;
import ma.handicare.user.AppUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final SupportResourceRepository resourceRepository;
    private final AuthService authService;
    private final NotificationService notificationService;

    public ReviewService(
            ReviewRepository reviewRepository,
            SupportResourceRepository resourceRepository,
            AuthService authService,
            NotificationService notificationService
    ) {
        this.reviewRepository = reviewRepository;
        this.resourceRepository = resourceRepository;
        this.authService = authService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> reviews(Long resourceId) {
        ensureResourceExists(resourceId);
        return reviewRepository.findByResourceIdWithUserOrderByCreatedAtDesc(resourceId).stream()
                .map(ReviewResponse::from)
                .toList();
    }

    @Transactional
    public ReviewResponse create(Long resourceId, ReviewRequest request, String authorizationHeader) {
        AppUser user = authService.requireUser(authorizationHeader);
        if (reviewRepository.existsByResourceIdAndUserId(resourceId, user.getId())) {
            throw new ReviewAlreadyExistsException();
        }
        Review review = new Review();
        var resource = resourceRepository.findById(resourceId).orElseThrow(ResourceNotFoundException::new);
        review.setResource(resource);
        review.setUser(user);
        applyRequest(review, request);
        Review saved = reviewRepository.save(review);

        // Notify other reviewers of this resource
        reviewRepository.findByResourceIdWithUserOrderByCreatedAtDesc(resourceId).stream()
                .map(r -> r.getUser().getId())
                .filter(uid -> !uid.equals(user.getId()))
                .distinct()
                .forEach(uid -> notificationService.notify(uid, "USER", "review",
                        user.getFullName() + " a aussi laissé un avis sur " + resource.getName(), saved.getId()));

        return ReviewResponse.from(saved);
    }

    @Transactional
    public ReviewResponse update(Long reviewId, ReviewRequest request, String authorizationHeader) {
        AppUser user = authService.requireUser(authorizationHeader);
        Review review = reviewRepository.findByIdWithUserAndResource(reviewId).orElseThrow(ResourceNotFoundException::new);
        if (!review.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException();
        }
        applyRequest(review, request);
        return ReviewResponse.from(reviewRepository.save(review));
    }

    @Transactional
    public void delete(Long reviewId, String authorizationHeader) {
        Review review = reviewRepository.findByIdWithUserAndResource(reviewId).orElseThrow(ResourceNotFoundException::new);
        boolean admin = authService.isAdmin(authorizationHeader);
        boolean owner = false;
        try {
            owner = review.getUser().getId().equals(authService.requireUser(authorizationHeader).getId());
        } catch (UnauthorizedException ignored) {
            // The caller may still be an admin; otherwise the check below rejects the request.
        }
        if (!admin && !owner) {
            throw new UnauthorizedException();
        }
        reviewRepository.delete(review);
    }

    @Transactional(readOnly = true)
    public ReviewStatsResponse stats(Long resourceId) {
        ensureResourceExists(resourceId);
        List<Review> reviews = reviewRepository.findByResourceIdWithUserOrderByCreatedAtDesc(resourceId);
        long count = reviews.size();
        if (count == 0) {
            return new ReviewStatsResponse(0.0, 0L, 0, 0, 0, null);
        }
        double average = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        long easy = countDifficulty(reviews, AppointmentDifficulty.EASY);
        long medium = countDifficulty(reviews, AppointmentDifficulty.MEDIUM);
        long hard = countDifficulty(reviews, AppointmentDifficulty.HARD);
        AppointmentDifficulty majority = List.of(AppointmentDifficulty.EASY, AppointmentDifficulty.MEDIUM, AppointmentDifficulty.HARD)
                .stream()
                .max(Comparator.comparingLong(difficulty -> countDifficulty(reviews, difficulty)))
                .orElse(null);
        return new ReviewStatsResponse(
                Math.round(average * 10.0) / 10.0,
                count,
                percentage(easy, count),
                percentage(medium, count),
                percentage(hard, count),
                majority
        );
    }

    @Transactional(readOnly = true)
    public Map<Long, Map<String, Object>> allStats() {
        Map<Long, Map<String, Object>> result = new HashMap<>();
        for (Object[] row : reviewRepository.findAverageRatingAndCountGrouped()) {
            Long resourceId = (Long) row[0];
            Double avg = (Double) row[1];
            Long count = (Long) row[2];
            Map<String, Object> stats = new HashMap<>();
            stats.put("averageRating", Math.round(avg * 10.0) / 10.0);
            stats.put("reviewCount", count);
            result.put(resourceId, stats);
        }
        return result;
    }

    private void applyRequest(Review review, ReviewRequest request) {
        review.setRating(request.rating());
        review.setComment(request.comment());
        review.setAppointmentDifficulty(request.appointmentDifficulty());
    }

    private void ensureResourceExists(Long resourceId) {
        if (!resourceRepository.existsById(resourceId)) {
            throw new ResourceNotFoundException();
        }
    }

    private long countDifficulty(List<Review> reviews, AppointmentDifficulty difficulty) {
        return reviews.stream()
                .filter(review -> difficulty == review.getAppointmentDifficulty())
                .count();
    }

    private int percentage(long value, long total) {
        return total == 0 ? 0 : (int) Math.round((value * 100.0) / total);
    }
}

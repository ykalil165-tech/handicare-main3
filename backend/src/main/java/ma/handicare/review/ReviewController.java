package ma.handicare.review;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/resources/{id}/reviews")
    public List<ReviewResponse> reviews(@PathVariable Long id) {
        return reviewService.reviews(id);
    }

    @GetMapping("/resources/{id}/reviews/stats")
    public ReviewStatsResponse stats(@PathVariable Long id) {
        return reviewService.stats(id);
    }

    /** Bulk stats: returns {resourceId -> {averageRating, reviewCount}} for all resources */
    @GetMapping("/reviews/stats/all")
    public Map<Long, Map<String, Object>> allStats() {
        return reviewService.allStats();
    }

    @PostMapping("/resources/{id}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return reviewService.create(id, request, authorizationHeader);
    }

    @PutMapping("/reviews/{id}")
    public ReviewResponse update(
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return reviewService.update(id, request, authorizationHeader);
    }

    @DeleteMapping("/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        reviewService.delete(id, authorizationHeader);
    }
}

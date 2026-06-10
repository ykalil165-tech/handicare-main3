package ma.handicare.favorite;

import ma.handicare.auth.AuthService;
import ma.handicare.resource.SupportResource;
import ma.handicare.resource.SupportResourceRepository;
import ma.handicare.user.AppUser;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final SupportResourceRepository resourceRepository;
    private final AuthService authService;

    public FavoriteController(FavoriteRepository favoriteRepository,
                              SupportResourceRepository resourceRepository,
                              AuthService authService) {
        this.favoriteRepository = favoriteRepository;
        this.resourceRepository = resourceRepository;
        this.authService = authService;
    }

    /** Get all favorite resource IDs for the current user */
    @GetMapping
    public List<Long> getUserFavorites(@RequestHeader("Authorization") String auth) {
        AppUser user = authService.requireUser(auth);
        return favoriteRepository.findByUserId(user.getId())
                .stream().map(f -> f.getResource().getId()).collect(Collectors.toList());
    }

    /** Toggle favorite: add if not exists, remove if exists */
    @PostMapping("/{resourceId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long resourceId) {
        AppUser user = authService.requireUser(auth);
        SupportResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

        var existing = favoriteRepository.findByUserIdAndResourceId(user.getId(), resourceId);
        boolean favorited;
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            favorited = false;
        } else {
            Favorite fav = new Favorite();
            fav.setUser(user);
            fav.setResource(resource);
            favoriteRepository.save(fav);
            favorited = true;
        }

        long count = favoriteRepository.countByResourceId(resourceId);
        Map<String, Object> response = new HashMap<>();
        response.put("favorited", favorited);
        response.put("favoriteCount", count);
        return ResponseEntity.ok(response);
    }

    /** Get favorite counts for all resources (public) */
    @GetMapping("/counts")
    public Map<Long, Long> getFavoriteCounts() {
        return favoriteRepository.countByResourceGrouped().stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));
    }
}

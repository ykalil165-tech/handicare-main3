package ma.handicare.favorite;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Optional<Favorite> findByUserIdAndResourceId(Long userId, Long resourceId);
    boolean existsByUserIdAndResourceId(Long userId, Long resourceId);
    List<Favorite> findByUserId(Long userId);
    long countByResourceId(Long resourceId);
    void deleteByUserIdAndResourceId(Long userId, Long resourceId);

    @Query("SELECT f.resource.id, COUNT(f) FROM Favorite f GROUP BY f.resource.id")
    List<Object[]> countByResourceGrouped();
}

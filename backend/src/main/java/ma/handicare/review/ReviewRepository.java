package ma.handicare.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    @Query("""
            select r from Review r
            join fetch r.user
            join fetch r.resource
            where r.resource.id = :resourceId
            order by r.createdAt desc
            """)
    List<Review> findByResourceIdWithUserOrderByCreatedAtDesc(@Param("resourceId") Long resourceId);

    @Query("""
            select r from Review r
            join fetch r.user
            join fetch r.resource
            where r.id = :id
            """)
    Optional<Review> findByIdWithUserAndResource(@Param("id") Long id);

    Optional<Review> findByResourceIdAndUserId(Long resourceId, Long userId);

    boolean existsByResourceIdAndUserId(Long resourceId, Long userId);

    @Query("SELECT r.resource.id, AVG(r.rating), COUNT(r) FROM Review r GROUP BY r.resource.id")
    List<Object[]> findAverageRatingAndCountGrouped();
}

package ma.handicare.community;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    List<CommunityPost> findByHandicapTypeOrderByCreatedAtDesc(String handicapType);
    List<CommunityPost> findAllByOrderByCreatedAtDesc();
}

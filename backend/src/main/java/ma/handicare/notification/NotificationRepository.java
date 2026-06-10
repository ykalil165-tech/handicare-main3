package ma.handicare.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdAndUserTypeOrderByCreatedAtDesc(Long userId, String userType);
    long countByUserIdAndUserTypeAndReadFalse(Long userId, String userType);
}

package ma.handicare.notification;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public void notify(Long userId, String userType, String type, String text, Long relatedId) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setUserType(userType);
        n.setType(type);
        n.setText(text);
        n.setRelatedId(relatedId);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(n);
    }
}

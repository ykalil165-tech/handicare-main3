package ma.handicare.notification;

import ma.handicare.auth.AuthService;
import ma.handicare.auth.AuthResponse;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    public NotificationController(NotificationRepository notificationRepository, AuthService authService) {
        this.notificationRepository = notificationRepository;
        this.authService = authService;
    }

    @GetMapping
    public List<Notification> getNotifications(@RequestHeader("Authorization") String auth) {
        AuthResponse account = authService.requireAccount(auth);
        return notificationRepository.findByUserIdAndUserTypeOrderByCreatedAtDesc(
                account.accountId(), account.accountType());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@RequestHeader("Authorization") String auth) {
        AuthResponse account = authService.requireAccount(auth);
        long count = notificationRepository.countByUserIdAndUserTypeAndReadFalse(
                account.accountId(), account.accountType());
        Map<String, Long> result = new HashMap<>();
        result.put("count", count);
        return result;
    }

    @PatchMapping("/{id}/read")
    public void markRead(@RequestHeader("Authorization") String auth, @PathVariable Long id) {
        authService.requireAccount(auth);
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @PatchMapping("/read-all")
    public void markAllRead(@RequestHeader("Authorization") String auth) {
        AuthResponse account = authService.requireAccount(auth);
        List<Notification> unread = notificationRepository
                .findByUserIdAndUserTypeOrderByCreatedAtDesc(account.accountId(), account.accountType());
        unread.stream().filter(n -> !n.isRead()).forEach(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}

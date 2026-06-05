package ma.handicare.admin;

import jakarta.validation.Valid;
import ma.handicare.auth.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/admins")
public class AdminUserController {
    private final AdminUserRepository repository;
    private final AuthService authService;

    public AdminUserController(AdminUserRepository repository, AuthService authService) {
        this.repository = repository;
        this.authService = authService;
    }

    @GetMapping
    public List<AdminUser> admins(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        authService.requireAdmin(authorizationHeader);
        return repository.findAll().stream()
                .sorted(Comparator.comparing(AdminUser::getPrincipal).reversed())
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUser create(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @Valid @RequestBody AdminUser admin
    ) {
        authService.requireAdmin(authorizationHeader);
        admin.setPrincipal(false);
        admin.setPasswordHash(authService.hashPassword(admin.getPasswordHash() == null ? "admin123" : admin.getPasswordHash()));
        if (admin.getRole() == null || admin.getRole().isBlank()) {
            admin.setRole("Administrateur");
        }
        return repository.save(admin);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long id
    ) {
        authService.requireAdmin(authorizationHeader);
        repository.findById(id).ifPresent(admin -> {
            if (!Boolean.TRUE.equals(admin.getPrincipal())) {
                repository.delete(admin);
            }
        });
    }
}

package ma.handicare.auth;

import ma.handicare.admin.AdminUser;
import ma.handicare.user.AppUser;

public record AuthResponse(
        String token,
        Long accountId,
        String fullName,
        String email,
        String role,
        Boolean principal,
        String accountType,
        String preferredNeed
) {
    public static AuthResponse from(String token, AdminUser admin) {
        return new AuthResponse(
                token,
                admin.getId(),
                admin.getFullName(),
                admin.getEmail(),
                admin.getRole(),
                admin.getPrincipal(),
                "ADMIN",
                null
        );
    }

    public static AuthResponse from(String token, AppUser user) {
        return new AuthResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                "Utilisateur",
                false,
                "USER",
                user.getPreferredNeed()
        );
    }
}

package ma.handicare.auth;

import ma.handicare.admin.AdminUser;
import ma.handicare.admin.AdminUserRepository;
import ma.handicare.user.AppUser;
import ma.handicare.user.AppUserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {
    private final AdminUserRepository adminUserRepository;
    private final AppUserRepository appUserRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, SessionAccount> sessions = new ConcurrentHashMap<>();

    public AuthService(AdminUserRepository adminUserRepository, AppUserRepository appUserRepository) {
        this.adminUserRepository = adminUserRepository;
        this.appUserRepository = appUserRepository;
    }

    public String hashPassword(String password) {
        return passwordEncoder.encode(password);
    }

    public AuthResponse login(AuthRequest request) {
        var admin = adminUserRepository.findByEmailIgnoreCase(request.email());
        if (admin.isPresent() && matchesPassword(request.password(), admin.get().getPasswordHash())) {
            String token = createToken();
            sessions.put(token, new SessionAccount(admin.get().getId(), "ADMIN"));
            return AuthResponse.from(token, admin.get());
        }

        var user = appUserRepository.findByEmailIgnoreCase(request.email());
        if (user.isPresent() && matchesPassword(request.password(), user.get().getPasswordHash())) {
            String token = createToken();
            sessions.put(token, new SessionAccount(user.get().getId(), "USER"));
            return AuthResponse.from(token, user.get());
        }

        throw new UnauthorizedException();
    }

    public AuthResponse register(RegisterRequest request) {
        if (adminUserRepository.findByEmailIgnoreCase(request.email()).isPresent()
                || appUserRepository.findByEmailIgnoreCase(request.email()).isPresent()) {
            throw new IllegalArgumentException("Email already used");
        }

        AppUser user = new AppUser();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPreferredNeed(request.preferredNeed() == null ? "motor" : request.preferredNeed());
        user.setPasswordHash(hashPassword(request.password()));
        AppUser savedUser = appUserRepository.save(user);
        String token = createToken();
        sessions.put(token, new SessionAccount(savedUser.getId(), "USER"));
        return AuthResponse.from(token, savedUser);
    }

    public AdminUser requireAdmin(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        SessionAccount session = sessions.get(token);
        if (session == null || !"ADMIN".equals(session.accountType())) {
            throw new UnauthorizedException();
        }
        return adminUserRepository.findById(session.accountId()).orElseThrow(UnauthorizedException::new);
    }

    public AppUser requireUser(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        SessionAccount session = sessions.get(token);
        if (session == null || !"USER".equals(session.accountType())) {
            throw new UnauthorizedException();
        }
        return appUserRepository.findById(session.accountId()).orElseThrow(UnauthorizedException::new);
    }

    public boolean isAdmin(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return false;
        }
        SessionAccount session = sessions.get(authorizationHeader.substring("Bearer ".length()));
        return session != null && "ADMIN".equals(session.accountType());
    }

    public AuthResponse requireAccount(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        SessionAccount session = sessions.get(token);
        if (session == null) {
            throw new UnauthorizedException();
        }
        if ("ADMIN".equals(session.accountType())) {
            return AuthResponse.from(null, adminUserRepository.findById(session.accountId()).orElseThrow(UnauthorizedException::new));
        }
        return AuthResponse.from(null, appUserRepository.findById(session.accountId()).orElseThrow(UnauthorizedException::new));
    }

    public Optional<AdminUser> currentAdmin(String authorizationHeader) {
        try {
            return Optional.of(requireAdmin(authorizationHeader));
        } catch (UnauthorizedException exception) {
            return Optional.empty();
        }
    }

    public void changePassword(String authorizationHeader, ChangePasswordRequest request) {
        String token = extractToken(authorizationHeader);
        SessionAccount session = sessions.get(token);
        if (session == null) {
            throw new UnauthorizedException();
        }
        if ("ADMIN".equals(session.accountType())) {
            AdminUser admin = adminUserRepository.findById(session.accountId()).orElseThrow(UnauthorizedException::new);
            if (!matchesPassword(request.currentPassword(), admin.getPasswordHash())) {
                throw new IllegalArgumentException("Current password is incorrect");
            }
            admin.setPasswordHash(hashPassword(request.newPassword()));
            adminUserRepository.save(admin);
        } else {
            AppUser user = appUserRepository.findById(session.accountId()).orElseThrow(UnauthorizedException::new);
            if (!matchesPassword(request.currentPassword(), user.getPasswordHash())) {
                throw new IllegalArgumentException("Current password is incorrect");
            }
            user.setPasswordHash(hashPassword(request.newPassword()));
            appUserRepository.save(user);
        }
    }

    public void logout(String authorizationHeader) {
        sessions.remove(extractToken(authorizationHeader));
    }

    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException();
        }
        return authorizationHeader.substring("Bearer ".length());
    }

    private String createToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private boolean matchesPassword(String password, String passwordHash) {
        return passwordHash != null && passwordEncoder.matches(password, passwordHash);
    }

    private record SessionAccount(Long accountId, String accountType) {
    }
}

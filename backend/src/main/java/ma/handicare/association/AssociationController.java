package ma.handicare.association;

import jakarta.validation.Valid;
import ma.handicare.auth.AuthService;
import ma.handicare.resource.ResourceType;
import ma.handicare.resource.SupportResource;
import ma.handicare.resource.SupportResourceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/associations")
public class AssociationController {
    private final AssociationAccountRepository associationRepository;
    private final SupportResourceRepository resourceRepository;
    private final AuthService authService;

    public AssociationController(
            AssociationAccountRepository associationRepository,
            SupportResourceRepository resourceRepository,
            AuthService authService
    ) {
        this.associationRepository = associationRepository;
        this.resourceRepository = resourceRepository;
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AssociationAccount register(@Valid @RequestBody AssociationAccount account) {
        account.setPasswordHash(authService.hashPassword(account.getPasswordHash()));
        account.setStatus(AssociationStatus.PENDING);
        account.setPlatformEmail(generatePlatformEmail(account.getAssociationName()));
        return associationRepository.save(account);
    }

    private String generatePlatformEmail(String associationName) {
        String slug = associationName.toLowerCase()
                .replaceAll("[àâä]", "a").replaceAll("[éèêë]", "e")
                .replaceAll("[îï]", "i").replaceAll("[ôö]", "o").replaceAll("[ùûü]", "u")
                .replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        String base = slug + "@handicare.com";
        if (!associationRepository.existsByPlatformEmail(base)) return base;
        int counter = 2;
        while (associationRepository.existsByPlatformEmail(slug + counter + "@handicare.com")) counter++;
        return slug + counter + "@handicare.com";
    }

    @GetMapping("/pending")
    public List<AssociationAccount> pending(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        authService.requireAdmin(authorizationHeader);
        return associationRepository.findByStatusOrderByAssociationNameAsc(AssociationStatus.PENDING);
    }

    @PatchMapping("/{id}/verify")
    public AssociationAccount verify(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long id
    ) {
        authService.requireAdmin(authorizationHeader);
        AssociationAccount account = associationRepository.findById(id).orElseThrow();
        account.setStatus(AssociationStatus.VERIFIED);
        publishAssociation(account);
        return associationRepository.save(account);
    }

    @PatchMapping("/{id}/reject")
    public AssociationAccount reject(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long id
    ) {
        authService.requireAdmin(authorizationHeader);
        AssociationAccount account = associationRepository.findById(id).orElseThrow();
        account.setStatus(AssociationStatus.REJECTED);
        return associationRepository.save(account);
    }

    private void publishAssociation(AssociationAccount account) {
        if (resourceRepository.findByNameIgnoreCase(account.getAssociationName()).isPresent()) {
            return;
        }
        SupportResource resource = new SupportResource();
        resource.setName(account.getAssociationName());
        resource.setType(ResourceType.ASSOCIATION);
        resource.setDisabilityKeys(account.getDisabilityKeys());
        resource.setDescription(account.getDescription());
        resource.setAddress(account.getAddress());
        resource.setLatitude(account.getLatitude());
        resource.setLongitude(account.getLongitude());
        resource.setPhone(account.getPhone());
        resource.setEmail(account.getEmail());
        resource.setOpeningHours("Contact direct");
        resource.setAccessibilityScore(70);
        resource.setAccessibilityFeatures("Informations verifiees par admin");
        resource.setVerified(true);
        resource.setServices(account.getServices());
        resource.setLanguages("Arabe, Francais");
        resource.setContactPreference("Email ou telephone");
        resource.setLastUpdated(LocalDate.now());
        resourceRepository.save(resource);
    }
}


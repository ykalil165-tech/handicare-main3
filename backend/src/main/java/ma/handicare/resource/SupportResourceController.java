package ma.handicare.resource;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
public class SupportResourceController {
    private final SupportResourceRepository repository;
    private final AuthService authService;

    public SupportResourceController(SupportResourceRepository repository, AuthService authService) {
        this.repository = repository;
        this.authService = authService;
    }

    @GetMapping("/resources")
    public List<SupportResource> resources(
            @RequestParam(required = false) String need,
            @RequestParam(required = false) ResourceType type
    ) {
        return repository.search(need, type);
    }

    @GetMapping("/resources/{id}")
    public SupportResource resource(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(ResourceNotFoundException::new);
    }

    @PostMapping("/resources")
    @ResponseStatus(HttpStatus.CREATED)
    public SupportResource create(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @Valid @RequestBody SupportResource resource
    ) {
        authService.requireAdmin(authorizationHeader);
        return repository.save(resource);
    }

    @DeleteMapping("/resources/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long id
    ) {
        authService.requireAdmin(authorizationHeader);
        repository.deleteById(id);
    }

    @GetMapping("/needs")
    public List<NeedOption> needs() {
        return List.of(
                new NeedOption("motor", "Handicap moteur", "Mobilite reduite, fauteuil roulant, transport adapte."),
                new NeedOption("visual", "Deficience visuelle", "Orientation, audio assistance, documents accessibles."),
                new NeedOption("hearing", "Deficience auditive", "LSM, WhatsApp, SMS, communication ecrite."),
                new NeedOption("cognitive", "Handicap cognitif", "Cadre calme, autisme, aidants et communication simple."),
                new NeedOption("chronic", "Maladie chronique invalidante", "Suivi regulier, soutien social et ressources pratiques."),
                new NeedOption("caregiver", "Aidant ou famille", "Associations, orientation et groupes de soutien.")
        );
    }

    @GetMapping("/resource-types")
    public List<ResourceType> resourceTypes() {
        return Arrays.asList(ResourceType.values());
    }
}

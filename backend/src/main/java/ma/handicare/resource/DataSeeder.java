package ma.handicare.resource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import ma.handicare.admin.AdminUser;
import ma.handicare.admin.AdminUserRepository;
import ma.handicare.auth.AuthService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {
    private final SupportResourceRepository repository;
    private final AdminUserRepository adminUserRepository;
    private final AuthService authService;

    public DataSeeder(SupportResourceRepository repository, AdminUserRepository adminUserRepository, AuthService authService) {
        this.repository = repository;
        this.adminUserRepository = adminUserRepository;
        this.authService = authService;
    }

    @Override
    public void run(String... args) {
        seedAdmins();
        List<SupportResource> seedResources = List.of(
                resource("Association Amal Mobilite", ResourceType.ASSOCIATION, "motor,caregiver",
                        "Orientation sociale, aide aux dossiers et reseau de transport adapte.",
                        "Maarif, Casablanca", 33.5861, -7.6358, "+212 522 00 11 22", "+212 600 11 22 33",
                        "Rampes, accueil aidants, accompagnement administratif", "Orientation, equipement, famille", 92, true),
                resource("Centre Reeducation Anfa", ResourceType.REHABILITATION_CENTER, "motor,chronic",
                        "Kinesitherapie, ergotherapie et accompagnement post-traumatique.",
                        "Anfa, Casablanca", 33.5943, -7.6531, "+212 522 22 33 44", "+212 600 22 33 44",
                        "Ascenseur, parking accessible, toilettes adaptees", "Kinesitherapie, ergotherapie", 88, true),
                resource("Cabinet Dr El Mansouri", ResourceType.DOCTOR, "hearing,cognitive",
                        "Medecin generaliste avec communication ecrite et accueil des aidants.",
                        "Gauthier, Casablanca", 33.5902, -7.6264, "+212 522 44 55 66", "+212 600 44 55 66",
                        "WhatsApp, consignes ecrites, salle calme", "Medecine generale, orientation", 81, true),
                resource("Atelier Familles Autisme Casa", ResourceType.EVENT, "cognitive,caregiver",
                        "Rencontre mensuelle pour parents, orthophonistes et associations.",
                        "Hay Hassani, Casablanca", 33.5657, -7.6846, "+212 522 66 77 88", "+212 600 66 77 88",
                        "Lieu calme, pictogrammes, accueil fratrie", "Atelier, soutien familial", 86, false),
                resource("Pharmacie Access Maarif", ResourceType.PHARMACY, "visual,motor,chronic",
                        "Pharmacie avec livraison de proximite et assistance lecture ordonnance.",
                        "Boulevard Zerktouni, Casablanca", 33.5868, -7.6296, "+212 522 88 99 00", "+212 600 88 99 00",
                        "Assistance audio, livraison, entree de plain-pied", "Medicaments, conseil, livraison", 77, false),
                resource("Urgence SAMU Casablanca", ResourceType.EMERGENCY, "motor,visual,hearing,cognitive,chronic",
                        "Contact d'urgence medicale. La plateforme ne remplace pas les services d'urgence.",
                        "Casablanca", 33.5731, -7.5898, "141", null,
                        "Urgence telephone, orientation rapide", "Urgence medicale", 70, true),
                resource("Transport Adapte Casa", ResourceType.TRANSPORT, "motor,visual,caregiver",
                        "Transport accompagne pour fauteuil roulant et trajets medicaux.",
                        "Casablanca", 33.5798, -7.6168, "+212 522 12 34 56", "+212 600 12 34 56",
                        "Vehicule adapte, aide montee, reservation par telephone", "Transport, accompagnement", 83, true),
                resource("Hopital Universitaire - couche carte", ResourceType.HOSPITAL, "motor,hearing,chronic",
                        "Ressource hospitaliere affichee dans la carte, sans page hopitaux separee.",
                        "Centre-ville, Casablanca", 33.5928, -7.6192, "+212 522 98 76 54", null,
                        "Rampe, ascenseur, signaletique visible", "Urgence, specialites", 74, false),
                resource("CHU Ibn Rochd", ResourceType.HOSPITAL, "motor,visual,hearing,cognitive,chronic,caregiver",
                        "Centre hospitalier universitaire majeur de Casablanca, utile comme point de reference hospitalier.",
                        "Quartier des Hopitaux, Casablanca", 33.5796, -7.6224, "Contact a verifier", null,
                        "Urgences, grands services, orientation hospitaliere", "Urgences, specialites, enseignement", 78, true),
                resource("Hopital 20 Aout 1953", ResourceType.HOSPITAL, "motor,visual,hearing,chronic",
                        "Etablissement rattache au CHU Ibn Rochd, connu pour plusieurs services specialises.",
                        "Boulevard Ibn Rochd, Casablanca", 33.5826, -7.6209, "Contact a verifier", null,
                        "Urgences, orientation, accueil hospitalier", "Urgences, oncologie, specialites", 76, true),
                resource("Hopital d'Enfants Abderrahim Harouchi", ResourceType.HOSPITAL, "motor,cognitive,caregiver,chronic",
                        "Hopital pediatrique du reseau CHU Ibn Rochd pour les enfants et familles.",
                        "Quartier des Hopitaux, Casablanca", 33.5808, -7.6240, "Contact a verifier", null,
                        "Accueil familles, pediatrie, orientation aidants", "Pediatrie, urgences pediatriques", 75, true),
                resource("Hopital Universitaire International Cheikh Khalifa", ResourceType.HOSPITAL, "motor,visual,hearing,cognitive,chronic,caregiver",
                        "Hopital universitaire international situe a Hay Hassani.",
                        "Boulevard Mohamed Taieb Naciri, Hay Hassani, Casablanca", 33.5553, -7.6654, "+212 529 00 44 77", null,
                        "Acces encadre, services pluridisciplinaires, orientation patient", "Urgences, specialites, oncologie", 84, true),
                resource("Hopital Moulay Youssef", ResourceType.HOSPITAL, "motor,visual,hearing,chronic",
                        "Hopital public regional connu a Casablanca.",
                        "112 Boulevard Moulay Youssef, Casablanca", 33.5982, -7.6320, "Contact a verifier", null,
                        "Accueil public, orientation hospitaliere", "Soins hospitaliers, consultations", 70, false),
                resource("Hopital Prive Casablanca Ain Sebaa", ResourceType.HOSPITAL, "motor,hearing,chronic,caregiver",
                        "Hopital prive pluridisciplinaire a Ain Sebaa.",
                        "279 Boulevard Chefchaouni, Ain Sebaa, Casablanca", 33.6053, -7.5355, "+212 522 68 00 00", null,
                        "Urgences 24h/24, imagerie, acces patient", "Urgences, chirurgie, cardiologie, maternite", 82, true),
                resource("Clinique Badr", ResourceType.HOSPITAL, "motor,chronic,caregiver",
                        "Clinique connue a Bourgogne avec activites medicales et oncologiques.",
                        "35 Rue Imam El Aloussi, Bourgogne, Casablanca", 33.5985, -7.6437, "Contact a verifier", null,
                        "Accueil clinique, consultations, orientation patient", "Oncologie, chimiotherapie, consultations", 72, false),
                resource("Cabinet Dr Lahlou Orthopedie", ResourceType.CABINET, "motor,caregiver",
                        "Cabinet specialise en orthopedie et appareillage pour personnes handicapees.",
                        "Boulevard Zerktouni, Maarif, Casablanca", 33.5872, -7.6401, "+212 522 23 45 67", null,
                        "Acces fauteuil roulant, consultation sans escalier", "Orthopedie, appareillage, consultation", 88, true),
                resource("ANAPEC Casablanca - Accompagnement Handicap", ResourceType.ADMINISTRATIVE_SUPPORT, "motor,visual,hearing,cognitive,caregiver",
                        "Aide a l'emploi et accompagnement administratif pour personnes en situation de handicap.",
                        "Boulevard Mohammed V, Casablanca", 33.5924, -7.6155, "+212 522 47 23 11", null,
                        "Acces de plain-pied, accueil dedie, langue des signes disponible", "Emploi, dossiers, orientation sociale", 80, true)
        );
        seedResources.forEach(resource -> repository.findByNameIgnoreCase(resource.getName()).orElseGet(() -> repository.save(resource)));
    }

    private void seedAdmins() {
        if (adminUserRepository.count() > 0) {
            adminUserRepository.findByEmailIgnoreCase("admin@handicare.ma").ifPresent(admin -> {
                if (admin.getPasswordHash() == null || admin.getPasswordHash().isBlank()) {
                    admin.setPasswordHash(authService.hashPassword("admin123"));
                    adminUserRepository.save(admin);
                }
            });
            return;
        }
        AdminUser principal = new AdminUser();
        principal.setFullName("Admin principal");
        principal.setEmail("admin@handicare.ma");
        principal.setRole("Super administrateur");
        principal.setPrincipal(true);
        principal.setPasswordHash(authService.hashPassword("admin123"));
        adminUserRepository.save(principal);
    }

    private SupportResource resource(String name, ResourceType type, String needs, String description, String address,
                                     Double latitude, Double longitude, String phone, String whatsapp,
                                     String accessibilityFeatures, String services, Integer score, Boolean verified) {
        SupportResource resource = new SupportResource();
        resource.setName(name);
        resource.setType(type);
        resource.setDisabilityKeys(needs);
        resource.setDescription(description);
        resource.setAddress(address);
        resource.setLatitude(latitude);
        resource.setLongitude(longitude);
        resource.setPhone(phone);
        resource.setWhatsapp(whatsapp);
        resource.setEmail("contact@handicare.ma");
        resource.setWebsite("https://handicare.ma");
        resource.setOpeningHours(type == ResourceType.EMERGENCY ? "24h/24" : "Lun-Sam, 9:00-18:00");
        resource.setAccessibilityScore(score);
        resource.setAccessibilityFeatures(accessibilityFeatures);
        resource.setVerified(verified);
        resource.setServices(services);
        resource.setLanguages("Arabe, Francais");
        resource.setContactPreference(whatsapp == null ? "Telephone" : "WhatsApp ou telephone");
        resource.setLastUpdated(LocalDate.now());
        if (type == ResourceType.EVENT) {
            resource.setEventStart(LocalDateTime.now().plusDays(14).withHour(10).withMinute(0));
            resource.setEventEnd(LocalDateTime.now().plusDays(14).withHour(12).withMinute(0));
            resource.setOrganizer("Association partenaire");
            resource.setRegistrationLink("https://handicare.ma/community");
            resource.setCost("Gratuit");
        }
        return resource;
    }
}

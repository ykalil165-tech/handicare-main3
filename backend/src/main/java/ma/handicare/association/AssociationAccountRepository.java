package ma.handicare.association;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssociationAccountRepository extends JpaRepository<AssociationAccount, Long> {
    Optional<AssociationAccount> findByEmailIgnoreCase(String email);

    List<AssociationAccount> findByStatusOrderByAssociationNameAsc(AssociationStatus status);

    boolean existsByPlatformEmail(String platformEmail);
}


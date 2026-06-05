package ma.handicare.resource;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupportResourceRepository extends JpaRepository<SupportResource, Long> {
    Optional<SupportResource> findByNameIgnoreCase(String name);

    @Query("""
            select r from SupportResource r
            where (:need is null or lower(r.disabilityKeys) like lower(concat('%', :need, '%')))
            and (:type is null or r.type = :type)
            order by r.verified desc, r.accessibilityScore desc, r.name asc
            """)
    List<SupportResource> search(@Param("need") String need, @Param("type") ResourceType type);
}

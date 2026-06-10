package ma.handicare.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("""
        SELECT m FROM Message m
        WHERE (m.senderId = :userId AND m.senderType = :userType AND m.receiverId = :otherId AND m.receiverType = :otherType)
           OR (m.senderId = :otherId AND m.senderType = :otherType AND m.receiverId = :userId AND m.receiverType = :userType)
        ORDER BY m.createdAt ASC
    """)
    List<Message> findConversation(@Param("userId") Long userId, @Param("userType") String userType,
                                   @Param("otherId") Long otherId, @Param("otherType") String otherType);

    @Query("""
        SELECT m FROM Message m
        WHERE (m.senderId = :userId AND m.senderType = :userType)
           OR (m.receiverId = :userId AND m.receiverType = :userType)
        ORDER BY m.createdAt DESC
    """)
    List<Message> findAllByParticipant(@Param("userId") Long userId, @Param("userType") String userType);

    @Query("""
        SELECT COUNT(m) FROM Message m
        WHERE m.receiverId = :userId AND m.receiverType = :userType
          AND m.senderId = :otherId AND m.senderType = :otherType
          AND m.read = false
    """)
    long countUnread(@Param("userId") Long userId, @Param("userType") String userType,
                     @Param("otherId") Long otherId, @Param("otherType") String otherType);
}

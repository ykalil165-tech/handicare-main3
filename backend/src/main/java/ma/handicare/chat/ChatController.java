package ma.handicare.chat;

import ma.handicare.association.AssociationAccount;
import ma.handicare.association.AssociationAccountRepository;
import ma.handicare.auth.AuthService;
import ma.handicare.notification.NotificationService;
import ma.handicare.user.AppUser;
import ma.handicare.user.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final MessageRepository messageRepository;
    private final AuthService authService;
    private final AppUserRepository appUserRepository;
    private final AssociationAccountRepository associationRepository;
    private final NotificationService notificationService;

    public ChatController(MessageRepository messageRepository, AuthService authService,
                          AppUserRepository appUserRepository, AssociationAccountRepository associationRepository,
                          NotificationService notificationService) {
        this.messageRepository = messageRepository;
        this.authService = authService;
        this.appUserRepository = appUserRepository;
        this.associationRepository = associationRepository;
        this.notificationService = notificationService;
    }

    /** List all conversations for the current user */
    @GetMapping("/conversations")
    public List<Map<String, Object>> getConversations(@RequestHeader("Authorization") String auth) {
        var account = authService.requireAccount(auth);
        Long myId = account.accountId();
        String myType = account.accountType();

        List<Message> allMessages = messageRepository.findAllByParticipant(myId, myType);

        // Group by conversation partner
        Map<String, List<Message>> grouped = new LinkedHashMap<>();
        for (Message m : allMessages) {
            String key;
            if (m.getSenderId().equals(myId) && m.getSenderType().equals(myType)) {
                key = m.getReceiverType() + "_" + m.getReceiverId();
            } else {
                key = m.getSenderType() + "_" + m.getSenderId();
            }
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(m);
        }

        List<Map<String, Object>> conversations = new ArrayList<>();
        for (var entry : grouped.entrySet()) {
            String[] parts = entry.getKey().split("_");
            String otherType = parts[0];
            Long otherId = Long.parseLong(parts[1]);
            List<Message> msgs = entry.getValue();
            Message last = msgs.get(0); // already sorted DESC

            long unread = messageRepository.countUnread(myId, myType, otherId, otherType);

            Map<String, Object> conv = new HashMap<>();
            conv.put("partnerId", otherId);
            conv.put("partnerType", otherType);
            conv.put("partnerName", resolvePartnerName(otherId, otherType));
            conv.put("lastMessage", last.getContent());
            conv.put("lastTime", last.getCreatedAt());
            conv.put("unread", unread);
            conversations.add(conv);
        }
        return conversations;
    }

    /** Get messages in a conversation */
    @GetMapping("/messages/{partnerType}/{partnerId}")
    public List<Map<String, Object>> getMessages(
            @RequestHeader("Authorization") String auth,
            @PathVariable String partnerType, @PathVariable Long partnerId) {
        var account = authService.requireAccount(auth);
        Long myId = account.accountId();
        String myType = account.accountType();

        List<Message> messages = messageRepository.findConversation(myId, myType, partnerId, partnerType);

        // Mark received messages as read
        for (Message m : messages) {
            if (m.getReceiverId().equals(myId) && m.getReceiverType().equals(myType) && !m.isRead()) {
                m.setRead(true);
                messageRepository.save(m);
            }
        }

        return messages.stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("content", m.getContent());
            map.put("mine", m.getSenderId().equals(myId) && m.getSenderType().equals(myType));
            map.put("createdAt", m.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
    }

    /** Send a message */
    @PostMapping("/send")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> sendMessage(@RequestHeader("Authorization") String auth,
                                            @RequestBody Map<String, Object> body) {
        var account = authService.requireAccount(auth);
        Long myId = account.accountId();
        String myType = account.accountType();

        Long receiverId = Long.valueOf(body.get("receiverId").toString());
        String receiverType = body.get("receiverType").toString();
        String content = body.get("content").toString().trim();

        if (content.isEmpty()) throw new IllegalArgumentException("Message cannot be empty");

        Message msg = new Message();
        msg.setSenderId(myId);
        msg.setSenderType(myType);
        msg.setReceiverId(receiverId);
        msg.setReceiverType(receiverType);
        msg.setContent(content);
        msg.setCreatedAt(LocalDateTime.now());
        messageRepository.save(msg);

        // Notify receiver
        String senderName = resolvePartnerName(myId, myType);
        notificationService.notify(receiverId, receiverType, "message",
                senderName + " vous a envoyé un message", msg.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("id", msg.getId());
        result.put("content", msg.getContent());
        result.put("mine", true);
        result.put("createdAt", msg.getCreatedAt());
        return result;
    }

    /** List all users and associations available to chat with */
    @GetMapping("/contacts")
    public List<Map<String, Object>> getContacts(@RequestHeader("Authorization") String auth) {
        authService.requireAccount(auth);
        List<Map<String, Object>> contacts = new ArrayList<>();

        for (AssociationAccount a : associationRepository.findByStatusOrderByAssociationNameAsc(
                ma.handicare.association.AssociationStatus.VERIFIED)) {
            Map<String, Object> c = new HashMap<>();
            c.put("id", a.getId());
            c.put("type", "ASSOCIATION");
            c.put("name", a.getAssociationName());
            c.put("platformEmail", a.getPlatformEmail());
            contacts.add(c);
        }

        for (AppUser u : appUserRepository.findAll()) {
            Map<String, Object> c = new HashMap<>();
            c.put("id", u.getId());
            c.put("type", "USER");
            c.put("name", u.getFullName());
            contacts.add(c);
        }
        return contacts;
    }

    private String resolvePartnerName(Long id, String type) {
        if ("ASSOCIATION".equals(type)) {
            return associationRepository.findById(id).map(AssociationAccount::getAssociationName).orElse("Association");
        }
        if ("USER".equals(type)) {
            return appUserRepository.findById(id).map(AppUser::getFullName).orElse("Utilisateur");
        }
        return "Utilisateur";
    }
}

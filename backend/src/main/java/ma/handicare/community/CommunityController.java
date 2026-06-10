package ma.handicare.community;

import ma.handicare.auth.AuthService;
import ma.handicare.auth.AuthResponse;
import ma.handicare.notification.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/community")
public class CommunityController {

    private final CommunityPostRepository postRepository;
    private final CommunityCommentRepository commentRepository;
    private final AuthService authService;
    private final NotificationService notificationService;

    public CommunityController(CommunityPostRepository postRepository,
                               CommunityCommentRepository commentRepository,
                               AuthService authService,
                               NotificationService notificationService) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.authService = authService;
        this.notificationService = notificationService;
    }

    /** Get all posts (with comments) */
    @GetMapping("/posts")
    public List<Map<String, Object>> getPosts() {
        List<CommunityPost> posts = postRepository.findAllByOrderByCreatedAtDesc();
        return posts.stream().map(this::toPostMap).collect(Collectors.toList());
    }

    /** Get posts by handicap type */
    @GetMapping("/posts/group/{handicapType}")
    public List<Map<String, Object>> getPostsByGroup(@PathVariable String handicapType) {
        List<CommunityPost> posts = postRepository.findByHandicapTypeOrderByCreatedAtDesc(handicapType);
        return posts.stream().map(this::toPostMap).collect(Collectors.toList());
    }

    /** Create a post */
    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createPost(@RequestHeader("Authorization") String auth,
                                           @RequestBody Map<String, Object> body) {
        AuthResponse account = authService.requireAccount(auth);

        CommunityPost post = new CommunityPost();
        post.setAuthor(account.fullName());
        post.setAvatar(account.fullName().substring(0, Math.min(2, account.fullName().length())).toUpperCase());
        post.setGroupName((String) body.getOrDefault("groupName", ""));
        post.setGroupId((String) body.getOrDefault("groupId", ""));
        post.setHandicapType((String) body.getOrDefault("handicapType", ""));
        post.setContent((String) body.get("content"));
        @SuppressWarnings("unchecked")
        List<String> tagList = body.containsKey("tags") ? (List<String>) body.get("tags") : List.of();
        post.setTags(String.join(",", tagList));
        post.setAuthorId(account.accountId());
        post.setAuthorType(account.accountType());
        post.setCreatedAt(LocalDateTime.now());

        CommunityPost saved = postRepository.save(post);
        return toPostMap(saved);
    }

    /** React to a post */
    @PostMapping("/posts/{postId}/react")
    public Map<String, Object> react(@PathVariable Long postId, @RequestBody Map<String, String> body) {
        String reaction = body.get("reaction"); // like, useful, thanks, solidarity
        boolean undo = "true".equals(body.get("undo"));
        CommunityPost post = postRepository.findById(postId).orElseThrow();
        int delta = undo ? -1 : 1;
        switch (reaction) {
            case "like" -> post.setLikesCount(Math.max(0, post.getLikesCount() + delta));
            case "useful" -> post.setUsefulCount(Math.max(0, post.getUsefulCount() + delta));
            case "thanks" -> post.setThanksCount(Math.max(0, post.getThanksCount() + delta));
            case "solidarity" -> post.setSolidarityCount(Math.max(0, post.getSolidarityCount() + delta));
        }
        postRepository.save(post);

        Map<String, Object> reactions = new HashMap<>();
        reactions.put("like", post.getLikesCount());
        reactions.put("useful", post.getUsefulCount());
        reactions.put("thanks", post.getThanksCount());
        reactions.put("solidarity", post.getSolidarityCount());
        return reactions;
    }

    /** Add a comment to a post */
    @PostMapping("/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> addComment(@RequestHeader("Authorization") String auth,
                                           @PathVariable Long postId,
                                           @RequestBody Map<String, String> body) {
        AuthResponse account = authService.requireAccount(auth);
        CommunityPost post = postRepository.findById(postId).orElseThrow();

        CommunityComment comment = new CommunityComment();
        comment.setPostId(postId);
        comment.setAuthor(account.fullName());
        comment.setText(body.get("text"));
        comment.setAuthorId(account.accountId());
        comment.setAuthorType(account.accountType());
        comment.setCreatedAt(LocalDateTime.now());
        CommunityComment saved = commentRepository.save(comment);

        // Notify post author
        if (!account.accountId().equals(post.getAuthorId())) {
            notificationService.notify(post.getAuthorId(), post.getAuthorType(), "comment",
                    account.fullName() + " a commenté votre publication", postId);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", saved.getId());
        result.put("author", saved.getAuthor());
        result.put("text", saved.getText());
        return result;
    }

    private Map<String, Object> toPostMap(CommunityPost post) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", post.getId());
        map.put("author", post.getAuthor());
        map.put("avatar", post.getAvatar());
        map.put("group", post.getGroupName());
        map.put("groupId", post.getGroupId());
        map.put("handicapType", post.getHandicapType());
        map.put("time", post.getCreatedAt().toString());
        map.put("content", post.getContent());
        map.put("tags", post.getTags() != null && !post.getTags().isEmpty()
                ? Arrays.asList(post.getTags().split(",")) : List.of());
        map.put("shares", post.getSharesCount());

        Map<String, Integer> reactions = new HashMap<>();
        reactions.put("like", post.getLikesCount());
        reactions.put("useful", post.getUsefulCount());
        reactions.put("thanks", post.getThanksCount());
        reactions.put("solidarity", post.getSolidarityCount());
        map.put("reactions", reactions);

        List<CommunityComment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());
        map.put("comments", comments.stream().map(c -> {
            Map<String, Object> cm = new HashMap<>();
            cm.put("id", c.getId());
            cm.put("author", c.getAuthor());
            cm.put("text", c.getText());
            return cm;
        }).collect(Collectors.toList()));

        return map;
    }
}

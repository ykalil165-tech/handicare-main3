package ma.handicare.community;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "community_posts")
public class CommunityPost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String author;

    private String avatar;

    @Column(name = "group_name")
    private String groupName;

    private String groupId;
    private String handicapType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String tags; // comma-separated

    private int likesCount;
    private int usefulCount;
    private int thanksCount;
    private int solidarityCount;
    private int sharesCount;

    private Long authorId;
    private String authorType; // USER, ASSOCIATION

    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
    public String getHandicapType() { return handicapType; }
    public void setHandicapType(String handicapType) { this.handicapType = handicapType; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public int getLikesCount() { return likesCount; }
    public void setLikesCount(int likesCount) { this.likesCount = likesCount; }
    public int getUsefulCount() { return usefulCount; }
    public void setUsefulCount(int usefulCount) { this.usefulCount = usefulCount; }
    public int getThanksCount() { return thanksCount; }
    public void setThanksCount(int thanksCount) { this.thanksCount = thanksCount; }
    public int getSolidarityCount() { return solidarityCount; }
    public void setSolidarityCount(int solidarityCount) { this.solidarityCount = solidarityCount; }
    public int getSharesCount() { return sharesCount; }
    public void setSharesCount(int sharesCount) { this.sharesCount = sharesCount; }
    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }
    public String getAuthorType() { return authorType; }
    public void setAuthorType(String authorType) { this.authorType = authorType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

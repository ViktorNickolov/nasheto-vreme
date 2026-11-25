package com.nashetovreme.emotion;

import com.nashetovreme.common.BaseEntity;
import com.nashetovreme.family.Family;
import com.nashetovreme.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "emotion_entries")
public class EmotionEntry extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(name = "emotion_type", nullable = false, length = 40)
    private String emotionType;

    @Column(name = "happened_note", length = 2000)
    private String happenedNote;

    @Column(name = "helped_note", length = 2000)
    private String helpedNote;

    @Column(name = "needs_note", length = 1000)
    private String needsNote;

    @Column(name = "want_to_talk", nullable = false)
    private boolean wantToTalk;
}


package com.nashetovreme.together;

import com.nashetovreme.common.BaseEntity;
import com.nashetovreme.family.Family;
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
@Table(name = "together_activities")
public class TogetherActivity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 120)
    private String category;

    @Column(length = 2000)
    private String description;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;
}


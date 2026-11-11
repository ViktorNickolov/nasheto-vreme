package com.nashetovreme.question;

import com.nashetovreme.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "questions")
public class Question extends BaseEntity {

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 120)
    private String category;

    @Column(nullable = false)
    private boolean active = true;
}


package com.nashetovreme.privacy;

import com.nashetovreme.common.BaseEntity;
import com.nashetovreme.family.Family;
import com.nashetovreme.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "privacy_requests")
public class PrivacyRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id")
    private Family family;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 40)
    private PrivacyRequestType requestType;

    @Column(length = 1000)
    private String note;

    @Column(nullable = false, length = 40)
    private String status;
}


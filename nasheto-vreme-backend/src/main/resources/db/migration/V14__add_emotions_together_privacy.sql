create table emotion_entries (
    id bigserial primary key,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    family_id bigint not null,
    author_id bigint not null,
    emotion_type varchar(40) not null,
    happened_note varchar(2000),
    helped_note varchar(2000),
    needs_note varchar(1000),
    want_to_talk boolean not null default false,
    constraint fk_emotion_family foreign key (family_id) references families(id),
    constraint fk_emotion_author foreign key (author_id) references users(id)
);

create index idx_emotion_entries_family_id_created_at on emotion_entries(family_id, created_at desc);

create table together_activities (
    id bigserial primary key,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    family_id bigint not null,
    created_by_user_id bigint,
    title varchar(255) not null,
    category varchar(120),
    description varchar(2000),
    duration_minutes integer,
    constraint fk_together_family foreign key (family_id) references families(id),
    constraint fk_together_user foreign key (created_by_user_id) references users(id),
    constraint chk_together_duration check (duration_minutes is null or duration_minutes between 1 and 720)
);

create index idx_together_activities_family_id_created_at on together_activities(family_id, created_at desc);

create table privacy_requests (
    id bigserial primary key,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    requester_id bigint not null,
    family_id bigint,
    request_type varchar(40) not null,
    status varchar(40) not null,
    note varchar(1000),
    constraint fk_privacy_requester foreign key (requester_id) references users(id),
    constraint fk_privacy_family foreign key (family_id) references families(id)
);

create index idx_privacy_requests_requester_id_created_at on privacy_requests(requester_id, created_at desc);


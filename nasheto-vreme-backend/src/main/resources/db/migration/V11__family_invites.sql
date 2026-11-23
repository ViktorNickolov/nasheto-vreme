create table if not exists family_invitations (
    id bigserial primary key,
    family_id bigint not null,
    invited_by_user_id bigint not null,
    email varchar(255) not null,
    role varchar(20) not null,
    token varchar(180) not null unique,
    expires_at timestamp not null,
    accepted_at timestamp,
    created_at timestamp,
    updated_at timestamp,
    constraint fk_family_invites_family
        foreign key (family_id)
            references families (id),
    constraint fk_family_invites_inviter
        foreign key (invited_by_user_id)
            references users (id)
);

create index if not exists idx_family_invites_family_id on family_invitations (family_id);
create index if not exists idx_family_invites_email on family_invitations (email);


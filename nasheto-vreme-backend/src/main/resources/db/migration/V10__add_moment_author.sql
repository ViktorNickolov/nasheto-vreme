alter table moments
    add column if not exists created_by_user_id bigint;

alter table moments
    add constraint fk_moments_created_by_user
        foreign key (created_by_user_id)
            references users (id);

create index if not exists idx_moments_created_by_user_id on moments (created_by_user_id);


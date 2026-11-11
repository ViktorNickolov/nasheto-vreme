alter table users
    add column role varchar(20) not null default 'PARENT';

alter table users
    add column family_id bigint;

alter table users
    add constraint fk_users_family
        foreign key (family_id)
            references families (id);

create index idx_users_family_id on users (family_id);


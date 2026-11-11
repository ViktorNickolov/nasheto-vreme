alter table users
    add column if not exists first_name varchar(80) not null default 'Unknown',
    add column if not exists last_name varchar(80) not null default 'User';

alter table families
    add column if not exists created_by bigint;

alter table families
    add constraint fk_families_created_by
        foreign key (created_by)
            references users (id);

create table if not exists family_members (
    id bigserial primary key,
    family_id bigint not null,
    user_id bigint not null,
    role varchar(20) not null,
    joined_at timestamp not null,
    created_at timestamp,
    updated_at timestamp,
    constraint fk_family_members_family
        foreign key (family_id)
            references families (id),
    constraint fk_family_members_user
        foreign key (user_id)
            references users (id),
    constraint uk_family_members_family_user unique (family_id, user_id)
);

create table if not exists questions (
    id bigserial primary key,
    title varchar(500) not null,
    category varchar(120) not null,
    active boolean not null default true,
    created_at timestamp,
    updated_at timestamp
);

create table if not exists question_answers (
    id bigserial primary key,
    question_id bigint not null,
    family_id bigint not null,
    author_id bigint not null,
    answer_text varchar(2000) not null,
    created_at timestamp,
    updated_at timestamp,
    constraint fk_question_answers_question
        foreign key (question_id)
            references questions (id),
    constraint fk_question_answers_family
        foreign key (family_id)
            references families (id),
    constraint fk_question_answers_author
        foreign key (author_id)
            references users (id)
);

create table if not exists moments (
    id bigserial primary key,
    family_id bigint not null,
    title varchar(255) not null,
    description varchar(2000),
    image_url varchar(1000),
    created_at timestamp,
    updated_at timestamp,
    constraint fk_moments_family
        foreign key (family_id)
            references families (id)
);

create index if not exists idx_family_members_family_id on family_members (family_id);
create index if not exists idx_family_members_user_id on family_members (user_id);
create index if not exists idx_questions_active on questions (active);
create index if not exists idx_question_answers_family_id on question_answers (family_id);
create index if not exists idx_moments_family_id on moments (family_id);


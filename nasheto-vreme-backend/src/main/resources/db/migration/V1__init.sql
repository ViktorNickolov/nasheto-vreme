create table users (
    id bigserial primary key,
    email varchar(255) not null unique,
    password varchar(255) not null,
    created_at timestamp,
    updated_at timestamp
);

create table families (
    id bigserial primary key,
    name varchar(255) not null,
    created_at timestamp,
    updated_at timestamp
);

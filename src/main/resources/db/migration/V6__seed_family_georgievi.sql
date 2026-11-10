insert into families (name, created_at, updated_at)
values ('Family Georgievi', now(), now());

insert into users (email, password, role, family_id, first_name, last_name, created_at, updated_at)
values (
    'iva.georgieva@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36A5x3wM4fC6Q6fQxYJv1e',
    'PARENT',
    (select id from families where name = 'Family Georgievi' order by id desc limit 1),
    'Iva',
    'Georgieva',
    now(),
    now()
);

update families
set created_by = (select id from users where email = 'iva.georgieva@example.com')
where id = (select family_id from users where email = 'iva.georgieva@example.com');

insert into users (email, password, role, family_id, first_name, last_name, created_at, updated_at)
values
(
    'boris.georgiev@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36A5x3wM4fC6Q6fQxYJv1e',
    'CHILD',
    (select family_id from users where email = 'iva.georgieva@example.com'),
    'Boris',
    'Georgiev',
    now(),
    now()
),
(
    'desi.georgieva@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36A5x3wM4fC6Q6fQxYJv1e',
    'CHILD',
    (select family_id from users where email = 'iva.georgieva@example.com'),
    'Desi',
    'Georgieva',
    now(),
    now()
);

insert into family_members (family_id, user_id, role, joined_at, created_at, updated_at)
select
    u.family_id,
    u.id,
    u.role,
    now(),
    now(),
    now()
from users u
where u.email in (
    'iva.georgieva@example.com',
    'boris.georgiev@example.com',
    'desi.georgieva@example.com'
)
on conflict (family_id, user_id) do nothing;


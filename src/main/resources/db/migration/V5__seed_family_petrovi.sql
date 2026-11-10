insert into families (name, created_at, updated_at)
values ('Family Petrovi', now(), now());

insert into users (email, password, role, family_id, first_name, last_name, created_at, updated_at)
values (
    'nikolay.petrov@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36A5x3wM4fC6Q6fQxYJv1e',
    'PARENT',
    (select id from families where name = 'Family Petrovi' order by id desc limit 1),
    'Nikolay',
    'Petrov',
    now(),
    now()
);

update families
set created_by = (select id from users where email = 'nikolay.petrov@example.com')
where id = (select family_id from users where email = 'nikolay.petrov@example.com');

insert into users (email, password, role, family_id, first_name, last_name, created_at, updated_at)
values
(
    'teodor.petrov@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36A5x3wM4fC6Q6fQxYJv1e',
    'CHILD',
    (select family_id from users where email = 'nikolay.petrov@example.com'),
    'Teodor',
    'Petrov',
    now(),
    now()
),
(
    'elena.petrova@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36A5x3wM4fC6Q6fQxYJv1e',
    'CHILD',
    (select family_id from users where email = 'nikolay.petrov@example.com'),
    'Elena',
    'Petrova',
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
    'nikolay.petrov@example.com',
    'teodor.petrov@example.com',
    'elena.petrova@example.com'
)
on conflict (family_id, user_id) do nothing;


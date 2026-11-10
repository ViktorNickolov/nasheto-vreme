insert into families (name, created_at, updated_at)
values ('Family Ivanovi', now(), now());

insert into users (email, password, role, family_id, first_name, last_name, created_at, updated_at)
values (
    'zhenya.ivanova@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36A5x3wM4fC6Q6fQxYJv1e',
    'PARENT',
    (select id from families where name = 'Family Ivanovi' order by id desc limit 1),
    'Zhenya',
    'Ivanova',
    now(),
    now()
);

update families
set created_by = (select id from users where email = 'zhenya.ivanova@example.com')
where id = (select family_id from users where email = 'zhenya.ivanova@example.com');

insert into users (email, password, role, family_id, first_name, last_name, created_at, updated_at)
values
(
    'alex.ivanov@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36A5x3wM4fC6Q6fQxYJv1e',
    'CHILD',
    (select family_id from users where email = 'zhenya.ivanova@example.com'),
    'Alex',
    'Ivanov',
    now(),
    now()
),
(
    'maria.ivanova@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36A5x3wM4fC6Q6fQxYJv1e',
    'CHILD',
    (select family_id from users where email = 'zhenya.ivanova@example.com'),
    'Maria',
    'Ivanova',
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
    'zhenya.ivanova@example.com',
    'alex.ivanov@example.com',
    'maria.ivanova@example.com'
)
on conflict (family_id, user_id) do nothing;


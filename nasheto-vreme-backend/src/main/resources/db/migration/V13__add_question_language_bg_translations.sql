alter table questions
    add column if not exists language varchar(2) not null default 'en';

update questions
set language = 'en'
where language is null or trim(language) = '';

insert into questions (title, category, language, active, created_at, updated_at)
values
('Кое беше най-хубавото нещо, което направихме заедно днес?', 'closeness', 'bg', true, now(), now()),
('Какво те накара да се усмихнеш тази седмица?', 'gratitude', 'bg', true, now(), now()),
('Ако планираме една семейна дейност този уикенд, каква да бъде тя?', 'planning', 'bg', true, now(), now()),
('Кое беше трудно днес и как можем да си помогнем един на друг?', 'emotions', 'bg', true, now(), now()),
('Кой момент от училище искаш да споделиш с нас?', 'school', 'bg', true, now(), now()),
('С кое нещо се гордееш днес?', 'self-esteem', 'bg', true, now(), now()),
('Как можем да направим утрешния ден по-спокоен и по-щастлив?', 'reflection', 'bg', true, now(), now());


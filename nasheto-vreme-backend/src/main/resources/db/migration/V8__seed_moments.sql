insert into moments (family_id, title, description, image_url, created_at, updated_at)
select
    f.id,
    'Sunday Park Walk',
    'We walked together and collected colorful leaves.',
    'https://images.example.com/ivanovi-park.jpg',
    now(),
    now()
from families f
where f.name = 'Family Ivanovi';

insert into moments (family_id, title, description, image_url, created_at, updated_at)
select
    f.id,
    'Baking Evening',
    'We baked cookies and laughed in the kitchen.',
    'https://images.example.com/petrovi-cookies.jpg',
    now(),
    now()
from families f
where f.name = 'Family Petrovi';

insert into moments (family_id, title, description, image_url, created_at, updated_at)
select
    f.id,
    'Board Games Night',
    'Everyone played together for one hour before bedtime.',
    'https://images.example.com/georgievi-games.jpg',
    now(),
    now()
from families f
where f.name = 'Family Georgievi';

insert into moments (family_id, title, description, image_url, created_at, updated_at)
select
    f.id,
    'Drawing Time',
    'The kids drew their favorite places and shared stories.',
    'https://images.example.com/ivanovi-drawing.jpg',
    now(),
    now()
from families f
where f.name = 'Family Ivanovi';

insert into moments (family_id, title, description, image_url, created_at, updated_at)
select
    f.id,
    'Family Breakfast',
    'Slow breakfast with pancakes and weekend plans.',
    'https://images.example.com/petrovi-breakfast.jpg',
    now(),
    now()
from families f
where f.name = 'Family Petrovi';


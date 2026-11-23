alter table users
    add column if not exists profile_image_url varchar(1000);


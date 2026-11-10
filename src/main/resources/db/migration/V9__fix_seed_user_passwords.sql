update users
set password = '$2a$10$AQKYVp1IRUGQH4jvse4SSueYwchbslBg3SrnOpTvAizIv8m8QVe/m',
    updated_at = now()
where email in (
    'zhenya.ivanova@example.com',
    'alex.ivanov@example.com',
    'maria.ivanova@example.com',
    'nikolay.petrov@example.com',
    'teodor.petrov@example.com',
    'elena.petrova@example.com',
    'iva.georgieva@example.com',
    'boris.georgiev@example.com',
    'desi.georgieva@example.com'
);


insert into private.site_admins (user_id)
select id
from auth.users
where lower(email) = lower('COLOQUE_O_EMAIL_DO_ADMIN_AQUI')
on conflict (user_id) do nothing;

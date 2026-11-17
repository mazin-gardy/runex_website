-- Show The Wheels logo on the start of the Wheels Run Club route.
-- The image is public/hosts/the-wheels.png in the website.
update public.sessions
set logo_url = '/hosts/the-wheels.png'
where id = 'bbd716fa-69b3-4b3d-9e28-cce4ba04e8d6';

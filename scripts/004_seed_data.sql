-- Insert sample categories
insert into public.categories (name, slug, description) values
  ('Web Development', 'web-development', 'Learn to build modern web applications'),
  ('Data Science', 'data-science', 'Master data analysis and machine learning'),
  ('Mobile Development', 'mobile-development', 'Create iOS and Android apps'),
  ('Design', 'design', 'UI/UX design and graphic design courses'),
  ('Business', 'business', 'Entrepreneurship and business skills')
on conflict (slug) do nothing;

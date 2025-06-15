
-- Update the admin user with a properly hashed password
-- Password: admin123 (using bcrypt with salt rounds 10)
UPDATE public.profiles 
SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'admin@vickyscafe.com';

-- If the above admin doesn't exist, insert it
INSERT INTO public.profiles (id, email, password_hash, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@vickyscafe.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash;

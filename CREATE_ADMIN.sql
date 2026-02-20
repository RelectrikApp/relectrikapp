-- =========================================
-- Script para crear el primer Administrador
-- Ejecutar en Supabase SQL Editor
-- =========================================

-- IMPORTANTE: Primero verifica que todas las tablas existan
-- Si falta alguna tabla, ejecuta el script completo de creación de tablas primero

-- =========================================
-- Crear usuario Administrador
-- =========================================
-- Reemplaza estos valores con tus datos:
-- - email: tu email de admin
-- - name: nombre del admin
-- - passwordHash: hash de tu contraseña (ver abajo cómo generarlo)

INSERT INTO "User" (
  id,
  email,
  name,
  "passwordHash",
  role,
  status,
  department,
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'admin@relectrikapp.com',  -- CAMBIA ESTE EMAIL
  'Admin User',              -- CAMBIA ESTE NOMBRE
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Yu',  -- Hash de "admin123" - CAMBIA ESTO
  'ADMIN',
  'ACTIVE',
  'Management',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- =========================================
-- Verificar que el admin se creó correctamente
-- =========================================
SELECT 
  id,
  email,
  name,
  role,
  status,
  "createdAt"
FROM "User"
WHERE role = 'ADMIN'
ORDER BY "createdAt" DESC
LIMIT 5;

-- =========================================
-- CÓMO GENERAR EL HASH DE CONTRASEÑA:
-- =========================================
-- Opción 1: En Node.js (en tu proyecto)
--   const bcrypt = require('bcryptjs');
--   bcrypt.hash('tu_password', 12).then(console.log);
--
-- Opción 2: En línea de comandos (si tienes Node instalado)
--   node -e "const bcrypt=require('bcryptjs');bcrypt.hash('admin123',12).then(console.log)"
--
-- Opción 3: Usar un generador online de bcrypt
--   https://bcrypt-generator.com/
--   Rounds: 12
--   Password: tu contraseña
--   Copia el hash generado y úsalo arriba

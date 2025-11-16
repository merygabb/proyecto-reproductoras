import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
  await prisma.alerta.deleteMany()
  await prisma.registroProduccion.deleteMany()
  await prisma.configuracionGranja.deleteMany()
  await prisma.user.deleteMany()

  // Crear usuarios
  console.log('👥 Creando usuarios...')
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@granja.com',
      nombre: 'Administrador',
      password: passwordHash,
      role: 'ADMIN',
    },
  })

  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@granja.com',
      nombre: 'Carlos Supervisor',
      password: passwordHash,
      role: 'SUPERVISOR',
    },
  })

  const encargado = await prisma.user.create({
    data: {
      email: 'encargado@granja.com',
      nombre: 'María Encargada',
      password: passwordHash,
      role: 'ENCARGADO',
    },
  })

  const operario = await prisma.user.create({
    data: {
      email: 'operario@granja.com',
      nombre: 'Juan Operario',
      password: passwordHash,
      role: 'OPERARIO',
    },
  })

  console.log('✅ Usuarios creados')

  // Crear configuración de granja
  console.log('⚙️ Creando configuración...')
  await prisma.configuracionGranja.create({
    data: {
      nombreGranja: 'Granja Reproductora El Progreso',
      totalHembras: 1000,
      totalMachos: 100,
    },
  })

  console.log('✅ Configuración creada')

  // Crear registros de producción de los últimos 30 días
  console.log('📊 Creando registros de producción...')
  const usuarios = [admin, supervisor, encargado, operario]

  for (let i = 0; i < 30; i++) {
    const fecha = subDays(new Date(), 29 - i)
    const usuario = usuarios[i % usuarios.length]

    // Generar datos realistas con variación
    const baseProduccion = 400
    const variacion = Math.floor(Math.random() * 100) - 50
    const produccionDia = baseProduccion + variacion

    const huevoFertilA = Math.floor(produccionDia * 0.45)
    const huevoFertilB = Math.floor(produccionDia * 0.40)
    const huevoGrande = Math.floor(produccionDia * 0.05)
    const huevoMediano = Math.floor(produccionDia * 0.04)
    const huevoPequeno = Math.floor(produccionDia * 0.03)
    const huevoJumbo = Math.floor(produccionDia * 0.02)
    const huevoPicado = Math.floor(Math.random() * 5)
    const huevoDesecho = Math.floor(Math.random() * 5)

    const mortalidadHembra = Math.floor(Math.random() * 3)
    const alimentoHembra = 125 + Math.random() * 20
    const alimentoMacho = 140 + Math.random() * 20

    await prisma.registroProduccion.create({
      data: {
        fecha,
        mortalidadHembra,
        alimentoHembra,
        alimentoMacho,
        huevoFertilA,
        huevoFertilB,
        huevoGrande,
        huevoMediano,
        huevoPequeno,
        huevoJumbo,
        huevoPicado,
        huevoDesecho,
        totalHuevos:
          huevoFertilA +
          huevoFertilB +
          huevoGrande +
          huevoMediano +
          huevoPequeno +
          huevoJumbo +
          huevoPicado +
          huevoDesecho,
        totalFertiles: huevoFertilA + huevoFertilB,
        observaciones: i % 5 === 0 ? `Registro del día ${i + 1}. Condiciones normales.` : null,
        usuarioId: usuario.id,
      },
    })
  }

  console.log('✅ 30 registros de producción creados')

  // Crear algunas alertas
  console.log('🔔 Creando alertas...')
  await prisma.alerta.createMany({
    data: [
      {
        tipo: 'PRODUCCION_BAJA',
        severidad: 'WARNING',
        titulo: 'Producción por debajo del promedio',
        descripcion: 'La producción de ayer fue un 15% menor al promedio mensual.',
        resuelta: false,
      },
      {
        tipo: 'MORTALIDAD_ALTA',
        severidad: 'CRITICAL',
        titulo: 'Mortalidad elevada detectada',
        descripcion: 'Se registraron 8 muertes de hembras en los últimos 3 días.',
        resuelta: false,
      },
      {
        tipo: 'FERTILIDAD_BAJA',
        severidad: 'WARNING',
        titulo: 'Fertilidad por debajo del 85%',
        descripcion: 'La fertilidad promedio de esta semana es del 82%.',
        resuelta: true,
      },
    ],
  })

  console.log('✅ Alertas creadas')
  console.log('')
  console.log('🎉 Seed completado exitosamente!')
  console.log('')
  console.log('📝 Credenciales de acceso:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 Admin:')
  console.log('   Email: admin@granja.com')
  console.log('   Contraseña: admin123')
  console.log('')
  console.log('👤 Supervisor:')
  console.log('   Email: supervisor@granja.com')
  console.log('   Contraseña: admin123')
  console.log('')
  console.log('👤 Encargado:')
  console.log('   Email: encargado@granja.com')
  console.log('   Contraseña: admin123')
  console.log('')
  console.log('👤 Operario:')
  console.log('   Email: operario@granja.com')
  console.log('   Contraseña: admin123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })




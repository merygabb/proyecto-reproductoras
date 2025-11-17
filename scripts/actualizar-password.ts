import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Función para normalizar el nombre del usuario a formato de contraseña
function generarPasswordDesdeNombre(nombre: string): string {
  // Normalizar: convertir a minúsculas, quitar acentos, quitar espacios
  const normalizado = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/\s+/g, '') // Quitar espacios
    .replace(/[^a-z0-9]/g, '') // Solo letras y números
  
  return `${normalizado}1234`
}

async function main() {
  console.log('🔐 Iniciando actualización de contraseñas...')
  console.log('')

  try {
    // Obtener todos los usuarios
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    })

    if (usuarios.length === 0) {
      console.log('⚠️ No se encontraron usuarios en la base de datos.')
      return
    }

    console.log(`📋 Se encontraron ${usuarios.length} usuario(s)`)
    console.log('')

    // Actualizar contraseña de cada usuario
    const actualizaciones = usuarios.map(async (usuario) => {
      const nuevaPassword = generarPasswordDesdeNombre(usuario.nombre)
      const hashedPassword = await bcrypt.hash(nuevaPassword, 10)

      await prisma.user.update({
        where: { id: usuario.id },
        data: { password: hashedPassword },
      })

      return {
        nombre: usuario.nombre,
        email: usuario.email,
        password: nuevaPassword,
      }
    })

    const resultados = await Promise.all(actualizaciones)

    console.log('✅ Contraseñas actualizadas exitosamente!')
    console.log('')
    console.log('📝 Credenciales actualizadas:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    resultados.forEach((resultado) => {
      console.log(`👤 ${resultado.nombre}:`)
      console.log(`   Email: ${resultado.email}`)
      console.log(`   Contraseña: ${resultado.password}`)
      console.log('')
    })
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('✨ Proceso completado!')
  } catch (error) {
    console.error('❌ Error al actualizar contraseñas:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


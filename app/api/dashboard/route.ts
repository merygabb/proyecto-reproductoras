import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const hoy = startOfDay(new Date())
    const hace7Dias = subDays(hoy, 7)

    // Registros de hoy
    const registrosHoy = await prisma.registroProduccion.count({
      where: {
        fecha: {
          gte: hoy,
        },
      },
    })

    // Total de huevos hoy
    const registrosHoyData = await prisma.registroProduccion.findMany({
      where: {
        fecha: {
          gte: hoy,
        },
      },
    })

    const totalHuevosHoy = registrosHoyData.reduce((sum, r) => sum + r.totalHuevos, 0)

    // Datos de la última semana
    const registrosSemana = await prisma.registroProduccion.findMany({
      where: {
        fecha: {
          gte: hace7Dias,
        },
      },
      orderBy: {
        fecha: 'asc',
      },
    })

    // Promedio semanal
    const promedioProduccionSemana = registrosSemana.length > 0
      ? Math.round(registrosSemana.reduce((sum, r) => sum + r.totalHuevos, 0) / 7)
      : 0

    // Mortalidad semanal
    const mortalidadSemana = registrosSemana.reduce((sum, r) => sum + r.mortalidadHembra, 0)

    // Producción por día
    const produccionPorDia = Array.from({ length: 7 }, (_, i) => {
      const fecha = subDays(hoy, 6 - i)
      const registrosDia = registrosSemana.filter(
        (r) => startOfDay(new Date(r.fecha)).getTime() === fecha.getTime()
      )
      
      return {
        fecha: format(fecha, 'dd MMM', { locale: es }),
        total: registrosDia.reduce((sum, r) => sum + r.totalHuevos, 0),
        fertiles: registrosDia.reduce((sum, r) => sum + r.totalFertiles, 0),
      }
    })

    // Tendencia de producción
    const tendenciaProduccion = produccionPorDia.map(d => ({
      fecha: d.fecha,
      total: d.total,
    }))

    // Distribución por tipo (última semana)
    const totales = {
      fertilA: registrosSemana.reduce((sum, r) => sum + r.huevoFertilA, 0),
      fertilB: registrosSemana.reduce((sum, r) => sum + r.huevoFertilB, 0),
      grande: registrosSemana.reduce((sum, r) => sum + r.huevoGrande, 0),
      mediano: registrosSemana.reduce((sum, r) => sum + r.huevoMediano, 0),
      pequeno: registrosSemana.reduce((sum, r) => sum + r.huevoPequeno, 0),
      jumbo: registrosSemana.reduce((sum, r) => sum + r.huevoJumbo, 0),
    }

    const totalGeneral = Object.values(totales).reduce((sum, v) => sum + v, 0)

    const distribucionTipos = [
      { nombre: 'Fértil A', cantidad: totales.fertilA, porcentaje: totalGeneral > 0 ? ((totales.fertilA / totalGeneral) * 100).toFixed(1) : 0 },
      { nombre: 'Fértil B', cantidad: totales.fertilB, porcentaje: totalGeneral > 0 ? ((totales.fertilB / totalGeneral) * 100).toFixed(1) : 0 },
      { nombre: 'Grande', cantidad: totales.grande, porcentaje: totalGeneral > 0 ? ((totales.grande / totalGeneral) * 100).toFixed(1) : 0 },
      { nombre: 'Mediano', cantidad: totales.mediano, porcentaje: totalGeneral > 0 ? ((totales.mediano / totalGeneral) * 100).toFixed(1) : 0 },
      { nombre: 'Pequeño', cantidad: totales.pequeno, porcentaje: totalGeneral > 0 ? ((totales.pequeno / totalGeneral) * 100).toFixed(1) : 0 },
      { nombre: 'Jumbo', cantidad: totales.jumbo, porcentaje: totalGeneral > 0 ? ((totales.jumbo / totalGeneral) * 100).toFixed(1) : 0 },
    ].filter(item => item.cantidad > 0)

    // Alertas recientes
    const alertas = await prisma.alerta.findMany({
      take: 10,
      orderBy: {
        fecha: 'desc',
      },
    })

    return NextResponse.json({
      registrosHoy,
      totalHuevosHoy,
      promedioProduccionSemana,
      mortalidadSemana,
      produccionPorDia,
      distribucionTipos,
      tendenciaProduccion,
      alertas,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 })
  }
}




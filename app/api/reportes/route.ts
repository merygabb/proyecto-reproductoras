import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role === 'OPERARIO') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dias = parseInt(searchParams.get('dias') || '30')
    
    const hoy = startOfDay(new Date())
    const fechaInicio = subDays(hoy, dias)

    const registros = await prisma.registroProduccion.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
        },
      },
      orderBy: {
        fecha: 'asc',
      },
    })

    // Calcular totales
    const produccionTotal = registros.reduce((sum, r) => sum + r.totalHuevos, 0)
    const fertilesTotal = registros.reduce((sum, r) => sum + r.totalFertiles, 0)
    const mortalidadTotal = registros.reduce((sum, r) => sum + r.mortalidadHembra, 0)
    const defectuososTotal = registros.reduce((sum, r) => sum + r.huevoPicado + r.huevoDesecho, 0)
    
    const promedioDiario = registros.length > 0 ? Math.round(produccionTotal / dias) : 0
    const fertilidadPromedio = produccionTotal > 0 
      ? ((fertilesTotal / produccionTotal) * 100).toFixed(1)
      : 0
    const mortalidadPromedio = registros.length > 0 
      ? (mortalidadTotal / dias).toFixed(1)
      : 0
    const eficiencia = produccionTotal > 0
      ? (((produccionTotal - defectuososTotal) / produccionTotal) * 100).toFixed(1)
      : 0

    // Evolución diaria
    const evolucionDiaria = Array.from({ length: dias }, (_, i) => {
      const fecha = subDays(hoy, dias - 1 - i)
      const registrosDia = registros.filter(
        (r) => startOfDay(new Date(r.fecha)).getTime() === fecha.getTime()
      )
      
      const total = registrosDia.reduce((sum, r) => sum + r.totalHuevos, 0)
      const fertiles = registrosDia.reduce((sum, r) => sum + r.totalFertiles, 0)
      const defectuosos = registrosDia.reduce((sum, r) => sum + r.huevoPicado + r.huevoDesecho, 0)
      
      return {
        fecha: format(fecha, 'dd/MM', { locale: es }),
        total,
        fertiles,
        defectuosos,
      }
    })

    // Distribución por categorías
    const distribucionCategorias = [
      { 
        categoria: 'Fértil A', 
        cantidad: registros.reduce((sum, r) => sum + r.huevoFertilA, 0),
        porcentaje: 0
      },
      { 
        categoria: 'Fértil B', 
        cantidad: registros.reduce((sum, r) => sum + r.huevoFertilB, 0),
        porcentaje: 0
      },
      { 
        categoria: 'Grande', 
        cantidad: registros.reduce((sum, r) => sum + r.huevoGrande, 0),
        porcentaje: 0
      },
      { 
        categoria: 'Mediano', 
        cantidad: registros.reduce((sum, r) => sum + r.huevoMediano, 0),
        porcentaje: 0
      },
      { 
        categoria: 'Pequeño', 
        cantidad: registros.reduce((sum, r) => sum + r.huevoPequeno, 0),
        porcentaje: 0
      },
      { 
        categoria: 'Jumbo', 
        cantidad: registros.reduce((sum, r) => sum + r.huevoJumbo, 0),
        porcentaje: 0
      },
    ].map(item => ({
      ...item,
      porcentaje: produccionTotal > 0 
        ? parseFloat(((item.cantidad / produccionTotal) * 100).toFixed(1))
        : 0
    }))

    // Alimentación vs Producción
    const alimentacionProduccion = Array.from({ length: Math.min(dias, 30) }, (_, i) => {
      const fecha = subDays(hoy, Math.min(dias, 30) - 1 - i)
      const registrosDia = registros.filter(
        (r) => startOfDay(new Date(r.fecha)).getTime() === fecha.getTime()
      )
      
      return {
        fecha: format(fecha, 'dd/MM', { locale: es }),
        alimentoTotal: registrosDia.reduce((sum, r) => sum + r.alimentoHembra + r.alimentoMacho, 0),
        produccion: registrosDia.reduce((sum, r) => sum + r.totalHuevos, 0),
      }
    })

    // Análisis de rendimiento (radar)
    const rendimiento = [
      { 
        categoria: 'Producción', 
        valor: Math.min(100, (promedioDiario / 500) * 100)
      },
      { 
        categoria: 'Fertilidad', 
        valor: parseFloat(fertilidadPromedio)
      },
      { 
        categoria: 'Eficiencia', 
        valor: parseFloat(eficiencia)
      },
      { 
        categoria: 'Calidad', 
        valor: produccionTotal > 0 
          ? ((produccionTotal - defectuososTotal) / produccionTotal) * 100
          : 0
      },
      { 
        categoria: 'Regularidad', 
        valor: registros.length > 0 ? (registros.length / dias) * 100 : 0
      },
    ]

    // Indicadores para tabla
    const indicadores = [
      { nombre: 'Producción Total', valor: `${produccionTotal.toLocaleString()} huevos`, estado: 'Óptimo' },
      { nombre: 'Producción Promedio Diaria', valor: `${promedioDiario.toLocaleString()} huevos/día`, estado: promedioDiario > 300 ? 'Óptimo' : 'Aceptable' },
      { nombre: 'Fertilidad Promedio', valor: `${fertilidadPromedio}%`, estado: parseFloat(fertilidadPromedio as string) >= 85 ? 'Óptimo' : 'Revisar' },
      { nombre: 'Mortalidad Total', valor: `${mortalidadTotal} hembras`, estado: mortalidadTotal < dias * 0.5 ? 'Óptimo' : 'Revisar' },
      { nombre: 'Mortalidad Promedio', valor: `${mortalidadPromedio} hembras/día`, estado: parseFloat(mortalidadPromedio as string) < 0.5 ? 'Óptimo' : 'Revisar' },
      { nombre: 'Eficiencia', valor: `${eficiencia}%`, estado: parseFloat(eficiencia as string) > 90 ? 'Óptimo' : 'Aceptable' },
      { nombre: 'Huevos Fértiles', valor: `${fertilesTotal.toLocaleString()}`, estado: 'Óptimo' },
      { nombre: 'Huevos Defectuosos', valor: `${defectuososTotal.toLocaleString()}`, estado: defectuososTotal < produccionTotal * 0.05 ? 'Óptimo' : 'Revisar' },
      { nombre: 'Alimento Total Consumido', valor: `${registros.reduce((sum, r) => sum + r.alimentoHembra + r.alimentoMacho, 0).toFixed(1)} kg`, estado: 'Óptimo' },
      { nombre: 'Días con Registros', valor: `${registros.length} de ${dias}`, estado: registros.length >= dias * 0.9 ? 'Óptimo' : 'Aceptable' },
    ]

    return NextResponse.json({
      totales: {
        produccionTotal,
        promedioDiario,
        fertilidadPromedio,
        mortalidadTotal,
        mortalidadPromedio,
        eficiencia,
      },
      evolucionDiaria,
      distribucionCategorias,
      alimentacionProduccion,
      rendimiento,
      indicadores,
    })
  } catch (error) {
    console.error('Error fetching reportes:', error)
    return NextResponse.json({ error: 'Error al cargar reportes' }, { status: 500 })
  }
}




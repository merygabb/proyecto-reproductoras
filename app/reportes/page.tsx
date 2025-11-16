'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { formatearNumero } from '@/lib/utils'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function ReportesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [periodo, setPeriodo] = useState('30')
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const reporteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role === 'OPERARIO') {
        router.push('/dashboard')
      } else {
        fetchReportes()
      }
    }
  }, [status, periodo])

  const fetchReportes = async () => {
    try {
      const res = await fetch(`/api/reportes?dias=${periodo}`)
      const data = await res.json()
      setData(data)
    } catch (error) {
      console.error('Error fetching reportes:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportarPDF = async () => {
    if (!reporteRef.current) return

    setExportando(true)
    try {
      // Ocultar el navbar y botones de acción antes de capturar
      const navbar = document.querySelector('nav')
      const botonesAccion = document.querySelector('.botones-accion')
      
      if (navbar) navbar.style.display = 'none'
      if (botonesAccion) (botonesAccion as HTMLElement).style.display = 'none'

      // Capturar el contenido como imagen
      const canvas = await html2canvas(reporteRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f9fafb',
      })

      // Restaurar navbar y botones
      if (navbar) navbar.style.display = ''
      if (botonesAccion) (botonesAccion as HTMLElement).style.display = ''

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // ancho A4 en mm
      const pageHeight = 297 // alto A4 en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      // Agregar primera página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Agregar páginas adicionales si es necesario
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Generar nombre del archivo
      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-')
      const nombreArchivo = `Reporte-${periodo}dias-${fecha}.pdf`

      // Descargar PDF
      pdf.save(nombreArchivo)
      
      setExportando(false)
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      alert('Error al exportar el PDF. Por favor, inténtalo de nuevo.')
      setExportando(false)
      
      // Asegurar que se restaure la visibilidad
      const navbar = document.querySelector('nav')
      const botonesAccion = document.querySelector('.botones-accion')
      if (navbar) navbar.style.display = ''
      if (botonesAccion) (botonesAccion as HTMLElement).style.display = ''
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8 botones-accion">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes y Análisis</h1>
            <p className="text-gray-600">Análisis detallado del rendimiento de la granja</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={periodo === '7' ? 'default' : 'outline'} 
              onClick={() => setPeriodo('7')}
              size="sm"
            >
              7 días
            </Button>
            <Button 
              variant={periodo === '30' ? 'default' : 'outline'} 
              onClick={() => setPeriodo('30')}
              size="sm"
            >
              30 días
            </Button>
            <Button 
              variant={periodo === '90' ? 'default' : 'outline'} 
              onClick={() => setPeriodo('90')}
              size="sm"
            >
              90 días
            </Button>
          </div>
        </div>

        {/* Contenido del reporte para exportar */}
        <div ref={reporteRef} className="bg-white p-6 rounded-lg">
          {/* Título del reporte */}
          <div className="mb-8 text-center border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Reporte de Producción</h2>
            <p className="text-gray-600 mt-1">
              Período: Últimos {periodo} días | Generado: {new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardDescription className="text-blue-100">Producción Total</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {formatearNumero(data.totales.produccionTotal)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-100">
                Promedio: {formatearNumero(data.totales.promedioDiario)} / día
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardDescription className="text-green-100">Fertilidad Promedio</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {data.totales.fertilidadPromedio}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-100">
                {data.totales.fertilidadPromedio >= 85 ? '✓ Óptimo' : '⚠ Revisar'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="pb-3">
              <CardDescription className="text-amber-100">Mortalidad Total</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {data.totales.mortalidadTotal}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-100">
                Promedio: {data.totales.mortalidadPromedio} / día
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardDescription className="text-purple-100">Eficiencia</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {data.totales.eficiencia}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-100">
                Huevos aprovechables
              </p>
            </CardContent>
          </Card>
        </div>

          {/* Gráficas Avanzadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Producción Diaria Completa */}
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Producción</CardTitle>
              <CardDescription>Análisis temporal detallado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.evolucionDiaria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
                  <Line type="monotone" dataKey="fertiles" stroke="#10b981" name="Fértiles" strokeWidth={2} />
                  <Line type="monotone" dataKey="defectuosos" stroke="#ef4444" name="Defectuosos" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Análisis Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Índice de Rendimiento</CardTitle>
              <CardDescription>Evaluación multidimensional</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={data.rendimiento}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="categoria" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Rendimiento" dataKey="valor" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          </div>

          {/* Comparativa por Categorías */}
          <Card className="mb-8">
          <CardHeader>
            <CardTitle>Distribución de Producción por Categoría</CardTitle>
            <CardDescription>Comparativa de tipos de huevo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.distribucionCategorias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad" fill="#3b82f6" name="Cantidad" />
                <Bar dataKey="porcentaje" fill="#10b981" name="% del Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
          </Card>

          {/* Análisis de Alimentación vs Producción */}
          <Card className="mb-8">
          <CardHeader>
            <CardTitle>Relación Alimentación - Producción</CardTitle>
            <CardDescription>Correlación entre consumo y rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.alimentacionProduccion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="alimentoTotal" stroke="#f59e0b" name="Alimento (kg)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="produccion" stroke="#3b82f6" name="Producción" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
          </Card>

          {/* Tabla de Resumen */}
          <Card>
          <CardHeader>
            <CardTitle>Resumen Estadístico</CardTitle>
            <CardDescription>Indicadores clave del período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Indicador</th>
                    <th className="text-right py-3 px-4 font-semibold">Valor</th>
                    <th className="text-right py-3 px-4 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.indicadores.map((ind: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{ind.nombre}</td>
                      <td className="text-right py-3 px-4 font-semibold">{ind.valor}</td>
                      <td className="text-right py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          ind.estado === 'Óptimo' ? 'bg-green-100 text-green-800' :
                          ind.estado === 'Aceptable' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {ind.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          </Card>

        </div>
        {/* Fin del contenido exportable */}

        {/* Botón de Exportar */}
        <div className="mt-8 flex justify-end">
          <Button onClick={exportarPDF} disabled={exportando}>
            {exportando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar Reporte (PDF)
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}




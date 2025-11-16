'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatearFecha, formatearHora, formatearNumero } from '@/lib/utils'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

export default function RegistrosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registros, setRegistros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [periodo, setPeriodo] = useState<'day' | 'week' | 'month'>('day')
  const [exportando, setExportando] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRegistros()
    }
  }, [status, pagination.page, periodo])

  const fetchRegistros = async () => {
    try {
      const res = await fetch(`/api/registros?page=${pagination.page}&limit=${pagination.limit}&period=${periodo}`)
      const data = await res.json()
      setRegistros(data.registros)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching registros:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportarPDF = async () => {
    if (!contenedorRef.current) return
    setExportando(true)
    try {
      const canvas = await html2canvas(contenedorRef.current, { scale: 2, useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-')
      pdf.save(`Registros-${periodo}-${fecha}.pdf`)
    } catch (e) {
      alert('Error al exportar PDF')
    } finally {
      setExportando(false)
    }
  }

  const exportarExcel = async () => {
    try {
      const res = await fetch(`/api/registros?export=1&period=${periodo}`)
      const data = await res.json()
      const rows = data.registros.map((r: any) => ({
        Fecha: new Date(r.fecha).toLocaleDateString('es-ES'),
        'Usuario (nombre)': r.usuario?.nombre || '',
        'Usuario (email)': r.usuario?.email || '',
        'Mortalidad Hembra': r.mortalidadHembra,
        'Mortalidad Macho': r.mortalidadMacho ?? 0,
        'Alimento Hembra (kg)': r.alimentoHembra,
        'Alimento Macho (kg)': r.alimentoMacho,
        'Fértil A': r.huevoFertilA,
        'Fértil B': r.huevoFertilB,
        Jumbo: r.huevoJumbo,
        Grande: r.huevoGrande,
        Mediano: r.huevoMediano,
        Pequeño: r.huevoPequeno,
        Picado: r.huevoPicado,
        Desecho: r.huevoDesecho,
        'Total Fértiles': r.totalFertiles,
        'Total Huevos': r.totalHuevos,
        Observaciones: r.observaciones || '',
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Registros')
      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-')
      XLSX.writeFile(wb, `Registros-${periodo}-${fecha}.xlsx`)
    } catch (e) {
      alert('Error al exportar Excel')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando registros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Registros de Producción</h1>
            <p className="text-gray-600">Historial por período seleccionado</p>
          </div>
          <div className="flex gap-2">
            <Button variant={periodo === 'day' ? 'default' : 'outline'} size="sm" onClick={() => { setPagination(p => ({...p, page: 1})); setPeriodo('day') }}>Hoy</Button>
            <Button variant={periodo === 'week' ? 'default' : 'outline'} size="sm" onClick={() => { setPagination(p => ({...p, page: 1})); setPeriodo('week') }}>Semana</Button>
            <Button variant={periodo === 'month' ? 'default' : 'outline'} size="sm" onClick={() => { setPagination(p => ({...p, page: 1})); setPeriodo('month') }}>Mes</Button>
            <Button variant="outline" size="sm" onClick={exportarExcel}>Exportar Excel</Button>
            <Button size="sm" onClick={exportarPDF} disabled={exportando}>{exportando ? 'Generando PDF...' : 'Exportar PDF'}</Button>
          </div>
          {(session?.user.role === 'OPERARIO' || session?.user.role === 'ENCARGADO') && (
            <Link href="/registros/nuevo">
              <Button>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Registro
              </Button>
            </Link>
          )}
        </div>

        {registros.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay registros</h3>
              <p className="text-gray-600 mb-4">Comienza creando tu primer registro de producción</p>
              {(session?.user.role === 'OPERARIO' || session?.user.role === 'ENCARGADO') && (
                <Link href="/registros/nuevo">
                  <Button>Crear Primer Registro</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4" ref={contenedorRef}>
              {registros.map((registro) => (
                <Card key={registro.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{formatearFecha(registro.fecha)}</CardTitle>
                        <CardDescription>
                          Registrado por {registro.usuario.nombre} a las {formatearHora(registro.createdAt)}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{formatearNumero(registro.totalHuevos)}</p>
                        <p className="text-sm text-gray-600">huevos totales</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Producción de Huevo Fértil */}
                      <div className="text-center p-4 bg-green-50 rounded-lg border-l-4 border-l-green-500">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Producción de Huevo Fértil</p>
                        <p className="text-3xl font-bold text-green-700">
                          {formatearNumero(registro.huevoFertilA + registro.huevoFertilB)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          A: {registro.huevoFertilA} | B: {registro.huevoFertilB}
                        </p>
                      </div>
                      
                      {/* Producción de Huevo Comercial */}
                      <div className="text-center p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Producción de Huevo Comercial</p>
                        <p className="text-3xl font-bold text-blue-700">
                          {formatearNumero(
                            registro.huevoJumbo +
                            registro.huevoGrande +
                            registro.huevoMediano +
                            registro.huevoPequeno +
                            registro.huevoPicado
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Jumbo, Grande, Mediano, Pequeño, Picado
                        </p>
                      </div>
                      
                      {/* Huevo Descartado */}
                      <div className="text-center p-4 bg-amber-50 rounded-lg border-l-4 border-l-amber-500">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Huevo Descartado</p>
                        <p className="text-3xl font-bold text-amber-700">
                          {formatearNumero(registro.huevoDesecho)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Huevos no comercializables
                        </p>
                      </div>
                    </div>
                    
                    {registro.observaciones && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Observaciones:</p>
                        <p className="text-sm text-gray-600">{registro.observaciones}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center px-4">
                  Página {pagination.page} de {pagination.pages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}




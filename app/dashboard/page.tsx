'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { formatearNumero } from '@/lib/utils'

interface DashboardData {
  registrosHoy: number
  totalHuevosHoy: number
  promedioProduccionSemana: number
  mortalidadSemana: number
  produccionPorDia: any[]
  distribucionTipos: any[]
  tendenciaProduccion: any[]
  alertas: any[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData()
      // Actualizar cada 30 segundos para simular tiempo real
      const interval = setInterval(fetchDashboardData, 30000)
      return () => clearInterval(interval)
    }
  }, [status])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      setData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session || !data) return null

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dashboard de Producción
          </h1>
          <p className="text-gray-600">
            Monitoreo en tiempo real de la granja reproductora
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="animate-fadeIn hover:shadow-lg transition-shadow border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardDescription>Huevos Producidos Hoy</CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-600">
                {formatearNumero(data.totalHuevosHoy)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {data.registrosHoy} registros hoy
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fadeIn hover:shadow-lg transition-shadow border-l-4 border-l-green-600" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <CardDescription>Promedio Semanal</CardDescription>
              <CardTitle className="text-3xl font-bold text-green-600">
                {formatearNumero(data.promedioProduccionSemana)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Últimos 7 días
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fadeIn hover:shadow-lg transition-shadow border-l-4 border-l-amber-600" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardDescription>Mortalidad Semanal</CardDescription>
              <CardTitle className="text-3xl font-bold text-amber-600">
                {data.mortalidadSemana}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Hembras fallecidas
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fadeIn hover:shadow-lg transition-shadow border-l-4 border-l-purple-600" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <CardDescription>Alertas Activas</CardDescription>
              <CardTitle className="text-3xl font-bold text-purple-600">
                {data.alertas.filter((a: any) => !a.resuelta).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Requieren atención
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tendencia de Producción */}
          <Card className="animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle>Tendencia de Producción</CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.tendenciaProduccion}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribución por Tipo */}
          <Card className="animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CardTitle>Distribución por Tipo</CardTitle>
              <CardDescription>Producción de la semana</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.distribucionTipos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nombre, porcentaje }) => `${nombre}: ${porcentaje}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="cantidad"
                  >
                    {data.distribucionTipos.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Producción Diaria Detallada */}
        <Card className="animate-fadeIn mb-8" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <CardTitle>Producción Diaria Detallada</CardTitle>
            <CardDescription>Comparativa de huevos fértiles vs totales</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.produccionPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="fertiles" fill="#10b981" name="Huevos Fértiles" />
                <Bar dataKey="total" fill="#3b82f6" name="Total Huevos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alertas Recientes */}
        {data.alertas.length > 0 && (
          <Card className="animate-fadeIn" style={{ animationDelay: '0.7s' }}>
            <CardHeader>
              <CardTitle>Alertas Recientes</CardTitle>
              <CardDescription>Notificaciones del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.alertas.slice(0, 5).map((alerta: any) => (
                  <div
                    key={alerta.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alerta.severidad === 'CRITICAL'
                        ? 'bg-red-50 border-l-red-600'
                        : alerta.severidad === 'WARNING'
                        ? 'bg-amber-50 border-l-amber-600'
                        : 'bg-blue-50 border-l-blue-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{alerta.titulo}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alerta.descripcion}</p>
                      </div>
                      {!alerta.resuelta && (
                        <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                          Activa
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}




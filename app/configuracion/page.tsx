'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ConfiguracionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const [config, setConfig] = useState({
    nombreGranja: '',
    totalHembras: 1000,
    totalMachos: 100,
    porcentajeMortalidadMaximo: 0.5,
    consumoAlimentoHembraMin: 120,
    consumoAlimentoHembraMax: 150,
    consumoAlimentoMachoMin: 130,
    consumoAlimentoMachoMax: 160,
    porcentajeProduccionMinimo: 85,
    porcentajeFertilidadMinimo: 90,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'ADMIN') {
      fetchConfiguracion()
    }
  }, [status, session])

  const fetchConfiguracion = async () => {
    try {
      const res = await fetch('/api/configuracion')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Error fetching configuracion:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMensajeExito(null)

    try {
      const res = await fetch('/api/configuracion', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (res.ok) {
        setMensajeExito('Configuración guardada exitosamente')
        setTimeout(() => setMensajeExito(null), 3000)
      } else {
        alert('Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setConfig({
      ...config,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración de la Granja</h1>
          <p className="text-gray-600">Ajusta los parámetros y umbrales del sistema</p>
        </div>

        {mensajeExito && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-green-900">{mensajeExito}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          {/* Información General */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos de la granja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombreGranja">Nombre de la Granja</Label>
                <Input
                  id="nombreGranja"
                  name="nombreGranja"
                  value={config.nombreGranja}
                  onChange={handleChange}
                  placeholder="Granja Reproductora El Progreso"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalHembras">Total de Hembras</Label>
                  <Input
                    id="totalHembras"
                    name="totalHembras"
                    type="number"
                    min="0"
                    value={config.totalHembras}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalMachos">Total de Machos</Label>
                  <Input
                    id="totalMachos"
                    name="totalMachos"
                    type="number"
                    min="0"
                    value={config.totalMachos}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parámetros de Alerta */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Parámetros de Alertas</CardTitle>
              <CardDescription>Umbrales para generar alertas automáticas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="porcentajeMortalidadMaximo">Mortalidad Máxima (%)</Label>
                <Input
                  id="porcentajeMortalidadMaximo"
                  name="porcentajeMortalidadMaximo"
                  type="number"
                  min="0"
                  step="0.1"
                  value={config.porcentajeMortalidadMaximo}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-gray-500">
                  Se generará alerta si la mortalidad supera este porcentaje
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consumoAlimentoHembraMin">Consumo Mín. Hembra (g/día)</Label>
                  <Input
                    id="consumoAlimentoHembraMin"
                    name="consumoAlimentoHembraMin"
                    type="number"
                    min="0"
                    step="1"
                    value={config.consumoAlimentoHembraMin}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consumoAlimentoHembraMax">Consumo Máx. Hembra (g/día)</Label>
                  <Input
                    id="consumoAlimentoHembraMax"
                    name="consumoAlimentoHembraMax"
                    type="number"
                    min="0"
                    step="1"
                    value={config.consumoAlimentoHembraMax}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consumoAlimentoMachoMin">Consumo Mín. Macho (g/día)</Label>
                  <Input
                    id="consumoAlimentoMachoMin"
                    name="consumoAlimentoMachoMin"
                    type="number"
                    min="0"
                    step="1"
                    value={config.consumoAlimentoMachoMin}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consumoAlimentoMachoMax">Consumo Máx. Macho (g/día)</Label>
                  <Input
                    id="consumoAlimentoMachoMax"
                    name="consumoAlimentoMachoMax"
                    type="number"
                    min="0"
                    step="1"
                    value={config.consumoAlimentoMachoMax}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parámetros de Producción */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Parámetros de Producción</CardTitle>
              <CardDescription>Umbrales mínimos esperados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="porcentajeProduccionMinimo">Producción Mínima (%)</Label>
                <Input
                  id="porcentajeProduccionMinimo"
                  name="porcentajeProduccionMinimo"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={config.porcentajeProduccionMinimo}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-gray-500">
                  Porcentaje mínimo de producción esperado (alerta si está por debajo)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="porcentajeFertilidadMinimo">Fertilidad Mínima (%)</Label>
                <Input
                  id="porcentajeFertilidadMinimo"
                  name="porcentajeFertilidadMinimo"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={config.porcentajeFertilidadMinimo}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-gray-500">
                  Porcentaje mínimo de fertilidad esperado (alerta si está por debajo)
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchConfiguracion()}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}


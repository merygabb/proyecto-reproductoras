'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NuevoRegistroPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    mortalidadHembra: 0,
    alimentoHembra: 0,
    alimentoMacho: 0,
    huevoFertilA: 0,
    huevoFertilB: 0,
    huevoGrande: 0,
    huevoMediano: 0,
    huevoPequeno: 0,
    huevoJumbo: 0,
    huevoPicado: 0,
    huevoDesecho: 0,
    observaciones: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/registros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/registros')
        }, 2000)
      } else {
        alert('Error al guardar el registro')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar el registro')
    } finally {
      setLoading(false)
    }
  }

  const totalHuevos = 
    formData.huevoFertilA +
    formData.huevoFertilB +
    formData.huevoGrande +
    formData.huevoMediano +
    formData.huevoPequeno +
    formData.huevoJumbo +
    formData.huevoPicado +
    formData.huevoDesecho

  const totalFertiles = formData.huevoFertilA + formData.huevoFertilB
  const porcentajeFertilidad = totalHuevos > 0 ? ((totalFertiles / totalHuevos) * 100).toFixed(1) : 0

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center">
            <CardContent className="pt-12 pb-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro Guardado Exitosamente!</h2>
              <p className="text-gray-600">Redirigiendo...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nuevo Registro de Producción</h1>
          <p className="text-gray-600">Captura los datos de producción diaria</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resumen en tiempo real */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Huevos</p>
                  <p className="text-3xl font-bold text-blue-600">{totalHuevos}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Huevos Fértiles</p>
                  <p className="text-3xl font-bold text-green-600">{totalFertiles}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">% Fertilidad</p>
                  <p className="text-3xl font-bold text-purple-600">{porcentajeFertilidad}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mortalidad y Alimentación */}
          <Card>
            <CardHeader>
              <CardTitle>Mortalidad y Alimentación</CardTitle>
              <CardDescription>Datos de sanidad y nutrición</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mortalidadHembra">Mortalidad Hembras</Label>
                <Input
                  id="mortalidadHembra"
                  name="mortalidadHembra"
                  type="number"
                  min="0"
                  value={formData.mortalidadHembra}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alimentoHembra">Alimento Hembra (kg)</Label>
                <Input
                  id="alimentoHembra"
                  name="alimentoHembra"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.alimentoHembra}
                  onChange={handleChange}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alimentoMacho">Alimento Macho (kg)</Label>
                <Input
                  id="alimentoMacho"
                  name="alimentoMacho"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.alimentoMacho}
                  onChange={handleChange}
                  placeholder="0.0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Producción de Huevos Fértiles */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-green-700">Producción de Huevos Fértiles</CardTitle>
              <CardDescription>Clasificación A y B</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="huevoFertilA">Huevo Fértil A</Label>
                <Input
                  id="huevoFertilA"
                  name="huevoFertilA"
                  type="number"
                  min="0"
                  value={formData.huevoFertilA}
                  onChange={handleChange}
                  placeholder="0"
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="huevoFertilB">Huevo Fértil B</Label>
                <Input
                  id="huevoFertilB"
                  name="huevoFertilB"
                  type="number"
                  min="0"
                  value={formData.huevoFertilB}
                  onChange={handleChange}
                  placeholder="0"
                  className="text-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Producción de Huevo Comercial */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-700">Producción de Huevo Comercial</CardTitle>
              <CardDescription>Clasificación por tamaño y tipo comercial</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="huevoJumbo">Jumbo</Label>
                <Input
                  id="huevoJumbo"
                  name="huevoJumbo"
                  type="number"
                  min="0"
                  value={formData.huevoJumbo}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="huevoGrande">Grande</Label>
                <Input
                  id="huevoGrande"
                  name="huevoGrande"
                  type="number"
                  min="0"
                  value={formData.huevoGrande}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="huevoMediano">Mediano</Label>
                <Input
                  id="huevoMediano"
                  name="huevoMediano"
                  type="number"
                  min="0"
                  value={formData.huevoMediano}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="huevoPequeno">Pequeño</Label>
                <Input
                  id="huevoPequeno"
                  name="huevoPequeno"
                  type="number"
                  min="0"
                  value={formData.huevoPequeno}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="huevoPicado">Huevo Picado</Label>
                <Input
                  id="huevoPicado"
                  name="huevoPicado"
                  type="number"
                  min="0"
                  value={formData.huevoPicado}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Huevo Descartado */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-amber-700">Huevo Descartado</CardTitle>
              <CardDescription>Huevos que no cumplen estándares de comercialización</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="huevoDesecho">Huevo Desecho</Label>
                <Input
                  id="huevoDesecho"
                  name="huevoDesecho"
                  type="number"
                  min="0"
                  value={formData.huevoDesecho}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
              <CardDescription>Notas adicionales (opcional)</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Detectada baja temperatura en galpón 2..."
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Guardando...' : 'Guardar Registro'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}




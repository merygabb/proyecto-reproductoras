'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SaldosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dias, setDias] = useState('7')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [guardando, setGuardando] = useState(false)

  const [formAlimento, setFormAlimento] = useState({ sexo: 'HEMBRA', cantidadKg: 0 })
  const [formAves, setFormAves] = useState({ sexo: 'HEMBRA', cantidad: 0 })
  const [formHuevos, setFormHuevos] = useState({ categoria: 'FERTIL_A', cantidad: 0 })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      // Permitir ENCARGADO, SUPERVISOR y OPERARIO
      if (
        session?.user.role === 'ENCARGADO' ||
        session?.user.role === 'SUPERVISOR' ||
        session?.user.role === 'OPERARIO'
      ) {
        fetchSaldos()
      } else {
        router.push('/dashboard')
      }
    }
  }, [status, session, dias])

  const fetchSaldos = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/saldos?dias=${dias}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error('Error cargando saldos:', e)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando saldos...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Saldos (Existencias)</h1>
            <p className="text-gray-600">
              Período: Últimos {dias} días — {new Date(data.fechaInicio).toLocaleDateString('es-ES')} a {new Date(data.fechaFin).toLocaleDateString('es-ES')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant={dias === '7' ? 'default' : 'outline'} onClick={() => setDias('7')} size="sm">7 días</Button>
            <Button variant={dias === '30' ? 'default' : 'outline'} onClick={() => setDias('30')} size="sm">30 días</Button>
            <Button variant={dias === '90' ? 'default' : 'outline'} onClick={() => setDias('90')} size="sm">90 días</Button>
          </div>
        </div>

        {/* Formularios de movimientos removidos: esta vista queda solo para consulta de saldos */}

        {/* Alimento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardTitle>Alimento Hembra</CardTitle>
              <CardDescription>Saldo consumido en el período (kg)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{data.alimento.hembra.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-indigo-600">
            <CardHeader className="pb-3">
              <CardTitle>Alimento Macho</CardTitle>
              <CardDescription>Saldo consumido en el período (kg)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-indigo-600">{data.alimento.macho.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-cyan-600">
            <CardHeader className="pb-3">
              <CardTitle>Alimento Total</CardTitle>
              <CardDescription>Hembra + Macho (kg)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-cyan-600">{data.alimento.total.toFixed(1)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Mortalidad */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-amber-600">
            <CardHeader className="pb-3">
              <CardTitle>Mortalidad Hembra</CardTitle>
              <CardDescription>Período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{data.mortalidad.hembra}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="pb-3">
              <CardTitle>Mortalidad Macho</CardTitle>
              <CardDescription>Período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{data.mortalidad.macho}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-600">
            <CardHeader className="pb-3">
              <CardTitle>Mortalidad Total</CardTitle>
              <CardDescription>Hembra + Macho</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{data.mortalidad.total}</p>
            </CardContent>
          </Card>
        </div>

        {/* Producción por tipo (saldo) */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Saldo de Producción por Tipo</CardTitle>
            <CardDescription>Acumulado del período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <SaldoItem color="text-green-700" label="Fértil A" value={data.produccion.fertilA} bg="bg-green-50" />
              <SaldoItem color="text-green-700" label="Fértil B" value={data.produccion.fertilB} bg="bg-green-50" />
              <SaldoItem color="text-blue-700" label="Jumbo" value={data.produccion.jumbo} bg="bg-blue-50" />
              <SaldoItem color="text-blue-700" label="Grande" value={data.produccion.grande} bg="bg-blue-50" />
              <SaldoItem color="text-blue-700" label="Mediano" value={data.produccion.mediano} bg="bg-blue-50" />
              <SaldoItem color="text-blue-700" label="Pequeño" value={data.produccion.pequeno} bg="bg-blue-50" />
              <SaldoItem color="text-amber-700" label="Picado" value={data.produccion.picado} bg="bg-amber-50" />
              <SaldoItem color="text-rose-700" label="Descartado" value={data.produccion.desecho} bg="bg-rose-50" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <ResumenCard title="Total Fértil" value={data.produccion.fertil} color="text-green-700" />
              <ResumenCard title="Total Comercial" value={data.produccion.comercial} color="text-blue-700" />
              <ResumenCard title="Total Producido" value={data.produccion.total} color="text-gray-900" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function SaldoItem({ label, value, color, bg }:{ label: string, value: number, color: string, bg: string }) {
  return (
    <div className={`text-center p-3 rounded-lg ${bg}`}>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function ResumenCard({ title, value, color }:{ title: string, value: number, color: string }) {
  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}



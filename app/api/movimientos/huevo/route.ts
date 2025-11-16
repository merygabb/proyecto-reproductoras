import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { tipo, categoria, cantidad } = body
    if (!tipo || !categoria || !cantidad || cantidad <= 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const mov = await prisma.movimientoHuevo.create({
      data: {
        tipo,
        categoria,
        cantidad,
      },
    })
    return NextResponse.json(mov, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error creando movimiento' }, { status: 500 })
  }
}



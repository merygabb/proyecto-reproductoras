import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (session.user.role !== 'SUPERVISOR') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

    const body = await request.json()
    const { tipo, sexo, cantidad } = body
    if (!tipo || !sexo || !cantidad || cantidad <= 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const mov = await prisma.movimientoAves.create({
      data: {
        tipo,
        sexo,
        cantidad,
      },
    })
    return NextResponse.json(mov, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error creando movimiento' }, { status: 500 })
  }
}



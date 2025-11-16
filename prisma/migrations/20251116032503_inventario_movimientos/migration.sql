-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('HEMBRA', 'MACHO');

-- CreateEnum
CREATE TYPE "TipoMovimientoAlimento" AS ENUM ('INGRESO', 'CONSUMO');

-- CreateEnum
CREATE TYPE "CategoriaHuevo" AS ENUM ('FERTIL_A', 'FERTIL_B', 'JUMBO', 'GRANDE', 'MEDIANO', 'PEQUENO', 'PICADO', 'DESECHO');

-- CreateEnum
CREATE TYPE "TipoMovimientoAves" AS ENUM ('INGRESO', 'MORTALIDAD');

-- CreateTable
CREATE TABLE "movimientos_alimento" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoMovimientoAlimento" NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "cantidadKg" DOUBLE PRECISION NOT NULL,
    "referenciaRegistroId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_alimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_aves" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoMovimientoAves" NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "referenciaRegistroId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_aves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_huevo" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" "CategoriaHuevo" NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "referenciaRegistroId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_huevo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimientos_alimento_fecha_idx" ON "movimientos_alimento"("fecha");

-- CreateIndex
CREATE INDEX "movimientos_alimento_sexo_tipo_idx" ON "movimientos_alimento"("sexo", "tipo");

-- CreateIndex
CREATE INDEX "movimientos_aves_fecha_idx" ON "movimientos_aves"("fecha");

-- CreateIndex
CREATE INDEX "movimientos_aves_sexo_tipo_idx" ON "movimientos_aves"("sexo", "tipo");

-- CreateIndex
CREATE INDEX "movimientos_huevo_fecha_idx" ON "movimientos_huevo"("fecha");

-- CreateIndex
CREATE INDEX "movimientos_huevo_categoria_tipo_idx" ON "movimientos_huevo"("categoria", "tipo");

-- AddForeignKey
ALTER TABLE "movimientos_alimento" ADD CONSTRAINT "movimientos_alimento_referenciaRegistroId_fkey" FOREIGN KEY ("referenciaRegistroId") REFERENCES "registros_produccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_aves" ADD CONSTRAINT "movimientos_aves_referenciaRegistroId_fkey" FOREIGN KEY ("referenciaRegistroId") REFERENCES "registros_produccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_huevo" ADD CONSTRAINT "movimientos_huevo_referenciaRegistroId_fkey" FOREIGN KEY ("referenciaRegistroId") REFERENCES "registros_produccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

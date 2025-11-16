-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERVISOR', 'ENCARGADO', 'OPERARIO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERARIO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_produccion" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mortalidadHembra" INTEGER NOT NULL DEFAULT 0,
    "alimentoHembra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alimentoMacho" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "huevoFertilA" INTEGER NOT NULL DEFAULT 0,
    "huevoFertilB" INTEGER NOT NULL DEFAULT 0,
    "huevoGrande" INTEGER NOT NULL DEFAULT 0,
    "huevoMediano" INTEGER NOT NULL DEFAULT 0,
    "huevoPequeno" INTEGER NOT NULL DEFAULT 0,
    "huevoJumbo" INTEGER NOT NULL DEFAULT 0,
    "huevoPicado" INTEGER NOT NULL DEFAULT 0,
    "huevoDesecho" INTEGER NOT NULL DEFAULT 0,
    "totalHuevos" INTEGER NOT NULL DEFAULT 0,
    "totalFertiles" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_produccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_granja" (
    "id" TEXT NOT NULL,
    "nombreGranja" TEXT NOT NULL,
    "totalHembras" INTEGER NOT NULL,
    "totalMachos" INTEGER NOT NULL,
    "porcentajeMortalidadMaximo" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "consumoAlimentoHembraMin" DOUBLE PRECISION NOT NULL DEFAULT 120,
    "consumoAlimentoHembraMax" DOUBLE PRECISION NOT NULL DEFAULT 150,
    "consumoAlimentoMachoMin" DOUBLE PRECISION NOT NULL DEFAULT 130,
    "consumoAlimentoMachoMax" DOUBLE PRECISION NOT NULL DEFAULT 160,
    "porcentajeProduccionMinimo" DOUBLE PRECISION NOT NULL DEFAULT 85,
    "porcentajeFertilidadMinimo" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_granja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "resuelta" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "registros_produccion_fecha_idx" ON "registros_produccion"("fecha");

-- CreateIndex
CREATE INDEX "registros_produccion_usuarioId_idx" ON "registros_produccion"("usuarioId");

-- CreateIndex
CREATE INDEX "alertas_fecha_idx" ON "alertas"("fecha");

-- CreateIndex
CREATE INDEX "alertas_resuelta_idx" ON "alertas"("resuelta");

-- AddForeignKey
ALTER TABLE "registros_produccion" ADD CONSTRAINT "registros_produccion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

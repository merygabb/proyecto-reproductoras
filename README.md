# 🐔 Sistema de Gestión de Granja Reproductora

Sistema web profesional para la recolección, procesamiento y visualización de datos de producción de huevos en granjas reproductoras. Proyecto desarrollado con tecnologías modernas para gestión en tiempo real.

## ✨ Características Principales

### 📊 Dashboard en Tiempo Real
- Visualización de producción diaria con gráficos interactivos
- KPIs principales: producción, fertilidad, mortalidad y alertas
- Tendencias de producción con gráficos de área
- Distribución por tipo de huevo (pie charts)
- Actualización automática cada 30 segundos

### 📝 Captura de Datos
- Formulario intuitivo para registro diario
- Captura de 11 tipos de datos de producción:
  - Mortalidad de hembras
  - Alimento de hembra y macho
  - Huevos fértiles A y B
  - Huevos por tamaño (Grande, Mediano, Pequeño, Jumbo)
  - Huevos con problemas (Picado, Desecho)
- Cálculo automático de totales y porcentajes
- Validación en tiempo real

### 📈 Reportes Avanzados
- Análisis detallado por períodos (7, 30, 90 días)
- Gráficos de evolución temporal
- Análisis radar de rendimiento
- Correlación alimentación-producción
- Tabla de indicadores estadísticos
- Exportación de reportes (en desarrollo)

### 👥 Sistema de Roles
- **Admin**: Acceso completo al sistema
- **Supervisor**: Dashboard, registros y reportes
- **Encargado**: Dashboard, registros y reportes
- **Operario**: Captura de datos y consulta de registros propios

### 🔔 Sistema de Alertas
- Detección automática de anomalías
- Alertas de mortalidad alta
- Alertas de producción baja
- Alertas de fertilidad baja
- Clasificación por severidad (INFO, WARNING, CRITICAL)

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 14 (App Router)
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Autenticación**: NextAuth.js
- **UI**: Tailwind CSS + Componentes personalizados
- **Gráficas**: Recharts
- **Lenguaje**: TypeScript
- **Validación**: Zod

## 📋 Requisitos Previos

- Node.js 18+ instalado
- PostgreSQL instalado y ejecutándose
- npm o yarn

## 🚀 Instalación

### 1. Clonar el repositorio (si aplica)

```bash
cd proyecto-reproductoras
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar base de datos

Crea una base de datos PostgreSQL:

```sql
CREATE DATABASE granja_reproductoras;
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto (ya existe como plantilla):

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/granja_reproductoras?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-super-seguro"
```

**Importante**: Cambia `usuario` y `password` por tus credenciales de PostgreSQL.

### 5. Ejecutar migraciones de Prisma

```bash
npx prisma migrate dev --name init
```

### 6. Poblar la base de datos con datos de prueba

```bash
npx prisma db seed
```

Este comando creará:
- 4 usuarios de prueba (uno por cada rol)
- 30 registros de producción de ejemplo
- Configuración inicial de granja
- Alertas de ejemplo

### 7. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

## 👤 Credenciales de Acceso

Después de ejecutar el seed, puedes acceder con:

### Administrador
- **Email**: admin@granja.com
- **Contraseña**: admin123

### Supervisor
- **Email**: supervisor@granja.com
- **Contraseña**: admin123

### Encargado
- **Email**: encargado@granja.com
- **Contraseña**: admin123

### Operario
- **Email**: operario@granja.com
- **Contraseña**: admin123

## 📁 Estructura del Proyecto

```
proyecto-reproductoras/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # Autenticación
│   │   ├── dashboard/         # Datos del dashboard
│   │   ├── registros/         # CRUD de registros
│   │   └── reportes/          # Generación de reportes
│   ├── dashboard/             # Página principal
│   ├── login/                 # Página de login
│   ├── registros/             # Gestión de registros
│   │   ├── nuevo/            # Formulario de captura
│   │   └── page.tsx          # Lista de registros
│   ├── reportes/              # Reportes avanzados
│   ├── globals.css            # Estilos globales
│   ├── layout.tsx             # Layout principal
│   └── providers.tsx          # Providers de contexto
├── components/
│   ├── ui/                    # Componentes UI reutilizables
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   └── navbar.tsx             # Barra de navegación
├── lib/
│   ├── prisma.ts             # Cliente de Prisma
│   └── utils.ts              # Utilidades
├── prisma/
│   ├── schema.prisma         # Esquema de base de datos
│   └── seed.ts               # Script de seed
├── types/
│   └── next-auth.d.ts        # Tipos de NextAuth
├── .env                      # Variables de entorno
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 🎨 Características Visuales

- **Diseño moderno y responsivo**: Funciona perfectamente en móviles, tablets y desktop
- **Tema profesional**: Colores corporativos con gradientes modernos
- **Animaciones suaves**: Transiciones y efectos fadeIn
- **Gráficos interactivos**: Tooltips, leyendas y zoom en gráficas
- **Feedback visual**: Estados de carga, éxito y error
- **Iconografía consistente**: Icons SVG integrados

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Producción
npm run build           # Compilar para producción
npm start              # Iniciar servidor de producción

# Prisma
npx prisma studio      # Abrir Prisma Studio (GUI para BD)
npx prisma migrate dev # Crear nueva migración
npx prisma db seed     # Ejecutar seed

# Linting
npm run lint           # Verificar código
```

## 📊 Modelos de Base de Datos

### User (Usuarios)
- id, email, nombre, password, role, activo

### RegistroProduccion
- Mortalidad y alimentación
- Producción de huevos por tipo
- Totales calculados automáticamente
- Relación con usuario

### Alerta
- Sistema de notificaciones
- Clasificación por severidad
- Estado de resolución

### ConfiguracionGranja
- Parámetros de la granja
- Límites para alertas

## 🚀 Despliegue en Producción

### Recomendaciones para despliegue:

1. **Vercel** (Recomendado para Next.js):
   - Conecta tu repositorio
   - Configura las variables de entorno
   - Despliegue automático

2. **Base de datos**:
   - Usa PostgreSQL en la nube (Railway, Supabase, Neon)
   - Actualiza DATABASE_URL en variables de entorno

3. **Seguridad**:
   - Genera un NEXTAUTH_SECRET seguro: `openssl rand -base64 32`
   - Usa HTTPS en producción
   - Configura CORS si es necesario

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación basada en JWT
- Protección de rutas por rol
- Validación de datos en cliente y servidor
- Sanitización de inputs

## 🤝 Contribuciones

Este es un proyecto de graduación. Para mejoras o sugerencias, por favor contacta al desarrollador.

## 📝 Licencia

Este proyecto es de uso académico.

## 👨‍💻 Autor

Desarrollado como proyecto de graduación de PGA.

## 📞 Soporte

Para problemas o preguntas:
1. Revisa esta documentación
2. Verifica que PostgreSQL esté ejecutándose
3. Asegúrate de que las migraciones se ejecutaron correctamente
4. Revisa los logs en la consola

## 🎯 Próximas Funcionalidades

- [ ] Exportación de reportes a PDF
- [ ] Notificaciones push en tiempo real
- [ ] Dashboard móvil nativo
- [ ] Integración con sistemas de pesaje automático
- [ ] Predicción de producción con ML
- [ ] Gestión de inventario de alimento
- [ ] Sistema de turnos para operarios

---

**¡Gracias por usar el Sistema de Gestión de Granja Reproductora!** 🐔🥚




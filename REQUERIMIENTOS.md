# 🏆 Santander Fiesta Awards — Documento de Requerimientos

> *App Android para llevar el control de gastos de la tarjeta Santander Fiesta Awards*
> *Sincronización en tiempo real entre 2 celulares · Sin login · Blanco y Dorado*

---

## 📋 1. Visión General

**¿Qué es?**
Una aplicación Android que permite a **2 personas** (ej: tú y tu pareja, o tú y un familiar) llevar el control de **todos los gastos realizados con la tarjeta Santander Fiesta Awards**.

**¿Qué la hace única?**
- ⚡ **Sincronización en tiempo real** — Si uno registra un gasto, el otro lo ve al instante
- 🔓 **Sin cuentas ni logins** — Abres la app y ya está todo ahí
- 📱 **Solo Android** — App nativa, sin versión web
- 🎨 **Blanco y Dorado** — Como la tarjeta física

---

## 🎯 2. Funcionalidades Core

### Fase 1 — Esencial (MVP)

| # | Funcionalidad | Descripción |
|:-:|:--------------|:------------|
| 1 | **Dashboard** | Resumen visual: saldo del mes, gasto total, gasto por categoría |
| 2 | **Registrar gasto** | Formulario: monto, fecha, descripción, categoría, notas |
| 3 | **Lista de gastos** | Historial completo ordenado por fecha, con búsqueda y filtros |
| 4 | **Categorías** | Clasificación de gastos (comida, transporte, shopping, etc.) |
| 5 | **Sincronización** | Tiempo real entre 2 dispositivos vía Firebase Firestore |

### Fase 2 — Mejoras (Post-MVP)

| # | Funcionalidad |
|:-:|:--------------|
| 6 | Editar/Eliminar gastos existentes |
| 7 | Estadísticas y gráficas por mes/categoría |
| 8 | Metas de gasto mensual por categoría |
| 9 | Exportar datos a CSV |

---

## 🧱 3. Arquitectura Técnica

```
┌─────────────────────┐     ┌─────────────────────┐
│   Celular #1        │     │   Celular #2        │
│  (App Android)      │     │  (App Android)      │
│                     │     │                     │
│  ┌───────────────┐  │     │  ┌───────────────┐  │
│  │ Expo (React   │  │     │  │ Expo (React   │  │
│  │ Native)       │  │     │  │ Native)       │  │
│  └───────┬───────┘  │     │  └───────┬───────┘  │
│          │          │     │          │          │
│  ┌───────▼───────┐  │     │  ┌───────▼───────┐  │
│  │ Firebase SDK  │  │     │  │ Firebase SDK  │  │
│  │ (Firestore)   │  │     │  │ (Firestore)   │  │
│  └───────┬───────┘  │     │  └───────┬───────┘  │
└──────────┼──────────┘     └──────────┼──────────┘
           │                           │
           └──────────┬────────────────┘
                      │
         ┌────────────▼────────────┐
         │   Firebase Firestore    │
         │   (Base de datos en     │
         │    la nube)             │
         │                         │
         │  📁 /groups/{groupId}   │
         │    ├── 📄 info          │
         │    └── 📁 transactions  │
         │         ├── 📄 gasto1   │
         │         └── 📄 gasto2   │
         └─────────────────────────┘
                      │
         ┌────────────▼────────────┐
         │   Firebase App Check    │
         │   (Protección contra    │
         │    accesos no deseados)  │
         └─────────────────────────┘
```

### Stack Tecnológico

| Capa | Tecnología | Versión |
|:-----|:-----------|:--------|
| **App** | Expo (React Native) | SDK 57 |
| **Lenguaje** | TypeScript | 6.0 |
| **Navegación** | expo-router | ✓ |
| **Base de datos** | Firebase Firestore | ✓ |
| **SDK Firebase** | @react-native-firebase | ✓ |
| **Íconos** | @expo/vector-icons | ✓ |
| **Gráficas** | react-native-gifted-charts | ✓ |
| **Fechas** | date-fns | ✓ |
| **Listas** | @shopify/flash-list | ✓ |
| **Gestos** | react-native-gesture-handler | ✓ |
| **Animaciones** | react-native-reanimated | ✓ |
| **Seguridad** | Firebase App Check (Play Integrity) | ✓ |

---

## 🔐 4. Seguridad — Sin Autenticación

Al no tener login de usuarios, la seguridad se maneja así:

### 4.1 Firebase App Check
- **¿Qué es?** Un servicio que verifica que las peticiones a Firestore vienen **exclusivamente de tu app instalada en un dispositivo real**.
- **¿Cómo funciona?** Usa **Play Integrity** de Google Play para asegurar que la app no ha sido modificada y está instalada desde una fuente confiable.
- **Beneficio:** Aunque alguien descubra tu clave de API de Firebase, **no podrá leer ni escribir datos** porque App Check bloquea peticiones que no vienen de tu app.

### 4.2 Código de Grupo Compartido
- Al abrir la app por primera vez, se genera un **código único de grupo**
- Ambos celulares usan el **mismo código** para acceder a los mismos datos
- El código se guarda localmente en el teléfono (AsyncStorage)
- Si alguien no tiene el código, no puede ver los datos

### 4.3 Reglas de Firestore
```
// Solo permitir acceso con App Check válido
allow read, write: if request.app.token != null;
```

### 4.4 Límites de Seguridad
- ❌ No hay forma de "recuperar acceso" si se pierde el código de grupo
- ❌ No hay control por usuario (quién hizo cada gasto)
- ✅ Pero es **extremadamente simple** para el uso diario (abres y ya)

---

## 💾 5. Modelo de Datos (Firestore)

### Colección: `groups`

```typescript
/groups/{groupId}/
  ├── info: {
  │     createdAt: timestamp,
  │     name: string         // ej: "Gastos Casa"
  │   }
  └── transactions/
        └── {transactionId}: {
              date: timestamp,        // Fecha del gasto
              amount: number,         // Monto en MXN
              description: string,    // Ej: "Súper semanal"
              category: string,       // Ej: "comida"
              notes?: string,         // Notas opcionales
              createdAt: timestamp,   // Cuándo se registró
              deviceId: string,       // ID del dispositivo que lo creó
              updatedAt?: timestamp   // Última modificación
            }
```

### Categorías (configuración fija en la app)

| Categoría | Icono | Color |
|:----------|:------|:------|
| Comida | restaurant | 🍔 |
| Transporte | car | 🚗 |
| Supermercado | cart | 🛒 |
| Shopping | bag | 🛍️ |
| Entretenimiento | film | 🎬 |
| Salud | medical | 💊 |
| Servicios | flash | 💡 |
| Educación | book | 📚 |
| Viajes | airplane | ✈️ |
| Otros | ellipsis | 📌 |

---

## 📱 6. Pantallas (UI)

### 6.1 Dashboard (Inicio)
- Resumen del mes actual: **Total gastado**
- Gráfica de dona por categoría (golden chart)
- Últimos 5 gastos registrados
- Barra dorada decorativa en la parte superior

### 6.2 Registrar Gasto
- Input de monto (teclado numérico, con formato de pesos)
- Selector de categoría (grid de íconos dorados sobre blanco)
- Campo de descripción
- Fecha (por defecto hoy)
- Notas (opcional)
- Botón "Registrar" dorado

### 6.3 Historial de Gastos
- Lista virtualizada con FlashList (smooth scrolling)
- Cada item: ícono de categoría + descripción + monto
- Ordenado por fecha (más reciente primero)
- Pull-to-refresh
- Filtro por mes y categoría

### 6.4 Configuración / Grupo
- Código del grupo (para compartir con el otro celular)
- Opción para cambiar nombre del grupo
- Acerca de / versión

---

## 🎨 7. Tema Visual — Blanco y Dorado

### Paleta de Colores

```
Dorado principal:    #C8A84E  — Botones, acentos, títulos
Dorado claro:        #E8D49E  — Fondos sutiles, decoraciones
Dorado oscuro:       #A68A3E  — Estados presionados
Fondo:               #F5F5F0  — Off-white cálido
Superficies:         #FFFFFF  — Cards, modales
Texto principal:     #1A1A1A  — Texto corporal
Texto secundario:    #6B6B6B  — Texto de ayuda
Bordes:              #E8E4DC  — Líneas divisorias suaves
Éxito:               #2E7D32  — Gastos dentro del presupuesto
Error:               #C62828  — Gastos que exceden presupuesto
```

### Principios de Diseño
- **Limpio y premium** — mucho espacio blanco, dorado usado con moderación
- **Superficies tipo tarjeta** — sombras sutiles, bordes redondeados de 12px
- **Dorado como acento** — solo en elementos importantes (totales, botones principales)
- **Tipografía clara** — jerarquía visual con sistema de fuentes nativo

---

## ⚡ 8. Sincronización en Tiempo Real

### Cómo funciona
1. Ambos celulares se conectan a la **misma colección en Firestore**
2. Cuando un celular **crea/edita/elimina** un gasto, Firestore notifica al otro automáticamente
3. El otro celular **actualiza su UI en tiempo real** sin hacer nada

### Manejo de conflictos
- **Last-Write-Wins** (el último que escribe, gana)
- Para 2 personas, los conflictos son extremadamente raros
- Si ambos editan el mismo gasto al mismo tiempo, el último cambio se guarda

### Offline
- Firebase Firestore tiene **persistencia offline nativa**
- Si un celular no tiene internet, los cambios se guardan localmente
- Cuando recupera conexión, **sincroniza automáticamente** con la nube

---

## 🛠️ 9. Flujo de Instalación

### Para desarrollo
```bash
# 1. Clonar el repo
git clone <url>
cd SantanderFiestaAwards

# 2. Instalar dependencias
pnpm install

# 3. Descargar google-services.json de Firebase Console
#    y colocarlo en la raíz del proyecto

# 4. Iniciar dev build
npx expo run:android
```

### Para los 2 celulares
1. Generar **APK firmada** con EAS Build
2. Compartir el APK con ambos celulares (o distribuir por Google Play)
3. En el primer celular: la app genera un **código de grupo**
4. En el segundo celular: ingresar ese código
5. ✅ **Listo** — ambos ven los mismos gastos

---

## 📐 10. Decisiones Técnicas Clave

| Decisión | Opción elegida | ¿Por qué? |
|:---------|:---------------|:----------|
| **Backend** | Firebase Firestore | Tiempo real nativo + offline automático + sin necesidad de servidor propio |
| **Auth** | Sin autenticación | Para 2 personas, un código de grupo es más simple que crear cuentas |
| **Seguridad** | App Check (Play Integrity) | Protege la BD sin complicar la experiencia de usuario |
| **Offline** | Firestore persistence | Sincronización automática cuando hay conexión |
| **Build** | EAS Build + APK | Distribución directa sin pasar por Google Play (si se desea) |

---

## 🚀 11. Próximos Pasos

1. ✅ **Esta documento** — definir exactamente qué construir
2. [ ] **Configurar Firebase** — crear proyecto, descargar google-services.json
3. [ ] **Configurar App Check** — Play Integrity + debug token
4. [ ] **Instalar Firebase SDK** en el proyecto Expo
5. [ ] **Actualizar arquitectura** — reemplazar expo-sqlite por Firestore
6. [ ] **Crear pantallas** — Dashboard, Registrar, Historial
7. [ ] **Implementar sincronización** — listeners en tiempo real
8. [ ] **Build y prueba** en 2 dispositivos

---

> 📝 *Este documento es vivo — se actualizará a medida que tomemos decisiones.*

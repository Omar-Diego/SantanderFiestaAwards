# 🏆 Santander Fiesta Awards — Documento de Requerimientos

> *App Android para llevar el control de gastos de la tarjeta Santander Fiesta Awards*
> *Sincronización en tiempo real entre 2 celulares · Sin login · Dark mode estilo banca*

---

## 📋 1. Visión General

**¿Qué es?**
Una aplicación Android que permite a **2 personas** (ej: tú y tu pareja, o tú y un familiar) llevar el control de **todos los gastos realizados con la tarjeta Santander Fiesta Awards**.

**¿Qué la hace única?**
- ⚡ **Sincronización en tiempo real** — Si uno registra un gasto, el otro lo ve al instante
- 🔓 **Sin cuentas ni logins** — Solo un enlace de invitación compartido por WhatsApp
- 📱 **Solo Android** — App nativa, sin versión web
- 🎨 **Dark mode estilo banca** — Revolut-style (ver `Design.md` v2)

---

## 🎯 2. Funcionalidades Core

### Fase 1 — Esencial (MVP)

| # | Funcionalidad | Descripción |
|:-:|:--------------|:------------|
| 1 | **Dashboard (Inicio)** | Balance del mes, disponible por fin de semana (con rollover), últimos 3 gastos, acciones rápidas |
| 2 | **Registrar gasto** | Formulario: monto, descripción, fecha. Sin categorías ni notas |
| 3 | **Lista de gastos (Actividad)** | Historial del mes con **búsqueda por descripción**, swipe para editar/eliminar |
| 4 | **Editar y eliminar gastos** | Botones verde (Editar) y rojo (Eliminar) al deslizar un gasto |
| 5 | **Presupuesto (Crédito)** | Meta mensual con día de corte; disponible por fin de semana y por período |
| 6 | **Sincronización** | Tiempo real entre 2 dispositivos vía Firebase Firestore |

### Fase 2 — Post-MVP (descartada por el cliente)

Se **eliminaron** de forma explícita:
- ~~Categorías y filtros por categoría~~
- ~~Notas opcionales en el gasto~~
- ~~Estadísticas y gráficas~~
- ~~Metas de gasto por categoría~~
- ~~Exportar datos a CSV~~
- ~~Alertas automáticas~~
- ~~Pantalla de configuración~~ — el código del grupo vive en la pestaña **Alertas**

---

## 🔐 3. Seguridad — Sin Autenticación

Al no tener login de usuarios, la seguridad se maneja así:

### 3.1 Código de grupo seguro
- El código de grupo se genera con **16 caracteres** aleatorios de un alfabeto seguro (32 símbolos: `A-Z` sin `I/O` + `2-9` sin `0/1`) → **≈ 2^80 combinaciones**, prácticamente imposible de adivinar
- Códigos antiguos (formato `ABCD1234`) siguen siendo válidos para unirse — compatibilidad total
- El código se guarda localmente en el teléfono (AsyncStorage)

### 3.2 Compartir por WhatsApp
- Desde la pestaña **Alertas** se muestra el **código en grupos de 4** (ej: `K7WQ-3X9M-2B4F-6H8D`) y se puede **copiar el enlace** o **compartirlo por WhatsApp**
- WhatsApp solo convierte en enlaces clicables las URLs `http/https`; los esquemas propios (`santander-fiesta://`) se ven como texto plano. Por eso el mensaje de WhatsApp comparte el **código con instrucciones** (funciona siempre):

  ```
  Únete a mi grupo "Gastos Casa" en Santander Fiesta Awards.

  Código: K7WQ-3X9M-2B4F-6H8D

  Abre la app, elige "Unirse a un grupo" y escribe el código.
  ```
- El enlace `santander-fiesta://join/{código}` también se genera (para copiar) y permite unirse automáticamente cuando se abre dentro de la app; el envío directo por WhatsApp quedará para una futura integración con universal links (requiere hosting)

### 3.3 Firebase App Check (pendiente)
- ⏳ **Pendiente de configurar:** App Check con Play Integrity para verificar que las peticiones vienen de la app instalada en un dispositivo real
- Beneficio: aunque alguien descubra la clave de API, no podrá leer ni escribir datos

### 3.4 Límites de Seguridad
- ❌ No hay forma de "recuperar acceso" si se pierde el código (el creador puede volver a compartir el enlace desde Alertas)
- ❌ No hay control por usuario (quién hizo cada gasto)
- ✅ Extremadamente simple para el uso diario (abres y ya)

---

## 💾 4. Modelo de Datos (Firestore)

### Colección: `groups`

```typescript
/groups/{groupId}/
  ├── info: {
  │     createdAt: timestamp,
  │     name: string,            // ej: "Gastos Casa"
  │     budgetAmount: number,    // Meta del período (opcional)
  │     budgetCutoffDay: number  // Día de corte del mes (opcional)
  │   }
  └── transactions/
        └── {transactionId}: {
              date: timestamp,        // Fecha del gasto
              amount: number,         // Monto en MXN
              description: string,    // Ej: "Súper semanal"
              createdAt: timestamp,   // Cuándo se registró
              deviceId: string,       // ID del dispositivo que lo creó
              updatedAt?: timestamp   // Última modificación
            }
```

---

## 📱 5. Pantallas (UI)

### 5.1 Dashboard (Inicio)
- **SALDO TOTAL** (gastado este mes) + **Disponible** (verde/rojo)
- Acciones rápidas circulares: **Registrar · Simular · Pagos · Crédito**
- **PUEDES GASTAR ESTE FIN DE SEMANA** con rollover (fin de semana actual / total, presupuesto por fin de semana — se divide entre los fines de semana reales del período, 4 o 5; el sobrante de períodos anteriores se suma completo al siguiente fin de semana)
- **ACTIVIDAD** — últimos 3 gastos con avatar por comercio + "Ver todo"
- Barra de navegación flotante (píldora): Inicio · Actividad · Alertas

### 5.2 Registrar / Editar Gasto
- Monto (teclado del sistema) · Descripción · Fecha (por defecto hoy)
- Modo edición (mismo formulario, con `?edit=id`): prellenado + "Guardar cambios"
- Botón outline "Registrar gasto" / "Guardar cambios"

### 5.3 Actividad (Historial)
- Filtro por mes + **búsqueda por descripción**
- Lista virtualizada con FlashList, agrupada por día (Hoy / Ayer / fecha)
- Swipe izquierdo: **botón verde "Editar"** + **botón rojo "Eliminar"** (confirmación en modal oscuro)
- Resumen "GASTADO EN {MES}"

### 5.4 Alertas (Código del grupo)
- Muestra el **código del grupo** y el nombre del grupo
- Botón **"Copiar enlace"** (copia `santander-fiesta://join/{código}`)
- Botón **"Compartir por WhatsApp"**
- Reemplaza las alertas automáticas y la configuración

### 5.5 Crédito (Presupuesto)
- Formulario directo: monto por período + día de corte (1-31)
- Campo opcional **Sobrante acumulado**: corrige el sobrante del período actual; al terminar el período se le suma lo no gastado y el cálculo continúa automático (corrección de una sola vez)
- Se abre desde el Inicio (acción rápida)

### 5.6 Pagos (Reparto Omar/Isa)
- Se abre desde el Inicio (acción rápida circular **Pagos**)
- Pestañas **Isa** (siempre primero) y **Omar**
- **Regla fija:** Omar cubre los primeros **$1,000** de gasto de cada período; **Isa** cubre el restante (todo lo que supere los $1,000)
- Los montos se calculan sobre el gasto acumulado del período actual (corte a corte)

---

## 🎨 6. Tema Visual

> ⚠️ **Actualizado:** la app migró a **Design System v2 — Dark mode estilo banca** (ver `Design.md`): fondo `#000000`, superficies `#1C1C1E`, acento rojo `#FF3B30`, verde `#2EA071`, borde sutil de cards, glow ambiental.

---

## ⚡ 7. Sincronización en Tiempo Real

1. Ambos celulares se conectan a la **misma colección en Firestore**
2. Cuando un celular **crea/edita/elimina** un gasto, Firestore notifica al otro automáticamente
3. El otro celular **actualiza su UI en tiempo real** sin hacer nada

### Manejo de conflictos
- **Last-Write-Wins** — para 2 personas los conflictos son extremadamente raros

### Offline
- Firebase Firestore tiene **persistencia offline nativa** — los cambios se guardan localmente y sincronizan al recuperar conexión

---

## 🛠️ 8. Flujo de Instalación

### Para desarrollo
```bash
git clone <url>
cd SantanderFiestaAwards
pnpm install
# google-services.json en la raíz (Firebase Console)
npx expo run:android
```

### Para los 2 celulares
1. Generar **APK firmada** con EAS Build
2. Instalar en ambos celulares
3. En el primer celular: la app genera un **código de grupo**
4. Abrir **Alertas** → **"Compartir por WhatsApp"** → enviar el enlace al otro celular
5. El otro celular toca el enlace → se une al grupo automáticamente
6. ✅ **Listo** — ambos ven los mismos gastos

---

## 📐 9. Decisiones Técnicas Clave

| Decisión | Opción elegida | ¿Por qué? |
|:---------|:---------------|:----------|
| **Backend** | Firebase Firestore | Tiempo real nativo + offline automático + sin servidor propio |
| **Auth** | Sin autenticación | Código de grupo seguro (16 chars) + enlace de invitación |
| **Seguridad** | App Check (Play Integrity) — *pendiente* | Protege la BD sin complicar la experiencia |
| **Compartir** | Enlace `santander-fiesta://join/{código}` | Un solo toque para unirse, vía WhatsApp |
| **Offline** | Firestore persistence | Sincronización automática cuando hay conexión |
| **Build** | EAS Build + APK | Distribución directa sin pasar por Google Play (si se desea) |

---

## 🚀 10. Próximos Pasos

- [x] Pantallas core: Inicio, Registrar, Actividad, Crédito
- [x] Sincronización en tiempo real
- [x] Editar y eliminar gastos
- [x] Búsqueda en el historial
- [x] Código de grupo seguro + compartir por WhatsApp (deep link)
- [x] Pantalla Pagos con reparto Omar/Isa (primeros $1,000 para Omar, restante para Isa)
- [ ] **Configurar App Check** (Play Integrity) en Firebase
- [ ] Probar deep link `santander-fiesta://join/{código}` en 2 dispositivos
- [ ] Build y prueba final en 2 dispositivos

---

> 📝 *Este documento es vivo — se actualizará a medida que tomemos decisiones.*

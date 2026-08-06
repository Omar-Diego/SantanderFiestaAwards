# 🎨 Santander Fiesta Awards — Design System (v2 · Dark Mode)

> *Documento vivo de diseño — define el look & feel de la app.*
> *Referencia visual: **Revolut** (app bancaria) en modo oscuro — de ahí salió la barra de navegación y las cards.*
> *Se actualiza en cada sesión de rediseño.*

> ⚙️ **Instrucción permanente del cliente:** para CUALQUIER cambio visual en esta app, cargar y aplicar la skill de diseño (**frontend-design**) antes de editar.

## 📌 Preferencias de diseño del cliente (no hay que repetirlas en cada sesión)

- **Siempre** usar las skills de diseño para cambios visuales (petición explícita del cliente).
- Dark mode estilo banca Santander: fondo `#000000`, superficies `#1C1C1E`, acento rojo `#FF3B30`, verde `#2EA071`.
- **Espaciado simétrico:** la distancia de un elemento a los bordes de su contenedor debe ser uniforme (igual en todos los lados). Preferir insets uniformes (ej. `margin: 6`) sobre medidas fijas por contenido.
- La navbar es una **píldora flotante** con cápsula activa de gap uniforme (ver sección 4.6).
- **Botones de acción: estilo outline unificado** — fondo transparente, borde rojo Santander, icono **sin fondo** (igual al botón "Editar presupuesto"). Ningún botón de acción lleva fondo rojo sólido.
- El cliente aprueba iterando sobre la app real: cambios pequeños, verificables, uno a la vez.

---

## 🧭 1. Dirección de Diseño

**Objetivo:** estilo **Revolut** en modo oscuro — app bancaria premium:

- **Fondo negro puro** `#000000` en toda la interfaz (sin marcos ni bordes blancos externos)
- **Glow ambiental sutil:** gradientes radiales de baja opacidad (rojo/morado) detrás del balance
- **Tipografía moderna sans-serif** con alto contraste
- **Acentos:** rojo brillante (marca Santander) + verde brillante (dinero disponible)
- **Superficies:** gris muy oscuro `#1C1C1E` con **borde sutil** `rgba(255,255,255,0.08)` en cards
- **Íconos de comercio:** círculos de color (inicial del comercio, color determinista por descripción)
- **Acciones rápidas circulares** con label debajo (patrón Revolut)
- Esquinas muy redondeadas (píldoras y tarjetas de ~16px)

---

## 🎨 2. Paleta de Colores

| Token | Hex | Uso |
|:------|:----|:----|
| `background` | `#000000` | Fondo general de pantalla (negro puro) |
| `surface` | `#1C1C1E` | Tarjetas, widgets, bottom nav (gris muy oscuro) |
| `surfaceElevated` | *(a definir)* | Superficies elevadas sobre `surface` |
| `red` | `#FF2E2E` *(ajustar)* | Acento Santander: avatar, enlaces "See all", alertas |
| `green` | `#2EA071` | Valor "Available" (alternativa `#00E676`) |
| `textPrimary` | `#FFFFFF` | Títulos, montos principales |
| `textSecondary` | `#8E8E93` *(gris medio)* | Subtítulos, textos descriptivos |
| `textMuted` | `#6B6B6B` | Etiquetas de bajo énfasis |
| `divider` | `#2C2C2E` *(gris oscuro)* | Línea divisoria horizontal |
| `borderSubtle` | `rgba(255,255,255,0.08)` | Borde sutil de cards estilo Revolut |
| `pillBackground` | `#3A3A3C` *(gris oscuro)* | Fondo de pills como "MXN" |

> ⚠️ **Nota:** los hex de rojo, gris medio y divider están propuestos; se ajustarán contra la referencia visual exacta.

---

## 🔤 3. Tipografía

- **Familia:** sans-serif moderna del sistema (SF / Roboto según plataforma)
- **Principio:** alto contraste, jerarquía clara, pesos semibold/bold para datos

| Estilo | Tamaño | Peso | Uso |
|:-------|:-------|:-----|:----|
| Balance | ~40–48 | Bold | Monto principal ("$0.00") |
| Monto widget | ~24 | Bold | Valores de widgets ("$2,000.00") |
| Título sección | ~18–20 | Bold | "Recent activity" |
| Título cuenta | ~16 | SemiBold/Bold | "Santander LikeU" |
| Body | ~15–16 | Regular | Texto general |
| Etiqueta pequeña | ~12–13 | Regular | "Spent this month", "Available", subtítulos |

---

## 📱 4. Componentes — Pantalla Principal (Home / Dashboard)

Estructura vertical de la pantalla principal:

### 4.1 Encabezado (Logo Santander)
```
        [ logo Santander en círculo blanco ]
```
- **Avatar circular con fondo blanco** (`#FFFFFF`) con el **logo de Santander** centrado dentro (asset `assets/SantanderLogo.png`)
- **Sin** barra de búsqueda ni botones laterales — el header es solo el logo

### 4.2 Balance Central
- Todo el bloque **centrado horizontalmente**
- Label pequeño: **"SALDO TOTAL"** — gris claro (ya sin referencia a la tarjeta)
- Monto principal: **gastado este mes** — blanco, grande, negrita
- **"Disponible: $X"** — verde si sobra presupuesto, rojo si te pasas, gris sin presupuesto
- ~~Botón píldora "Presupuesto"~~ — **eliminado**: se llega a Crédito desde la acción rápida
- Detrás del balance: **glow ambiental** (gradientes radiales rojo/morado de baja opacidad)

### 4.3 Acciones Rápidas (Quick Actions)
- Fila de **4 botones circulares** `#1C1C1E` (borde sutil), icono + label debajo:
  **Registrar (+)** · **Historial (lista)** · **Presupuesto (gráfica)** · **Alertas (campana)**

### 4.4 Tarjeta de Actividad
- Card `#1C1C1E` con **borde sutil** `rgba(255,255,255,0.08)`, radio 16px
- Cada gasto: **círculo de color del comercio** (color determinista por descripción) con la **inicial** en blanco · descripción bold + fecha gris · monto blanco a la derecha
- **"Ver todo"** centrado abajo (rojo) → Actividad
- Estado vacío: icono receipt gris + **"No hay gastos este mes"**

### 4.5 Tarjeta Período (Próximo)
- Card con **"PERÍODO"** + rango del período (ej. "19 jul – 18 ago")
- Pill a la derecha: **"Corte el 01/09"** (día de corte del presupuesto) · "Define presupuesto" si aún no hay meta

### 4.6 Barra de Navegación Inferior (Floating Pill Nav)
- Contenedor **flotante tipo píldora** (extremos totalmente redondeados) `#1C1C1E`, con margen lateral y sombra
- **4 pestañas** equitativas: icono lineal arriba + texto debajo
  | Pestaña | Ícono | Estado |
  |:--------|:------|:-------|
  | **Inicio** | Casa (rellena cuando está activa) | Activa: **cápsula gris más claro** `#2C2C2E` alrededor de icono + texto, todo en blanco |
  | **Crédito** | Gráfica con flecha arriba | Inactiva: gris |
  | **Actividad** | Lista con viñetas | Inactiva: gris |
  | **Alertas** | Campana | Inactiva: gris |
- ~~Botón flotante "+" rojo~~ — **eliminado**: registrar gasto se hace desde la acción rápida **Registrar** del Home (o navegando a `/add`)

---

## 🧩 4.7 Sistema unificado de pestañas (todas las pantallas)

Todas las pestañas comparten la identidad del Home:

- **Componentes compartidos** en `src/components/`:
  - `AmbientGlow` — glow ambiental (SVG con IDs únicos por instancia); Home lo usa a intensidad 1.0, las demás a 0.7–0.8 para que el Home siga siendo el hero
  - `TabHeader` — círculo blanco con logo Santander + título + subtítulo opcional (usado en Crédito, Actividad, Alertas y Nuevo gasto)
  - `PrimaryButton` — botón de acción **outline unificado por defecto** (fondo transparente, borde rojo, icono sin fondo; prop `compact`), con icono opcional
- **Una acción esencial por pantalla** (protagonismo en rojo Santander, siempre estilo outline):
  | Pantalla | Acción esencial |
  |:---------|:----------------|
  | Inicio | Acciones rápidas circulares (Registrar, Historial, Presupuesto, Alertas) |
  | Actividad | Botón **Registrar gasto** (outline, ancho completo) bajo el resumen del mes |
  | Crédito | Botón **Editar presupuesto** (outline) bajo la tarjeta resumen / **GUARDAR PRESUPUESTO** (outline) en el formulario |
  | Alertas | CTA **Ir a Crédito / Ver presupuesto** (botón outline dentro de la tarjeta de alerta) |
  | Nuevo gasto | Botón **REGISTRAR GASTO** (outline, ancho completo) |
- **Resumen prominente por pantalla:** tarjeta centrada con label + monto grande (Actividad: "GASTADO EN {MES}"; Crédito: "TE QUEDA"; Alertas: "DISPONIBLE EN EL PERÍODO")
- Formulario de **Crédito**: **sin card** — directo sobre el fondo de la app; teclado numérico puro (solo dígitos, sin símbolos +/−)
- Formulario de **Nuevo gasto**: secciones dentro de **cards** `#1C1C1E` con borde sutil
- **Lista de gastos en Actividad: SIN card envolvente** — cada gasto es **su propia card** (`#1C1C1E`, borde sutil), agrupadas por fecha con encabezados **Hoy / Ayer / "Lunes 12 de agosto"** (mismo patrón que la lista de Crédito)

---

## 🗺️ 5. Mapeo a las Pantallas de la App (propuesta)

| Diseño nuevo | Pantalla actual | Notas |
|:-------------|:----------------|:------|
| **Inicio** | Dashboard (`dashboard.tsx`) | Balance → "Spent this month"; widgets → presupuesto/restante |
| **Crédito** | Presupuesto (`budget.tsx`) | Reinterpreta "límite de crédito" → presupuesto del grupo |
| **Actividad** | Historial (`history.tsx`) | Lista de gastos con "Ver todo" |
| **Alertas** | `alerts.tsx` | Alertas de presupuesto (excedido / cerca del límite / sin presupuesto) |
| *(sin mapeo)* | Registrar gasto (`add.tsx`) | Se mantiene como botón de acción central o modal |

> ⚠️ **Pendiente de definir:** cómo entra la pantalla de **Registrar gasto** en la nav flotante de 4 pestañas (¿botón central?, ¿desde Home?), y qué pasa con la pantalla de **grupo/código** (`index.tsx`).

---

## 🔄 6. Migración de Tokens (antes → después)

| Token viejo (blanco y dorado) | Token nuevo (dark) |
|:------------------------------|:-------------------|
| `gold: #C8A84E` | → `red` (acento) |
| `goldLight: #E8D49E` | → *(eliminar)* |
| `goldDark: #A68A3E` | → *(eliminar)* |
| `background: #F5F5F0` | → `#000000` |
| `surface: #FFFFFF` | → `#1C1C1E` |
| `textPrimary: #1A1A1A` | → `#FFFFFF` |
| `textSecondary: #6B6B6B` | → `#8E8E93` |
| `success: #2E7D32` | → `#2EA071` |
| `error: #C62828` | → rojo brillante |
| `divider: #EFEBE3` | → `#2C2C2E` |

---

## 📌 7. Decisiones Abiertas / Pendientes

- [ ] Ajustar hex exactos de rojo, verde y grises contra referencia visual
- [ ] Definir estado "con datos" de Recent activity (rows de transacciones en dark)
- [ ] Definir diseño de las pantallas internas (Registrar, Historial, Presupuesto) en dark
- [ ] Integrar pantalla de grupo/código (`index.tsx`) al nuevo estilo
- [ ] Definir micro-interacciones y animaciones del rediseño
- [ ] Actualizar `INIT.md` y `REQUERIMIENTOS.md` con la nueva dirección de diseño

---

*Documento vivo — se actualizará a medida que avance el rediseño en esta sesión.*

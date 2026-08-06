# 🎨 Santander Fiesta Awards — Design System (v2 · Dark Mode)

> *Documento vivo de diseño — define el look & feel de la app.*
> *Referencia visual: app de banca Santander en modo oscuro (estilo "Santander LikeU").*
> *Se actualiza en cada sesión de rediseño.*

> ⚙️ **Instrucción permanente del cliente:** para CUALQUIER cambio visual en esta app, cargar y aplicar la skill de diseño (**frontend-design**) antes de editar.

## 📌 Preferencias de diseño del cliente (no hay que repetirlas en cada sesión)

- **Siempre** usar las skills de diseño para cambios visuales (petición explícita del cliente).
- Dark mode estilo banca Santander: fondo `#000000`, superficies `#1C1C1E`, acento rojo `#FF3B30`, verde `#2EA071`.
- **Espaciado simétrico:** la distancia de un elemento a los bordes de su contenedor debe ser uniforme (igual en todos los lados). Preferir insets uniformes (ej. `margin: 6`) sobre medidas fijas por contenido.
- La navbar es una **píldora flotante** con cápsula activa de gap uniforme (ver sección 4.6).
- El cliente aprueba iterando sobre la app real: cambios pequeños, verificables, uno a la vez.

---

## 🧭 1. Dirección de Diseño

**Objetivo:** abandonar el tema claro "blanco y dorado" y adoptar un **modo oscuro tipo app bancaria premium**:

- **Fondo negro puro** `#000000` en toda la interfaz (sin marcos ni bordes blancos externos)
- **Tipografía moderna sans-serif** con alto contraste
- **Acentos:** rojo brillante (marca Santander) + verde brillante (dinero disponible)
- **Superficies:** gris muy oscuro `#1C1C1E` para tarjetas y contenedores flotantes
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

### 4.1 Encabezado de la Cuenta (Top Bar)
```
[🟥S]  Santander LikeU        [ MXN ]
       •• 4521
```
- **Izquierda — Avatar:** cuadro con esquinas muy redondeadas, **rojo brillante**, letra **"S" mayúscula blanca** en el centro (estilo Santander)
- **Centro-Izquierda — Info de cuenta:**
  - Título: **"Santander LikeU"** — blanco, tamaño mediano, semibold/bold
  - Subtítulo: **"•• 4521"** — gris medio, pequeño
- **Derecha — Moneda:** pill-button (cápsula) gris oscura con texto **"MXN"** blanco, pequeño

### 4.2 Bloque Principal de Balance ("Spent this month")
- Todo el bloque **centrado horizontalmente**
- Etiqueta superior: **"Spent this month"** — gris claro, fuente pequeña
- Monto principal: **"$0.00"** — blanco, fuente grande, limpia, negrita
- Límite: **"0% of $2,000.00 limit"** — gris claro, fuente pequeña, justo debajo del monto

### 4.3 Tarjetas de Información Rápida (Widgets en par)
- Fila horizontal con **dos cajas flotantes**: fondo `#1C1C1E`, esquinas redondeadas **~16px**
- **Widget izquierdo — Available:**
  - Título: "Available" — gris claro, pequeño
  - Valor: "$2,000.00" — grande, negrita, **verde brillante** (`#2EA071` / `#00E676`)
- **Widget derecho — Payment due:**
  - Título: "Payment due" — gris claro, pequeño
  - Valor: "05/07" — grande, negrita, **blanco**

### 4.4 Línea Divisoria
- Línea horizontal tenue **gris oscuro** que separa los widgets de la siguiente sección

### 4.5 Sección de Actividad Reciente ("Recent activity")
- **Encabezado:** "Recent activity" — blanco, mediano-grande, negrita (izquierda) · **"See all"** — enlace rojo brillante (derecha)
- **Estado vacío (Empty State):**
  - Icono centrado: **ticket/receipt en line art**, gris medio
  - Texto: **"No expenses yet this month"** — centrado, gris claro, debajo del icono

### 4.6 Barra de Navegación Inferior (Floating Pill Nav)
- Contenedor **flotante tipo píldora** (extremos totalmente redondeados) `#1C1C1E`, con margen lateral y sombra
- **4 pestañas** equitativas: icono lineal arriba + texto debajo
  | Pestaña | Ícono | Estado |
  |:--------|:------|:-------|
  | **Inicio** | Casa (rellena cuando está activa) | Activa: **cápsula gris más claro** `#2C2C2E` alrededor de icono + texto, todo en blanco |
  | **Crédito** | Gráfica con flecha arriba | Inactiva: gris |
  | **Actividad** | Lista con viñetas | Inactiva: gris |
  | **Alertas** | Campana | Inactiva: gris |
- Botón flotante **"+" rojo** (Registrar gasto) sobre la barra, a la derecha

---

## 🗺️ 5. Mapeo a las Pantallas de la App (propuesta)

| Diseño nuevo | Pantalla actual | Notas |
|:-------------|:----------------|:------|
| **Inicio** | Dashboard (`dashboard.tsx`) | Balance → "Spent this month"; widgets → presupuesto/restante |
| **Crédito** | Presupuesto (`budget.tsx`) | Reinterpreta "límite de crédito" → presupuesto del grupo |
| **Actividad** | Historial (`history.tsx`) | Lista de gastos con "See all" |
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

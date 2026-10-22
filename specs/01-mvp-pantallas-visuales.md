# SPEC 01 — MVP visual de Arcade Vault (5 pantallas)

> **Estado:** Aprobado
> **Depende de:** ninguna (el tema y las fuentes ya están en `app/globals.css` y `app/layout.tsx`)
> **Fecha:** 2026-10-22
> **Objetivo:** Implementar en Next.js las 5 pantallas del prototipo `references/templates/` (auth, biblioteca, detalle, reproductor, salón de la fama) como UI pura con datos ficticios y sin ningún juego real.

## Por qué existe esta spec

El prototipo vive en HTML/JSX con estado y hash como router. Esta spec lo traduce al modelo de Next.js (rutas reales, Server/Client Components, Cache Components) y deja la capa de datos aislada en `app/data/` para que luego se sustituya por una base de datos sin tocar las pantallas.

## Alcance

**Dentro:**

- Rutas reales con App Router:
  - `/` — Biblioteca (hero, buscador, chips de categoría, grid de tarjetas).
  - `/juegos/[id]` — Detalle (portada, tags, stats, leaderboard top 10).
  - `/juegos/[id]/jugar` — Reproductor (HUD, marco CRT, arena decorativa, pausa, modal de fin de juego).
  - `/salon` — Salón de la Fama (tabs por juego, podio, tabla, fila "tu mejor marca" si hay sesión).
  - `/auth` — Iniciar sesión / Crear cuenta.
- Layout global: `Nav` (logo, links, contador "CRÉDITOS · 03", botón de sesión, hamburguesa y panel móvil), footer y fondo (`av-bg`, `av-noise`), responsive.
- Capa de datos ficticia en `app/data/` con tipos y funciones async.
- Sesión simulada con `AuthProvider` (React context) persistida en `localStorage`.
- Reproductor con puntaje simulado, vidas y nivel decorativos, pausa/reanudar, FIN, salir y modal de game over con "Guardar puntuación" (solo estado de UI).
- Estilos: se mantiene `app/globals.css` (revisable si hace falta); todo lo demás con utilidades Tailwind.
- Textos en español, igual que el prototipo.

**Fuera de alcance (para otras specs):**

- Cualquier juego jugable (lógica, canvas, input, física).
- Autenticación real, OAuth (los botones Google/GitHub son inertes), validación de formularios, recuperación de contraseña.
- Base de datos, route handlers o API.
- Persistir puntuaciones guardadas; el salón no muestra marcas del usuario real.
- Créditos reales (el contador es estático) y perfil de usuario.
- Tests automatizados (el proyecto no tiene runner).

## Modelo de datos

Todo vive en `app/data/`. Los datos salen de los mocks de `references/templates/data.jsx`.

```ts
// app/data/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;          // slug: "bloque-buster", "caida", ...
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;       // clase CSS: "cover-bricks", "cover-tetro", ...
  color: GameColor;
  best: number;
  plays: string;       // "12.4K"
};

export const CATEGORIES = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;
export async function getGames(): Promise<Game[]>;
export async function getGameById(id: string): Promise<Game | undefined>;

// app/data/scores.ts
export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date: "DD/MM/2026"
export async function getScores(gameId: string, count?: number): Promise<ScoreRow[]>;
// Generador determinista (seededScores del prototipo): mismo gameId => mismas filas.
```

```ts
// app/components/auth-provider.tsx (client)
type SessionUser = { name: string };       // mayúsculas, máx. 10 caracteres
// Clave localStorage: "av_user" -> JSON de SessionUser | null
// useAuth(): { user: SessionUser | null; login(u: SessionUser | null): void; logout(): void }
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`.
- Las funciones de `app/data/` son `async` aunque hoy no lo necesiten, para que el cambio a BD no altere a los consumidores.

## Plan de implementación

1. **Datos.** Crear `app/data/games.ts` y `app/data/scores.ts` (tipos, los 8 juegos, `getGames`, `getGameById`, `getScores` determinista). Verificación: `pnpm lint` y `pnpm build` pasan.
2. **Sesión.** Crear `app/components/auth-provider.tsx` con `AuthProvider` y `useAuth`, leyendo `av_user` de `localStorage` sin romper la hidratación (valor inicial `null`, lectura en efecto/`useSyncExternalStore`).
3. **Layout global.** Crear `Nav` (client, con panel móvil) y `Footer`; montarlos junto al `AuthProvider` en `app/layout.tsx` dentro de `av-root`. El link activo se deriva de `usePathname()`. Verificación: `pnpm dev`, el nav aparece en `/` y en un 404.
4. **Biblioteca (`/`).** Reemplazar `app/page.tsx`. Hero + componente client `LibraryBrowser` (búsqueda + chips) + `GameCard` con tilt al pasar el mouse y estado "NO HAY RESULTADOS". Las tarjetas enlazan a `/juegos/[id]`.
5. **Detalle (`/juegos/[id]`).** Página que resuelve `params` como promesa, llama a `notFound()` si el id no existe, y renderiza portada, tags, stats y leaderboard. Los botones enlazan a `/juegos/[id]/jugar` y `/`. Definir `generateStaticParams` o `<Suspense>` según exija Cache Components.
6. **Salón (`/salon`).** Tabs por juego, podio top 3, tabla con animación escalonada y fila "tu mejor marca" visible solo con sesión. El juego activo se refleja en el query param `?juego=<id>` (por defecto, el primero).
7. **Auth (`/auth`).** Pestañas "Iniciar sesión / Crear cuenta" (el campo email solo en la segunda), submit que llama a `login({ name })` con `(usuario || "PLAYER1")` en mayúsculas y máx. 10 caracteres y redirige a `/`; botón "Jugar como invitado" (`login(null)` y redirige a `/`); botones sociales inertes.
8. **Reproductor (`/juegos/[id]/jugar`).** Componente client con HUD (jugador, puntuación, vidas, nivel), marco CRT con arena decorativa, puntaje simulado por intervalo, PAUSA/REANUDAR con overlay, FIN, SALIR (a `/juegos/[id]`) y modal de game over (guardar muestra "PUNTUACIÓN GUARDADA_" sin persistir; "Jugar de nuevo" reinicia; "Volver al Vault" va a `/`).
9. **Pulido responsive.** Revisar las 5 pantallas en ancho móvil (≈390px), tablet y desktop; ajustar `globals.css` solo si falta alguna clase del prototipo (por ejemplo las portadas `cover-*`).

## Criterios de aceptación

- [ ] `pnpm lint` y `pnpm build` terminan sin errores.
- [ ] Existen las rutas `/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/salon` y `/auth`; todas cargan sin errores en consola.
- [ ] `/juegos/inexistente` y `/juegos/inexistente/jugar` muestran la página 404.
- [ ] `/` muestra los 8 juegos; escribir "caí" deja solo CAÍDA; el chip SHOOTER deja INVASORES y ROCAS; una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Hacer clic en una tarjeta o en su botón JUGAR navega a `/juegos/<id>`.
- [ ] El detalle muestra título, descripción larga, 4 tags, Partidas / Mejor global / Dificultad y 10 filas de leaderboard con las 3 primeras destacadas; "JUGAR AHORA" lleva a `/juegos/<id>/jugar` y "VOLVER AL VAULT" a `/`.
- [ ] El leaderboard de un mismo juego es idéntico en cada recarga (datos deterministas).
- [ ] `/salon` muestra una tab por cada uno de los 8 juegos; cambiar de tab cambia podio y tabla; recargar con `?juego=caida` abre esa tab.
- [ ] En `/auth`, la pestaña "Crear cuenta" muestra el campo de correo y "Iniciar sesión" lo oculta.
- [ ] Enviar el formulario de `/auth` con usuario "px_kai" redirige a `/` y el nav muestra "PX_KAI"; sin usuario muestra "PLAYER1".
- [ ] Tras iniciar sesión, recargar la página mantiene el nombre en el nav (clave `av_user`); al cerrar sesión desaparece y el nav vuelve a "Iniciar Sesión".
- [ ] "Jugar como invitado" redirige a `/` y el nav muestra "Iniciar Sesión".
- [ ] `/salon` muestra la fila "TU MEJOR MARCA" solo cuando hay sesión.
- [ ] En el reproductor, la puntuación aumenta sola; PAUSA la detiene y muestra "EN PAUSA"; REANUDAR la retoma; SALIR vuelve a `/juegos/<id>`.
- [ ] FIN abre el modal con la puntuación final; "GUARDAR PUNTUACIÓN" muestra "PUNTUACIÓN GUARDADA_"; "JUGAR DE NUEVO" reinicia puntos, vidas y nivel; "VOLVER AL VAULT" va a `/`.
- [ ] A 390px de ancho no hay scroll horizontal; el nav muestra la hamburguesa y esta abre/cierra el panel móvil con links a Biblioteca, Salón y Auth.
- [ ] Footer y fondo (grid/scanlines/ruido) aparecen en todas las pantallas.
- [ ] Ninguna pantalla importa datos desde `references/`; todo viene de `app/data/`.

## Decisiones

- **Sí:** rutas reales de App Router en lugar de estado + hash. Es el modelo de Next, da URLs compartibles y permite prefetch con `<Link>`.
- **No:** replicar el router por hash del prototipo. Va contra el framework.
- **Sí:** `app/data/` con funciones `async` y tipos. Permite sustituir los mocks por consultas a BD sin tocar las pantallas.
- **No:** route handlers/API para los mocks. Complejidad innecesaria en un MVP visual.
- **Sí:** sesión simulada con context + `localStorage` (`av_user`), igual que el prototipo. Nav, salón y reproductor la comparten.
- **No:** auth real ni OAuth. Merece su propia spec.
- **Sí:** mantener `app/globals.css` (ya porta el tema y las clases del prototipo) y usar Tailwind para lo nuevo; se puede editar si hace falta.
- **No:** reescribir todo el CSS con Tailwind ni usar CSS Modules. Riesgo de desviarse del diseño.
- **Sí:** reproductor con HUD y puntaje simulados como en el prototipo, para validar el diseño del flujo completo.
- **No:** guardar puntuaciones en `localStorage` ni mostrarlas en el salón. Se hará cuando exista backend.
- **Sí:** tab activa del salón en `?juego=` para que sea compartible. Es un añadido menor respecto al prototipo, que la guardaba en estado.
- **Sí:** nav completo con panel móvil, contador de créditos estático, footer y fondo, responsive.
- **Sí:** componentes compartidos en `app/components/`. Convención propia de esta spec; el usuario no la fijó.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `cacheComponents` exige que el acceso a datos dinámicos (`params`, `searchParams`) esté dentro de `<Suspense>` o se prerenderice con `generateStaticParams`. | Leer `node_modules/next/dist/docs/` antes de implementar (paso 3 en adelante); usar `generateStaticParams` con los ids de `getGames()` y `<Suspense>` donde haga falta. |
| Desajuste de hidratación al leer `localStorage` en el primer render. | Valor inicial `null` en el servidor y el primer render del cliente; leer `av_user` en efecto o con `useSyncExternalStore`. |
| Faltan en `globals.css` clases del prototipo (portadas `cover-*`, animaciones). | El paso 9 compara contra `references/templates/styles.css` y se completa lo que falte. |
| `localStorage` bloqueado (modo privado). | Envolver lectura/escritura en `try/catch`; la sesión vive solo en memoria si falla. |
| Next.js 16.4.2 / React 19.3 difieren de lo que conoce el modelo. | Usar `PageProps<"/juegos/[id]">` y `LayoutProps` globales y consultar las guías del paquete antes de escribir código. |

## Qué **no** está en esta spec

- Ningún juego jugable (ni lógica, ni input, ni canvas).
- Autenticación o usuarios reales, ni OAuth con Google/GitHub.
- Base de datos, API o route handlers.
- Persistencia de puntuaciones ni ranking real.
- Créditos funcionales, perfil de usuario o ajustes.
- Tests automatizados.

Cada uno de estos puntos, si se aborda, va en su propia spec.

# Guía del proyecto

Aquí explicamos cómo está hecho el backoffice y dónde se ve cada punto del seminario de React en el
código. Para instalarlo y arrancarlo, mira el [README](README.md). Es la versión en React del backoffice de
Angular del Seminario 6, así que al final hay una [tabla de equivalencias](#9-de-angular-a-react).

## Índice

1. [Introducción y setup](#1-introducción-y-setup)
2. [Fundamentos: JSX/TSX, componentes y props](#2-fundamentos-jsxtsx-componentes-y-props)
3. [Reactividad y estado local](#3-reactividad-y-estado-local)
4. [Efectos y comunicación con el exterior](#4-efectos-y-comunicación-con-el-exterior)
5. [Estado global](#5-estado-global)
6. [Navegación y rutas](#6-navegación-y-rutas)
7. [Hooks que no pueden faltar (cheat sheet)](#7-hooks-que-no-pueden-faltar-cheat-sheet)
8. [Cuestionario de validación React](#8-cuestionario-de-validación-react)
9. [De Angular a React](#9-de-angular-a-react)

---

## 1. Introducción y setup

### Qué es React

React es una **librería** para construir interfaces con componentes. Angular, en cambio, es un **framework**:
ya trae router, formularios, cliente HTTP, inyección de dependencias... React solo se ocupa de pintar la
pantalla, y lo demás se elige: aquí `react-router-dom` para las rutas, `fetch` para las peticiones y
Nanostores para el estado global.

**Declarativo frente a imperativo.** Con el DOM "a mano" (imperativo) se dan órdenes paso a paso:
*crea un `<tr>`, ponle este texto, añádelo a la tabla*. Con React (declarativo) se describe cómo tiene que verse
la pantalla para unos datos concretos y React se encarga de llegar hasta ahí:

```tsx
// Si cambia la lista de autores, la tabla se vuelve a describir y React hace los cambios
{pageItems.map((author) => (
  <tr key={author._id}>...</tr>
))}
```

### Virtual DOM

Tocar el DOM real es lento. React guarda en memoria una copia ligera del DOM (el **Virtual DOM**). Cuando
cambia el estado de un componente:

1. React vuelve a ejecutar el componente y obtiene un Virtual DOM nuevo.
2. El **reconciliador** compara el nuevo con el anterior (*diffing*).
3. Solo cambia en el DOM real las partes que son distintas.

Por eso es rápido, y por eso las listas necesitan una `key`: es lo que usa el reconciliador para saber
qué fila es cuál ([apartado 2](#2-fundamentos-jsxtsx-componentes-y-props)).

### CSR y SPA

Este proyecto es **CSR** (Client-Side Rendering) y **SPA** (Single Page Application). El `index.html` solo trae
un `<div id="root">` vacío y el JavaScript de React pinta todo en el navegador:

```tsx
// src/main.tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

Solo hay un `index.html`: al pasar de Autores a Libros la página no se recarga, el router cambia el
componente que se ve ([apartado 6](#6-navegación-y-rutas)). Para verlo en clase: "Ver código fuente" (Ctrl+U)
enseña el `<div id="root">` vacío, e "Inspeccionar" (F12) enseña la tabla ya pintada.

`StrictMode` es una ayuda solo para desarrollo: monta cada componente dos veces para encontrar efectos mal
escritos ([apartado 4](#4-efectos-y-comunicación-con-el-exterior)). En producción no hace nada.

### Instalación y ejecución: Vite

Hoy el estándar es **Vite** (`create-react-app` está abandonado). Este proyecto se creó con:

```
npm create vite@latest EA-Seminari7-React-BackOffice -- --template react-ts
```

Y se usa con `npm run dev` (servidor con recarga al guardar), `npm run build` y `npm test`. La
lista completa está en el [README](README.md#scripts).

### Estructura del proyecto

| Carpeta | Qué hay |
|---|---|
| `public/` | Ficheros estáticos que se sirven tal cual (el favicon) |
| `src/components/` | Los componentes: pantallas y piezas reutilizables |
| `src/hooks/` | Hooks propios (`useApiList`, `useApiPage`, `useListControls`, `useForm`) |
| `src/services/` | La capa de servicio: las llamadas a la API |
| `src/context/` y `src/stores/` | Estado global |
| `src/models/`, `src/utils/`, `src/config/` | Tipos, funciones sueltas y ajustes |

La URL de la API está en un solo fichero, `src/config/environment.ts`.

## 2. Fundamentos: JSX/TSX, componentes y props

### JSX y TSX

JSX es la sintaxis que mezcla HTML dentro de JavaScript; TSX es lo mismo con TypeScript (por eso los ficheros
terminan en `.tsx`). Las reglas de oro:

- **Un solo elemento padre.** Si no se quiere añadir un `<div>` de más, se usa un *Fragment* `<>...</>`
  (por ejemplo en `Layout.tsx` y en `AuthorsList.tsx`).
- **Atributos en camelCase:** `className` (no `class`), `onClick`, `colSpan`, `htmlFor`.
- **`{ }` para meter JavaScript:** `<td>{author.name}</td>`, `<img src={`https://.../${book._id}`} />`.
- **`style` recibe un objeto**, con las propiedades en camelCase (`AuthorCard.tsx`):

  ```tsx
  <span className="role" style={{ backgroundColor: role === 'admin' ? '#fde2e1' : '#e3e8fb' }}>
  ```

### Componentes: funciones

Un componente es una función que devuelve JSX (*Functional Component*, el estándar moderno; las clases
con `extends Component` ya no se usan). El nombre empieza por mayúscula. La paginación es de los más sencillos:

```tsx
// src/components/Pagination.tsx
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  return (/* ... */);
};
```

`React.FC` (`FC`) es una forma de tipar un componente de función. También vale escribir
`function Pagination(props: PaginationProps)`, que es lo que hacen el resto de componentes del proyecto.

### Props: flujo unidireccional

Las props son los datos que un componente recibe de su padre. Van **hacia abajo** (*top-down*) y son
**de solo lectura**: un hijo nunca modifica sus props. Si el hijo necesita cambiar algo, el padre le
pasa una función y el hijo la llama:

```tsx
// AuthorsList.tsx (padre)
<Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
```

```tsx
// Pagination.tsx (hijo): no cambia la página, le avisa al padre
<button onClick={() => onPageChange(page - 1)}>Anterior</button>
```

En Angular esto eran `input()` y `output()`. Aquí todo son props, y los "outputs" son funciones.
`AuthorCard`, `ViewToggle` y `ConfirmModal` funcionan igual: solo pintan y avisan al padre.

`children` es una prop especial: lo que se escribe entre las etiquetas del componente.
`Field.tsx` la usa para envolver cualquier input:

```tsx
<Field label="Nombre *" error={form.errorOf('name')}>
  <input name="name" ... />
</Field>
```

### Renderizado condicional y listas

En JSX no hay `@if` ni `@for`: se usa JavaScript normal.

```tsx
{error && <p className="alert">{error}</p>}          {/* se pinta solo si error tiene texto */}
{loading && <p className="muted">Cargando...</p>}
{viewMode === 'list' ? <table>...</table> : <div className="cards">...</div>}
if (!open) return null;                               {/* un componente puede no pintar nada */}
```

Las listas se pintan con `.map()`, y cada elemento necesita una **`key`** única y estable (el `_id`, no la
posición). Así React sabe qué fila es cuál cuando la lista cambia y no las repinta todas:

```tsx
{pageItems.map((author) => (
  <tr key={author._id}>...</tr>
))}
{pageItems.length === 0 && <tr><td colSpan={7}>No hay autores</td></tr>}   {/* el @empty de Angular */}
```

Lo que en Angular eran pipes (`date`, `currency`, `uppercase`, `languageName`, `truncate`) aquí son funciones
normales, en `src/utils/format.ts`: `{formatPrice(book.price)}`, `{languageName(book.language)}`.

## 3. Reactividad y estado local

### useState

Es el hook de cada día. Devuelve el valor y una función para cambiarlo. Cuando se llama a esa función, React
vuelve a ejecutar el componente con el valor nuevo:

```tsx
// AuthorsList.tsx
const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);

<button onClick={() => setAuthorToDelete(author)}>Borrar</button>
<ConfirmModal open={authorToDelete !== null} ... />
```

Reglas: el estado **no se modifica directamente** (`authors.push(x)` no funciona), se crea uno nuevo
(`setAuthors([...authors, x])`); y cambiar una variable normal (`let`) no repinta nada.

### useReducer

Para estados con varios valores que cambian juntos o con reglas, `useReducer` reúne todos los cambios en
una función (`reducer`) que recibe el estado y una acción y devuelve el estado nuevo. Es lo que se usaba antes
de pasar a Redux. Se usa en dos sitios:

```ts
// src/hooks/useApiList.ts: items, loading y error cambian siempre a la vez
function reducer<T extends { _id: string }>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'loaded':
      return { items: action.items, loading: false, error: '' };
    case 'failed':
      return { ...state, loading: false, error: action.error };
    case 'removed':
      return { ...state, items: state.items.filter((item) => item._id !== action.id) };
  }
}

const [state, dispatch] = useReducer(reducer<T>, { items: [], loading: true, error: '' });
dispatch({ type: 'loaded', items });
```

El otro está en `src/hooks/useForm.ts`: los valores del formulario y los campos "tocados" (`change`, `blur`,
`touchAll`, `fill`).

### Eventos y formularios controlados

Los eventos se escriben en camelCase y reciben una función: `onClick`, `onChange`, `onSubmit`, `onBlur`.

Un formulario **controlado** es aquel en el que el valor del input vive en el estado de React y cada tecla lo
actualiza. Es lo que en Angular hacía `[(ngModel)]` o `formControlName`:

```tsx
// El buscador de AuthorsList.tsx: el valor viene de la URL y onChange la cambia
<input value={search} onChange={(e) => setSearch(e.target.value)} />
```

En los formularios de autores y libros todos los campos se enlazan con el `name` del input y un único `handleChange`
(`useForm.ts`), que sirve para input, select, textarea, checkbox y `<select multiple>`:

```tsx
<input type="text" name="name" value={form.values.name}
       onChange={form.handleChange} onBlur={form.handleBlur} />
```

Al enviar, `onSubmit` recibe el evento y hay que llamar a **`preventDefault()`**; si no, el navegador envía el
formulario y recarga la página:

```tsx
async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  form.touchAll();            // enseña los errores de todos los campos
  if (!form.isValid) return;
  /* ... */
}
```

**Validación.** `validate(values)` (en `AuthorForm.tsx` y `BookForm.tsx`) devuelve un texto de error por
campo. Los errores no se guardan: se calculan en cada render a partir de los valores, y solo se enseñan en los
campos tocados (`form.errorOf('email')`). Son reglas parecidas a las de Joi en el backend, así casi todos los
errores salen antes de enviar; un email repetido, en cambio, solo lo sabe la API y el formulario enseña su mensaje
(409).

Antes de enviar, `removeEmpty` quita los campos vacíos, porque Joi responde 422 si le llega un `""`.

## 4. Efectos y comunicación con el exterior

### useEffect

Un efecto es código que se ejecuta **después** de pintar y que sirve para sincronizar el componente con algo de
fuera (la API, un listener, el título...). Tiene tres partes:

```tsx
useEffect(() => {
  // 1. Se ejecuta al montar el componente y cada vez que cambie algo del array de dependencias
  const controller = new AbortController();
  fetcher(controller.signal).then(/* ... */);

  // 2. La función que se devuelve es la limpieza: se ejecuta al desmontar o antes de repetir el efecto
  return () => controller.abort();
}, [fetcher]); // 3. Dependencias: [] = solo al montar; [id] = al montar y cuando cambie id
```

Así se ve el ciclo de vida (*muntatge, actualització i neteja*): montaje (el efecto se ejecuta), actualización
(se repite si cambian las dependencias) y limpieza (el `return`).

Sitios donde se usa:

- `useApiList.ts`: pide la lista a la API al montar la pantalla.
- `useApiPage.ts`: pide una página de la lista, y lo repite cuando cambia la página o el buscador.
- `AuthorForm.tsx` y `BookForm.tsx`: piden el autor o libro a editar cuando cambia el `:id`.
- `ConfirmModal.tsx`: mientras el modal está abierto escucha la tecla Escape, y la limpieza quita el listener.

**Por qué la limpieza y el `AbortController`.** En desarrollo `StrictMode` monta cada componente dos veces
(montar, desmontar y volver a montar). Sin limpieza, cada petición se haría dos veces y podría actualizar un
componente ya desmontado. Con el `AbortController`, la primera petición se cancela (`fetch` lanza un `AbortError`
que `isAbort()` ignora) y solo cuenta la segunda. Se puede ver en la pestaña Red (F12).

**Dependencias.** Todo lo que el efecto usa de fuera tiene que estar en el array. Por eso `useApiList` pide una
función estable (`authorService.getAuthors`, que está fuera del componente): si se le pasara una flecha nueva en cada
render, el efecto se repetiría sin parar.

### HTTP: fetch (y axios)

Las peticiones se hacen con `fetch`, que viene en el navegador. Hay dos diferencias importantes con
`HttpClient` de Angular o con `axios`:

- `fetch` **no falla con un 404 o un 500**: solo falla si no hay red. Hay que mirar `res.ok` y leer el
  `{ message }` del error a mano.
- No convierte el JSON solo: hay que llamar a `res.json()`, pero no con un `204` (el DELETE no tiene cuerpo).

Todo eso está en un solo sitio, `src/services/http.ts`:

```ts
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${environment.apiUrl}${path}`, { ...options, /* ... */ });
  } catch {
    // sin red o con el backend apagado fetch lanza un TypeError (el "status 0" de Angular)
    throw new ApiError('No se puede conectar con la API...', 0);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message ?? `Error ${res.status}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
```

`axios` es una librería que hace esto por ti (lanza error con los códigos 4xx/5xx, convierte el JSON, tiene
interceptores). Aquí no se usa para no añadir dependencias, pero el resto del proyecto no cambiaría: solo el
`request`.

### Dónde ubicar las peticiones: Service Layer

Los componentes **nunca** llaman a `fetch`. Las llamadas viven en `src/services/` (`authorService`,
`bookService`), que son el equivalente a los servicios de Angular pero sin inyección de dependencias: son
simplemente un objeto con funciones que se importa.

```ts
// src/services/author.service.ts
export const authorService = {
  getAuthors: (signal?: AbortSignal) =>
    request<AuthorListResponse>('/authors', { signal }).then((res) => res.authors),
  deleteAuthor: (id: string) => request<void>(`/authors/${id}`, { method: 'DELETE' }),
  /* ... */
};
```

El recorrido de una petición, desde que se entra en Autores hasta MongoDB y vuelta:

```
AuthorsList (se monta)
  -> useApiPage: useEffect
    -> authorService.getAuthorsPage({ page: 1, limit: 4, q: '' })
      -> request(): fetch GET http://localhost:1337/authors?page=1&limit=4
        -> API del S5: router -> middleware -> controller -> service -> model
          -> MongoDB (skip + limit)
        <- { authors: [...], total: 5, page: 1, totalPages: 2 }
    <- dispatch({ type: 'loaded' }) -> React vuelve a pintar la tabla
```

### Paginación en el backend

Las listas no traen todos los elementos para luego cortarlos en el navegador: piden a la API solo la página
que se ve. En la URL de la petición van la página, cuántos elementos caben y el texto del buscador
(`/authors?page=2&limit=4&q=cervantes`), y la API contesta con esa página y con el total:

```ts
// Backend, src/services/AuthorService.ts
const total = await Author.countDocuments(filter);       // cuántos hay, para saber las páginas
const authors = await Author.find(filter)
  .sort({ _id: 1 })
  .skip((currentPage - 1) * limit)                       // salta las páginas anteriores
  .limit(limit);                                         // y coge solo los de esta
```

En React el hook `useApiPage` tiene la página y el texto en las dependencias de su `useEffect`, así que cada
vez que cambian se hace una petición nueva (y la anterior se cancela con el `AbortController`):

```ts
// src/hooks/useApiPage.ts
useEffect(() => {
  const controller = new AbortController();
  fetchPage({ page, limit, q }, controller.signal).then((result) => dispatch({ type: 'loaded', result }));
  return () => controller.abort();
}, [fetchPage, page, limit, q, version]);
```

El buscador no lanza una petición por cada letra: `useListControls` espera a que se deje de escribir un
momento (300 ms) antes de poner el texto en la URL. Si la API recibe la petición sin `page` ni `limit` devuelve
la lista entera, que es lo que usa el formulario de libros para el desplegable de autores (`useApiList`).

### useRef

`useRef` guarda un valor que **no hace repintar** el componente al cambiar, y se usa en dos casos:

1. **Acceso directo al DOM.** Ponerle el foco al buscador al entrar (`AuthorsList.tsx`, `BooksList.tsx`) o al
   primer campo de un formulario:

   ```tsx
   const searchRef = useRef<HTMLInputElement>(null);
   useEffect(() => { searchRef.current?.focus(); }, []);
   <input ref={searchRef} ... />
   ```

2. **Persistir un valor entre renders** sin provocar un render (un contador de intentos, un timer...). La
   diferencia con `useState`: cambiar `ref.current` no repinta.

## 5. Estado global

Cuando varios componentes que no están emparentados necesitan el mismo dato, pasarlo por props nivel a nivel se
llama **prop drilling**. Hay dos soluciones en el proyecto.

### Context API

Viene con React. Aquí se usa para los avisos ("Autor creado", "Libro borrado"): `ToastContext.tsx`.

```tsx
// 1. Se crea el contexto y un Provider que guarda el estado
const ToastContext = createContext<ToastContextValue | null>(null);
export function ToastProvider({ children }) { /* useState con la lista de avisos */ }

// 2. main.tsx envuelve la app con el Provider
<ToastProvider><App /></ToastProvider>

// 3. Cualquier componente, a la profundidad que sea, lo lee con useContext
const { showToast } = useToast();   // useToast = useContext(ToastContext) con una comprobación
showToast('Autor creado');
```

Ojo: cuando el valor de un contexto cambia, se repintan todos los componentes que lo usan. Va bien para
datos que cambian poco (tema, usuario, avisos).

### Una librería pequeña: Nanostores

Para estados más grandes se suele usar Redux Toolkit (store, slices, actions), que aquí queda demasiado grande.
Hay librerías mucho más simples; Nanostores tiene solo dos ideas: un `atom` y el hook `useStore`.

```ts
// src/stores/viewMode.ts
export const authorsView = atom<ViewMode>('list');   // un valor FUERA de los componentes
authorsView.set('cards');                            // se cambia desde donde sea
```

```tsx
// AuthorsList.tsx
const viewMode = useStore(authorsView);              // el componente se repinta si cambia
<ViewToggle mode={viewMode} onChange={(mode) => authorsView.set(mode)} />
```

Cada lista guarda el modo elegido en el navegador (`localStorage`) y así al volver sigue igual. Ni Context
ni Nanostores hacen falta para algo tan pequeño, pero sirven para ver las dos formas.

### useMemo (bonus)

`useMemo` guarda el resultado de un cálculo y solo lo repite si cambian sus dependencias. Sirve para cálculos
caros y también para no crear un objeto nuevo en cada render. Se usa en el contexto de los avisos
(`ToastContext.tsx`):

```ts
const value = useMemo(() => ({ showToast }), [showToast]);
```

Sin el `useMemo`, cada render del provider crearía un objeto distinto y todos los componentes que usan
`useToast()` se volverían a pintar cada vez que sale un aviso.

Es el equivalente a `computed()` de las signals de Angular, con la diferencia de que hay que escribir las
dependencias a mano.

## 6. Navegación y rutas

Se usa **React Router** (v6 o superior). Las rutas están en `src/App.tsx`:

```tsx
<Routes>
  <Route element={<Layout />}>
    <Route path="/" element={<Navigate to="/authors" replace />} />
    <Route path="/authors" element={<AuthorsList />} />
    <Route path="/authors/new" element={<AuthorForm />} />
    <Route path="/authors/:id/edit" element={<AuthorForm />} />
    {/* ... libros ... */}
    <Route path="*" element={<Navigate to="/authors" replace />} />
  </Route>
</Routes>
```

- **`BrowserRouter`** (en `main.tsx`) activa el router usando las URLs normales del navegador.
- **`Routes` y `Route`** relacionan cada URL con un componente.
- **`Navigate`** redirige (la `/` y cualquier URL desconocida vuelven a autores).
- **`Link` y `NavLink`** navegan sin recargar. `NavLink` le pone la clase `active` al enlace de la página
  actual (`Navbar.tsx`).

### Layouts: nested routing y Outlet

Las rutas están anidadas: todas son hijas de una ruta sin `path` cuyo elemento es `<Layout />`. El `Layout` pinta la
barra de arriba y un **`<Outlet />`**, que es el hueco donde se pinta la pantalla de la ruta que toque
(el `<router-outlet>` de Angular):

```tsx
export function Layout() {
  return (<><Navbar /><main><Outlet /></main></>);
}
```

### Datos de la URL: useParams y useSearchParams

- **`useParams`** lee los parámetros de la ruta: en `/authors/:id/edit`, `const { id } = useParams()`. En
  `/authors/new` no hay `id` y el formulario sirve para crear.
- **`useSearchParams`** lee y cambia la parte `?q=...&page=2` de la URL. Las listas guardan ahí el buscador y la
  página (`useListControls.ts`): se pueden compartir, y al pulsar Atrás o recargar no se pierden. Con esos dos
  valores se pide la página a la API.

### Navegación programática: useNavigate

Al guardar un formulario se vuelve a la lista desde el código:

```tsx
navigate('/authors', { replace: true });
```

`replace` hace que el botón Atrás no vuelva al formulario que se acaba de guardar.

También se puede mandar información extra con `state`. El botón "Editar" de la lista de autores manda el autor
entero, que no se ve en la URL:

```tsx
// AuthorsList.tsx
navigate(`/authors/${author._id}/edit`, { state: { author } });

// AuthorForm.tsx
const stateAuthor = (useLocation().state as { author?: Author } | null)?.author;
```

Si el `state` no está (entrando con la URL escrita o desde otra pestaña), el formulario pide el autor a la API con
el `id`. En "Editar libro" solo se usa la URL y siempre se pide a la API.

## 7. Hooks que no pueden faltar (cheat sheet)

| Hook | Utilidad | Dónde se ve |
|---|---|---|
| `useState` | Estado local de la variable | Todos los componentes |
| `useReducer` | Estado con varios valores o reglas | `useApiList.ts`, `useApiPage.ts`, `useForm.ts` |
| `useEffect` | Efectos secundarios (APIs, timers, listeners) | `useApiList.ts`, `useApiPage.ts`, formularios, `ConfirmModal.tsx` |
| `useContext` | Evitar pasar props a través de 5 niveles | `ToastContext.tsx` |
| `useRef` | Referenciar elementos del DOM o guardar valores que no han de refrescar la UI | Buscadores y formularios |
| `useMemo` | (Bonus) Optimización de cálculos pesados | `ToastContext.tsx` |
| `useCallback` | (Bonus) Mantener la misma función entre renders | `useForm.ts`, `ToastContext.tsx` |
| `useParams`, `useSearchParams`, `useNavigate`, `useLocation` | Hooks de React Router | Listas y formularios |

**Hooks propios.** Un custom hook es una función cuyo nombre empieza por `use` y que usa otros hooks dentro.
Sirve para reutilizar lógica con estado: `useApiPage` y `useListControls` los usan las dos listas, `useApiList`
el formulario de libros (para el desplegable de autores) y `useForm` los dos formularios.

**Reglas de los hooks:** solo se llaman en el nivel superior de un componente (o de otro hook), nunca dentro
de un `if` o de un bucle, y siempre en el mismo orden.

Herramientas: la extensión **React Developer Tools** enseña el árbol de componentes con sus props y su estado
(y un Profiler), y los tests se pasan con `npm test` (Vitest: servicios, utilidades).

## 8. Cuestionario de validación React

**1. ¿Cuál es la principal diferencia entre el DOM real y el Virtual DOM?**

- a) El Virtual DOM es más lento.
- b) El Virtual DOM permite actualizar solo las partes que han cambiado. **(correcta)**
- c) El DOM real solo se usa en clases.

El Virtual DOM es una copia ligera en memoria. React compara la versión nueva con la anterior y toca el DOM
real únicamente donde hay diferencias.

**2. ¿Qué es el TSX?**

- a) Un sustituto de JavaScript.
- b) Sintaxis HTML dentro de TypeScript. **(correcta)**
- c) Una base de datos.

Es JSX con tipos de TypeScript.

**3. ¿Se pueden modificar las props directamente?**

- a) Sí.
- b) No, son de solo lectura. **(correcta)**
- c) Solo en componentes de clase.

Las props van del padre al hijo y no se cambian; para cambiar un dato el hijo llama a una función que le ha dado el
padre, y es el padre quien cambia su estado.

Más preguntas para repasar:

**4. ¿Por qué hace falta `key` en una lista?** Para que React identifique cada elemento entre renders y solo
actualice los que cambian. Tiene que ser única y estable (el `_id`), no el índice del `.map()`.

**5. ¿Qué diferencia hay entre `useState` y `useRef`?** Cambiar el estado repinta el componente; cambiar
`ref.current` no. `useRef` sirve para acceder al DOM o guardar valores que no afectan a lo que se ve.

**6. ¿Qué hace el array de dependencias de `useEffect`?** Dice cuándo se repite el efecto: `[]` solo al montar,
`[id]` al montar y cada vez que cambie `id`, sin array en cada render.

**7. ¿Para qué sirve la función que devuelve un `useEffect`?** Es la limpieza: se ejecuta al desmontar el
componente y antes de repetir el efecto (cancelar peticiones, quitar listeners, parar timers).

**8. ¿Por qué `fetch` no lanza error con un 404?** Porque para `fetch` una respuesta HTTP, aunque sea un error, es una
respuesta correcta. Solo falla si no hay red. Hay que mirar `res.ok`.

**9. ¿Qué es el prop drilling y cómo se evita?** Pasar una prop por muchos componentes que no la usan solo para
que llegue a uno de abajo. Se evita con la Context API (o con una librería de estado global).

**10. ¿Qué es un componente controlado?** Un input cuyo valor está en el estado de React (`value`) y se cambia
con `onChange`.

**11. ¿Por qué se llama a `preventDefault()` en un `onSubmit`?** Para que el navegador no envíe el formulario y
recargue la página, que es lo que hace por defecto.

**12. ¿Para qué sirve `<Outlet />`?** Para marcar dónde se pinta el componente de la ruta hija dentro de un
layout.

## 9. De Angular a React

| Angular (Seminario 6) | React (Seminario 7) |
|---|---|
| `@Component` con .ts + .html + .css | Una función que devuelve JSX (`.tsx`) |
| `input()` / `output()` / `model()` | Props (los outputs son funciones) |
| `signal()` / `computed()` / `effect()` | `useState` / `useMemo` / `useEffect` |
| `@if` / `@for ... track` / `@empty` | `&&` y `? :` / `.map()` con `key` / `length === 0 &&` |
| `{{ valor }}` / `[prop]="x"` / `(click)="f()"` | `{valor}` / `prop={x}` / `onClick={f}` |
| `[(ngModel)]` / formularios reactivos | Input controlado (`value` + `onChange`) / `useForm` |
| Pipes (`date`, `currency`, `languageName`...) | Funciones normales (`utils/format.ts`) |
| `@Injectable` + `inject()` | Objeto con funciones (`services/`) que se importa |
| `HttpClient` + Observables + `subscribe` | `fetch` + Promises + `async/await` |
| `ngOnInit` | `useEffect(..., [])` |
| `<router-outlet />`, `routerLink`, `routerLinkActive` | `<Outlet />`, `Link`, `NavLink` |
| `withComponentInputBinding()` para `:id` | `useParams()` |
| `Router.navigate(..., { state })` / `history.state` | `useNavigate()` / `useLocation().state` |
| `styleUrl` (CSS de un componente) | `index.css` global (el CSS no se limita al componente) |
| `ng generate component` | Se crea el fichero a mano |
| Angular DevTools | React Developer Tools |

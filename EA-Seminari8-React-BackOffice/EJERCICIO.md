### **Ejercicio: Soporte para el campo "Editorial" (*Publisher*)**

**Contexto:**

El backend ya soporta y almacena el campo opcional `publisher` en la entidad de los libros, y la interfaz `BookInput` de `src/models/book.model.ts` ya lo contempla. Pero actualmente el frontend no lo aprovecha.

**Objetivo:**

Integrar el campo `publisher` en el flujo de la aplicación cliente (BackOffice) para que sea editable, visible en el listado y localizable mediante el buscador.

**Requisitos:**

1. **Modelo de datos (`src/models/book.model.ts`):**
   Comprobar que las interfaces del modelo de libro contemplan la propiedad opcional `publisher`.
2. **Formulario (`src/components/BookForm.tsx`):**
   * Añadir `publisher` al tipo `BookFormValues` y a `INITIAL_VALUES` (como texto, igual que `title`).
   * Añadir un campo `<input name="publisher">` controlado con `value={form.values.publisher}` y `onChange={form.handleChange}`.
   * Cargar el valor existente al editar un libro que ya disponga de editorial (en el `fill({...})` del `useEffect`).
3. **Listado y Búsqueda (`src/components/BooksList.tsx`):**
   * Mostrar la editorial en la vista de la tabla de libros (nueva columna `<th>` y `<td>`; acuerdate de subir el `colSpan` de la fila "No hay libros").
   * Ampliar la función `matchesBook` para que las búsquedas por texto coincidan también con la editorial.
4. **Validación:**
   Comprobar que el proyecto compila limpiamente (`npm run build`) y verificar en el navegador el guardado, la visualización y el filtrado del nuevo dato.

**Pistas:**

* `removeEmpty` ya quita los campos vacíos antes de enviar, así que una editorial en blanco no se manda a la API.
* El campo es texto y no hay que convertirlo a número, por lo que no hace falta tocar el `handleSubmit`.

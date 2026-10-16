# Cómo colaborar

Gracias por ayudar. Hay tres formas, de la más fácil a la más técnica.

## 1. Publicar en el muro de la comunidad

Desde la pestaña **Comunidad** de la app: comparte una explicación, una frase útil, un truco de pronunciación o un
enlace a un video o audio. Vota lo que te sirva. Los aportes más votados se convierten en lecciones oficiales.

## 2. Proponer una lección sin programar

Abre un *issue* con la plantilla **Propuesta de lección o corrección** y escribe el contenido con tus palabras.
Alguien del equipo lo pasará al formato de la app.

## 3. Editar las lecciones directamente

Cada idioma es un archivo en `content/` (por ejemplo `content/pt.json`). Una unidad tiene esta forma:

```json
{
  "id": "pt6",
  "level": "A2",
  "title": "No mercado",
  "subtitle": "Comprar y preguntar precios",
  "grammar": [
    "Para preguntar el precio: **Quanto custa?** (singular) y **Quanto custam?** (plural)."
  ],
  "words": [
    { "term": "Quanto custa?", "es": "¿Cuánto cuesta?", "ipa": "[ˈkwɐ̃.tu ˈkus.tɐ]" }
  ]
}
```

Reglas:

- `id` único (código del idioma + número). `level` de A1 a C2.
- Al menos 4 palabras por unidad. `ipa` es opcional.
- Sin HTML: para resaltar, usa `**negrita**`.
- Escribe tus propias explicaciones. No copies textos ni audios con derechos de autor; enlaza a ellos desde el muro.

Antes de enviar tu cambio, comprueba el formato:

```bash
node scripts/validate-content.mjs
```

GitHub lo comprueba también en cada *pull request*. Otra persona revisa el contenido antes de publicarlo,
idealmente alguien que hable el idioma con fluidez.

## Añadir un idioma nuevo

1. Crea `content/<código>.json` con el mismo formato (`code`, `name`, `voice` como `fr-FR`, `units`).
2. Añade una línea en `content/languages.json`.
3. Añade el archivo a la lista `CORE` de `sw.js` para que funcione sin conexión.

## Código

Es HTML, CSS y JavaScript sin dependencias ni compilación. Prueba en local con `python3 -m http.server 8000`
y revisa que funcione en el móvil (ancho de unos 400 px) y en modo oscuro.

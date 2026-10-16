# Ponte de Idiomas

Plataforma **gratuita y abierta** para aprender inglés y portugués desde el español. Funciona como página web y se
instala en el móvil como app (PWA), incluso sin conexión. La comunidad aprende y también aporta: explicaciones,
frases, trucos de pronunciación y enlaces a videos o audios, y vota lo más útil.

## Qué incluye

- **Lecciones**: 5 unidades por idioma (A1–A2) con la regla gramatical explicada para hispanohablantes,
  vocabulario con pronunciación (AFI) y audio con la voz del navegador.
- **Práctica**: test de opción múltiple en las dos direcciones.
- **Comunidad**: muro de aportes con votos. Compartido si se conecta Supabase; si no, en modo local.
- **App instalable**: manifiesto, iconos y service worker para usarla sin internet.

## Probarla en tu computador

No necesita instalar nada para compilar. Desde la carpeta del proyecto:

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

## Publicarla gratis

1. En GitHub: *Settings → Pages → Source: GitHub Actions*.
2. Cada cambio en `main` se publica solo (ver `.github/workflows/pages.yml`) en
   `https://<usuario>.github.io/ponte-de-idiomas/`.

## Activar el muro compartido (opcional, gratis)

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito).
2. En *SQL Editor* ejecuta [`supabase/schema.sql`](supabase/schema.sql).
3. En *Authentication → URL Configuration* añade la dirección de GitHub Pages como URL permitida.
4. Copia *Project URL* y la clave *anon public* en [`js/config.js`](js/config.js). Esa clave es pública por diseño;
   la seguridad la ponen las reglas de la base de datos (cada persona solo puede borrar lo suyo).

## Estructura

```
content/        lecciones (un JSON por idioma) y languages.json con la lista de idiomas
js/app.js       lecciones, práctica, navegación e instalación
js/community.js muro de aportes (Supabase o modo local)
js/config.js    configuración pública
sw.js           funcionamiento sin conexión
supabase/       esquema de la base de datos
scripts/        validador del contenido (lo ejecuta GitHub en cada cambio)
```

## Colaborar

Lee [CONTRIBUTING.md](CONTRIBUTING.md). No hace falta programar para aportar lecciones.

## Licencias

Código: [MIT](LICENSE). Contenido de `content/`: [CC BY-SA 4.0](content/LICENSE.md).

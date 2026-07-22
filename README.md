# Toviu HUB

Toviu HUB es una app web ligera para centralizar accesos rapidos a plataformas de entretenimiento.

## Caracteristicas

- Gestion local de links (agregar, eliminar y reordenar)
- Persistencia en navegador con `localStorage`
- Navegacion por teclado:
  - `Flechas`: mover seleccion
  - `Enter` y `Espacio`: abrir opcion activa
  - `N`: abrir modal para nuevo link
- Reordenamiento por arrastrar y soltar (drag & drop)
- Interfaz visual tipo hub, pensada para abrirse como app en Chrome

## Estructura del proyecto

```text
index.html
css/
  styles.css
Js/
  motor.js
```

## Requisitos

- Navegador moderno (Chrome recomendado)
- No requiere backend para funcionamiento basico

## Uso local

1. Clona o descarga el proyecto.
2. Abre `index.html` directamente en el navegador.
3. Opcional: levanta un servidor estatico para pruebas mas cercanas a produccion.

Ejemplo con Python:

```bash
python -m http.server 8080
```

Luego abre:

```text
http://localhost:8080
```

## Donde se guardan los links

Los links se guardan en `localStorage` bajo la clave:

```text
toviuHubLinks
```

Importante:

- El almacenamiento es local por navegador/dispositivo.
- Si limpias datos del navegador, se borra la configuracion guardada.

## Despliegue sugerido (servidor personal)

Para publicar en un dominio como `toviu.dannprod.com`, considera:

- HTTPS (certificado valido)
- Cabeceras de seguridad (CSP, `X-Content-Type-Options`, `Referrer-Policy`)
- Cache de archivos estaticos
- Respaldo de configuracion (futuro: export/import JSON)

## Roadmap sugerido

- Exportar/importar links en JSON
- PWA instalable (manifest + service worker)
- Sincronizacion opcional en backend
- Categorizacion y busqueda de links

## Licencia

Uso personal. Ajusta esta seccion segun como quieras distribuir el proyecto.

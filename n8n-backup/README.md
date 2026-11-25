# N8N Backup - YBank Migration

Backup de los workflows de N8N antes de migrar a Worker Node.js en el repo.

## Por qué este backup

Vamos a migrar el parsing de emails de N8N a un Worker en Node.js dentro de este repo. Este backup es por seguridad y para tener referencia de qué parsers teníamos.

## Cómo exportar tus workflows

### Opción 1: Desde la UI (más fácil)

1. Abrí N8N en el navegador (ej: `http://tu-server:5678`)
2. Para cada workflow:
   - Abrilo
   - Click en los **3 puntos** arriba a la derecha
   - **Download** → te descarga un JSON
3. Mové todos los JSONs a esta carpeta (`n8n-backup/`)

### Opción 2: CLI (exporta todos de una)

Si tenés acceso SSH/Docker a tu server:

```bash
# Si corrés N8N con docker run
docker exec -u node -it n8n n8n export:workflow --all --output=/tmp/workflows.json

# Copialo a tu máquina local
docker cp n8n:/tmp/workflows.json ./n8n-backup/all-workflows.json
```

Si usás docker-compose, reemplazá `n8n` por el nombre de tu servicio.

### Opción 3: Acceso directo a SQLite (sin Docker exec)

Los workflows están en SQLite. La DB suele estar en:

```bash
# Linux/Mac
~/.n8n/database.sqlite

# Dentro del container
/home/node/.n8n/database.sqlite
```

```bash
sqlite3 database.sqlite "SELECT name, nodes FROM workflow_entity;" > workflows-dump.txt
```

(esta opción es fea, preferí Opción 1 o 2)

## Estructura esperada

```
n8n-backup/
├── README.md           ← este archivo
├── popular.json        ← workflow del Banco Popular
├── banreservas.json    ← workflow de Banreservas
├── bhd.json
├── ...otros bancos
└── all-workflows.json  ← export completo (si usaste CLI)
```

## Una vez que tengas los JSONs acá

Ejecutá el análisis:

```bash
npm run analyze:n8n
```

Esto te va a mostrar:
- Cuántos workflows hay
- Cuáles son parsers de email
- Qué regex/JS code tiene cada uno
- Qué bancos están cubiertos
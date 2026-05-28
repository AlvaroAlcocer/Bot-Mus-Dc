# Bot-Mus-Dc

Bot de música para Discord basado en **discord.js v14** y **Lavalink v4**. Reproduce audio desde YouTube, SoundCloud, Twitch y más en canales de voz.

## Requisitos

- **Git**
- **Node.js** 18+
- **Java** 17+ (solo para ejecución local sin Docker)
- **Docker** y **Docker Compose** (opcional, recomendado)

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/AlvaroAlcocer/Bot-Mus-Dc.git
cd Bot-Mus-Dc

# 2. Configurar variables de entorno
cp App/.env.example App/.env
```

Editar `App/.env` y completar el token de Discord:

```env
DISCORD_TOKEN=tu_token_aqui
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
```

> El token se obtiene en https://discord.com/developers/applications → tu app → Bot → Reset Token

## Cómo ejecutar

### Opción 1 — Docker (recomendado)

**Primera vez o después de cambios en el código:**

```bash
docker compose up --build -d
```

> `--build` reconstruye la imagen para reflejar cambios en el código fuente (ej: editar archivos `.ts`). Sin este flag Docker usa la imagen en caché.

**Arranque normal (sin cambios):**

```bash
docker compose up -d
```

Ver logs:
```bash
docker compose logs -f
```

Detener:
```bash
docker compose down
```

### Opción 2 — Local (sin Docker)

**Terminal 1 — Lavalink:**
```bash
cd Server
java -jar Lavalink.jar
```

**Terminal 2 — Bot:**
```bash
cd App
npm install
npm run dev
```

## Comandos

| Comando   | Descripción                     | Opciones                     |
|-----------|---------------------------------|------------------------------|
| `/play`   | Busca y reproduce una canción   | `query` (texto o URL)        |
| `/skip`   | Salta a la siguiente canción    | —                            |
| `/pause`  | Pausa la reproducción           | —                            |
| `/resume` | Reanuda la reproducción         | —                            |
| `/stop`   | Detiene y limpia la cola        | —                            |
| `/queue`  | Muestra la cola de reproducción | —                            |

> `/play` acepta nombres, URLs de YouTube, URLs de SoundCloud y playlists de YouTube.

## Estructura del proyecto

```
Bot-Mus-Dc/
├── App/                  # Bot de Node.js (TypeScript)
│   ├── src/
│   │   ├── index.ts           # Punto de entrada
│   │   ├── config.ts          # Config desde .env
│   │   ├── lavalink/
│   │   │   └── manager.ts     # Conexión con Lavalink
│   │   ├── events/
│   │   │   ├── ready.ts       # Evento al iniciar sesión
│   │   │   └── interactionCreate.ts  # Ruteo de comandos
│   │   └── commands/
│   │       ├── play.ts
│   │       ├── skip.ts
│   │       ├── pause.ts
│   │       ├── resume.ts
│   │       ├── stop.ts
│   │       └── queue.ts
│   ├── Dockerfile
│   └── package.json
├── Server/               # Servidor de audio Lavalink (Java)
│   ├── Lavalink.jar
│   ├── application.yml
│   └── plugins/
│       └── youtube-plugin-1.18.1.jar
├── docker-compose.yml    # Orquestación Docker
└── README.md
```

## Producción

```bash
cd App
npm run build
npm start
```

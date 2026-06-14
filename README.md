# DRONE HUNT

Juego de disparos en el navegador inspirado en Duck Hunt. Derriba drones que cruzan la pantalla antes de que escapen. Sin instalación, sin dependencias locales.

---

## Cómo iniciar

1. Abre `index.html` en tu navegador (Chrome o Edge recomendados).
2. Selecciona el modo de control.
3. ¡Dispara!

> **Nota:** Si usas el modo cámara, el navegador pedirá permiso para acceder a la webcam. Los modelos de IA se descargan automáticamente desde CDN la primera vez (~30 MB).

---

## Modos de control

| Modo | Mira | Disparo |
|---|---|---|
| **Cámara (mano)** | Punta del dedo índice frente a la webcam | Juntar el pulgar con la base del índice (gesto "pistola") |
| **Teclado + Ratón** | Mueve el ratón sobre el canvas | Clic izquierdo o `Espacio` |

---

## De qué trata el juego

Drones enemigos aparecen uno a uno y vuelan en zigzag a través de la pantalla. Tienes **3 balas por wave**. Si aciertas, el dron explota y avanzas al siguiente. Si agotas las balas o el dron llega al borde, escapa — y un alienígena burlón aparece para restregártelo.

Cada ronda aumenta la cantidad de drones y su velocidad. El juego no termina: el objetivo es acumular la mayor puntuación posible.

---

## Features

- **Control por gestos con IA** — MediaPipe HandLandmarker detecta la mano en tiempo real vía GPU. No requiere marcadores ni hardware especial, solo una webcam.
- **Mira con suavizado** — La posición del crosshair usa interpolación (lerp) para evitar temblor.
- **Sistema de balas por wave** — 3 balas para derribar cada dron. Sin hit en 3 tiros: el dron escapa.
- **Streak y multiplicador de puntuación** — Hits consecutivos aumentan el multiplicador (+50% por cada hit encadenado).
- **Dificultad progresiva** — Cada ronda suma más drones y aumenta su velocidad.
- **Zigzag dinámico** — Los drones vuelan en trayectoria sinusoidal, no en línea recta.
- **Partículas de explosión** — Hit confirmado con explosión de 22 partículas.
- **Alienígena burlón** — Animación de taunt cuando un dron escapa o se agotan las balas.
- **Audio procedural** — Todos los sonidos (disparo, explosión, recarga, escape, inicio de ronda) generados con WebAudio API. Sin archivos de audio externos.
- **Vista de cámara en overlay** — Preview de la webcam en la esquina inferior derecha mientras juegas.
- **Paleta neón** — Estética cyberpunk con fondo oscuro y colores cyan, magenta, naranja y verde.

---

## Tecnologías

- Vanilla JS con ES Modules (sin frameworks ni bundlers)
- Canvas 2D API
- WebAudio API
- [MediaPipe Tasks Vision](https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14) (CDN)
- Google Fonts CDN (Share Tech Mono)

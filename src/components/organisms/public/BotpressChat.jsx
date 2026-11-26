// src/components/organisms/public/BotpressChat.jsx
import { useEffect } from 'react';

const BOTPRESS_CSS_URL = 'https://vdk-viber-runtime-prod.bot.botpress.host/edge/webchat.css';
const BOTPRESS_JS_URL = 'https://vdk-viber-runtime-prod.bot.botpress.host/edge/webchat.js';
const BOT_ID = '4603b936-6b70-4573-87ac-b63746a6c302';
const BASE_URL = 'https://vdk-viber-runtime-prod.bot.botpress.host';

let botMounted = false;

export default function BotpressChat() {
  useEffect(() => {
    // 1. CSS original de Botpress
    if (!document.getElementById('chapulgo-botpress-css')) {
      const link = document.createElement('link');
      link.id = 'chapulgo-botpress-css';
      link.rel = 'stylesheet';
      link.href = BOTPRESS_CSS_URL;
      document.head.appendChild(link);
    }

    // 2. Reglas de tamaño para que la cabecera con el ícono y el "+" nunca se oculte al chatear
    if (!document.getElementById('chapulgo-botpress-bounds')) {
      const style = document.createElement('style');
      style.id = 'chapulgo-botpress-bounds';
      style.textContent = `
        [id*="vdk"], [class*="vdk-edge"] {
          z-index: 9999 !important;
        }
        /* Limita la altura del diálogo para que la cabecera quede siempre visible debajo del navbar */
        [class*="vdk-edge"] [role="dialog"],
        [class*="vdk-edge"] > div > div[style*="height"],
        [class*="vdk-edge"] > div:first-child:not(:only-child) {
          max-height: calc(100vh - 165px) !important;
        }
        /* Asegura que el encabezado del chat (ícono + título + botón "+") sea sticky y visible */
        [class*="vdk-edge"] header,
        [class*="vdk-edge"] [class*="header"] {
          position: sticky !important;
          top: 0 !important;
          z-index: 20 !important;
        }
      `;
      document.head.appendChild(style);
    }

    const initBot = () => {
      if (botMounted) {
        document
          .querySelectorAll('[id*="vdk"], [class*="vdk"]')
          .forEach((el) => (el.style.display = ''));
        return;
      }

      if (!window.VdkEdgeWebchat) return;
      botMounted = true;

      fetch(`${BASE_URL}/edge/bots/${BOT_ID}/config`)
        .then((res) => res.json())
        .then(({ webchat }) => {
          window.VdkEdgeWebchat.mount({
            ...webchat,
            mode: 'bubble',
            baseUrl: BASE_URL,
            botId: BOT_ID,
          });
        })
        .catch(() => {
          botMounted = false;
        });
    };

    let script = document.getElementById('chapulgo-botpress-js');
    if (!script) {
      script = document.createElement('script');
      script.id = 'chapulgo-botpress-js';
      script.src = BOTPRESS_JS_URL;
      script.onload = initBot;
      document.body.appendChild(script);
    } else if (window.VdkEdgeWebchat) {
      initBot();
    } else {
      script.addEventListener('load', initBot);
    }

    // 3. Cerrar el chatbot automáticamente al tocar cualquier parte de la pantalla fuera de él
    const handleClickAfuera = (event) => {
      const raizBot = document.querySelector('[id*="vdk"], [class*="vdk-edge"]');
      if (!raizBot) return;

      // Si el clic fue dentro del chatbot o en su burbuja, no hacemos nada
      if (raizBot.contains(event.target)) return;

      // Revisar si la ventana de chat está abierta (tiene el campo de texto visible)
      const cajaTexto = raizBot.querySelector('textarea, input[type="text"]');
      if (cajaTexto && cajaTexto.offsetParent !== null) {
        // Buscar el botón lanzador/burbuja de la esquina inferior derecha y hacer clic para minimizarlo
        const botones = Array.from(raizBot.querySelectorAll('button'));
        const botonBurbuja = botones[botones.length - 1];
        if (botonBurbuja) {
          botonBurbuja.click();
        }
      }
    };

    document.addEventListener('mousedown', handleClickAfuera);

    // 4. Ocultar al navegar fuera de PublicHome (Login / Admin)
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document
        .querySelectorAll('[id*="vdk"], [class*="vdk"]')
        .forEach((el) => (el.style.display = 'none'));
    };
  }, []);

  return null;
}
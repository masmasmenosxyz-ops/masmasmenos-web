# masmasmenos · beta

Versión independiente de una sola pantalla, basada en las referencias de `Referencias/`.
HTML, CSS, JavaScript, logo y fuentes propios: se puede publicar el contenido de esta carpeta como sitio estático sin depender de la web principal.

Vista local desde la raíz del proyecto: `npm run dev`, luego abrir `http://localhost:3000/Beta/index.html`.

El logo sigue al mouse en desktop. Los textos entran carácter por carácter con +, −, _ y .; el hover transforma solo las letras dentro de un radio de 40px y las restaura al salir. Respeta la preferencia de movimiento reducido.
Social abre Instagram y contact abre un correo a masmasmenos.xyz@gmail.com.

El texto descriptivo se conserva de la web actual y la fecha de salida (nov 2026) de las referencias.

## Entrada del storyboard

Sobre negro, el wordmark entra desde arriba y los botones desde abajo (620ms, cubic-bezier(.16,1,.3,1)). Luego el blanco pasa directamente de vacío a rectángulo horizontal (450ms) y se expande verticalmente (500ms). El iso comienza 180ms antes del fin del blanco y conserva su curva y duración de 900ms. La descripción comienza a los 450ms del crecimiento del iso; coming soon entra al terminar la descripción. El iso responde al mouse desde que completa sus 900ms, sin esperar a los textos. Los caracteres mantienen su aleatoriedad y desaceleración progresiva.

La entrada funciona también en mobile. Los cambios de altura de las barras del navegador no la cancelan; un cambio de ancho superior a 80px, como al girar el dispositivo, muestra el estado final. Movimiento reducido muestra directamente el contenido.

El plano blanco usa una sola animación de escala de 950ms: alcanza todo el ancho a los 450ms con velocidad vertical continua y termina de expandirse durante los 500ms restantes.

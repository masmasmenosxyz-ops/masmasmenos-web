# Beta · storyboard y hover localizado

Validación de la actualización del storyboard, 20 septiembre 2026.

## Comprobaciones
- JavaScript: comprobación de sintaxis correcta.
- Navegador: Codex in-app browser, desktop 1440 × 1024 y mobile 390 × 844.
- Primer plano capturado en ambos tamaños: wordmark blanco sobre negro, botones visibles sin fondo blanco alrededor.
- Estado final inspeccionado: logo, descripción, coming soon y botones visibles; sin caracteres ocultos o símbolos pendientes.
- Separaciones medidas en desktop: 60px entre textos y 60px hasta los botones. Sin desbordamiento (documento 1440 × 1024 y 390 × 844 respectivamente).
- Hover desktop en (600,744): 33 caracteres activos de 180; cero caracteres activos fuera del radio de 40px.
- Últimos índices de descripción: 210,211,212,213,214. El retraso continúa hasta el final y cuenta espacios; se eliminó el límite previo de 700ms.
- Interrupción por resize durante la apertura: clase opening eliminada, cero letras ocultas, textos accesibles completos.
- Consola sin errores ni warnings durante la revisión.

## Revisión de implementación
- Expansión por fases: 160ms + 450ms + 800ms; iso 900ms, inicio con 620ms de retraso dentro de la fase vertical (180ms de solapamiento).
- Curva de expansión cubic-bezier(.16,1,.3,1).
- Botones separados del bloqueo de entrada y plano blanco sin captura de eventos.
- Hover deshabilitado para puntero táctil y durante la apertura.
- Movimiento reducido salta la entrada; cambio de preferencia cancela la animación. Revisado en código, sin alterar la configuración del sistema.
- No se capturaron individualmente todos los fotogramas intermedios ni se midió la curva por vídeo; duraciones y solapamiento comprobados en código.

## Actualización: continuidad y solapamiento
- Blanco: 950ms con curvas Hermite muestreadas cada 10ms. Verificación numérica de crecimiento monótono, extremos 0/1 y velocidad vertical continua y no nula en 450ms (aprox. 0.0009/ms a ambos lados).
- Iso: mantiene 900ms y curva original; el bloqueo de inclinación ahora depende de su finalización, no de la entrada de los textos.
- Descripción: arranca a los 1220ms de la expansión blanca, 450ms después del inicio del iso (770ms). Coming soon sigue esperando al fin de la descripción.
- Puntero registrado durante la entrada y aplicado suavemente al desbloquear el iso.
- Comprobación de sintaxis y consola sin errores. Inclinación observada después de registrar el puntero durante la entrada.

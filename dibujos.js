/* ==========================================================================
   LOS SEIS DIBUJOS DE LOS SELLOS
   Cada sobre trae un dibujo y, al lado, su nombre escrito en el alfabeto.
   Dibujados en un lienzo de 100×100 con el mismo trazo que los símbolos.
   Usado por la app, los papeles imprimibles y la guía (UMD, como simbolos.js).
   ========================================================================== */
(function (raiz) {
  'use strict';

  // Los elementos con class="ac" se rellenan con --acento (si no hay, quedan vacíos).
  var AC = 'style="fill:var(--acento,none)"';

  var FORMAS = {
    // Rosa: capullo con espiral, tallo y dos hojas
    rosa:
      '<path d="M50 14C36 14 27 25 32 38C35 46 44 50 50 50C56 50 65 46 68 38C73 25 64 14 50 14Z" ' + AC + '/>' +
      '<path d="M50 24C42 24 40 34 47 37C53 39 58 33 54 29"/>' +
      '<path d="M50 50V92"/>' +
      '<path d="M50 74C41 70 33 71 28 64C38 62 46 66 50 74Z"/>' +
      '<path d="M50 82C59 78 67 79 72 72C62 70 54 74 50 82Z"/>',

    // Guante: palma, cuatro dedos, pulgar y puño
    guante:
      '<path d="M30 90V58C23 56 19 49 22 42C25 37 31 40 35 47V26C35 20 44 20 44 26V42V14C44 8 54 8 54 14V42V20C54 14 64 14 64 20V44V32C64 26 73 26 73 32V64L70 90Z"/>' +
      '<path d="M30 76H71"/>',

    // Libro abierto
    libro:
      '<path d="M8 28C26 22 42 24 50 33C58 24 74 22 92 28V77C74 71 58 73 50 82C42 73 26 71 8 77Z"/>' +
      '<path d="M50 33V82"/>' +
      '<path d="M18 40C27 38 36 40 42 44M18 52C27 50 36 52 42 56M18 64C27 62 36 64 42 68"/>' +
      '<path d="M58 44C64 40 73 38 82 40M58 56C64 52 73 50 82 52M58 68C64 64 73 62 82 64"/>',

    // Dado en perspectiva con sus puntos
    dado:
      '<path d="M50 12L85 31V69L50 88L15 69V31Z"/>' +
      '<path d="M15 31L50 50L85 31M50 50V88"/>' +
      '<circle cx="50" cy="31" r="3.4" fill="currentColor"/>' +
      '<circle cx="31" cy="64" r="3.4" fill="currentColor"/><circle cx="40" cy="71" r="3.4" fill="currentColor"/>' +
      '<circle cx="62" cy="62" r="3.4" fill="currentColor"/><circle cx="71" cy="57" r="3.4" fill="currentColor"/><circle cx="66" cy="76" r="3.4" fill="currentColor"/>',

    // Lámpara de mesa con pantalla, pie y base
    lampara:
      '<path d="M32 12H68L82 52H18Z"/>' +
      '<path d="M50 52V80"/>' +
      '<path d="M34 90C34 84 42 80 50 80C58 80 66 84 66 90Z"/>' +
      '<path d="M44 52V62" stroke-dasharray="1 7"/>',

    // Cámara de fotos con objetivo y flash
    camara:
      '<path d="M10 32H30L36 22H64L70 32H90V80H10Z"/>' +
      '<circle cx="50" cy="56" r="17"/>' +
      '<circle cx="50" cy="56" r="8"/>' +
      '<path d="M76 40H84"/>' +
      '<circle cx="21" cy="42" r="2.4" fill="currentColor"/>'
  };

  function svgDibujo(id, o) {
    o = o || {};
    var f = FORMAS[id];
    if (!f) return '';
    var tam = o.tam || 120;
    return '<svg class="dibujo" data-dibujo="' + id + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + tam + '" height="' + tam + '"' +
      ' fill="none" stroke="' + (o.color || 'currentColor') + '" stroke-width="' + (o.grosor || 3.6) + '"' +
      ' stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Dibujo">' + f + '</svg>';
  }

  var API = { FORMAS: FORMAS, svgDibujo: svgDibujo };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else raiz.DIBUJOS = API;
})(typeof window !== 'undefined' ? window : this);

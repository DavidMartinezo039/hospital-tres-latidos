/* ==========================================================================
   ALFABETO DEL HOSPITAL TRES LATIDOS  ·  27 símbolos (A–Z + Ñ)
   Calcados de la hoja manuscrita original. Cada símbolo está dibujado en un
   lienzo de 100×100 con trazo redondeado, para que escalen sin perder nitidez.

   Este archivo lo usan TRES cosas a la vez (así nunca se desincronizan):
     · la app del móvil        (se carga como <script>)
     · el generador de papeles (se carga desde Node con require)
     · el generador de la guía (idem)
   ========================================================================== */
(function (raiz) {
  'use strict';

  // Orden oficial del alfabeto. La Ñ va tras la N, igual que en tu hoja.
  var LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

  // Contenido interior de cada <svg viewBox="0 0 100 100">.
  // Por defecto: sin relleno, trazo currentColor (lo decide quien lo pinte).
  var FORMAS = {
    A: '<path d="M17 24H83L50 82Z"/><path d="M38 52H62L50 72Z" fill="currentColor"/>',
    B: '<path d="M50 80C20 58 16 36 30 27C40 21 49 27 50 35C51 27 60 21 70 27C84 36 80 58 50 80Z"/>',
    C: '<path d="M30 24V76H47C70 76 78 62 78 50C78 38 70 24 47 24Z"/>',
    D: '<path d="M16 38H84A34 34 0 0 1 16 38Z"/><path d="M27 50Q50 44 73 50"/><ellipse cx="40" cy="59" rx="8" ry="4.5"/>',
    E: '<path d="M30 22H70V78H30Z"/><path d="M30 47H70"/>',
    F: '<path d="M50 14V54"/><path d="M30 56H70L50 88Z"/>',
    G: '<path d="M18 62L36 46L52 72L64 28H90"/>',
    H: '<path d="M24 26L76 76M76 24L26 76" stroke-width="10"/>',
    I: '<path d="M26 50H74M50 24V78"/>',
    J: '<circle cx="46" cy="57" r="17"/><path d="M46 40H86"/>',
    K: '<path d="M22 36H78M46 36C46 54 38 64 22 66M58 36C58 52 66 62 80 64"/>',
    L: '<path d="M30 80L40 24L72 82"/>',
    M: '<path d="M16 28H84V72H16Z"/><path d="M50 28V72"/>',
    N: '<path d="M28 26H72V74H28Z"/>',
    Ñ: '<path d="M28 26H72V74H28Z"/><path d="M32 70L68 30" stroke-width="10"/>',
    O: '<circle cx="50" cy="50" r="22"/><path d="M22 80L80 20"/>',
    P: '<ellipse cx="40" cy="50" rx="15" ry="12"/><path d="M24 50H86"/>',
    Q: '<circle cx="50" cy="50" r="18"/><path d="M24 24L40 40M76 24L60 40M24 76L40 60M76 76L60 60"/>',
    R: '<path d="M24 28C18 52 26 70 44 68C60 66 56 36 72 36C86 36 82 58 80 68"/>',
    S: '<ellipse cx="50" cy="34" rx="13" ry="11"/><ellipse cx="50" cy="66" rx="16" ry="14"/>',
    T: '<path d="M24 52H76" stroke-width="9"/>',
    U: '<ellipse cx="50" cy="50" rx="16" ry="19"/><path d="M50 22V82"/>',
    V: '<path d="M20 78L58 22L82 76Z"/><path d="M34 60H72"/>',
    W: '<path d="M50 20L72 56H28Z"/><path d="M50 56V88"/>',
    X: '<path d="M16 68L34 36L58 62L88 32"/>',
    Y: '<path d="M66 18V46H38V82"/>',
    Z: '<circle cx="50" cy="33" r="15"/><path d="M42 52H58V84H42Z"/>'
  };

  // Quita tildes y diéresis pero conserva la Ñ (que sí tiene símbolo propio).
  function normalizar(texto) {
    return String(texto)
      .toUpperCase()
      .replace(/Ñ/g, '\u0001')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\u0001/g, 'Ñ');
  }

  // Devuelve solo letras del alfabeto y espacios (todo lo demás se descarta).
  function limpiar(texto) {
    return normalizar(texto).replace(/[^A-ZÑ ]+/g, ' ').replace(/ +/g, ' ').trim();
  }

  // SVG autónomo de una letra. opciones: {tam, color, grosor}
  function svgLetra(letra, o) {
    o = o || {};
    var tam = o.tam || 48;
    var f = FORMAS[letra];
    if (!f) return '';
    return '<svg class="glifo" data-letra="' + letra + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + tam + '" height="' + tam + '"' +
      ' fill="none" stroke="' + (o.color || 'currentColor') + '" stroke-width="' + (o.grosor || 6.5) + '"' +
      ' stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="' + letra + '">' + f + '</svg>';
  }

  // Valida que un texto solo use letras con símbolo. Devuelve lista de errores.
  function validar(texto) {
    var malos = [];
    var n = normalizar(texto);
    for (var i = 0; i < n.length; i++) {
      var c = n[i];
      if (c === ' ' || FORMAS[c]) continue;
      if (/[.,;:!?¡¿"'()\-–—\n\r\t0-9]/.test(c)) continue; // signos: se ignoran al cifrar
      malos.push(c);
    }
    return malos;
  }

  var API = { LETRAS: LETRAS, FORMAS: FORMAS, normalizar: normalizar, limpiar: limpiar, svgLetra: svgLetra, validar: validar };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else raiz.SIMBOLOS = API;
})(typeof window !== 'undefined' ? window : this);

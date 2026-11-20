/* ==========================================================================
   Cifrado del Caso Inimă. El MISMO archivo se usa en el navegador (window.CRIPTO)
   y en Node (require) para que el build y la app no puedan desincronizarse.

   · Clave:   PBKDF2-SHA256, 200 000 iteraciones, sal de 16 bytes
   · Cifrado: AES-GCM de 256 bits, IV de 12 bytes distinto en cada elemento
   · Formato: { s: sal, i: iv, c: cifrado }  (todo en base64)
   · Hashes:  SHA-256 con sal, para COMPROBAR un sello sin guardarlo en claro
   ========================================================================== */
(function (raiz) {
  'use strict';

  var ITERACIONES = 200000;
  var TE = new TextEncoder();
  var TD = new TextDecoder();
  var web = raiz.crypto || (typeof require !== 'undefined' ? require('node:crypto').webcrypto : null);
  var sutil = web.subtle;

  function aB64(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }
  function deB64(txt) {
    var s = atob(txt), b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }
  function aleatorio(n) { return web.getRandomValues(new Uint8Array(n)); }

  // Sellos: MAYÚSCULAS, sin tildes, sin espacios (conserva la Ñ).
  function normalizarSello(t) {
    return String(t).toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD')
      .replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ').replace(/[^A-ZÑ]/g, '');
  }

  async function derivar(clave, sal) {
    var base = await sutil.importKey('raw', TE.encode(clave), 'PBKDF2', false, ['deriveKey']);
    return sutil.deriveKey(
      { name: 'PBKDF2', salt: sal, iterations: ITERACIONES, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  // Cifra cualquier valor serializable en JSON.
  async function cifrar(valor, clave) {
    var sal = aleatorio(16), iv = aleatorio(12);
    var k = await derivar(clave, sal);
    var c = await sutil.encrypt({ name: 'AES-GCM', iv: iv }, k, TE.encode(JSON.stringify(valor)));
    return { s: aB64(sal), i: aB64(iv), c: aB64(c) };
  }

  // Devuelve el valor, o lanza si la clave es incorrecta (GCM lo detecta).
  async function descifrar(paquete, clave) {
    var k = await derivar(clave, deB64(paquete.s));
    var p = await sutil.decrypt({ name: 'AES-GCM', iv: deB64(paquete.i) }, k, deB64(paquete.c));
    return JSON.parse(TD.decode(p));
  }

  async function hash(valor, sal) {
    var d = await sutil.digest('SHA-256', TE.encode(sal + ':' + valor));
    var b = new Uint8Array(d), h = '';
    for (var i = 0; i < b.length; i++) h += ('0' + b[i].toString(16)).slice(-2);
    return h;
  }
  function salNueva() { return aB64(aleatorio(12)); }

  var API = {
    ITERACIONES: ITERACIONES, normalizarSello: normalizarSello,
    cifrar: cifrar, descifrar: descifrar, hash: hash, salNueva: salNueva
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else raiz.CRIPTO = API;
})(typeof window !== 'undefined' ? window : globalThis);

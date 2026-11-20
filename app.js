/* ==========================================================================
   Caso Inimă · lógica de la app
   Sin frameworks. Todo el contenido que destripa el caso llega CIFRADO en
   datos.js y solo se descifra con un sello (sobre) o con la contraseña del
   autor (pistas). La contraseña del autor nunca se guarda en el móvil.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.CASO, S = window.SIMBOLOS, K = window.CRIPTO;
  var CLAVE = 'caso-inima-v1';
  var TOTAL = C.sobres.length;
  var N_INTERRO = C.interroEn || (TOTAL - 1);

  /* ------------------------------------------------------------------ estado */
  function porDefecto() {
    return { nombre: '', introLeida: false, sellos: {}, notas: {}, marcas: {}, log: {},
             pistasPedidas: {}, acusacion: null, resuelto: false, tab: 'caso' };
  }
  function cargar() {
    try {
      var t = localStorage.getItem(CLAVE);
      if (t) {
        var o = JSON.parse(t), d = porDefecto();
        for (var k in d) if (!(k in o)) o[k] = d[k];
        return o;
      }
    } catch (e) { /* sin almacenamiento: la app sigue funcionando en memoria */ }
    return porDefecto();
  }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* idem */ } }
  var estado = cargar();

  // Lo descifrado vive solo en memoria.
  var mem = {
    cargando: true, sobres: {}, interro: null, final: null,
    pistas: {}, trad: {}, abierto: undefined,
    subCodice: 'alfabeto', desc: '', escr: '',
    sosp: null, confesionVista: false, instalar: null, aviso: {}
  };

  /* ---------------------------------------------------------------- utilidades */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function txt(s) { return esc(String(s).replace(/\{\{detective\}\}/g, estado.nombre || 'detective')); }
  function $(id) { return document.getElementById(id); }
  function nSellos() { return Object.keys(estado.sellos).length; }
  function tieneSello(n) { return !!estado.sellos[n]; }
  function siguiente() {
    for (var n = 1; n <= TOTAL; n++) if (!tieneSello(n)) return n;
    return null;
  }
  function sospechoso(id) { return C.sospechosos.filter(function (x) { return x.id === id; })[0]; }
  function reducido() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  var ICONO = {
    caso: '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/></svg>',
    codice: '<svg viewBox="0 0 24 24"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4"/></svg>',
    expediente: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="1.5"/><path d="M3 7l9 7 9-7"/></svg>',
    sospechosos: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
    acusar: '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L21 21M7.5 10h5M10 7.5v5"/></svg>',
    candado: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    flecha: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>'
  };
  var TABS = [
    { id: 'caso', nombre: 'Caso' }, { id: 'codice', nombre: 'Códice' },
    { id: 'expediente', nombre: 'Expediente' }, { id: 'sospechosos', nombre: 'Sospechosos' },
    { id: 'acusar', nombre: 'Acusar' }
  ];

  /* ------------------------------------------------------------ monitor (ECG) */
  var W = 368, BASE = 28;
  function latido(x, a) {
    function y(d) { return (BASE + d * a).toFixed(1); }
    return ' L' + (x + 18) + ' ' + BASE + ' Q' + (x + 24) + ' ' + y(-6) + ' ' + (x + 30) + ' ' + BASE +
      ' L' + (x + 38) + ' ' + BASE + ' L' + (x + 42) + ' ' + y(4) + ' L' + (x + 47) + ' ' + y(-22) +
      ' L' + (x + 52) + ' ' + y(10) + ' L' + (x + 56) + ' ' + BASE + ' L' + (x + 64) + ' ' + BASE +
      ' Q' + (x + 74) + ' ' + y(-12) + ' ' + (x + 84) + ' ' + BASE;
  }
  function patron(sano) {
    // Sano: cuatro latidos iguales. Sin resolver: tres, el tercero adelantado y flojo, y una pausa (tropiezo).
    var lat = sano ? [[0, 1], [92, 1], [184, 1], [276, 1]] : [[0, 1], [92, 1], [170, 0.5]];
    var d = 'M0 ' + BASE;
    lat.forEach(function (l) { d += ' L' + l[0] + ' ' + BASE + latido(l[0], l[1]); });
    return d + ' L' + W + ' ' + BASE;
  }
  function pintarEcg() {
    var d = patron(estado.resuelto), copias = '';
    for (var i = 0; i < 4; i++) copias += '<path d="' + d + '" transform="translate(' + (i * W) + ')"/>';
    $('ecg').innerHTML = '<svg viewBox="0 0 ' + (W * 4) + ' 46" preserveAspectRatio="none">' + copias + '</svg>';
  }
  function latidoFuerte() {
    var e = $('ecg');
    e.classList.add('fuerte');
    setTimeout(function () { e.classList.remove('fuerte'); }, 1000);
  }

  /* ------------------------------------------------------ cifrado: abrir cosas */
  async function abrirSobre(n, sello) {
    var datos = await K.descifrar(C.sobres[n - 1].datos, sello);
    mem.sobres[n] = datos;
    if (n === N_INTERRO) mem.interro = await K.descifrar(C.interrogatorio, sello);
    return datos;
  }
  async function cargarPartida() {
    var tareas = [];
    Object.keys(estado.sellos).forEach(function (k) {
      tareas.push(abrirSobre(+k, estado.sellos[k]).catch(function () { delete estado.sellos[k]; }));
    });
    if (estado.resuelto && estado.acusacion) {
      var a = estado.acusacion;
      tareas.push(K.descifrar(C.final, [a.quien, a.con, a.donde].join('|')).then(function (f) { mem.final = f; mem.confesionVista = true; })
        .catch(function () { estado.resuelto = false; estado.acusacion = null; }));
    }
    await Promise.all(tareas);
    guardar();
    mem.cargando = false;
  }

  // Ventana de contraseña. intentar(pw) debe devolver un valor o lanzar si la contraseña no vale.
  function pedirPassword(o) {
    return new Promise(function (resolve) {
      var d = $('modal');
      if (!d.showModal) { // navegador sin <dialog>
        var pw = window.prompt(o.titulo + '\n' + o.texto);
        if (pw === null) return resolve(null);
        o.intentar(pw).then(resolve, function () { window.alert('Contraseña incorrecta.'); resolve(null); });
        return;
      }
      d.innerHTML =
        '<form id="fPw" autocomplete="off">' +
        '<h2>' + esc(o.titulo) + '</h2><p class="suave">' + esc(o.texto) + '</p>' +
        '<label class="campo" for="inPw">Contraseña</label>' +
        '<input id="inPw" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" required>' +
        '<p class="mensaje mensaje--error" id="msgPw" role="alert"></p>' +
        '<div class="fila-btn"><button type="button" class="btn" id="cancPw">Cancelar</button>' +
        '<button type="submit" class="btn btn--primario">' + esc(o.boton || 'Mostrar') + '</button></div></form>';
      var fin = false;
      function cerrar(v) { if (fin) return; fin = true; if (d.open) d.close(); resolve(v); }
      d.addEventListener('close', function () { cerrar(null); }, { once: true });
      $('cancPw').onclick = function () { cerrar(null); };
      $('fPw').onsubmit = async function (ev) {
        ev.preventDefault();
        var btn = ev.target.querySelector('[type=submit]');
        btn.disabled = true; $('msgPw').textContent = 'Comprobando…';
        try {
          var v = await o.intentar($('inPw').value);
          cerrar(v === undefined ? true : v);
        } catch (e) {
          btn.disabled = false;
          $('msgPw').textContent = 'Contraseña incorrecta. Inténtalo de nuevo.';
          $('inPw').select();
        }
      };
      d.showModal();
      $('inPw').focus();
    });
  }

  /* ------------------------------------------------------------------ vistas */
  function hoja(titulo, cuerpo, extra) {
    return '<section class="hoja' + (extra ? ' ' + extra : '') + '"><h2 class="pestana">' + txt(titulo) + '</h2>' + cuerpo + '</section>';
  }

  // ---- Caso
  function vCaso() {
    var h = '';
    h += hoja('Historia clínica', C.intro.map(function (p, i) {
      return '<p class="parrafo' + (i === 0 ? ' parrafo--apertura' : '') + '">' + txt(p) + '</p>';
    }).join(''));

    h += hoja('Cómo se juega', '<ol class="reglas">' + C.reglas.map(function (r) { return '<li>' + txt(r) + '</li>'; }).join('') + '</ol>');

    h += hoja('Plano del hospital',
      '<p class="parrafo suave pequeno" style="margin-bottom:12px">Estas son las once salas. En verde, dónde está cada una en la casa.</p>' +
      '<div class="plano">' + C.salas.map(function (s) {
        return '<div class="placa-puerta"><span class="placa-puerta__nombre">' + esc(s.nombre) + '</span>' +
          '<span class="placa-puerta__real">' + esc(s.real) + '</span>' +
          '<span class="placa-puerta__nota">' + esc(s.nota) + '</span>' +
          (s.glifo ? '<span class="placa-puerta__glifo" title="Símbolo de la puerta">' + S.svgLetra(s.glifo, { tam: 30, grosor: 7 }) + '</span>' : '') +
          '</div>';
      }).join('') + '</div>');

    if (!estado.introLeida) {
      h += hoja('Antes de seguir',
        '<p class="parrafo">Cuando hayas leído el caso, las reglas y el plano de arriba, marca que has terminado.</p>' +
        '<div class="fila-btn"><button class="btn btn--primario btn--completo" data-acc="leido">He terminado de leer</button></div>');
    } else {
      h += hoja('Ya puedes empezar',
        '<p class="parrafo"><b>Abre ahora el segundo papel del sobre 1</b>: el sobre pequeño que viene dentro del ramo. ' +
        'Descifra la palabra que lleva en lo alto (el sello) y escríbela en la pestaña Expediente.</p>' +
        '<div class="fila-btn"><button class="btn btn--primario" data-acc="ir" data-tab="expediente">Ir al Expediente</button>' +
        '<button class="btn" data-acc="ir" data-tab="codice">Abrir el Códice</button></div>', 'hoja--aviso');
    }

    h += hoja('Instalar en el móvil',
      '<p class="parrafo pequeno"><b>Android:</b> menú del navegador (tres puntos) y «Instalar aplicación» o «Añadir a pantalla de inicio».</p>' +
      '<p class="parrafo pequeno"><b>iPhone:</b> botón Compartir y «Añadir a pantalla de inicio».</p>' +
      '<p class="parrafo pequeno suave">Una vez abierta una vez, funciona sin conexión.</p>' +
      (mem.instalar ? '<div class="fila-btn"><button class="btn" data-acc="instalar">Instalar ahora</button></div>' : ''));

    h += '<details class="autor"><summary>Zona del autor</summary>' +
      '<p class="pequeno suave">Para quien preparó el juego. Pide la contraseña de pistas.</p>' +
      '<div class="fila-btn"><button class="btn" data-acc="todo">Desbloquear todo (modo prueba)</button>' +
      '<button class="btn" data-acc="reiniciar">Reiniciar partida</button></div></details>';
    return h;
  }

  // ---- Códice
  function glifosPalabras(texto, tam) {
    return S.normalizar(texto).split(/ +/).filter(Boolean).map(function (p) {
      return '<span class="palabra">' + p.split('').filter(function (l) { return S.FORMAS[l]; })
        .map(function (l) { return S.svgLetra(l, { tam: tam || 36, grosor: 7 }); }).join('') + '</span>';
    }).join(' ');
  }
  function vCodice() {
    var sub = mem.subCodice, c = '';
    c += '<div class="pestanas-cod" role="group" aria-label="Herramientas del Códice">' +
      [['alfabeto', 'Alfabeto'], ['descifrar', 'Descifrar'], ['escribir', 'Escribir']].map(function (p) {
        return '<button data-acc="subcod" data-sub="' + p[0] + '" aria-pressed="' + (sub === p[0]) + '">' + p[1] + '</button>';
      }).join('') + '</div>';

    if (sub === 'alfabeto') {
      c += '<p class="parrafo suave pequeno" style="margin-bottom:12px">Cada símbolo es una letra. Los espacios separan palabras.</p><div class="alfabeto">' +
        S.LETRAS.map(function (l) {
          return '<div class="alfabeto__celda">' + S.svgLetra(l, { tam: 44, grosor: 6.5 }) + '<b>' + l + '</b></div>';
        }).join('') + '</div>';
    } else if (sub === 'descifrar') {
      c += '<p class="parrafo suave pequeno" style="margin-bottom:10px">Toca los símbolos tal y como aparecen en el papel y verás qué letras son.</p>' +
        '<div class="lectura' + (mem.desc ? '' : ' lectura--vacia') + '" id="lectura" aria-live="polite">' + (mem.desc ? esc(mem.desc) : 'Aquí aparecerá lo que descifres.') + '</div>' +
        '<div class="teclado" role="group" aria-label="Símbolos">' + S.LETRAS.map(function (l) {
          return '<button class="tecla" data-acc="tecla" data-l="' + l + '">' + S.svgLetra(l, { tam: 34, grosor: 7 }) + '</button>';
        }).join('') + '</div>' +
        '<div class="teclado-acc"><button class="btn" data-acc="espacio">Espacio</button><button class="btn" data-acc="borrar">Borrar</button><button class="btn" data-acc="vaciar">Vaciar</button></div>';
    } else {
      c += '<p class="parrafo suave pequeno" style="margin-bottom:10px">Escribe con letras normales y mira cómo queda en símbolos.</p>' +
        '<label class="campo" for="escr" style="margin-top:0">Tu texto</label>' +
        '<textarea id="escr" maxlength="200" spellcheck="false" placeholder="Escribe aquí…">' + esc(mem.escr) + '</textarea>' +
        '<div class="salida-simbolos" id="salidaSimbolos" aria-live="polite">' + glifosPalabras(mem.escr) + '</div>';
    }
    return hoja('Códice del hospital', c);
  }

  // ---- Expediente
  function lineasGlifos(d) {
    var rojo = d.tipo === 'acrostico';
    return d.lineas.map(function (l) {
      var pal = S.limpiar(l).split(' ');
      return '<div class="linea">' + pal.map(function (p, pi) {
        return '<span class="palabra">' + p.split('').map(function (letra, li) {
          var r = rojo && pi === 0 && li === 0;
          return '<button class="g' + (r ? ' g--roja' : '') + '" data-acc="glifo" data-l="' + letra + '" aria-label="Símbolo. Toca para ver su letra.">' +
            S.svgLetra(letra, { tam: 31, grosor: 7 }) + '<span class="g__l" aria-hidden="true"></span></button>';
        }).join('') + '</span>';
      }).join('') + '</div>';
    }).join('');
  }
  function glifosSello(sello) {
    return '<span class="sello-glifos">' + sello.split('').map(function (l) { return S.svgLetra(l, { tam: 22, grosor: 8 }); }).join('') + '</span>';
  }
  function htmlSobreAbierto(n) {
    var d = mem.sobres[n], h = '';
    if (n === 1) h += '<p class="nota-papel">Este es el <b>segundo papel del sobre pequeño</b> que venía dentro del ramo. Ya puedes tenerlo en la mano.</p>';
    h += '<div class="fila-sello"><span class="sello-goma">Archivado</span>' + glifosSello(CRIPTO_norm(estado.sellos[n])) + '</div>';
    h += '<div class="prueba"><h3>' + txt(d.prueba.titulo) + '</h3><p>' + txt(d.prueba.texto) + '</p></div>';
    h += '<h3 class="sub-m">Acertijo</h3>';
    if (d.tipo === 'espejo') h += '<p class="nota-papel">Este papel está escrito para leerse en un espejo. Ponlo frente al cristal.</p>';
    h += '<div class="acertijo' + (d.tipo === 'espejo' ? ' espejo' : '') + '"><div class="acertijo__lineas">' + lineasGlifos(d) + '</div></div>';
    if (d.tipo === 'acrostico') h += '<p class="pequeno suave" style="margin-top:6px">Fíjate en los símbolos en rojo.</p>';

    var pedidas = estado.pistasPedidas[n] || 0;
    h += '<h3 class="sub-m">¿Atascada?</h3><div class="pistas">';
    for (var i = 0; i < 3; i++) {
      var vista = mem.pistas[n + ':' + i] !== undefined;
      var bloq = i > pedidas;
      h += '<button class="btn" data-acc="pista" data-n="' + n + '" data-i="' + i + '"' + (bloq ? ' disabled' : '') + '>Pista ' + (i + 1) + (vista ? ' ' + ICONO.ok : '') + '</button>';
    }
    h += '</div><div class="fila-btn"><button class="btn btn--completo" data-acc="trad" data-n="' + n + '">Traducción completa</button></div>';
    for (var j = 0; j < 3; j++) {
      if (mem.pistas[n + ':' + j] !== undefined) h += '<div class="pista-visible"><b>Pista ' + (j + 1) + '</b>' + txt(mem.pistas[n + ':' + j]) + '</div>';
    }
    if (mem.trad[n]) h += '<div class="pista-visible"><b>Traducción</b><div class="traduccion">' + txt(mem.trad[n].join('\n')) + '</div></div>';

    h += '<label class="campo" for="nota' + n + '">Mis notas</label><textarea id="nota' + n + '" data-nota="' + n + '" placeholder="Apunta aquí tus sospechas…">' + esc(estado.notas[n] || '') + '</textarea>';
    return h;
  }
  function CRIPTO_norm(s) { return K.normalizarSello(s); }

  function vExpediente() {
    if (mem.cargando) return hoja('Expediente', '<p class="parrafo">Descifrando el expediente…</p>');
    var sig = siguiente();
    if (mem.abierto === undefined) {
      var max = 0; for (var n0 in mem.sobres) max = Math.max(max, +n0);
      mem.abierto = max || sig;
    }
    var h = '<p class="parrafo suave" style="margin:6px 2px 4px">Cada sobre lleva arriba una palabra en símbolos: su sello. Descífrala y escríbela para guardar la prueba en tu expediente.</p>';
    var lista = '';
    C.sobres.forEach(function (s) {
      var n = s.n, d = mem.sobres[n], abierto = !!d, esSig = n === sig, plegado = mem.abierto !== n;
      if (abierto) {
        lista += '<article class="sobre sobre--abierto' + (plegado ? ' sobre--plegado' : '') + '">' +
          '<button class="sobre__cab" data-acc="plegar" data-n="' + n + '" aria-expanded="' + !plegado + '">' +
          '<span class="sobre__num">' + n + '</span><span class="sobre__txt"><span class="sobre__nom">' + txt(d.titulo) + '</span><br><span class="sobre__est">Sobre ' + n + ' · archivado</span></span>' +
          '<span class="sobre__flecha">' + ICONO.flecha + '</span></button><div class="sobre__cuerpo">' + htmlSobreAbierto(n) + '</div></article>';
      } else if (esSig) {
        var msg = mem.aviso[n] ? '<p class="mensaje mensaje--error" role="alert">' + esc(mem.aviso[n]) + '</p>' : '';
        var cuerpo;
        if (n === 1 && !estado.introLeida) {
          cuerpo = '<p class="parrafo">Primero lee la pestaña <b>Caso</b> hasta el final y marca que has terminado. Después podrás abrir el segundo papel del sobre pequeño.</p>' +
            '<div class="fila-btn"><button class="btn btn--primario" data-acc="ir" data-tab="caso">Volver al Caso</button></div>';
        } else {
          cuerpo = '<p class="parrafo">' + (n === 1
            ? 'Abre el <b>segundo papel del sobre pequeño</b> del ramo. En lo alto verás una palabra en símbolos: es su sello.'
            : 'Cuando encuentres el sobre ' + n + ', descifra la palabra en símbolos que lleva en lo alto: es su sello.') + '</p>' +
            '<form class="bloque-sello" data-form="sello" data-n="' + n + '" autocomplete="off">' +
            '<label class="campo" for="sello' + n + '">Escribe el sello del sobre ' + n + '</label>' +
            '<input id="sello' + n + '" class="entrada-sello" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go">' + msg +
            '<button type="submit" class="btn btn--primario btn--completo">Guardar en el expediente</button></form>';
        }
        lista += '<article class="sobre sobre--siguiente"><div class="sobre__cab"><span class="sobre__num">' + n + '</span><span class="sobre__txt"><span class="sobre__nom">Sobre ' + n + '</span><br><span class="sobre__est">Siguiente</span></span></div><div class="sobre__cuerpo">' + cuerpo + '</div></article>';
      } else {
        lista += '<article class="sobre sobre--bloqueado"><div class="sobre__cab"><span class="sobre__num">' + n + '</span><span class="sobre__txt"><span class="sobre__nom">Sobre ' + n + '</span><br><span class="sobre__est">Aparece al guardar el sello del sobre ' + (n - 1) + '</span></span>' + ICONO.candado + '</div></article>';
      }
    });
    return h + '<div style="margin-top:34px"></div>' + lista;
  }

  // ---- Sospechosos
  function cara(x, tam) {
    var t = x.tinta, f = x.color, ojos = '', boca = '', extra = '';
    var tr = 'fill="none" stroke="' + t + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
    var rel = 'fill="' + t + '"';
    if (x.id === 'alegre') {
      ojos = '<path d="M18 28Q23 21 28 28M36 28Q41 21 46 28" ' + tr + '/>';
      boca = '<path d="M17 38Q32 56 47 38Z" fill="' + t + '" stroke="' + t + '" stroke-width="2" stroke-linejoin="round"/>';
    } else if (x.id === 'triste') {
      // Cejas tristes: más altas por dentro que por fuera (al revés serían de enfado).
      ojos = '<circle cx="23" cy="31" r="2.8" ' + rel + '/><circle cx="41" cy="31" r="2.8" ' + rel + '/><path d="M16 26L28 21M48 26L36 21" ' + tr + '/>';
      boca = '<path d="M22 47Q32 39 42 47" ' + tr + '/>';
      extra = '<path d="M44 37Q47 42 44 45Q41 42 44 37Z" fill="#D7ECFF" stroke="' + t + '" stroke-width="1.2"/>';
    } else if (x.id === 'amor') {
      var cor = 'M0 3C-6 -3 -2 -7 0 -3C2 -7 6 -3 0 3Z';
      ojos = '<path transform="translate(23 29) scale(1.35)" d="' + cor + '" ' + rel + '/><path transform="translate(41 29) scale(1.35)" d="' + cor + '" ' + rel + '/>';
      boca = '<path d="M24 41Q32 50 40 41" ' + tr + '/>';
      extra = '<circle cx="14" cy="40" r="4" fill="#fff" opacity=".35"/><circle cx="50" cy="40" r="4" fill="#fff" opacity=".35"/>';
    } else if (x.id === 'enfado') {
      ojos = '<path d="M15 21L28 28M49 21L36 28" ' + tr + '/><circle cx="24" cy="33" r="2.8" ' + rel + '/><circle cx="40" cy="33" r="2.8" ' + rel + '/>';
      boca = '<path d="M21 47L26.5 42L32 47L37.5 42L43 47" ' + tr + '/>';
    } else { // asustado
      ojos = '<circle cx="23" cy="30" r="6" fill="#fff" stroke="' + t + '" stroke-width="2"/><circle cx="41" cy="30" r="6" fill="#fff" stroke="' + t + '" stroke-width="2"/>' +
        '<circle cx="23" cy="31" r="2.2" fill="#2A1F3D"/><circle cx="41" cy="31" r="2.2" fill="#2A1F3D"/><path d="M16 19Q23 14 30 18M34 18Q41 14 48 19" ' + tr + '/>';
      boca = '<ellipse cx="32" cy="47" rx="4.6" ry="6" fill="#2A1F3D" stroke="' + t + '" stroke-width="2"/>';
      extra = '<path d="M52 18Q56 24 52 27Q48 24 52 18Z" fill="#D7ECFF" stroke="' + t + '" stroke-width="1.2"/>';
    }
    return '<svg class="sosp__cara" viewBox="0 0 64 64" width="' + (tam || 76) + '" height="' + (tam || 76) + '" role="img" aria-label="Rostro de ' + esc(x.nombre) + '">' +
      '<circle cx="32" cy="32" r="29" fill="' + f + '" stroke="' + C_TINTA + '" stroke-width="2.5"/>' + ojos + boca + extra + '</svg>';
  }
  var C_TINTA = '#1D2A5B';

  function vSospechosos() {
    if (mem.cargando) return hoja('Sospechosos', '<p class="parrafo">Descifrando el expediente…</p>');
    if (mem.sosp && mem.interro) return vInterrogatorio(sospechoso(mem.sosp));
    mem.sosp = null;
    var h = '';
    if (!mem.interro) {
      var faltan = 0; for (var n = 1; n <= N_INTERRO; n++) if (!tieneSello(n)) faltan++;
      h += '<div class="bloqueo">' + ICONO.candado + '<div><b>Interrogatorio cerrado.</b> Se abre al guardar el sello del sobre ' + N_INTERRO + '. ' +
        (faltan === 1 ? 'Te falta 1 sello.' : 'Te faltan ' + faltan + ' sellos.') + ' Mientras tanto, puedes anotar tus impresiones.</div></div>';
    } else if (!estado.resuelto) {
      h += '<p class="parrafo suave" style="margin:4px 2px 10px">Interroga a los cinco. Cuatro dicen la verdad; una miente.</p>';
    }
    h += C.sospechosos.map(function (x) {
      var m = estado.marcas[x.id] || 'sin';
      var cls = m === 'desc' ? ' sosp--descartado' : (m === 'sosp' ? ' sosp--sospechoso' : '');
      return '<article class="sosp' + cls + '">' + cara(x) +
        '<div><h3 class="sosp__nom">' + esc(x.titulo) + '</h3><p class="sosp__rol">' + esc(x.rol) + '</p><p class="sosp__desc">' + esc(x.descripcion) + '</p></div>' +
        '<div class="sosp__pie"><div class="marcas" role="group" aria-label="Tu opinión sobre ' + esc(x.nombre) + '">' +
        [['sin', 'Sin decidir', ''], ['desc', 'Descartado', ''], ['sosp', 'Sospechoso', 'm-sosp']].map(function (o) {
          return '<button class="' + o[2] + '" data-acc="marca" data-id="' + x.id + '" data-m="' + o[0] + '" aria-pressed="' + (m === o[0]) + '">' + o[1] + '</button>';
        }).join('') + '</div>' +
        (mem.interro ? '<button class="btn btn--primario" data-acc="interrogar" data-id="' + x.id + '">Interrogar a ' + esc(x.nombre) + '</button>' : '') +
        '</div></article>';
    }).join('');
    return h;
  }

  function vInterrogatorio(x) {
    var I = mem.interro[x.id], log = estado.log[x.id] || [];
    var h = '<button class="btn btn--enlace volver" data-acc="volver">‹ Volver a los sospechosos</button>';
    h += '<div class="cabecera-sosp">' + cara(x, 64) + '<div><h2 class="titulo-m" style="margin:0">' + esc(x.titulo) + '</h2><p class="sosp__rol">' + esc(x.rol) + '</p></div></div>';
    h += '<div class="charla" aria-live="polite">';
    function dice(texto) { return '<div class="burbuja" style="border-color:' + x.color + '"><b>' + esc(x.nombre) + '</b>' + txt(texto) + '</div>'; }
    h += dice(x.saludo);
    log.forEach(function (e) {
      if (e.t === 'q') {
        var q = I.preguntas.filter(function (p) { return p.id === e.id; })[0];
        h += '<div class="burbuja burbuja--yo"><b>Tú</b>' + esc(q.q) + '</div>' + dice(q.a);
      } else {
        var titulo = pruebaTitulo(e.id);
        h += '<div class="burbuja burbuja--yo"><b>Tú</b>Le presento una prueba: «' + esc(titulo) + '».</div>' + dice(I.reacciones[e.id] || I.defecto);
      }
    });
    h += '</div>';

    h += '<h3 class="sub-m">Preguntar</h3><div class="preguntas">' + I.preguntas.map(function (p) {
      var hecha = log.some(function (e) { return e.t === 'q' && e.id === p.id; });
      return '<button class="btn" data-acc="preguntar" data-s="' + x.id + '" data-q="' + p.id + '"' + (hecha ? ' disabled' : '') + '>' + esc(p.q) + (hecha ? '<span class="hecha">' + ICONO.ok + '</span>' : '') + '</button>';
    }).join('') + '</div>';

    var disponibles = Object.keys(I.reacciones).filter(function (id) { return pruebaTitulo(id); });
    h += '<h3 class="sub-m">Presentar una prueba</h3>';
    if (!disponibles.length) h += '<p class="suave">Aún no tienes pruebas que presentar.</p>';
    else h += '<div class="preguntas">' + disponibles.map(function (id) {
      var hecha = log.some(function (e) { return e.t === 'p' && e.id === id; });
      return '<button class="btn" data-acc="presentar" data-s="' + x.id + '" data-p="' + id + '"' + (hecha ? ' disabled' : '') + '>' + esc(pruebaTitulo(id)) + (hecha ? '<span class="hecha">' + ICONO.ok + '</span>' : '') + '</button>';
    }).join('') + '</div>';
    return h;
  }
  function pruebaTitulo(id) {
    for (var n in mem.sobres) if (mem.sobres[n].prueba.id === id) return mem.sobres[n].prueba.titulo;
    return null;
  }

  // ---- Acusar
  function vAcusar() {
    if (mem.cargando) return hoja('Acusación', '<p class="parrafo">Descifrando el expediente…</p>');
    if (estado.resuelto && mem.final) return vResuelto();
    if (!tieneSello(TOTAL)) {
      var faltan = 0; for (var n = 1; n <= TOTAL; n++) if (!tieneSello(n)) faltan++;
      return '<div class="bloqueo">' + ICONO.candado + '<div><b>La acusación está cerrada.</b> Se abre al guardar el sello del sobre ' + TOTAL + ' (el último). ' +
        (faltan === 1 ? 'Te falta 1 sello.' : 'Te faltan ' + faltan + ' sellos.') + '</div></div>';
    }
    function opciones(lista, campo) {
      return '<option value="">Elige…</option>' + lista.map(function (o) { return '<option value="' + o.id + '">' + esc(o.nombre) + '</option>'; }).join('');
    }
    var msg = mem.aviso.acusar ? '<p class="mensaje mensaje--error" role="alert">' + esc(mem.aviso.acusar) + '</p>' : '';
    return hoja('Acusación formal',
      '<p class="parrafo">Has reunido todas las pruebas. Es el momento de decidir.</p>' +
      '<form class="acusar-form" data-form="acusar" autocomplete="off">' +
      '<label class="campo" for="selQuien">¿Quién lo robó?</label><select id="selQuien">' + opciones(C.sospechosos) + '</select>' +
      '<label class="campo" for="selCon">¿Con qué?</label><select id="selCon">' + opciones(C.objetos) + '</select>' +
      '<label class="campo" for="selDonde">¿Dónde está ahora el corazón?</label><select id="selDonde">' + opciones(C.salas) + '</select>' + msg +
      '<div class="fila-btn"><button type="submit" class="btn btn--corazon btn--completo">Presentar la acusación</button></div></form>');
  }
  function vResuelto() {
    var f = mem.final, animar = !mem.confesionVista && !reducido();
    var h = '<div style="padding:6px 2px 0"><span class="titulo-resuelto">' + txt(f.acierto_titulo) + '</span></div><div class="confesion">';
    f.confesion.forEach(function (p, i) {
      h += '<p' + (animar ? ' class="aparece" style="animation-delay:' + (0.4 + i * 1.9).toFixed(1) + 's"' : '') + '>' + txt(p) + '</p>';
    });
    h += '</div><div class="cierre' + (animar ? ' aparece' : '') + '"' + (animar ? ' style="animation-delay:' + (0.4 + f.confesion.length * 1.9).toFixed(1) + 's"' : '') + '>' + txt(f.cierre) + '</div>';
    mem.confesionVista = true;
    return h;
  }

  /* ------------------------------------------------------------------ render */
  var VISTAS = { caso: vCaso, codice: vCodice, expediente: vExpediente, sospechosos: vSospechosos, acusar: vAcusar };
  function render(opciones) {
    opciones = opciones || {};
    var tab = VISTAS[estado.tab] ? estado.tab : 'caso';
    $('cuenta').innerHTML = '<b>' + nSellos() + '</b> de ' + TOTAL + ' sobres';
    $('barra').innerHTML = '<div class="barra__fila">' + TABS.map(function (t) {
      var punto = (t.id === 'acusar' && tieneSello(TOTAL) && !estado.resuelto) || (t.id === 'sospechosos' && mem.interro && !Object.keys(estado.log).length);
      return '<button data-acc="ir" data-tab="' + t.id + '"' + (t.id === tab ? ' aria-current="page"' : '') + '>' + ICONO[t.id] + t.nombre + (punto ? '<span class="punto"></span>' : '') + '</button>';
    }).join('') + '</div>';
    $('pantalla').innerHTML = VISTAS[tab]();
    if (opciones.arriba) window.scrollTo(0, 0);
  }
  function irA(tab) { estado.tab = tab; if (tab !== 'sospechosos') mem.sosp = null; guardar(); render({ arriba: true }); }

  /* ------------------------------------------------------------------ acciones */
  async function probarSello(n, texto) {
    var norm = K.normalizarSello(texto);
    if (!norm) { mem.aviso[n] = 'Escribe la palabra que has descifrado.'; return render(); }
    var coincide = null;
    for (var i = 0; i < C.sobres.length; i++) {
      var s = C.sobres[i].sello;
      if (await K.hash(norm, s.sal) === s.h) { coincide = C.sobres[i].n; break; }
    }
    if (coincide === null) mem.aviso[n] = 'Ese sello no corresponde a ningún sobre. Revisa el descifrado letra a letra.';
    else if (coincide < n) mem.aviso[n] = 'Ese sello ya lo tienes guardado (sobre ' + coincide + ').';
    else if (coincide > n) mem.aviso[n] = 'Ese sello no es el del siguiente sobre.';
    else {
      try {
        await abrirSobre(n, norm);
        estado.sellos[n] = norm; mem.aviso[n] = ''; mem.abierto = n; guardar();
        render(); latidoFuerte();
        var el = document.querySelector('.sobre--abierto:not(.sobre--plegado)');
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: reducido() ? 'auto' : 'smooth' });
        return;
      } catch (e) { mem.aviso[n] = 'No se ha podido abrir el sobre. Inténtalo de nuevo.'; }
    }
    render();
    var campo = $('sello' + n); if (campo) { campo.value = ''; campo.focus(); }
  }

  async function pedirPista(n, i) {
    var r = await pedirPassword({
      titulo: 'Pista protegida', texto: 'Esta ayuda la desbloquea ' + C.meta.autor + ', quien preparó el juego. Pídele la contraseña.',
      intentar: function (pw) { return K.descifrar(C.sobres[n - 1].pistas[i], pw); }
    });
    if (r === null) return;
    mem.pistas[n + ':' + i] = r;
    estado.pistasPedidas[n] = Math.max(estado.pistasPedidas[n] || 0, i + 1); guardar();
    render();
  }
  async function pedirTraduccion(n) {
    var r = await pedirPassword({
      titulo: 'Traducción protegida', texto: 'Si te rindes con el descifrado, ' + C.meta.autor + ' puede abrirte la traducción completa.',
      intentar: function (pw) { return K.descifrar(C.sobres[n - 1].traduccion, pw); }
    });
    if (r === null) return;
    mem.trad[n] = r; render();
  }
  function pedirAutor(texto, accion) {
    return pedirPassword({
      titulo: 'Zona del autor', texto: texto, boton: 'Continuar',
      intentar: async function (pw) { await K.descifrar(C.verifica, pw); return pw; }
    }).then(function (pw) { if (pw) return accion(pw); });
  }
  async function desbloquearTodo(pw) {
    var sellos = await K.descifrar(C.sellosCifrados, pw);
    Object.keys(sellos).forEach(function (k) { estado.sellos[k] = sellos[k]; });
    estado.introLeida = true; mem.cargando = true; render();
    await cargarPartida(); mem.abierto = undefined; render();
  }
  function reiniciar() {
    try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
    window.location.reload();
  }

  async function acusar() {
    var v = { quien: $('selQuien').value, con: $('selCon').value, donde: $('selDonde').value };
    if (!v.quien || !v.con || !v.donde) { mem.aviso.acusar = 'Elige una respuesta en cada pregunta antes de acusar.'; return render(); }
    var A = C.acusacion, bien = 0;
    if (await K.hash('quien:' + v.quien, A.sal) === A.quien) bien++;
    if (await K.hash('con:' + v.con, A.sal) === A.con) bien++;
    if (await K.hash('donde:' + v.donde, A.sal) === A.donde) bien++;
    if (bien < 3) {
      mem.aviso.acusar = 'Aciertas ' + bien + ' de 3. Vuelve al expediente y revisa las pruebas.';
      render();
      ['selQuien', 'selCon', 'selDonde'].forEach(function (id, i) { $(id).value = [v.quien, v.con, v.donde][i]; });
      return;
    }
    mem.final = await K.descifrar(C.final, [v.quien, v.con, v.donde].join('|'));
    estado.resuelto = true; estado.acusacion = v; mem.aviso.acusar = ''; mem.confesionVista = false; guardar();
    pintarEcg(); render({ arriba: true }); latidoFuerte();
  }

  /* ------------------------------------------------------------------ eventos */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-acc]');
    if (!el) return;
    var a = el.getAttribute('data-acc'), d = el.dataset;
    switch (a) {
      case 'ir': irA(d.tab); break;
      case 'leido': estado.introLeida = true; guardar(); render(); window.scrollTo(0, document.body.scrollHeight); break;
      case 'instalar':
        if (mem.instalar) { mem.instalar.prompt(); mem.instalar = null; render(); }
        break;
      case 'todo': pedirAutor('Esto abre todos los sobres en este móvil, para probar el juego.', desbloquearTodo); break;
      case 'reiniciar': pedirAutor('Esto borra toda la partida de este móvil.', reiniciar); break;
      case 'subcod': mem.subCodice = d.sub; render(); break;
      case 'tecla': mem.desc += d.l; actualizarLectura(); break;
      case 'espacio': if (mem.desc && mem.desc.slice(-1) !== ' ') mem.desc += ' '; actualizarLectura(); break;
      case 'borrar': mem.desc = mem.desc.slice(0, -1); actualizarLectura(); break;
      case 'vaciar': mem.desc = ''; actualizarLectura(); break;
      case 'plegar': mem.abierto = (mem.abierto === +d.n) ? null : +d.n; render(); break;
      case 'glifo':
        var cap = el.querySelector('.g__l');
        if (el.classList.toggle('visto')) cap.textContent = d.l; else cap.textContent = '';
        break;
      case 'pista': pedirPista(+d.n, +d.i); break;
      case 'trad': pedirTraduccion(+d.n); break;
      case 'marca': estado.marcas[d.id] = d.m; guardar(); render(); break;
      case 'interrogar': mem.sosp = d.id; render({ arriba: true }); break;
      case 'volver': mem.sosp = null; render({ arriba: true }); break;
      case 'preguntar': pushLog(d.s, { t: 'q', id: d.q }); break;
      case 'presentar': pushLog(d.s, { t: 'p', id: d.p }); break;
    }
  });
  function pushLog(sid, entrada) {
    var l = estado.log[sid] = estado.log[sid] || [];
    if (l.some(function (e) { return e.t === entrada.t && e.id === entrada.id; })) return;
    l.push(entrada); guardar(); render();
    var burbujas = document.querySelectorAll('.charla .burbuja');
    if (burbujas.length) burbujas[burbujas.length - 1].scrollIntoView({ block: 'center', behavior: reducido() ? 'auto' : 'smooth' });
  }
  function actualizarLectura() {
    var l = $('lectura'); if (!l) return;
    l.textContent = mem.desc || 'Aquí aparecerá lo que descifres.';
    l.classList.toggle('lectura--vacia', !mem.desc);
  }
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-form]');
    if (!f) return;
    e.preventDefault();
    if (f.dataset.form === 'sello') probarSello(+f.dataset.n, f.querySelector('input').value);
    else if (f.dataset.form === 'acusar') acusar();
  });
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'escr') { mem.escr = t.value; $('salidaSimbolos').innerHTML = glifosPalabras(mem.escr); }
    else if (t.dataset && t.dataset.nota) { estado.notas[t.dataset.nota] = t.value; guardar(); }
  });
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); mem.instalar = e; if (estado.tab === 'caso') render(); });

  $('formPlaca').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('nombreDetective').value.trim();
    if (!v) return;
    estado.nombre = v; guardar();
    $('placa').hidden = true; document.body.classList.remove('sin-scroll');
    render({ arriba: true });
  });

  /* ------------------------------------------------------------------ arranque */
  function arrancar() {
    $('hospital').textContent = C.meta.hospital;
    document.title = C.meta.titulo;
    pintarEcg();
    if (!estado.nombre) { $('placa').hidden = false; document.body.classList.add('sin-scroll'); setTimeout(function () { $('nombreDetective').focus(); }, 50); }
    render();
    cargarPartida().then(function () { render(); });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sin SW la app sigue siendo usable */ });
    }
  }
  arrancar();
})();

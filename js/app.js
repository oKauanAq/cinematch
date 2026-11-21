/* app.js — interface e estado do CineMatch.
   Organização: 1) estado  2) utilidades de DOM  3) componentes (pôster, cartão, toast)
   4) telas (descobrir, match, buscar, favoritos, histórico)  5) tema/configurações  6) início. */
(function () {
  'use strict';
  const { storage, movies, recommend, api } = window.CM;
  const { lista, generos: TODOS_GENEROS, humores: HUMORES, porId, formatarDuracao } = movies;

  /* ---------- 1) ESTADO (tudo vem do LocalStorage ao abrir) ---------- */
  const PREFS_PADRAO = { humor: '', generos: [], tempo: 120, idadeMax: 18 };
  const estado = {
    prefs: Object.assign({}, PREFS_PADRAO, storage.ler('prefs', {})),
    favoritos: storage.ler('favoritos', []),     // [id]
    historico: storage.ler('historico', []),     // [{ id, data }]
    avaliacoes: storage.ler('avaliacoes', {}),   // { id: 1..5 }
    recusados: storage.ler('recusados', []),     // [id] — não voltam nas recomendações
    vistosNaSessao: new Set(),                   // para "Outras 3" não repetir
    atuais: [],                                  // as 3 sugestões na tela
    fila: []                                     // fila do modo Match
  };
  const LIMITE_HISTORICO = 30;

  /* ---------- 2) UTILIDADES DE DOM ---------- */
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

  /** Cria elemento: h('div', {class:'x', onclick: fn}, 'texto', outroNo). Sempre textContent (sem innerHTML). */
  function h(tag, attrs = {}, ...filhos) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    // ignora null/false/undefined (antes virava o texto "null" na tela)
    filhos.flat().forEach(f => {
      if (f == null || f === false) return;
      el.append(f instanceof Node ? f : document.createTextNode(f));
    });
    return el;
  }

  const reduzMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ehFavorito = id => estado.favoritos.includes(id);

  /* ---------- 3) COMPONENTES ---------- */

  /** Toast de feedback (heurística: visibilidade do estado). `desfazer` é opcional. */
  function toast(mensagem, desfazer) {
    const caixa = $('#toasts');
    const item = h('div', { class: 'toast' }, h('span', {}, mensagem));
    const remover = () => item.remove();
    if (desfazer) {
      item.append(h('button', { type: 'button', class: 'toast__btn', onclick: () => { desfazer(); remover(); } }, 'Desfazer'));
    }
    caixa.append(item);
    setTimeout(remover, desfazer ? 6000 : 3200);
  }

  /** Matiz (0–359) estável calculado do título: cada pôster tem sua cor. */
  function matiz(texto) {
    let n = 0;
    for (const c of texto) n = (n * 31 + c.charCodeAt(0)) % 360;
    return n;
  }

  /** Pôster gerado em CSS. Se houver chave do TMDb, troca pela imagem real. */
  function posterEl(filme) {
    const m = matiz(filme.titulo);
    const el = h('div', {
      class: 'poster',
      style: '--m:' + m,
      role: 'img',
      'aria-label': 'Pôster de ' + filme.titulo
    },
      h('span', { class: 'poster__tipo' }, filme.tipo),
      h('span', { class: 'poster__titulo' }, filme.titulo),
      h('span', { class: 'poster__ano' }, String(filme.ano))
    );
    if (api.temChave()) {
      api.posterDe(filme).then(url => {
        if (!url) return;
        const img = h('img', { src: url, alt: 'Pôster de ' + filme.titulo, loading: 'lazy' });
        el.replaceChildren(img);
        el.classList.add('poster--real');
        el.removeAttribute('role');
        el.removeAttribute('aria-label');
      });
    }
    return el;
  }

  /** Estrelas de avaliação (1–5). Clicar na mesma nota remove a avaliação. */
  function estrelasEl(id) {
    const nota = estado.avaliacoes[id] || 0;
    const grupo = h('div', { class: 'estrelas', role: 'group', 'aria-label': 'Sua avaliação' });
    for (let i = 1; i <= 5; i++) {
      grupo.append(h('button', {
        type: 'button', class: 'estrela' + (i <= nota ? ' estrela--on' : ''),
        'aria-label': i + (i === 1 ? ' estrela' : ' estrelas'), 'aria-pressed': String(i === nota),
        onclick: () => avaliar(id, i === nota ? 0 : i)
      }, '★'));
    }
    return grupo;
  }

  /** Cartão de título. opcoes: { motivo, estrelas } */
  function cartaoEl(filme, opcoes = {}) {
    const fav = ehFavorito(filme.id);
    const botaoFav = h('button', {
      type: 'button', class: 'btn-fav' + (fav ? ' btn-fav--on' : ''),
      'aria-pressed': String(fav),
      'aria-label': (fav ? 'Remover dos favoritos: ' : 'Adicionar aos favoritos: ') + filme.titulo,
      onclick: () => alternarFavorito(filme.id)
    }, fav ? '♥' : '♡');

    return h('article', { class: 'cartao', 'data-id': filme.id },
      h('div', { class: 'cartao__poster' }, posterEl(filme), botaoFav),
      h('div', { class: 'cartao__corpo' },
        h('h3', { class: 'cartao__titulo' }, filme.titulo),
        h('p', { class: 'cartao__meta' },
          h('span', { class: 'nota', title: 'Nota de referência' }, '★ ' + filme.nota.toFixed(1)),
          ' · ' + formatarDuracao(filme.duracao) + (filme.tipo === 'série' ? '/ep' : '') +
          ' · ' + (filme.idade ? filme.idade + '+' : 'Livre')),
        h('p', { class: 'cartao__cat' }, filme.generos.join(' · ')),
        opcoes.motivo ? h('p', { class: 'cartao__motivo' }, opcoes.motivo) : null,
        h('p', { class: 'cartao__sinopse' }, filme.sinopse),
        opcoes.estrelas ? estrelasEl(filme.id) : null
      )
    );
  }

  /* ---------- AÇÕES SOBRE OS DADOS ---------- */

  /** Adiciona/remove favorito (RF03/RF04), com toast e "Desfazer". */
  function alternarFavorito(id) {
    const filme = porId(id);
    const estava = ehFavorito(id);
    if (estava) estado.favoritos = estado.favoritos.filter(f => f !== id);
    else estado.favoritos.push(id);
    storage.salvar('favoritos', estado.favoritos);
    toast(estava ? filme.titulo + ' saiu dos favoritos.' : filme.titulo + ' foi para os favoritos!',
      () => alternarFavorito(id));
    atualizarTudo();
  }

  function avaliar(id, nota) {
    if (nota) estado.avaliacoes[id] = nota; else delete estado.avaliacoes[id];
    storage.salvar('avaliacoes', estado.avaliacoes);
    renderFavoritos();
  }

  /** Registra no histórico (RF05): mais recente primeiro, sem duplicar, máx. 30. */
  function registrarHistorico(ids) {
    const agora = new Date().toISOString();
    ids.forEach(id => {
      estado.historico = estado.historico.filter(x => x.id !== id);
      estado.historico.unshift({ id, data: agora });
    });
    estado.historico = estado.historico.slice(0, LIMITE_HISTORICO);
    storage.salvar('historico', estado.historico);
  }

  /** Re-renderiza o que depende de favoritos (cartões visíveis, contador, listas). */
  function atualizarTudo() {
    $('#cont-fav').textContent = estado.favoritos.length;
    renderResultado();
    renderBusca();
    renderFavoritos();
    renderMatchInfo();
  }

  /* ---------- 4) TELAS ---------- */

  /* --- Navegação por abas (hash na URL) --- */
  const ABAS = ['descobrir', 'match', 'buscar', 'favoritos', 'historico'];
  function irParaAba(nome, mover) {
    if (!ABAS.includes(nome)) nome = 'descobrir';
    ABAS.forEach(a => { $('#' + a).hidden = a !== nome; });
    $$('.abas a').forEach(a => {
      const ativa = a.dataset.aba === nome;
      a.classList.toggle('ativa', ativa);
      if (ativa) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (nome === 'historico') renderHistorico();
    if (nome === 'favoritos') renderFavoritos();
    if (nome === 'match') renderMatch();
    document.title = 'CineMatch — ' + nome.charAt(0).toUpperCase() + nome.slice(1);
    if (mover) { window.scrollTo({ top: 0 }); $('#conteudo').focus({ preventScroll: true }); }
  }
  const abaDoHash = () => location.hash.replace('#', '') || 'descobrir';

  /* --- DESCOBRIR: formulário de preferências (RF01) --- */
  function montarFormulario() {
    // Humores como cartões clicáveis (radios estilizados)
    const caixaHumor = $('#humores');
    Object.entries(HUMORES).forEach(([chave, info]) => {
      caixaHumor.append(h('label', { class: 'humor' },
        h('input', { type: 'radio', name: 'humor', value: chave }),
        h('span', { class: 'humor__icone', 'aria-hidden': 'true' }, info.icone),
        h('span', { class: 'humor__nome' }, info.rotulo)));
    });
    // Gêneros como "chips" (checkboxes estilizados)
    const caixaGen = $('#generos');
    TODOS_GENEROS.forEach(g => {
      caixaGen.append(h('label', { class: 'chip' },
        h('input', { type: 'checkbox', name: 'genero', value: g }), h('span', {}, g)));
    });
    // Mesmos gêneros no filtro da busca
    TODOS_GENEROS.forEach(g => $('#busca-genero').append(h('option', { value: g }, g)));
    aplicarPrefsNoFormulario();
  }

  function aplicarPrefsNoFormulario() {
    const p = estado.prefs;
    $$('input[name="humor"]').forEach(i => { i.checked = i.value === p.humor; });
    $$('input[name="genero"]').forEach(i => { i.checked = p.generos.includes(i.value); });
    $$('input[name="tempo"]').forEach(i => { i.checked = Number(i.value) === p.tempo; });
    $$('input[name="idade"]').forEach(i => { i.checked = Number(i.value) === p.idadeMax; });
  }

  function lerPrefsDoFormulario() {
    const humor = $('input[name="humor"]:checked');
    return {
      humor: humor ? humor.value : '',
      generos: $$('input[name="genero"]:checked').map(i => i.value),
      tempo: Number($('input[name="tempo"]:checked').value),
      idadeMax: Number($('input[name="idade"]:checked').value)
    };
  }

  /** Validação com mensagem clara (heurística: prevenção de erros). */
  function validarPrefs(p) {
    if (!p.humor) return 'Escolha como você está agora (passo 1).';
    if (!p.generos.length) return 'Marque pelo menos um gênero (passo 2).';
    return '';
  }

  function mostrarErro(msg) {
    const e = $('#erro-prefs');
    e.textContent = msg;
    e.hidden = !msg;
  }

  /** Gera 3 recomendações (RF02). `novas` = true é o botão "Outras 3". */
  function gerarRecomendacoes(novas) {
    const excluir = new Set([...estado.recusados, ...(novas ? estado.vistosNaSessao : [])]);
    let picks = recommend.recomendar(estado.prefs, { excluir, quantidade: 3 });
    if (picks.length < 3 && novas) {
      // acabou o estoque: recomeça a rodada, avisando o usuário
      estado.vistosNaSessao.clear();
      picks = recommend.recomendar(estado.prefs, { excluir: new Set(estado.recusados), quantidade: 3 });
      toast('Você já viu tudo que combina — recomeçando a lista.');
    }
    estado.atuais = picks;
    picks.forEach(p => estado.vistosNaSessao.add(p.filme.id));
    registrarHistorico(picks.map(p => p.filme.id));
    renderResultado();
  }

  function renderResultado() {
    const caixa = $('#resultado');
    if (!estado.atuais.length) { caixa.hidden = true; return; }
    caixa.hidden = false;
    $('#grade-resultado').replaceChildren(
      ...estado.atuais.map(p => cartaoEl(p.filme, { motivo: p.motivo })));
  }

  /* --- MATCH --- */
  function montarFila() {
    const fora = new Set([...estado.recusados, ...estado.favoritos]);
    const candidatos = lista.filter(f => !fora.has(f.id) && f.idade <= estado.prefs.idadeMax);
    // embaralha (Fisher–Yates)
    for (let i = candidatos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]];
    }
    estado.fila = candidatos;
  }

  function renderMatchInfo() {
    $('#info-recusados').textContent = estado.recusados.length
      ? '(' + estado.recusados.length + ' recusado' + (estado.recusados.length > 1 ? 's' : '') + ')' : '';
  }

  function renderMatch() {
    renderMatchInfo();
    const area = $('#match-area');
    const disponivel = estado.fila.length > 0;
    $('#btn-aceitar').disabled = !disponivel;
    $('#btn-recusar').disabled = !disponivel;
    if (!disponivel) {
      area.replaceChildren(h('p', { class: 'vazio' }, 'Acabaram os títulos do Match. Use "Esquecer títulos recusados" para recomeçar.'));
      return;
    }
    const filme = estado.fila[0];
    const cartao = cartaoEl(filme);
    cartao.classList.add('cartao--match');
    cartao.querySelector('.btn-fav').remove(); // aqui as ações são os botões grandes
    ativarArrastar(cartao);
    area.replaceChildren(cartao, h('p', { class: 'sub sub--pequeno' }, 'Restam ' + estado.fila.length + ' títulos nesta rodada.'));
  }

  function decidirMatch(aceitou) {
    if (!estado.fila.length) return;
    const filme = estado.fila.shift();
    if (aceitou) {
      if (!ehFavorito(filme.id)) { estado.favoritos.push(filme.id); storage.salvar('favoritos', estado.favoritos); }
      toast(filme.titulo + ' → favoritos ♥');
    } else {
      estado.recusados.push(filme.id);
      storage.salvar('recusados', estado.recusados);
      toast(filme.titulo + ' recusado. Não vai mais aparecer.', () => {
        estado.recusados = estado.recusados.filter(x => x !== filme.id);
        storage.salvar('recusados', estado.recusados);
        estado.fila.unshift(filme);
        renderMatch();
      });
    }
    $('#cont-fav').textContent = estado.favoritos.length;
    renderMatch();
  }

  /** Gesto de arrastar (mouse e toque) no cartão do Match. */
  function ativarArrastar(cartao) {
    let inicioX = null, dx = 0;
    cartao.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      inicioX = e.clientX; dx = 0; cartao.setPointerCapture(e.pointerId);
      cartao.classList.add('arrastando');
    });
    cartao.addEventListener('pointermove', e => {
      if (inicioX === null) return;
      dx = e.clientX - inicioX;
      cartao.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 20 + 'deg)';
      cartao.dataset.lado = dx > 40 ? 'aceitar' : dx < -40 ? 'recusar' : '';
    });
    const soltar = () => {
      if (inicioX === null) return;
      const limite = 90;
      inicioX = null;
      cartao.classList.remove('arrastando');
      if (dx > limite) decidirMatch(true);
      else if (dx < -limite) decidirMatch(false);
      else { cartao.style.transform = ''; cartao.dataset.lado = ''; }
    };
    cartao.addEventListener('pointerup', soltar);
    cartao.addEventListener('pointercancel', soltar);
  }

  /* --- BUSCAR --- */
  function renderBusca() {
    const texto = $('#busca-texto').value.trim().toLowerCase();
    const genero = $('#busca-genero').value;
    const tipo = $('#busca-tipo').value;
    const achados = lista.filter(f =>
      (!texto || f.titulo.toLowerCase().includes(texto) || f.sinopse.toLowerCase().includes(texto)) &&
      (!genero || f.generos.includes(genero)) &&
      (!tipo || f.tipo === tipo));
    $('#busca-info').textContent = achados.length
      ? achados.length + (achados.length === 1 ? ' título encontrado.' : ' títulos encontrados.')
      : 'Nenhum título com esses filtros. Tente outro termo ou limpe o gênero.';
    $('#grade-busca').replaceChildren(...achados.map(f => cartaoEl(f)));
  }

  /* --- FAVORITOS + ESTATÍSTICAS + DECIDE POR MIM --- */
  function renderFavoritos() {
    const favs = estado.favoritos.map(porId).filter(Boolean);
    $('#vazio-fav').hidden = favs.length > 0;
    $('#btn-decide').disabled = favs.length < 2;
    $('#grade-fav').replaceChildren(...favs.map(f => cartaoEl(f, { estrelas: true })));
    renderEstatisticas(favs);
  }

  function renderEstatisticas(favs) {
    const caixa = $('#estatisticas');
    caixa.hidden = favs.length === 0;
    if (!favs.length) return;

    const porGenero = {};
    favs.forEach(f => f.generos.forEach(g => { porGenero[g] = (porGenero[g] || 0) + 1; }));
    const ordenado = Object.entries(porGenero).sort((a, b) => b[1] - a[1]);
    const maximo = ordenado[0][1];
    const minutos = favs.reduce((s, f) => s + f.duracao, 0);
    const notas = Object.values(estado.avaliacoes);
    const media = notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : '—';

    const numero = (valor, rotulo) => h('div', { class: 'stat' }, h('strong', {}, valor), h('span', {}, rotulo));
    const barras = h('ul', { class: 'barras', 'aria-label': 'Favoritos por gênero' },
      ordenado.slice(0, 6).map(([g, n]) => h('li', {},
        h('span', { class: 'barras__nome' }, g),
        h('span', { class: 'barras__trilho' }, h('span', { class: 'barras__valor', style: 'width:' + (n / maximo * 100) + '%' })),
        h('span', { class: 'barras__n' }, String(n)))));

    caixa.replaceChildren(
      h('h3', {}, 'Suas estatísticas'),
      h('div', { class: 'stats__nums' },
        numero(String(favs.length), 'favoritos'),
        numero(ordenado[0][0], 'gênero mais salvo'),
        numero(formatarDuracao(minutos), 'para ver um de cada'),
        numero(media === '—' ? media : media + ' ★', 'sua nota média')),
      barras);
  }

  /** "Decide por mim": embaralha os nomes e para num sorteado. */
  let sorteando = false;
  function decidirPorMim() {
    const favs = estado.favoritos.map(porId).filter(Boolean);
    if (favs.length < 2 || sorteando) return;
    const caixa = $('#sorteio');
    const escolhido = favs[Math.floor(Math.random() * favs.length)];
    caixa.hidden = false;
    caixa.classList.remove('sorteio--fim');

    const finalizar = () => {
      caixa.classList.add('sorteio--fim');
      caixa.replaceChildren(h('p', {}, 'Hoje você assiste:'), h('strong', {}, escolhido.titulo),
        h('p', { class: 'sub sub--pequeno' }, formatarDuracao(escolhido.duracao) + (escolhido.tipo === 'série' ? ' por episódio' : '') + ' · ' + escolhido.generos.join(' · ')));
      sorteando = false;
      registrarHistorico([escolhido.id]);
    };
    if (reduzMovimento()) return finalizar();

    sorteando = true;
    let ciclos = 0;
    const timer = setInterval(() => {
      const f = favs[ciclos % favs.length];
      caixa.replaceChildren(h('strong', { class: 'sorteio__roleta' }, f.titulo));
      if (++ciclos > 18) { clearInterval(timer); finalizar(); }
    }, 110);
  }

  /* --- HISTÓRICO --- */
  function renderHistorico() {
    const itens = estado.historico.filter(x => porId(x.id));
    $('#vazio-hist').hidden = itens.length > 0;
    $('#btn-limpar-hist').disabled = itens.length === 0;
    const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    $('#lista-hist').replaceChildren(...itens.map(({ id, data }) => {
      const f = porId(id);
      return h('li', { class: 'hist-item' },
        h('time', { datetime: data }, fmt.format(new Date(data))),
        h('div', {},
          h('strong', {}, f.titulo),
          h('span', { class: 'hist-item__meta' }, ' · ' + f.generos.join(' · ') + ' · ★ ' + f.nota.toFixed(1))),
        h('button', {
          type: 'button', class: 'btn btn--fantasma btn--pequeno',
          'aria-label': (ehFavorito(id) ? 'Remover dos favoritos: ' : 'Favoritar: ') + f.titulo,
          'aria-pressed': String(ehFavorito(id)),
          onclick: () => { alternarFavorito(id); renderHistorico(); }
        }, ehFavorito(id) ? '♥' : '♡'));
    }));
  }

  /* ---------- 5) TEMA E CONFIGURAÇÕES ---------- */
  function aplicarTema(tema) {
    document.documentElement.dataset.tema = tema;
    $('#icone-tema').textContent = tema === 'escuro' ? '🌙' : '☀️';
    $('#btn-tema').setAttribute('aria-pressed', String(tema === 'claro'));
    $('#btn-tema').setAttribute('aria-label', tema === 'escuro' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro');
  }

  function alternarTema() {
    const novo = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
    storage.salvar('tema', novo);
    aplicarTema(novo);
  }

  function msgConfig(texto, ehErro) {
    const m = $('#cfg-msg');
    m.textContent = texto; m.hidden = !texto;
    m.classList.toggle('erro--ok', !ehErro);
  }

  function ligarConfiguracoes() {
    const dlg = $('#dlg-config');
    $('#btn-config').addEventListener('click', () => {
      $('#cfg-chave').value = storage.ler('tmdbKey', '');
      msgConfig('');
      dlg.showModal();
    });
    $('#cfg-salvar').addEventListener('click', () => {
      const valor = $('#cfg-chave').value.trim();
      if (valor) storage.salvar('tmdbKey', valor); else storage.remover('tmdbKey');
      dlg.close();
      toast(valor ? 'Chave salva. Carregando pôsteres reais…' : 'Chave removida. Usando a base local.');
      atualizarTudo();
      if (abaDoHash() === 'match') renderMatch();
    });
    $('#cfg-testar').addEventListener('click', async () => {
      const valor = $('#cfg-chave').value.trim();
      if (!valor) return msgConfig('Cole uma chave para testar.', true);
      const antiga = storage.ler('tmdbKey', '');
      storage.salvar('tmdbKey', valor);
      msgConfig('Testando…', false);
      try { await api.testarChave(); msgConfig('Chave válida! Clique em Salvar.', false); }
      catch (e) { msgConfig(e.message, true); }
      finally { if (antiga) storage.salvar('tmdbKey', antiga); else storage.remover('tmdbKey'); }
    });
    $('#cfg-apagar').addEventListener('click', () => {
      if (!confirm('Apagar favoritos, histórico, avaliações, preferências e chave deste navegador?')) return;
      ['prefs', 'favoritos', 'historico', 'avaliacoes', 'recusados', 'tmdbKey', 'posters', 'tema'].forEach(storage.remover);
      location.reload();
    });
  }

  /* ---------- 6) INÍCIO ---------- */
  function ligarEventos() {
    $('#form-prefs').addEventListener('submit', e => {
      e.preventDefault();
      const prefs = lerPrefsDoFormulario();
      const erro = validarPrefs(prefs);
      mostrarErro(erro);
      if (erro) return;
      estado.prefs = prefs;
      storage.salvar('prefs', prefs);
      estado.vistosNaSessao.clear();
      gerarRecomendacoes(false);
      $('#resultado').scrollIntoView({ behavior: reduzMovimento() ? 'auto' : 'smooth', block: 'start' });
    });
    // Salva as escolhas assim que mudam (não se perde ao recarregar)
    $('#form-prefs').addEventListener('change', () => {
      mostrarErro('');
      const p = lerPrefsDoFormulario();
      estado.prefs = p; storage.salvar('prefs', p);
      if (abaDoHash() === 'match') montarFila();
    });
    $('#btn-limpar-prefs').addEventListener('click', () => {
      estado.prefs = Object.assign({}, PREFS_PADRAO);
      storage.salvar('prefs', estado.prefs);
      aplicarPrefsNoFormulario(); mostrarErro('');
      toast('Escolhas limpas.');
    });
    $('#btn-outras').addEventListener('click', () => gerarRecomendacoes(true));

    $('#btn-aceitar').addEventListener('click', () => decidirMatch(true));
    $('#btn-recusar').addEventListener('click', () => decidirMatch(false));
    $('#btn-zerar-recusados').addEventListener('click', () => {
      estado.recusados = []; storage.salvar('recusados', []);
      montarFila(); renderMatch(); toast('Títulos recusados voltaram para a fila.');
    });
    document.addEventListener('keydown', e => {
      if (abaDoHash() !== 'match' || e.target.closest('input, select, textarea, dialog')) return;
      if (e.key === 'ArrowRight') decidirMatch(true);
      if (e.key === 'ArrowLeft') decidirMatch(false);
    });

    ['#busca-texto', '#busca-genero', '#busca-tipo'].forEach(s => $(s).addEventListener('input', renderBusca));
    $('#form-busca').addEventListener('submit', e => e.preventDefault());

    $('#btn-decide').addEventListener('click', decidirPorMim);
    $('#btn-limpar-hist').addEventListener('click', () => {
      const copia = estado.historico.slice();
      estado.historico = []; storage.salvar('historico', []);
      renderHistorico();
      toast('Histórico limpo.', () => { estado.historico = copia; storage.salvar('historico', copia); renderHistorico(); });
    });
    $('#btn-tema').addEventListener('click', alternarTema);
    window.addEventListener('hashchange', () => irParaAba(abaDoHash(), true));
  }

  function iniciar() {
    aplicarTema(document.documentElement.dataset.tema || 'escuro');
    montarFormulario();
    ligarEventos();
    ligarConfiguracoes();
    montarFila();
    $('#cont-fav').textContent = estado.favoritos.length;
    renderBusca();
    renderFavoritos();
    irParaAba(abaDoHash(), false);
  }

  iniciar();
})();

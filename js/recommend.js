/* recommend.js — motor de recomendação (RF02).
   Pontua cada título pelas preferências e devolve os melhores com um MOTIVO
   legível ("porque você está animado e tem até 2 h"). Sem dependência de DOM. */
(function () {
  'use strict';
  const { lista, humores, formatarDuracao } = window.CM.movies;

  const PESO_GENERO = 3;   // por gênero em comum
  const PESO_HUMOR = 4;    // humor compatível
  const PESO_NOTA = 0.4;   // nota alta desempata
  const PENALIDADE_TEMPO = 5; // passou do tempo disponível (ainda pode aparecer, por último)

  /** Rótulo amigável do tempo disponível. */
  function rotuloTempo(minutos) {
    if (!minutos) return 'sem limite de tempo';
    return 'até ' + (minutos / 60) + ' h';
  }

  /**
   * Calcula a pontuação de um título e os motivos.
   * prefs = { generos: [], idadeMax: 18, tempo: 0|60|120, humor: 'animado' }
   */
  function pontuar(filme, prefs) {
    const motivos = [];
    let pontos = filme.nota * PESO_NOTA;

    const emComum = filme.generos.filter(g => prefs.generos.includes(g));
    pontos += emComum.length * PESO_GENERO;
    if (emComum.length) motivos.push('combina com ' + emComum.join(' e '));

    if (prefs.humor && filme.humores.includes(prefs.humor)) {
      pontos += PESO_HUMOR;
      motivos.push('é bom para quem está ' + humores[prefs.humor].rotulo.toLowerCase());
    }

    if (prefs.tempo && filme.duracao > prefs.tempo) {
      pontos -= PENALIDADE_TEMPO;
    } else {
      motivos.push(prefs.tempo ? 'cabe em ' + rotuloTempo(prefs.tempo) : 'dura ' + formatarDuracao(filme.duracao));
    }
    if (filme.nota >= 8.5) motivos.push('tem nota alta (' + filme.nota.toFixed(1) + ')');

    return { pontos, motivos };
  }

  /** Frase final: "Porque combina com Drama, é bom para quem está triste e cabe em até 2 h." */
  function montarMotivo(motivos) {
    if (!motivos.length) return 'Uma boa surpresa para hoje.';
    const texto = motivos.length > 1
      ? motivos.slice(0, -1).join(', ') + ' e ' + motivos[motivos.length - 1]
      : motivos[0];
    return 'Porque ' + texto + '.';
  }

  /**
   * Recomenda `quantidade` títulos.
   * excluir = Set de ids que NÃO podem aparecer (já vistos nesta sessão, recusados no Match).
   * Retorna [{ filme, motivo }]. Se acabar o estoque, retorna menos que o pedido.
   */
  function recomendar(prefs, { excluir = new Set(), quantidade = 3 } = {}) {
    const candidatos = lista
      .filter(f => f.idade <= prefs.idadeMax && !excluir.has(f.id))
      .map(f => {
        const { pontos, motivos } = pontuar(f, prefs);
        // pequeno sorteio (até 1 ponto) para "outras 3" não ser sempre a mesma ordem
        return { filme: f, pontos: pontos + Math.random(), motivo: montarMotivo(motivos) };
      })
      .sort((a, b) => b.pontos - a.pontos);
    return candidatos.slice(0, quantidade).map(({ filme, motivo }) => ({ filme, motivo }));
  }

  window.CM.recommend = { recomendar, pontuar, montarMotivo, rotuloTempo };
})();

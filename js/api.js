/* api.js — integração OPCIONAL com o TMDb (bônus de API externa).
   A chave NUNCA fica no código: o usuário cola a própria chave em
   "Configurações" e ela é guardada só no LocalStorage dele.
   Sem chave, nada aqui é chamado e o app usa a base local. */
(function () {
  'use strict';
  const { storage } = window.CM;
  const BASE = 'https://api.themoviedb.org/3';
  const IMG = 'https://image.tmdb.org/t/p/w342';
  const emAndamento = {}; // evita pedir o mesmo pôster duas vezes ao mesmo tempo

  function chave() { return storage.ler('tmdbKey', ''); }
  function temChave() { return !!chave(); }

  /** Faz o pedido e converte falhas em mensagens claras para o usuário. */
  async function pedir(caminho, params) {
    const url = new URL(BASE + caminho);
    url.searchParams.set('api_key', chave());
    url.searchParams.set('language', 'pt-BR');
    Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    let resp;
    try {
      resp = await fetch(url);
    } catch (e) {
      throw new Error('Sem conexão com o TMDb. Verifique sua internet.');
    }
    if (resp.status === 401) throw new Error('Chave do TMDb inválida. Confira em Configurações.');
    if (!resp.ok) throw new Error('O TMDb respondeu com erro ' + resp.status + '.');
    return resp.json();
  }

  /** Testa a chave atual. Lança erro com mensagem clara se falhar. */
  async function testarChave() {
    await pedir('/configuration');
    return true;
  }

  /** Devolve a URL do pôster real do título (ou null). Resultado fica em cache. */
  async function posterDe(filme) {
    if (!temChave()) return null;
    const cache = storage.ler('posters', {});
    if (filme.id in cache) return cache[filme.id];
    if (emAndamento[filme.id]) return emAndamento[filme.id];

    emAndamento[filme.id] = (async () => {
      try {
        const tipo = filme.tipo === 'série' ? 'tv' : 'movie';
        const dados = await pedir('/search/' + tipo, {
          query: filme.titulo,
          [tipo === 'tv' ? 'first_air_date_year' : 'year']: filme.ano
        });
        const achado = (dados.results || []).find(r => r.poster_path);
        const url = achado ? IMG + achado.poster_path : null;
        const novo = storage.ler('posters', {});
        novo[filme.id] = url;
        storage.salvar('posters', novo);
        return url;
      } catch (e) {
        return null; // falha de rede não deve quebrar a tela: fica o pôster em CSS
      } finally {
        delete emAndamento[filme.id];
      }
    })();
    return emAndamento[filme.id];
  }

  window.CM.api = { temChave, testarChave, posterDe };
})();

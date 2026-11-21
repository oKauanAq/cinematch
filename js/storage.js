/* storage.js — camada única de acesso ao LocalStorage.
   Tudo que o CineMatch guarda passa por aqui (RF06). Se o navegador
   bloquear o LocalStorage, usamos memória e o app continua funcionando. */
(function () {
  'use strict';
  const PREFIXO = 'cinematch:';
  const memoria = {}; // plano B quando o LocalStorage não está disponível

  /** Lê um valor salvo; devolve `padrao` se não existir ou estiver corrompido. */
  function ler(chave, padrao) {
    try {
      const bruto = localStorage.getItem(PREFIXO + chave);
      return bruto === null ? padrao : JSON.parse(bruto);
    } catch (e) {
      return chave in memoria ? memoria[chave] : padrao;
    }
  }

  /** Salva um valor (qualquer coisa serializável em JSON). */
  function salvar(chave, valor) {
    memoria[chave] = valor;
    try {
      localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false; // cota cheia ou modo privado restrito
    }
  }

  /** Apaga uma chave. */
  function remover(chave) {
    delete memoria[chave];
    try { localStorage.removeItem(PREFIXO + chave); } catch (e) { /* ignora */ }
  }

  window.CM = window.CM || {};
  window.CM.storage = { ler, salvar, remover };
})();

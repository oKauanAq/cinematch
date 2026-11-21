# CineMatch — Recomendador de Filmes e Séries

Projeto da disciplina **Desenvolvimento de Interfaces** (CEUB, Turma B). Diga seu humor, os gêneros que curte, o tempo que tem e a faixa etária: o CineMatch escolhe 3 filmes ou séries e **explica o motivo** de cada sugestão.

Feito só com **HTML5, CSS3 e JavaScript puro**, sem frameworks e sem build. Os dados ficam no **LocalStorage** do seu navegador.

## Como rodar
- Baixe ou clone o repositório e abra o `index.html` (duplo clique). Não precisa de servidor.
- Ou acesse a versão publicada no GitHub Pages: `https://okauanaq.github.io/cinematch/`

## Funcionalidades
| Requisito | O que faz |
|---|---|
| RF01 Preferências | Humor (6 opções), gêneros (múltipla escolha), tempo (1 h / 2 h / sem limite) e faixa etária, com validação |
| RF02 Recomendação | 3 sugestões com pôster, nota, duração, categoria e motivo; botão "Outras 3" sem repetir |
| RF03 / RF04 Favoritos | Adicionar e remover com aviso e botão **Desfazer** |
| RF05 Histórico | Últimas sugestões com data e hora; limpar (com desfazer) |
| RF06 LocalStorage | Preferências, favoritos, histórico, avaliações, tema e recusados persistem |
| Tema | Claro e escuro; respeita o sistema na primeira visita |

**Diferenciais:** modo **Match** (aceitar/recusar por botões, setas do teclado ou arrastando), **Decide por mim** (sorteio entre os favoritos), busca com filtros, avaliação por estrelas, estatísticas dos favoritos, integração opcional com o **TMDb** e respeito a `prefers-reduced-motion`.

## Pôsteres reais com o TMDb (opcional)
1. Crie uma chave grátis em https://www.themoviedb.org/settings/api (tipo *Developer*).
2. No CineMatch, abra ⚙️ **Configurações**, cole a chave e clique em *Testar chave* e *Salvar*.
3. A chave fica **só no seu navegador**. Nada é enviado além do TMDb. Sem chave, os pôsteres são gerados em CSS.

## Estrutura
```
cinematch/
├── index.html
├── css/style.css
├── js/
│   ├── app.js        interface e estado
│   ├── movies.js     base com 64 títulos
│   ├── storage.js    LocalStorage
│   ├── recommend.js  motor de recomendação
│   └── api.js        TMDb (opcional)
└── assets/images/
```

## Heurísticas de Nielsen
| Heurística | Onde aparece |
|---|---|
| Visibilidade do estado | Avisos (toasts), contador de favoritos, aba ativa |
| Mundo real | Humores e textos em linguagem do dia a dia |
| Controle e liberdade | Desfazer em favoritos, histórico e Match |
| Consistência | Mesmos botões, cores e cartões em todas as telas |
| Prevenção de erros | Validação antes de recomendar; confirmação ao apagar dados |
| Reconhecimento | Escolhas visíveis; preferências salvas |
| Eficiência | Setas do teclado no Match; busca com filtros |
| Design minimalista | Uma ação principal por tela |
| Recuperação de erros | Mensagens claras (preferências, chave, rede) |
| Ajuda | Dicas curtas nas telas e este README |

## Acessibilidade
HTML semântico, `label` em todos os campos, link "Pular para o conteúdo", foco visível, alvos de toque de 44 px, contraste revisado nos dois temas e animações reduzidas para quem pede.

## Testes
Teste automatizado no Edge (Playwright) cobrindo RF01–RF06, Match, busca, tema, 360/768/1280 px nos dois temas, labels, teclado e console sem erros.

## Créditos
Alunos: Kauãn Souza de Aquino, André Ribeiro Mendes Araújo e Guilherme da Silva Batista. Professora: Adriana Falcomer Pontes. Código desenvolvido com apoio de IA (Claude Code e Codex), com registro dos prompts no relatório. Notas dos títulos são aproximadas.

*This product uses the TMDB API but is not endorsed or certified by TMDB.*

Licença MIT.

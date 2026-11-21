/* movies.js — base local de filmes e séries (64 títulos).
   Cada linha da tabela: [título, tipo, ano, gêneros, humores, duração(min), idade, nota, sinopse]
   - duração: em série é a duração do episódio.
   - idade: classificação indicativa (0 = livre).
   - nota: referência aproximada (0–10), não é dado oficial.
   Os pôsteres NÃO são imagens: são gerados em CSS a partir do título
   (evita arte com direito autoral). Com chave do TMDb, o app busca o pôster real. */
(function () {
  'use strict';
  const FC = 'Ficção Científica';

  const TABELA = [
    ['Interestelar', 'filme', 2014, [FC, 'Drama', 'Aventura'], ['curioso', 'triste'], 169, 10, 8.7, 'Astronautas atravessam um buraco de minhoca em busca de um novo lar para a humanidade.'],
    ['Vingadores: Ultimato', 'filme', 2019, ['Ação', FC, 'Aventura'], ['animado', 'tenso'], 181, 12, 8.4, 'Os heróis restantes tentam desfazer o estrago causado por Thanos.'],
    ['Divertida Mente', 'filme', 2015, ['Animação', 'Comédia', 'Aventura'], ['animado', 'triste'], 95, 0, 8.1, 'As emoções de uma menina entram em crise quando ela se muda de cidade.'],
    ['Procurando Nemo', 'filme', 2003, ['Animação', 'Aventura'], ['animado', 'relaxado'], 100, 0, 8.2, 'Um peixe-palhaço atravessa o oceano para reencontrar o filho.'],
    ['Parasita', 'filme', 2019, ['Suspense', 'Drama', 'Comédia'], ['tenso', 'curioso'], 132, 16, 8.5, 'Uma família pobre se infiltra na vida de uma família rica, com consequências sombrias.'],
    ['Cidade de Deus', 'filme', 2002, ['Crime', 'Drama'], ['tenso'], 130, 18, 8.6, 'A ascensão do crime numa favela do Rio de Janeiro, vista por um jovem fotógrafo.'],
    ['Central do Brasil', 'filme', 1998, ['Drama'], ['triste', 'relaxado'], 113, 14, 8.0, 'Uma ex-professora ajuda um menino a procurar o pai no sertão.'],
    ['O Auto da Compadecida', 'filme', 2000, ['Comédia', 'Aventura'], ['animado'], 104, 12, 8.7, 'Dois amigos espertos aprontam no sertão nordestino até o julgamento final.'],
    ['Matrix', 'filme', 1999, ['Ação', FC], ['curioso', 'tenso'], 136, 14, 8.7, 'Um programador descobre que a realidade é uma simulação.'],
    ['A Origem', 'filme', 2010, [FC, 'Ação', 'Suspense'], ['curioso', 'tenso'], 148, 14, 8.8, 'Ladrões invadem sonhos para plantar uma ideia na mente de um alvo.'],
    ['Questão de Tempo', 'filme', 2013, ['Romance', 'Comédia', 'Fantasia'], ['romantico', 'relaxado'], 123, 14, 7.8, 'Um rapaz descobre que pode voltar no tempo e usa o dom para conquistar o amor.'],
    ['La La Land', 'filme', 2016, ['Romance', 'Drama'], ['romantico', 'triste'], 128, 12, 8.0, 'Uma atriz e um pianista tentam equilibrar sonhos e amor em Los Angeles.'],
    ['Cinema Paradiso', 'filme', 1988, ['Drama', 'Romance'], ['triste', 'romantico'], 124, 12, 8.5, 'Um cineasta relembra a infância e a amizade com o projecionista da cidade.'],
    ['Corra!', 'filme', 2017, ['Terror', 'Suspense'], ['tenso'], 104, 16, 7.7, 'Um rapaz visita a família da namorada e percebe que algo está muito errado.'],
    ['Hereditário', 'filme', 2018, ['Terror'], ['tenso'], 127, 18, 7.3, 'Uma família é assombrada por segredos após a morte da avó.'],
    ['Um Lugar Silencioso', 'filme', 2018, ['Terror', 'Suspense'], ['tenso'], 90, 14, 7.5, 'Uma família sobrevive em silêncio absoluto para escapar de criaturas que caçam pelo som.'],
    ['Toy Story', 'filme', 1995, ['Animação', 'Comédia', 'Aventura'], ['animado'], 81, 0, 8.3, 'Os brinquedos de um menino ganham vida quando ninguém está olhando.'],
    ['A Viagem de Chihiro', 'filme', 2001, ['Animação', 'Fantasia'], ['curioso', 'relaxado'], 125, 0, 8.6, 'Uma menina entra num mundo de espíritos para salvar os pais.'],
    ['Meu Amigo Totoro', 'filme', 1988, ['Animação', 'Fantasia'], ['relaxado'], 86, 0, 8.1, 'Duas irmãs conhecem criaturas mágicas na floresta perto da casa nova.'],
    ['O Grande Hotel Budapeste', 'filme', 2014, ['Comédia', 'Aventura', 'Crime'], ['curioso', 'animado'], 99, 16, 8.1, 'Um concierge lendário e seu protegido se envolvem num roubo de obra de arte.'],
    ['Clube da Luta', 'filme', 1999, ['Drama', 'Suspense'], ['tenso', 'curioso'], 139, 18, 8.8, 'Um homem entediado cria um clube secreto de lutas com um desconhecido carismático.'],
    ['Forrest Gump', 'filme', 1994, ['Drama', 'Romance', 'Comédia'], ['triste', 'relaxado'], 142, 14, 8.8, 'Um homem simples atravessa décadas da história americana sem perceber.'],
    ['O Poderoso Chefão', 'filme', 1972, ['Crime', 'Drama'], ['tenso'], 175, 18, 9.2, 'A saga de uma família mafiosa e a passagem do poder ao filho mais novo.'],
    ['Mad Max: Estrada da Fúria', 'filme', 2015, ['Ação', 'Aventura', FC], ['animado', 'tenso'], 120, 16, 8.1, 'Uma fuga a toda velocidade pelo deserto contra um tirano.'],
    ['Homem-Aranha: No Aranhaverso', 'filme', 2018, ['Animação', 'Ação', 'Aventura'], ['animado'], 117, 10, 8.4, 'Miles Morales encontra outros Homens-Aranha de universos paralelos.'],
    ['Viva: A Vida é uma Festa', 'filme', 2017, ['Animação', 'Fantasia', 'Aventura'], ['triste', 'animado'], 105, 0, 8.4, 'Um menino viaja à Terra dos Mortos para entender a história da família.'],
    ['Os Incríveis', 'filme', 2004, ['Animação', 'Ação', 'Comédia'], ['animado'], 115, 0, 8.0, 'Uma família de super-heróis aposentados volta à ativa.'],
    ['Pequena Miss Sunshine', 'filme', 2006, ['Comédia', 'Drama'], ['relaxado', 'animado'], 101, 14, 7.8, 'Uma família desajustada atravessa o país numa van para um concurso infantil.'],
    ['Antes do Amanhecer', 'filme', 1995, ['Romance', 'Drama'], ['romantico', 'relaxado'], 101, 14, 8.1, 'Dois desconhecidos passam uma noite conversando por Viena.'],
    ['Orgulho e Preconceito', 'filme', 2005, ['Romance', 'Drama'], ['romantico'], 129, 0, 7.8, 'Elizabeth Bennet e o orgulhoso Sr. Darcy precisam superar seus preconceitos.'],
    ['Blade Runner 2049', 'filme', 2017, [FC, 'Suspense'], ['curioso'], 164, 16, 8.0, 'Um caçador de androides descobre um segredo capaz de abalar a sociedade.'],
    ['Ainda Estou Aqui', 'filme', 2024, ['Drama'], ['triste'], 137, 14, 8.1, 'Uma mãe luta por respostas após o desaparecimento do marido na ditadura.'],
    ['Tropa de Elite', 'filme', 2007, ['Ação', 'Crime', 'Drama'], ['tenso'], 115, 16, 8.0, 'Um capitão do BOPE busca um sucessor enquanto enfrenta o tráfico.'],
    ['O Silêncio dos Inocentes', 'filme', 1991, ['Suspense', 'Crime', 'Terror'], ['tenso'], 118, 16, 8.6, 'Uma agente do FBI pede ajuda a um canibal brilhante para capturar outro assassino.'],
    ['Garota Exemplar', 'filme', 2014, ['Suspense', 'Drama'], ['tenso'], 149, 16, 8.1, 'O desaparecimento de uma mulher transforma o marido no principal suspeito.'],
    ['Shrek', 'filme', 2001, ['Animação', 'Comédia', 'Fantasia'], ['animado'], 90, 0, 7.9, 'Um ogro resgata uma princesa para recuperar seu pântano.'],
    ['O Senhor dos Anéis: A Sociedade do Anel', 'filme', 2001, ['Fantasia', 'Aventura'], ['curioso', 'animado'], 178, 12, 8.9, 'Um hobbit parte numa missão para destruir um anel poderoso.'],
    ['Harry Potter e a Pedra Filosofal', 'filme', 2001, ['Fantasia', 'Aventura'], ['relaxado', 'animado'], 152, 0, 7.7, 'Um garoto descobre ser bruxo e entra numa escola de magia.'],
    ['Jurassic Park', 'filme', 1993, ['Aventura', FC, 'Ação'], ['animado', 'tenso'], 127, 12, 8.2, 'Um parque de dinossauros clonados foge do controle.'],
    ['De Volta para o Futuro', 'filme', 1985, [FC, 'Comédia', 'Aventura'], ['animado', 'curioso'], 116, 0, 8.5, 'Um adolescente viaja a 1955 num carro que é máquina do tempo.'],
    ['O Fabuloso Destino de Amélie Poulain', 'filme', 2001, ['Romance', 'Comédia'], ['romantico', 'relaxado'], 122, 16, 8.3, 'Uma garçonete tímida decide melhorar a vida das pessoas ao redor.'],
    ['Ela', 'filme', 2013, ['Romance', FC, 'Drama'], ['romantico', 'triste', 'curioso'], 126, 16, 8.0, 'Um homem solitário se apaixona por um sistema operacional.'],
    ['Whiplash', 'filme', 2014, ['Drama'], ['tenso'], 106, 14, 8.5, 'Um jovem baterista enfrenta um professor implacável.'],
    ['Up: Altas Aventuras', 'filme', 2009, ['Animação', 'Aventura', 'Comédia'], ['triste', 'animado'], 96, 0, 8.3, 'Um viúvo amarra balões à casa e parte para a América do Sul.'],
    ['WALL-E', 'filme', 2008, ['Animação', FC], ['relaxado', 'triste'], 98, 0, 8.4, 'Um robô solitário limpa a Terra e encontra uma nova companheira.'],
    ['Entre Facas e Segredos', 'filme', 2019, ['Crime', 'Suspense', 'Comédia'], ['curioso'], 130, 12, 7.9, 'Um detetive investiga a morte de um escritor rodeado de herdeiros.'],
    ['Dark', 'série', 2017, [FC, 'Suspense', 'Drama'], ['curioso', 'tenso'], 60, 16, 8.7, 'O sumiço de crianças revela segredos de quatro gerações numa cidade alemã.'],
    ['Breaking Bad', 'série', 2008, ['Crime', 'Drama', 'Suspense'], ['tenso'], 47, 18, 9.5, 'Um professor de química com câncer entra para o mundo das drogas.'],
    ['Stranger Things', 'série', 2016, [FC, 'Terror', 'Aventura'], ['curioso', 'tenso'], 50, 14, 8.7, 'Crianças enfrentam forças sobrenaturais numa cidade dos anos 80.'],
    ['Black Mirror', 'série', 2011, [FC, 'Suspense', 'Drama'], ['curioso', 'tenso'], 60, 16, 8.7, 'Episódios independentes sobre os lados sombrios da tecnologia.'],
    ['The Office (EUA)', 'série', 2005, ['Comédia'], ['animado', 'relaxado'], 22, 14, 9.0, 'O dia a dia caótico dos funcionários de uma filial de papel.'],
    ['Friends', 'série', 1994, ['Comédia', 'Romance'], ['animado', 'relaxado'], 22, 12, 8.9, 'Seis amigos dividem alegrias e confusões em Nova York.'],
    ['Avatar: A Lenda de Aang', 'série', 2005, ['Animação', 'Aventura', 'Fantasia'], ['animado'], 23, 10, 9.3, 'Um jovem mestre dos quatro elementos tenta restaurar o equilíbrio do mundo.'],
    ['Round 6', 'série', 2021, ['Suspense', 'Drama', 'Ação'], ['tenso'], 55, 16, 8.0, 'Endividados disputam jogos infantis mortais por um prêmio gigante.'],
    ['Chernobyl', 'série', 2019, ['Drama', 'Suspense'], ['tenso', 'triste'], 65, 16, 9.3, 'A reconstrução do desastre nuclear e dos esforços para contê-lo.'],
    ['Anne with an E', 'série', 2017, ['Drama'], ['triste', 'relaxado'], 45, 12, 8.7, 'Uma órfã imaginativa conquista uma pequena cidade canadense.'],
    ['3%', 'série', 2016, [FC, 'Suspense'], ['tenso', 'curioso'], 45, 16, 7.3, 'Jovens brasileiros disputam um processo seletivo para viver num mundo melhor.'],
    ['Sherlock', 'série', 2010, ['Crime', 'Suspense'], ['curioso'], 88, 14, 9.1, 'Um detetive moderno resolve casos com a ajuda do Dr. Watson.'],
    ['Gilmore Girls', 'série', 2000, ['Comédia', 'Drama', 'Romance'], ['relaxado', 'romantico'], 44, 12, 8.2, 'Mãe e filha crescem juntas numa cidadezinha cheia de personagens.'],
    ['Bridgerton', 'série', 2020, ['Romance', 'Drama'], ['romantico'], 60, 16, 7.3, 'Romances e intrigas na alta sociedade londrina do século XIX.'],
    ['The Last of Us', 'série', 2023, ['Drama', 'Terror', 'Ação'], ['tenso', 'triste'], 55, 18, 8.7, 'Um sobrevivente escolta uma adolescente num mundo devastado por infectados.'],
    ['Arcane', 'série', 2021, ['Animação', 'Fantasia', 'Ação'], ['tenso', 'curioso'], 42, 14, 9.0, 'Duas irmãs em lados opostos de uma guerra entre a cidade rica e o submundo.'],
    ['Os Simpsons', 'série', 1989, ['Animação', 'Comédia'], ['animado', 'relaxado'], 22, 12, 8.7, 'A família mais famosa de Springfield em situações absurdas.'],
    ['Ted Lasso', 'série', 2020, ['Comédia', 'Drama'], ['animado', 'relaxado'], 30, 14, 8.8, 'Um técnico de futebol americano assume um time de futebol inglês.']
  ];

  /** Gera um id estável a partir do título ("A Origem" → "a-origem"). */
  function criarId(titulo) {
    return titulo.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const lista = TABELA.map(([titulo, tipo, ano, generos, humores, duracao, idade, nota, sinopse]) => ({
    id: criarId(titulo), titulo, tipo, ano, generos, humores, duracao, idade, nota, sinopse
  }));

  const generos = [...new Set(lista.flatMap(f => f.generos))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  /** Humores disponíveis: chave interna → rótulo e ícone exibidos. */
  const humores = {
    animado:   { rotulo: 'Animado',   icone: '🎉' },
    relaxado:  { rotulo: 'Relaxado',  icone: '🛋️' },
    triste:    { rotulo: 'Triste',    icone: '🌧️' },
    tenso:     { rotulo: 'Tenso',     icone: '⚡' },
    romantico: { rotulo: 'Romântico', icone: '💌' },
    curioso:   { rotulo: 'Curioso',   icone: '🔭' }
  };

  /** Busca um título pelo id. */
  function porId(id) { return lista.find(f => f.id === id); }

  /** Formata minutos: 169 → "2h49min"; 22 → "22min". */
  function formatarDuracao(min) {
    const h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + 'min';
    return m ? h + 'h' + String(m).padStart(2, '0') + 'min' : h + 'h';
  }

  window.CM = window.CM || {};
  window.CM.movies = { lista, generos, humores, porId, formatarDuracao };
})();

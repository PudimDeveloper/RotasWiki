const botoes = document.getElementsByTagName("button");
const textarea = document.querySelector("#textarea");
const output = document.getElementById("output");


// ==========================================
// PÁGINAS DE ERRO
// ==========================================

const notfoundpage = `
<style>
  * {
    margin: 0;
  }

  h1 {
    background-color: #c44646;
    color: #691818;
  }
</style>

<h1>Erro</h1>
<p>Palavra não encontrada</p>
`;


const repeaterror = `
<style>
  * {
    margin: 0;
  }

  h1 {
    background-color: #c44646;
    color: #691818;
  }
</style>

<h1>Erro</h1>
<p>Você está procurando muitas vezes, espere um pouco ;-;</p>
`;


const errorpage = `
<style>
  * {
    margin: 0;
  }

  h1 {
    background-color: #c44646;
    color: #691818;
  }
</style>

<h1>Erro</h1>
<p>Digite algo na query</p>
`;


// ==========================================
// VARIÁVEIS
// ==========================================

let prompt = "";
let resposta = "";
let resultado = "";


// ==========================================
// ESPERAR
// ==========================================

function esperar(ms) {

  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });

}


// ==========================================
// REQUEST
// ==========================================

async function resq(prompt) {

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log(
    "[RESQ] Iniciando pesquisa:"
  );

  console.log(
    "[RESQ] Query:",
    prompt
  );


  try {

    const rsp = await fetch(
      "/pesquisar/html",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          query: prompt
        })
      }
    );


    console.log(
      "[RESQ] Status:",
      rsp.status
    );

    console.log(
      "[RESQ] StatusText:",
      rsp.statusText
    );

    console.log(
      "[RESQ] URL:",
      rsp.url
    );

    console.log(
      "[RESQ] Response:",
      rsp
    );


    return rsp;

  } catch (erro) {

    console.error(
      "[RESQ] Erro no fetch:",
      erro
    );

    throw erro;
  }
}


// ==========================================
// PESQUISA COM VARIAÇÕES
// ==========================================
//
// Ordem:
//
// 1. MAIÚSCULO
// 2. minúsculo
// 3. original
//
// A primeira resposta 200 é utilizada.
// ==========================================

async function pesquisarVariacoes(prompt) {

  /*
   * Cria as três possibilidades.
   */
  const variacoes = [
    prompt.toUpperCase(),
    prompt.toLowerCase(),
    prompt
  ];


  /*
   * Remove duplicatas.
   *
   * Exemplo:
   *
   * "aabb"
   *
   * vira:
   *
   * ["AABB", "aabb"]
   *
   * em vez de pesquisar "aabb" duas vezes.
   */
  const variacoesUnicas = [
    ...new Set(variacoes)
  ];


  console.log("");
  console.log(
    "================================"
  );

  console.log(
    "[VARIAÇÕES] Iniciando pesquisas"
  );

  console.log(
    "[VARIAÇÕES] Possibilidades:",
    variacoesUnicas
  );

  console.log(
    "================================"
  );


  /*
   * Tenta uma por uma.
   */
  for (
    let i = 0;
    i < variacoesUnicas.length;
    i++
  ) {

    const pesquisa =
      variacoesUnicas[i];


    console.log("");

    console.log(
      `[VARIAÇÃO ${i + 1}] Tentando:`,
      pesquisa
    );


    load_text(
      `Pesquisando "${pesquisa}"...`
    );


    const rsp =
      await resq(pesquisa);


    load_text(
      "Transferindo dados..."
    );


    const html =
      await rsp.text();


    console.log(
      `[VARIAÇÃO ${i + 1}] Status:`,
      rsp.status
    );

    console.log(
      `[VARIAÇÃO ${i + 1}] Tamanho:`,
      html.length
    );


    /*
     * ======================================
     * SUCESSO
     * ======================================
     */

    if (rsp.status === 200) {

      console.log("");

      console.log(
        "✅ [VARIAÇÕES] Pesquisa funcionou!"
      );

      console.log(
        "[VARIAÇÕES] Pesquisa utilizada:",
        pesquisa
      );


      return {
        resposta: rsp,
        resultado: html,
        pesquisa: pesquisa
      };
    }


    /*
     * ======================================
     * FALHOU
     * ======================================
     */

    console.warn(
      `❌ [VARIAÇÃO ${i + 1}] Falhou.`
    );


    /*
     * Espera antes da próxima tentativa.
     */
    if (
      i < variacoesUnicas.length - 1
    ) {

      load_text(
        "Tentando outra forma..."
      );

      await esperar(300);
    }
  }


  /*
   * ======================================
   * NENHUMA VARIAÇÃO FUNCIONOU
   * ======================================
   *
   * Faz a pesquisa original novamente.
   */

  console.log("");

  console.warn(
    "[VARIAÇÕES] Nenhuma variação funcionou."
  );

  console.log(
    "[ORIGINAL] Fazendo pesquisa original:"
  );

  console.log(
    "[ORIGINAL] Query:",
    prompt
  );


  load_text(
    "Tentando pesquisa original..."
  );


  const rsp =
    await resq(prompt);


  load_text(
    "Transferindo dados..."
  );


  const html =
    await rsp.text();


  return {
    resposta: rsp,
    resultado: html,
    pesquisa: prompt
  };
}


// ==========================================
// RESOLVER REDIRECT
// ==========================================

async function resolverRedirect(
  respostaInicial,
  resultadoInicial
) {

  let respostaAtual =
    respostaInicial;

  let resultadoAtual =
    resultadoInicial;


  /*
   * Limite de redirects.
   *
   * Evita loop infinito.
   */
  for (
    let tentativa = 0;
    tentativa < 5;
    tentativa++
  ) {


    /*
     * Não é redirect?
     * Então acabou.
     */

    if (
      !resultadoAtual.includes(
        "redirectMsg"
      )
    ) {

      return {
        resposta: respostaAtual,
        resultado: resultadoAtual
      };
    }


    console.log("");

    console.warn(
      "⚠️ [REDIRECT] Redirect detectado!"
    );


    load_text(
      "⚠️ Redirect detectado..."
    );


    /*
     * ======================================
     * PARSER
     * ======================================
     */

    const parser =
      new DOMParser();


    const documento =
      parser.parseFromString(
        resultadoAtual,
        "text/html"
      );


    console.log(
      "[REDIRECT] Documento:",
      documento
    );


    /*
     * ======================================
     * LINK
     * ======================================
     */

    const link =
      documento.querySelector(
        ".redirectText a"
      );


    console.log(
      "[REDIRECT] Link:",
      link
    );


    if (!link) {

      console.error(
        "[REDIRECT] Link não encontrado!"
      );

      return {
        resposta: respostaAtual,
        resultado: resultadoAtual
      };
    }


    const titulo =
      link.textContent.trim();


    const href =
      link.getAttribute("href");


    console.log(
      "[REDIRECT] Título:",
      titulo
    );

    console.log(
      "[REDIRECT] href:",
      href
    );


    /*
     * ======================================
     * URL
     * ======================================
     */

    const url =
      new URL(
        href,
        window.location.origin
      );


    console.log(
      "[REDIRECT] URL absoluta:",
      url.href
    );


    /*
     * Confirma Wikipédia.
     */

    if (
      !url.hostname.includes(
        "wikipedia.org"
      )
    ) {

      console.warn(
        "[REDIRECT] Não é Wikipédia."
      );

      return {
        resposta: respostaAtual,
        resultado: resultadoAtual
      };
    }


    /*
     * ======================================
     * EXTRAIR /wiki/PAGINA
     * ======================================
     */

    const partes =
      url.pathname.split("/");


    const indiceWiki =
      partes.indexOf("wiki");


    if (
      indiceWiki === -1
    ) {

      console.error(
        "[REDIRECT] /wiki/ não encontrado."
      );

      return {
        resposta: respostaAtual,
        resultado: resultadoAtual
      };
    }


    let pagina =
      partes
        .slice(indiceWiki + 1)
        .join("/");


    /*
     * Decodifica URL.
     */

    pagina =
      decodeURIComponent(
        pagina
      );


    /*
     * Wikipédia usa "_" para espaços.
     */

    pagina =
      pagina.replaceAll(
        "_",
        " "
      );


    console.log(
      "[REDIRECT] Página destino:",
      pagina
    );


    /*
     * ======================================
     * NOVA PESQUISA
     * ======================================
     */

    load_text(
      "Redirecionando..."
    );


    await esperar(300);


    respostaAtual =
      await resq(pagina);


    load_text(
      "Transferindo dados..."
    );


    resultadoAtual =
      await respostaAtual.text();


    console.log(
      "[REDIRECT] Nova resposta:"
    );

    console.log(
      "[REDIRECT] Status:",
      respostaAtual.status
    );

    console.log(
      "[REDIRECT] Tamanho:",
      resultadoAtual.length
    );
  }


  /*
   * ======================================
   * REDIRECT DEMAIS
   * ======================================
   */

  console.error(
    "[REDIRECT] Limite de redirects atingido."
  );


  return {
    resposta: {
      status: 502
    },

    resultado: repeaterror
  };
}


// ==========================================
// BOTÃO PESQUISAR
// ==========================================

botoes[0].addEventListener(
  "click",
  async () => {

    /*
     * Liga carregamento.
     */

    load_display(true);

    load_text(
      "Preparando..."
    );


    /*
     * Pequena pausa para permitir
     * que a interface seja atualizada.
     */

    await esperar(100);


    console.clear();


    console.log(
      "================================"
    );

    console.log(
      "        NOVA PESQUISA"
    );

    console.log(
      "================================"
    );


    /*
     * ======================================
     * INPUT
     * ======================================
     */

    prompt =
      textarea.value.trim();


    console.log(
      "[INPUT] Valor:",
      prompt
    );

    console.log(
      "[INPUT] Tamanho:",
      prompt.length
    );


    /*
     * ======================================
     * QUERY VAZIA
     * ======================================
     */

    if (!prompt) {

      console.warn(
        "[INPUT] Query vazia!"
      );


      output.srcdoc =
        errorpage;


      load_text(
        "Prompt vazio"
      );


      await esperar(500);


      load_display(false);

      return;
    }


    try {

      /*
       * ====================================
       * PESQUISA
       * ====================================
       */

      const pesquisa =
        await pesquisarVariacoes(
          prompt
        );


      resposta =
        pesquisa.resposta;


      resultado =
        pesquisa.resultado;


      console.log("");

      console.log(
        "[PESQUISA] Utilizada:",
        pesquisa.pesquisa
      );


      /*
       * ====================================
       * REDIRECT
       * ====================================
       */

      const final =
        await resolverRedirect(
          resposta,
          resultado
        );


      resposta =
        final.resposta;


      resultado =
        final.resultado;


      /*
       * ====================================
       * STATUS FINAL
       * ====================================
       */

      console.log("");

      console.log(
        "================================"
      );

      console.log(
        "[STATUS] Status final:",
        resposta.status
      );

      console.log(
        "================================"
      );


      /*
       * ====================================
       * ERRO 400
       * ====================================
       */

      if (
        resposta.status === 400
      ) {

        console.error(
          "[STATUS] Erro 400."
        );


        output.srcdoc =
          errorpage;


        load_display(false);

        return;
      }


      /*
       * ====================================
       * ERRO 404
       * ====================================
       */

      if (
        resposta.status === 404
      ) {

        console.error(
          "[STATUS] Erro 404."
        );


        output.srcdoc =
          notfoundpage;


        load_display(false);

        return;
      }


      /*
       * ====================================
       * ERRO 502
       * ====================================
       */

      if (
        resposta.status === 502
      ) {

        console.error(
          "[STATUS] Erro 502."
        );


        output.srcdoc =
          repeaterror;


        load_display(false);

        return;
      }


      /*
       * ====================================
       * RESULTADO
       * ====================================
       */

      console.log("");

      console.log(
        "================================"
      );

      console.log(
        "       RESULTADO FINAL"
      );

      console.log(
        "================================"
      );


      console.log(
        "[RESULTADO] Tamanho:",
        resultado.length
      );


      console.log(
        "[RESULTADO] Primeiros caracteres:",
        resultado.slice(0, 200)
      );


      load_text(
        "Exibindo resultado..."
      );


      await esperar(300);


      output.srcdoc =
        resultado;


      console.log(
        "[RESULTADO] Página exibida."
      );


      console.log(
        "================================"
      );


      load_display(false);


    } catch (erro) {

      /*
       * ====================================
       * ERRO DE REDE / JAVASCRIPT
       * ====================================
       */

      console.error(
        "[ERRO] Erro durante pesquisa:",
        erro
      );


      output.srcdoc = `
        <style>
          * {
            margin: 0;
          }

          h1 {
            background-color: #c44646;
            color: #691818;
          }
        </style>

        <h1>Erro</h1>
        <p>Não foi possível realizar a pesquisa.</p>
      `;


      load_display(false);
    }
  }
);


// ==========================================
// BOTÃO LIMPAR
// ==========================================

botoes[1].addEventListener(
  "click",
  () => {

    console.log(
      "[LIMPAR] Limpando pesquisa."
    );


    textarea.value = "";

    output.srcdoc = "";


    console.log(
      "[LIMPAR] Concluído."
    );
  }
);


// ==========================================
// BARRA DE CARREGAMENTO
// ==========================================

const preenchimento =
  document.querySelector(
    "#preenchimento"
  );


let atras = 0;
let value = 50;
let direcao = 1;


if (preenchimento) {

  setInterval(() => {

    atras +=
      5 * direcao;


    value +=
      5 * direcao;


    /*
     * Chegou na direita.
     */

    if (
      value >= 100
    ) {

      value = 100;

      atras = 50;

      direcao = -1;
    }


    /*
     * Chegou na esquerda.
     */

    if (
      atras <= 0
    ) {

      atras = 0;

      value = 50;

      direcao = 1;
    }


    preenchimento.style.left =
      atras + "%";


    preenchimento.style.width =
      (value - atras) + "%";

  }, 40);

} else {

  console.error(
    "[BARRA] #preenchimento não encontrado!"
  );
}


// ==========================================
// CARREGAMENTO
// ==========================================

const bloco_load =
  document.getElementById(
    "carregamento"
  );


function load_display(ativo) {

  console.log(
    "[LOAD] Alterando carregamento:",
    ativo
  );


  if (!bloco_load) {

    console.error(
      "[LOAD] #carregamento não existe!"
    );

    return 1;
  }


  if (ativo) {

    bloco_load.style.display =
      "block";


    console.log(
      "[LOAD] Carregamento VISÍVEL"
    );

  } else {

    bloco_load.style.display =
      "none";


    console.log(
      "[LOAD] Carregamento OCULTO"
    );
  }


  return 0;
}


// ==========================================
// TEXTO DO CARREGAMENTO
// ==========================================

function load_text(text) {

  if (!bloco_load) {

    console.error(
      "[LOAD] #carregamento não existe!"
    );

    return 1;
  }


  if (!text) {

    console.warn(
      "[LOAD] Texto vazio"
    );

    return 1;
  }


  const texto =
    bloco_load.querySelector(
      "p"
    );


  if (!texto) {

    console.error(
      "[LOAD] Não encontrei <p> dentro de #carregamento"
    );

    return 1;
  }


  texto.textContent =
    text;


  console.log(
    "[LOAD] Texto:",
    text
  );


  return 0;
}
import flask
import pywikibot
import os
import requests
from bs4 import BeautifulSoup

app = flask.Flask(__name__, static_folder="public", static_url_path="")

@app.errorhandler(404)
def error(error):
  return "<h1>Error 404</h1><p>Página não encontrada</p>", 404


@app.route("/")
def home():
  return flask.send_from_directory("public", "index.html")


@app.route("/pesquisar", methods=["POST"])
def pesquisa():
  dados = flask.request.get_json()

  
  p = dados.get("query")

  if not p:
    return {"error": "query não informado"}, 400

  site = pywikibot.Site("pt", "wikipedia")
  page = pywikibot.Page(site, p)

  return page.text

@app.route("/pesquisar/html", methods=["POST"])
def pesquisa_html():
    dados = flask.request.get_json()

    if not dados:
        return {"error": "JSON não enviado"}, 400

    pesquisa = dados.get("query")

    if not pesquisa or not pesquisa.strip():
        return {"error": "query vazia"}, 400

    pesquisa = pesquisa.strip()

    resposta = requests.get(
        "https://pt.wikipedia.org/w/api.php",
        params={
            "action": "parse",
            "page": pesquisa,
            "prop": "text",
            "format": "json",
            "formatversion": "2"
        },
        headers={
            "User-Agent": "WikiSearch/1.0 (seu-contato)"
        },
        timeout=15
    )

    if resposta.status_code != 200:
        return {
            "error": "Erro ao consultar a Wikipédia",
            "status": resposta.status_code,
            "response": resposta.text
        }, 502

    try:
        dados_wiki = resposta.json()
    except requests.exceptions.JSONDecodeError:
        return {
            "error": "A Wikipédia não retornou JSON",
            "response": resposta.text[:500]
        }, 502

    if "error" in dados_wiki:
        return {
            "error": dados_wiki["error"]
        }, 404

    html = dados_wiki["parse"]["text"]

    soup = BeautifulSoup(html, "html.parser")

    # Corrige imagens
    for img in soup.find_all("img"):
        src = img.get("src")

        if not src:
            continue

        if src.startswith("//"):
            img["src"] = "https:" + src

        elif src.startswith("/"):
            img["src"] = "https://pt.wikipedia.org" + src

    # Corrige links
    for link in soup.find_all("a"):
        href = link.get("href")

        if not href:
            continue

        if href.startswith("/"):
            link["href"] = "https://pt.wikipedia.org" + href

    return str(soup)

port = int(os.getenv("PORT", 3000))
app.run(host="0.0.0.0", port=port)

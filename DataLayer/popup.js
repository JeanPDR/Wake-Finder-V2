const keys = [
  "dataLayer1",
  "dataLayer2",
  "dataLayer3",
  "dataLayer4",
  "dataLayer5",
];
let global = {};

document.addEventListener("DOMContentLoaded", function () {
  const loadDataLayerButton = document.getElementById("loadDataLayerButton");
  const loader = document.getElementById("loader");
  const content = document.getElementById("content");

  // Ação ao clicar no botão de carregar DataLayer
  loadDataLayerButton.addEventListener("click", function () {
    loader.style.display = "block"; // Mostrar o "Carregando..."
    content.innerHTML = ""; // Limpar conteúdo antigo

    // Executar o processo de obtenção dos DataLayer names
    chrome.storage.sync.get(keys, (values) => {
      const names = Object.values(values).filter((value) => value);
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          message: "dataLayerNames",
          names: names,
        });
      });
    });
  });

  // Lidar com a resposta que contém os dados do DataLayer
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    loader.style.display = "none"; // Ocultar o "Carregando..."
    global.url = message.url;
    global.data = message.data;
    global.index = 0;

    if (message.error !== undefined) {
      return writeError();
    }

    if (message.data.length === 0) {
      return writeMissing();
    }

    writeFound();

    global.container = document.querySelector("#data");
    global.container.appendChild(
      renderjson.set_icons("+", "-").set_show_to_level("all")(
        JSON.parse(global.data[global.index][1])
      )
    );

    for (i in global.data) {
      createTab(i);
    }

    addListeners();
  });
});

/**
 * HELPER FUNCTIONS
 */

function writeError() {
  const content = `
		<div id="data">
			<br>
			Oops, parece que temos um erro.
			<br><br>
			${global.data.error}
		</div>
		<br>
	`;
  return writeContent(content);
}

function writeMissing() {
  const content = `
		<div id="data">
			<br>
			Não contem dataLayer nessa pagina
		</div>
		<br>
	`;
  return writeContent(content);
}

function writeFound() {
  const content = `
		<p id="details">
			<i id="location"><b>on </b>${global.url}</i><br>
			<i id="time"><b>at </b>${new Date().toLocaleString({
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</i>
		</p>
		<div id="selector"></div>
		<div id="actions">
			<div id="collapseall">Fechar</div>
			<div id="expandall" style="display: none">Abrir</div>
			<div id="copytoclipboard">Copiar</div>
		</div>
		<div id="data"></div>
	`;
  writeContent(content);
}

function writeContent(content) {
  document.querySelector("main").innerHTML = content;
}

function addListeners() {
  const copyButton = document.querySelector("#copytoclipboard");
  copyButton.addEventListener("click", copyObject);

  const collapseButton = document.querySelector("#collapseall");
  collapseButton.addEventListener("click", handleSyntax);

  const expandButton = document.querySelector("#expandall");
  expandButton.addEventListener("click", handleSyntax);
}

function createTab(index) {
  let button = document.createElement("button");
  button.id = index;
  button.innerHTML = global.data[index][0];
  if (index == 0) {
    button.className = "activated";
  }
  button.addEventListener("click", changeObject);
  document.querySelector("#selector").appendChild(button);
}

function changeObject() {
  global.index = parseInt(this.id);
  const collapseButton = document.querySelector("#collapseall");
  const expandButton = document.querySelector("#expandall");
  expandButton.style.display = "none";
  collapseButton.style.display = "inline-block";
  for (var i = 0; i < global.data.length; i++) {
    if (global.index != i) {
      document.getElementById(i).className = "";
    } else {
      document.getElementById(i).className = "activated";
    }
  }
  global.container.innerHTML = "";
  global.container.appendChild(
    renderjson.set_show_to_level("all")(
      JSON.parse(global.data[global.index][1])
    )
  );
}

function copyObject() {
  var copyText = document.createElement("textarea");
  document.body.appendChild(copyText);
  copyText.value = global.data[global.index][1];
  copyText.select();
  document.execCommand("copy");
  document.body.removeChild(copyText);
}

function handleSyntax() {
  var level = "all";
  const collapseButton = document.querySelector("#collapseall");
  const expandButton = document.querySelector("#expandall");
  if (this.id === "expandall") {
    expandButton.style.display = "none";
    collapseButton.style.display = "inline-block";
  }
  if (this.id === "collapseall") {
    expandButton.style.display = "inline-block";
    collapseButton.style.display = "none";
    level = "0";
  }
  global.container.innerHTML = "";
  global.container.appendChild(
    renderjson.set_show_to_level(level)(
      JSON.parse(global.data[global.index][1])
    )
  );
}

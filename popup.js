document.addEventListener("DOMContentLoaded", function () {
  const requestsTable = document.getElementById("requests-table");
  const clearButton = document.getElementById("clear-requests");
  const integrationMessage = document.getElementById("integration-message");
  const gtmStatus = document.getElementById("gtm-status");
  const datalayerContent = document.getElementById("datalayer-output");

  // Função para alternar a exibição dos detalhes do payload
  function togglePayload(event) {
    const payloadDetails = event.target.nextElementSibling;
    payloadDetails.style.display =
      payloadDetails.style.display === "none" ? "block" : "none";
  }

  function organizeData(rawData) {
    return rawData
      .replace(/:\s+/g, ": ") // Garante que haja apenas um espaço após os dois-pontos
      .split("\n") // Usa a quebra de linha como delimitador principal
      .map((line) => line.trim()) // Remove espaços desnecessários ao redor
      .reduce((acc, line) => {
        if (line.includes(":")) {
          const [key, ...value] = line.split(": ");
          const joinedValue = value.join(": ");
          acc.push(`${key}: ${joinedValue.trim()}`);
        }
        return acc;
      }, [])
      .join("\n");
  }

  // Função que exibe as requisições armazenadas no localStorage
  function displayRequests() {
    chrome.storage.local.get(
      { requests: [], integrationFound: false },
      function (data) {
        requestsTable.innerHTML = ""; // Limpa a tabela de requisições
        let noValidTagFound = true;

        // Percorre todas as requisições armazenadas
        data.requests.forEach((request) => {
          const row = document.createElement("div");
          row.classList.add(
            request.valid ? "valid-request" : "invalid-request"
          );

          if (request.valid) noValidTagFound = false;

          let tagMessage = "Não contém tag válida";
          if (request.tag === "client")
            tagMessage = "Nesta página contém a tag client";
          else if (request.tag === "product")
            tagMessage = "Nesta página contém tag de produto";
          else if (request.tag === "cart")
            tagMessage = "Nesta página contém tag de carrinho";
          else if (request.tag === "order")
            tagMessage = "Nesta página contém a tag de order";

          const organizedPayload = organizeData(request.payload);
          row.innerHTML = `
            <div>${tagMessage}
              <div>
                <button class="toggle-payload">Detalhes</button>
                <div class="payload-details" style="display:none; white-space: pre-wrap;">${organizedPayload}</div>
              </div>
            </div>`;
          requestsTable.appendChild(row);
        });

        document.querySelectorAll(".toggle-payload").forEach((button) => {
          button.addEventListener("click", togglePayload);
        });

        integrationMessage.style.display = data.integrationFound
          ? "none"
          : "block";
      }
    );
  }

  // Função para verificar a presença do GTM
  function checkGTM() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => {
            const scripts = Array.from(document.scripts);
            const gtmScript = scripts.find((script) =>
              script.src.includes("googletagmanager.com/gtm.js?id=")
            );
            return gtmScript ? gtmScript.src.match(/id=(GTM-\w+)/)[1] : null;
          },
        },
        (results) => {
          gtmStatus.textContent =
            results && results[0] && results[0].result
              ? `GTM encontrado: ${results[0].result}`
              : "GTM não encontrado";
        }
      );
    });
  }

  // Função para obter o conteúdo do dataLayer
  function getDataLayer() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => JSON.stringify(window.dataLayer, null, 2),
        },
        (results) => {
          datalayerContent.textContent =
            results && results[0] && results[0].result
              ? results[0].result
              : "dataLayer não encontrado ou vazio.";
        }
      );
    });
  }

  clearButton.addEventListener("click", function () {
    chrome.storage.local.set(
      { requests: [], integrationFound: false },
      function () {
        displayRequests();
      }
    );
  });

  displayRequests();
  checkGTM();
  getDataLayer();
});

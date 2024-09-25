document.addEventListener("DOMContentLoaded", function () {
  const requestsTable = document.getElementById("requests-table");
  const clearButton = document.getElementById("clear-requests");
  const gtmStatus = document.getElementById("gtm-status");
  const datalayerContent = document.getElementById("datalayer-output");
  const loadDataLayerButton = document.getElementById("loadDataLayerButton");
  const behaviorsOutput = document.getElementById("behaviors-output");
  const workflowOutput = document.getElementById("workflow-output");
  const workStatus = document.getElementById("work-status");

  // Função para verificar o GTM
  function checkGTM() {
    gtmStatus.textContent = "Recarregando GTM...";
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

  // Função para exibir comportamentos (Behaviors)
  function displayBehaviorRequests() {
    behaviorsOutput.textContent = "Recarregando comportamentos...";
    behaviorsOutput.innerHTML = ""; // Limpar conteúdo anterior

    chrome.storage.local.get("networkRequests", function (data) {
      const requests = data.networkRequests || [];

      if (requests.length === 0) {
        behaviorsOutput.innerHTML = "<p>Nenhum comportamento capturado.</p>";
        return;
      }

      requests.forEach((request) => {
        const parsedPayload = JSON.parse(request.requestBody);

        if (parsedPayload && parsedPayload.behaviors) {
          const behaviors = parsedPayload.behaviors;

          behaviors.forEach((behavior) => {
            const requestElement = document.createElement("div");
            requestElement.classList.add("behavior-request");

            // Exibir apenas os campos de clientId, customerId, metadata, personId, referer, url
            requestElement.innerHTML = `
              <div><strong>clientId:</strong> ${behavior.clientId}</div>
              <div><strong>customerId:</strong> ${behavior.customerId}</div>
              <div><strong>metadata:</strong> 
                <pre>${JSON.stringify(behavior.metadata, null, 2)}</pre>
              </div>
              <div><strong>personId:</strong> ${behavior.personId}</div>
              <div><strong>referer:</strong> ${behavior.referer}</div>
              <div><strong>url:</strong> ${decodeURIComponent(
                behavior.url
              )}</div>
            `;

            behaviorsOutput.appendChild(requestElement);
          });
        }
      });
    });
  }

  // Função para exibir os workflows capturados
  function displayWorkflowRequests() {
    workflowOutput.textContent = "Recarregando workflows...";
    workflowOutput.innerHTML = ""; // Limpar conteúdo anterior

    chrome.storage.local.get("workflowRequests", function (data) {
      const requests = data.workflowRequests || [];

      if (requests.length === 0) {
        workflowOutput.innerHTML = "<p>Nenhum workflow capturado.</p>";
        return;
      }

      requests.forEach((request) => {
        const urlParams = new URL(request.url).searchParams;

        const workflowElement = document.createElement("div");
        workflowElement.innerHTML = `
          <p><strong>i:</strong> ${urlParams.get("i")}</p>
          <p><strong>data:</strong> ${decodeURIComponent(
            urlParams.get("data")
          )}</p>
          <p><strong>rand:</strong> ${urlParams.get("rand")}</p>
          <p><strong>rand2:</strong> ${urlParams.get("rand2")}</p>
        `;
        workflowOutput.appendChild(workflowElement);
      });
    });
  }

  // Botão de recarregar workflows
  const reloadWorkflowButton = document.getElementById("reload-workflow");
  reloadWorkflowButton.addEventListener("click", displayWorkflowRequests);

  // Função para limpar as requisições de Workflow e Behaviors
  clearButton.addEventListener("click", function () {
    chrome.storage.local.set(
      { networkRequests: [], workflowRequests: [] },
      function () {
        behaviorsOutput.innerHTML = "<p>Nenhum comportamento capturado.</p>";
        workflowOutput.innerHTML = "<p>Nenhum workflow capturado.</p>";
      }
    );
  });

  // Inicialização ao carregar o popup
  displayWorkflowRequests();
  displayBehaviorRequests();
});

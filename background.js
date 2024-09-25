let requests = [];

// Função para tentar parsear o JSON e evitar erros
function tryParseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null; // Se não for JSON, retorna null
  }
}

// Função para verificar se a URL corresponde ao padrão desejado
function isTargetUrl(url) {
  return (
    url.includes("/behaviors") ||
    url.includes("https://wonka.socialminer.com/ursa/enterprise/behaviors") ||
    url.includes("__workflow.gif") // Adiciona suporte para workflow
  );
}

// Função para adicionar a requisição capturada e exibir no popup
function addRequest(details, requestBody) {
  let parsedRequestBody = tryParseJSON(requestBody) || requestBody; // Se não for JSON, mantém o conteúdo bruto

  let payload = {
    url: details.url,
    method: details.method,
    requestBody: parsedRequestBody,
  };

  // Armazena a requisição capturada
  requests.push(payload);

  // Armazena no storage local para ser usado no popup
  chrome.storage.local.set({ networkRequests: requests });
}

// Função para verificar a presença de tags específicas e integração socl
function processRequest(details) {
  const validPaths = [
    "__client.gif",
    "__product.gif",
    "__cart.gif",
    "__order.gif",
  ];
  let tagType = null;
  let found = false;
  let payload = "";

  // Verificar _workflow (workflow instalado)
  if (details.url.includes("__workflow.gif")) {
    // Aqui, o workflow será tratado separadamente e não marcado como tag inválida
    chrome.storage.local.get({ workflowRequests: [] }, function (data) {
      const workflowRequests = data.workflowRequests || [];
      workflowRequests.push({
        id: details.requestId,
        url: details.url,
        timeStamp: details.timeStamp.toString(),
      });
      chrome.storage.local.set({ workflowRequests: workflowRequests });
    });
    return; // Sair para que o _workflow.gif seja tratado separadamente e não continue como tag inválida
  }

  // Verificar socl (integração mínima encontrada com o ID dinâmico)
  const soclUrlPattern =
    /^https:\/\/api\.soclminer\.com\.br\/v2\.1\/customers\/([a-f0-9-]+)\?format=json&url=.*&isMobile=.*$/;
  const match = details.url.match(soclUrlPattern);
  if (match) {
    const customerId = match[1]; // Extrai o customer ID da URL
    chrome.storage.local.set({ soclFound: true, customerId });
    console.log(
      `Integração mínima (socl) encontrada com o customer ID: ${customerId}`
    );
  }

  // Verificar se a URL contém uma das tags válidas
  validPaths.forEach((path) => {
    if (details.url.includes(path)) {
      found = true;
      if (path === "__client.gif") tagType = "client";
      else if (path === "__product.gif") tagType = "product";
      else if (path === "__cart.gif") tagType = "cart";
      else if (path === "__order.gif") tagType = "order";
    }
  });

  if (found) {
    chrome.storage.local.set({ integrationFound: true });

    // Processar payload baseado no método
    if (details.method === "GET") {
      const urlParams = new URL(details.url).searchParams;
      payload = Array.from(urlParams.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
    } else if (
      details.method === "POST" &&
      details.requestBody &&
      details.requestBody.raw
    ) {
      const decoder = new TextDecoder("utf-8");
      const formData = new URLSearchParams(
        decoder.decode(details.requestBody.raw[0].bytes)
      );
      payload = Array.from(formData.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
    }

    // Armazena a requisição processada
    chrome.storage.local.get({ requests: [] }, function (data) {
      const requests = data.requests;
      requests.push({
        id: details.requestId,
        url: details.url,
        method: details.method,
        timeStamp: details.timeStamp.toString(),
        tag: tagType,
        valid: found,
        payload: payload,
      });
      chrome.storage.local.set({ requests: requests });
    });
  }
}

// Listener para capturar e processar requisições de rede
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (isTargetUrl(details.url)) {
      let requestBody = null;

      if (details.requestBody && details.requestBody.raw) {
        // Tenta decodificar o corpo da requisição se for válido
        requestBody = new TextDecoder("utf-8").decode(
          details.requestBody.raw[0].bytes
        );
      }

      addRequest(details, requestBody); // Adiciona requisição com o corpo
    }

    // Processa a requisição para verificar tags e integrações
    processRequest(details);
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

// Listener para atualizar o status da solicitação após a conclusão
chrome.webRequest.onCompleted.addListener(
  function (details) {
    chrome.storage.local.get(
      {
        requests: [],
        soclFound: false,
        customerId: "",
        workFound: false,
      },
      function (data) {
        const requests = data.requests;
        const requestIndex = requests.findIndex(
          (req) =>
            req.id === details.requestId &&
            req.timeStamp === details.timeStamp.toString()
        );
        if (requestIndex !== -1) {
          requests[requestIndex].status = details.statusCode;
          chrome.storage.local.set({ requests: requests });
        }

        // Atualiza a interface para mostrar as informações
        document.getElementById("socl-status").textContent = data.soclFound
          ? `SDK instalada, customer ID: ${data.customerId}`
          : "Nenhuma integração mínima (socl) encontrada.";
        document.getElementById("work-status").textContent = data.workFound
          ? "Workflow instalado."
          : "Nenhum workflow encontrado.";
      }
    );
  },
  { urls: ["<all_urls>"] }
);

// Listener para quando a extensão for instalada
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    requests: [],
    workflowRequests: [], // Para separar as requisições de workflow
    integrationFound: false,
    soclFound: false,
    workFound: false,
  });

  const validPaths = [
    "__client.gif",
    "__product.gif",
    "__cart.gif",
    "__order.gif",
  ];

  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: validPaths.map((path, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          { header: "X-BTG-Monitor", operation: "set", value: "true" },
        ],
      },
      condition: {
        urlFilter: `*${path}*`,
        resourceTypes: [
          "main_frame",
          "sub_frame",
          "stylesheet",
          "script",
          "image",
          "font",
          "object",
          "xmlhttprequest",
          "ping",
          "csp_report",
          "media",
          "websocket",
          "other",
        ],
      },
    })),
    removeRuleIds: validPaths.map((_, index) => index + 1),
  });

  chrome.storage.sync.set({
    dataLayer1: "dataLayer",
    dataLayer2: "digitalData",
    dataLayer3: "tc_vars",
    dataLayer4: "utag_data",
    dataLayer5: "udo",
  });

  console.log("Wake Finder extension installed");
});

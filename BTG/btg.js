// btg.js

// Definição dos dataLayers padrão
export const defaults = {
  dataLayer1: "dataLayer",
  dataLayer2: "digitalData",
  dataLayer3: "tc_vars",
  dataLayer4: "utag_data",
  dataLayer5: "udo",
};

// Função para inicializar o módulo BTG
export function initBTG() {
  // Configurações iniciais
  chrome.storage.sync.set(defaults);

  const validPaths = [
    "__client.gif",
    "__product.gif",
    "__cart.gif",
    "__order.gif",
  ];

  // Atualiza regras dinâmicas para modificar cabeçalhos
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

  console.log("Módulo BTG inicializado");
}

// Função para lidar com as requisições BTG
export function handleBTGRequest(details) {
  const validPaths = [
    "__client.gif",
    "__product.gif",
    "__cart.gif",
    "__order.gif",
  ];
  let tagType = null;
  let found = false;
  let payload = "";

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
      let decoder = new TextDecoder("utf-8");
      const formData = new URLSearchParams(
        decoder.decode(details.requestBody.raw[0].bytes)
      );
      payload = Array.from(formData.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
    }

    chrome.storage.local.get({ requests: [] }, function (data) {
      let requests = data.requests;
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

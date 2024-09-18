// background.js

const defaults = {
  dataLayer1: "dataLayer",
  dataLayer2: "digitalData",
  dataLayer3: "tc_vars",
  dataLayer4: "utag_data",
  dataLayer5: "udo",
};

// Ao instalar a extensão
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    requests: [],
    integrationFound: false,
    soclFound: false,
    workFound: false,
  });
  chrome.storage.sync.set(defaults);

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

  console.log("Wake Finder extension installed");
});

// Verifica se o cliente está usando _work ou socl
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    const validPaths = [
      "__client.gif",
      "__product.gif",
      "__cart.gif",
      "__order.gif",
    ];
    let tagType = null;
    let found = false;
    let payload = "";

    // Verificar _work (workflow instalado)
    if (details.url.includes("_work")) {
      chrome.storage.local.set({ workFound: true });
      console.log("Workflow encontrado.");
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
        const decoder = new TextDecoder("utf-8");
        const formData = new URLSearchParams(
          decoder.decode(details.requestBody.raw[0].bytes)
        );
        payload = Array.from(formData.entries())
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
      }

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
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

// Exibe o status da solicitação após o carregamento
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

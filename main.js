// main.js
import { displayRequests } from "./BTG/displayRequests.js";
import { checkGTM } from "./GTM/checkGTM.js";
import { getDataLayer } from "./DataLayer/getDataLayer.js";

document.addEventListener("DOMContentLoaded", function () {
  // Seleciona os elementos da página que serão manipulados
  const requestsTable = document.getElementById("requests-table");
  const clearButton = document.getElementById("clear-requests");
  const integrationMessage = document.getElementById("integration-message");
  const gtmStatus = document.getElementById("gtm-status");
  const datalayerContent = document.getElementById("datalayer-content");

  // Chama as funções ao carregar a página
  displayRequests(requestsTable, integrationMessage);
  checkGTM(gtmStatus);
  getDataLayer(datalayerContent);

  // Limpa as requisições armazenadas no localStorage e atualiza a tabela
  clearButton.addEventListener("click", function () {
    chrome.storage.local.set(
      { requests: [], integrationFound: false },
      function () {
        displayRequests(requestsTable, integrationMessage);
      }
    );
  });
});

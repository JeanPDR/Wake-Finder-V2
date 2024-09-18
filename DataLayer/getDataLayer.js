// getDataLayer.js
export function getDataLayer(datalayerContent) {
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

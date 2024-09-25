// checkGTM.js
export function checkGTM(gtmStatus) {
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

// workflow.js

export function checkWorkflow(details) {
  // Verificar se a URL contém "_work"
  if (details.url.includes("_work")) {
    // Armazenar o payload da requisição
    chrome.storage.local.set(
      {
        workFound: true,
        workPayload: details.requestBody,
      },
      function () {
        console.log("Workflow encontrado e payload armazenado.");
      }
    );
  }
}

export function updateWorkflowStatus() {
  // Atualiza o status do Workflow na interface
  chrome.storage.local.get(
    { workFound: false, workPayload: null },
    function (data) {
      chrome.runtime.sendMessage({
        type: "updateWorkStatus",
        workFound: data.workFound,
        workPayload: data.workPayload,
      });
    }
  );
}

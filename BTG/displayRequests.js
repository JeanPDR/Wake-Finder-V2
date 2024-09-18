// displayRequests.js
import { organizeData } from "./organizeData.js";
import { togglePayload } from "./togglePayload.js";

export function displayRequests(requestsTable, integrationMessage) {
  chrome.storage.local.get(
    { requests: [], integrationFound: false },
    function (data) {
      requestsTable.innerHTML = "";
      let noValidTagFound = true;

      data.requests.forEach((request) => {
        const row = document.createElement("div");
        row.classList.add(request.valid ? "valid-request" : "invalid-request");

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

      // Adiciona o evento de click para exibir/ocultar o payload
      document.querySelectorAll(".toggle-payload").forEach((button) => {
        button.addEventListener("click", togglePayload);
      });

      integrationMessage.style.display = data.integrationFound
        ? "none"
        : "block";
    }
  );
}

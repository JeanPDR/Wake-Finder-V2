// socl.js

export function checkSocl(details) {
  // Verificar se a URL corresponde ao padrão da API Soclminer
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
}

export function updateSoclStatus() {
  // Atualiza o status do Socl na interface
  chrome.storage.local.get(
    { soclFound: false, customerId: "" },
    function (data) {
      chrome.runtime.sendMessage({
        type: "updateSoclStatus",
        soclFound: data.soclFound,
        customerId: data.customerId,
      });
    }
  );
}

// togglePayload.js
export function togglePayload(event) {
  const payloadDetails = event.target.nextElementSibling;
  payloadDetails.style.display =
    payloadDetails.style.display === "none" ? "block" : "none";
}

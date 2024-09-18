// forward incoming data from website to popup.js
document.addEventListener('sendDataLayerInformation', function(e) {
	chrome.runtime.sendMessage(e.detail);
});

// forward data layer names to 
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if( request.message === "dataLayerNames" ) {
			const names = request.names;
			document.dispatchEvent(
				new CustomEvent('sendDataLayerNames', { 
					"detail": {
						"names": names 
					}
				})
			)
		}
	}
);

// append inject.js to current website
(() => {
	var script = document.createElement("script");
	script.id = "simpleDataLayerViewerHelper";
	script.src = chrome.runtime.getURL("inject.js");
	(document.head||document.documentElement).appendChild(script);
})();
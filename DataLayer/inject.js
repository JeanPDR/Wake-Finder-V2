document.addEventListener('sendDataLayerNames', function(e) {

    const names = e.detail.names;

    let results = {
        url: document.location.href,
        data: []
    };

    if (names.length != 0) {
        names.forEach((name) => {
            if(window[name] !== undefined) {
                results.data.push([
                    name,
                    JSON.stringify(window[name])
                ]);
            }
        });
    } else {
        results.error = "There are no data layer names defined. You can add names under options.";
    }
    
    document.dispatchEvent(new CustomEvent('sendDataLayerInformation', {detail: results}))
});
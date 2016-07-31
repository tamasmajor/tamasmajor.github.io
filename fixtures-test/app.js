(function () {
    'use strict';

    function get (url) {
        return new Promise(function (resolve, reject) {
            // the request
            var req = new XMLHttpRequest();
            req.open('GET', url, true);

            req.onload = function() {
                // success (0 - for CORS error locally)
                if (req.status === 200 || req.status === 0) {
                    // fake latency
                    setTimeout(function () {
                        resolve(req.response);
                    }, Math.random() * 500 + 200);
                }
                else {
                    reject(Error(req.statusText));
                }
            };

            // on error
            req.onerror = function() {
                reject(Error("Network error"));
            };

            // Make the request
            req.send();
        });
    }

    function getJSON (url) {
        return get(url).then(function (content) {
            return JSON.parse(content);
        });
    }

    getJSON('https://manutd-fixtures-server.herokuapp.com/fixtures').then(function (fixtures) {
      console.log(fixtures);
    }).catch(function (err) {
        console.log("Argh " + err.message);
    })
})();

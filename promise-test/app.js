(function () {
    'use strict';

    var storyDiv = document.querySelector('.story');

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

    function addChapterTitleToPage (content) {
        var p = document.createElement('h3');
        p.textContent = content;
        storyDiv.appendChild(p);
    }

    function addHtmlToPage(content) {
        var div = document.createElement('div');
        div.innerHTML = content;
        storyDiv.appendChild(div);
    }

    getJSON('story.json').then(function (story) {
        addHtmlToPage(story.heading);
        return story.chapterUrls.map(getJSON)
            .reduce(function (sequence, chapterPromise) {
                return sequence.then(function () {
                    return chapterPromise;
                }).then(function (chapter) {
                    addChapterTitleToPage(chapter.chapter);
                    addHtmlToPage(chapter.html);
                });
            }, Promise.resolve());
    }).then(function () {
        addHtmlToPage("All done");
    }).catch(function (err) {
        addHtmlToPage("Argh " + err.message);
    }).then(function () {
        document.querySelector('.progress').style.display = 'none';
    });
})();

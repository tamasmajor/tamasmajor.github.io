(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function () {

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js', {scope:'/simple-test/'}).then(function(reg) {
      // registration worked
      console.log('Registration succeeded. Scope is ' + reg.scope);
    }).catch(function(error) {
      // registration failed
      console.log('Registration failed with ' + error);
    });
  } else {
    console.log('Not supported');
  }

  var fixtureHandler = require('./fixture-handler');
  var isNextFixtureAdded = false;

  (function init() {
    var data = loadFixtures();
    if (data) {
      addFixturesToPage(data.fixtures);
    } else {
      getFixtures();
    }
  }());

  /**
   * Load the data from the localStorage
   */
  function loadFixtures() {
    var data = localStorage.fixtures;
    if (data) {
      var tmp = JSON.parse(localStorage.fixtures);
      return tmp; /*console.log(tmp);
      return {
        saveTime: tmp.saveTime,
        fixtures: JSON.parse(tmp.fixtures)
      }*/
    }
    return undefined;
  }


  /**
   * Save the data to the localStorage
   */
  function storeFixtures(fixtures) {
    if (fixtures) {
      localStorage.fixtures = JSON.stringify({
        saveTime: new Date().getTime(),
        fixtures: fixtures
      });
    }
  }

  /**
   * Get the fixtures from the server
   */
  function getFixtures() {
    var fixtures = [];
    // The getFixturePromises() will send the request and will return
    // immediatelly with the promises. The with the reduce we will process
    // then in the order of the pages and not the order of the responses.
    // So we can show the first fixtures immediatelly when they arrive and
    // we don't need to wait for all requests to respond before we show something
    fixtureHandler.getFixturePromises().reduce(function (sequence, fixturePromise) {
      return sequence.then(function() {
        return fixturePromise;
      }).then(function (parsedFixtures) {
        fixtures = fixtures.concat(parsedFixtures);
        return addFixturesToPage(parsedFixtures);
      });
    }, Promise.resolve())
    .then(function () {
      // pages were read, save the data to the localStorage
      storeFixtures(fixtures);
    });
  }


  /**
   * Add the fixture items to the DOM
   */
  function addFixturesToPage(fixtures) {
    /**
     * Construct one fixture list item
     */
    function createFixtureListItem(fixture) {
      // create the fixture item holder
      var fixtureItemDiv = createDivWithClass("fixture-item");
      var opponentDiv = createDivWithClass("fixture-item-opponent");
      addTextNode(opponentDiv, fixture.opponent + " (" + fixture.type + ")");
      var competitionDiv = createDivWithClass("fixture-item-competition");
      addTextNode(competitionDiv, fixture.competition);
      var dateDiv = createDivWithClass("fixture-item-date");
      addTextNode(dateDiv, formatDate(fixture.date) + " " + formatTime(fixture.date));

      fixtureItemDiv.appendChild(opponentDiv);
      fixtureItemDiv.appendChild(competitionDiv);
      fixtureItemDiv.appendChild(dateDiv);

      return fixtureItemDiv;
    }

    // first filter for the upcoming fixtures
    var now = new Date().getTime();
    var upcoming = fixtures.filter(function (item) {
      return item.date > now;
    });

    if (!isNextFixtureAdded && upcoming.length > 0) {
      var nextFixture = upcoming.shift();
      isNextFixtureAdded = true;
      addNextFixtureToPage(nextFixture);
    }
    var holder = document.getElementById("fixture-list-holder");
    upcoming.forEach(function (item) {
      holder.appendChild(createFixtureListItem(item));
    });
  }


  /**
   * Add the very next fixture to the DOM
   */
  function addNextFixtureToPage(fixture) {
    var nextFixtureDiv = document.getElementById('next-fixture');

    // add the competition div
    var competitionDiv = createDivWithClass("competition");
    addTextNode(competitionDiv, fixture.competition);
    nextFixtureDiv.appendChild(competitionDiv);

    // teams and kickoff
    var team1Div = createDivWithClass("team");
    var team2Div = createDivWithClass("team");
    var vsDiv = createDivWithClass("vs");
    if (fixture.type && fixture.type === "A") {
      addTextNode(team1Div, fixture.opponent);
      addTextNode(vsDiv, "vs");
      addTextNode(team2Div, "Manchester United");
    } else {
      addTextNode(team1Div, "Manchester United");
      addTextNode(vsDiv, "vs");
      addTextNode(team2Div, fixture.opponent);
    }
    nextFixtureDiv.appendChild(team1Div);
    nextFixtureDiv.appendChild(vsDiv);
    nextFixtureDiv.appendChild(team2Div);

    // add the date div
    var dateDiv = createDivWithClass("match-date");
    addTextNode(dateDiv, formatDate(fixture.date));
    nextFixtureDiv.appendChild(dateDiv);

    // kickoff
    var kickoffDiv = createDivWithClass("kickoff");
    addTextNode(kickoffDiv, formatTime(fixture.date));

    nextFixtureDiv.appendChild(kickoffDiv);
  }

  /**
   * Adds a text node to an element
   */
  function addTextNode(element, text) {
    return element.appendChild(document.createTextNode(text));
  }

  /**
   *Creates a div element and add the param classes to it
   */
  function createDivWithClass(classes) {
    var div = document.createElement("div");
    if (typeof(classes) === 'string') {
      div.className += classes;
    } else if (classes instanceof Array) {
      div.className += classes.join(' ');
    }
    return div;
  }


  function formatDate(date) {
    var d = new Date(date);
    var day = d.getDate();
    day = day < 10 ? "0" + day : day;
    var month = d.getMonth() + 1;
    month = month < 10 ? "0" + month : month;
    return day + "/" + month + "/" + d.getFullYear();
  }


  function formatTime(date) {
    var d = new Date(date);
    var hours = d.getHours();
    hours = hours < 10 ? "0" + hours : hours;
    var minutes = d.getMinutes();
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return hours + ":" + minutes;
  }

}());

},{"./fixture-handler":2}],2:[function(require,module,exports){
var requests = require('./requests');
var fixtureParser = require('./fixture-parser');

var fixtureHandler = (function () {
  'use strict';

  /**
   * Make the request for the fixture page and parse the result
   */
  function getFixtureList(url) {
    return requests.get(url).then(function (html) {
      return fixtureParser.parse(html);
    });
  }

  var baseUrl = "https://iparutca.noip.me:8888/manutd/en/Fixtures-And-Results/United-Fixtures-And-Results.aspx?pageNo=";
  var pages = [];
  for (var i=0; i<4; i++) {
    pages.push(baseUrl + (i+1));
  }


  /**
   * Make the request for all the pages and return the promises in an array
   */
  function getFixturePromises() {
    return pages.map(getFixtureList);
  }

  return {
    getFixturePromises: getFixturePromises
  }
}());

module.exports = fixtureHandler;

},{"./fixture-parser":3,"./requests":4}],3:[function(require,module,exports){
var fixturesParser = (function() {
  'use strict';

  function parseFixtureElem(row, year) {
    var fixture = {};
    var cells = row.getElementsByTagName('td');
    for (var i=0; i<cells.length; i++) {
      // we assume there is only one class
      switch (cells[i].className) {
        case 'date':
          fixture.date = cells[i].innerText;
          break;
        case 'competition':
          fixture.competition = cells[i].innerText;
          break;
        case 'opponent':
          fixture.opponent = cells[i].innerText;
          break;
        case 'kickoff':
          fixture.kickoff = cells[i].innerText;
          break;
        case 'score':
          fixture.score = cells[i].innerText;
          break;
        case '':
          // TODO: fix this (the type of the fixture [H,A,N])
          fixture.type = cells[i].innerText;
          break;
      }
    }
    // Check that we have the mandatory properties to continue
    if (!fixture.date || fixture.date === "TBC" || !fixture.opponent || !fixture.hasOwnProperty("score")) {
      return undefined;
    }
    // if the kickoff time is not yet confirmed
    if (!fixture.kickoff) {
      fixture.kickoff = "00:00";
    }
    // process the date
    var dayAndMonth = fixture.date.split(" ");
    // first remove the BST and other things then split it
    var hoursAndMins = fixture.kickoff.match(/[0-9]{2}:[0-9]{2}/)[0].split(':');
    try {
      var day = dayAndMonth[0];
      var month = getMonth(dayAndMonth[1]); // get the JS value from the abbreviation
      var hours = hoursAndMins[0];
      var mins = hoursAndMins[1];
      var d = new Date(Date.UTC(year, month, day, hours, mins));
      fixture.date = d.getTime();
      delete fixture.kickoff;
    } catch (error) {
      console.log(error);
      return undefined;
    }
    return fixture;
  }

  function parseMonth(theadEl, tbodyEl) {
    var fixtures = [];
    if (!theadEl || theadEl.tagName !== "THEAD" || !tbodyEl || tbodyEl.tagName !== "TBODY") {
      return [];
    }
    try {
      var year = theadEl.getElementsByTagName('tr')[0].innerText.split(" ")[1];
      var fixtureRows = tbodyEl.getElementsByTagName('tr');
      for (var i=0; i<fixtureRows.length; i++) {
        var fixture = parseFixtureElem(fixtureRows[i], year);
        if (fixture) {
          fixtures.push(fixture);
        }
      }
    } catch (error) {
      console.log("Can't parse the monthly fixtures");
      console.log(error);
      return [];
    }
    return fixtures;
  }

  function parse(html) {
    var fixtures = [];
    // remove the src link, so the browser won't try to download the resources
    html = html.replace(/src.*ashx[^\s\\]*/g, '');
    var holder = document.createElement("div");
    holder.innerHTML = html;

    try {
      var table = holder.getElementsByTagName('table');
      var children = table[0].children;
      var i = 0;
      for (var i=0; i<children.length; i+=2) {
        // the children should always contains a thead, followed by a tbody repeat X times
        // if the structure is different, parseMonth will return an empty array (=no fixtures)
        fixtures = fixtures.concat(parseMonth(children[i], children[i+1]));
      }
    } catch(error) {
      console.log("Can't parse the data");
      console.log(error);
      return [];
    }
    return fixtures;
  }

  /** Get JS month from the month name abbrevoation */
  function getMonth(monthAsString) {
    var month;
    switch (monthAsString) {
      case 'Jan': month = 0; break;
      case 'Feb': month = 1; break;
      case 'Mar': month = 2; break;
      case 'Apr': month = 3; break;
      case 'May': month = 4; break;
      case 'Jun': month = 5; break;
      case 'Jul': month = 6; break;
      case 'Aug': month = 7; break;
      case 'Sep': month = 8; break;
      case 'Oct': month = 9; break;
      case 'Nov': month = 10; break;
      case 'Dec': month = 11; break;
    }
    return month;
  }

  return {
    parse: parse
  }

}());

module.exports = fixturesParser;

},{}],4:[function(require,module,exports){
function getRequest(url) {

  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('GET', url, true);

    req.onload = function() {
      console.log(req.status + " " + url);
      // success (0 - for CORS error locally)
      if (req.status === 200 || req.status === 0) {
        resolve(req.response);
      }
      else {
        reject(new Error(req.statusText));
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

module.exports = {
  get: getRequest
}

},{}]},{},[1,2,3,4]);

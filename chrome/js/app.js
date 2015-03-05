'use strict';
// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
// window.addEventListener('DOMContentLoaded', start);

function app_start(gFront) {
  navigator.memprofiler = gFront;
  var store = new Store();
  var profilerManager = new ProfilerManager(store);

  var hubElements = {
    searchBar: document.getElementById('searchBar'),
    searchPanel: document.getElementById('searchPanel'),
    startSearch: document.getElementById('startSearch'),
    startButton: document.getElementById('startRecord'),
    stopButton: document.getElementById('stopRecord'),
    resetButton: document.getElementById('resetRecord'),
    infoTable: document.getElementById('infoTable')
  };
  var hubOption = {
    'elements': hubElements
  };
  var hub = new Hub(hubOption);
  hub.start();

  var padOption = {
    'elements': {'pad': document.getElementById('pad'),
                 'positiveMax':  document.getElementById('positiveMax'),
                 'negativeMax':  document.getElementById('negativeMax')
               },
    'store': store
  };
  var padManager = new PadManager(padOption);
  padManager.start();

  var rankOption = {
    'elements': {
      'infoTable': document.getElementById('infoTable'),
      'filterTable': document.getElementById('filterTable')
    },
    'store': store
  };
  var rankManager = new RankManager(rankOption);
  rankManager.start();

  var treeOption = {
    'elements': {'treePanel': document.getElementById('treePanel')},
    'store': store
  };
  var treeManager = new TreeManager(treeOption);
  treeManager.start();
}

'use strict';
function humanReadable(bytes) {
    var thresh = 1024;
    if(bytes < thresh) return bytes + ' B';
    var units = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(bytes >= thresh);
    return bytes.toFixed(1)+' '+units[u];
};

(function(exports) {
  function RankManager(option) {
    this._elements = option.elements;
    this.rankHist = [];
    this.filterHist = [];
    this.store = option.store;
    this.defaultSort = 'selfPeak';
  }

  RankManager.prototype.start = function RM_start() {
    window.addEventListener('dataReady', this);
  };

  RankManager.prototype.stop = function RM_stop() {
    window.removeEventListener('dataReady', this);
  };

  RankManager.prototype.sortBY = function RM_sortBY(hist, key) {
    hist.sort(function(a,b) {return b[key] - a[key];});
    return hist;
  };

  RankManager.prototype.filterBY = function RM_filterBY(nameIdx) {
    var p = this.store.getFilterList(nameIdx);
    p.then(function(values) {
      var sort =  this.sortBY(this.store.filterNodes, this.defaultSort);
      this.template(this.store.filterNodes);
      console.log('sorted');
    }.bind(this));
  };

  RankManager.prototype.showRankList = function RM_showRankList() {
   this.rankHist = this.store.getRankList();
   this.rankHist = this.sortBY(this.rankHist, this.defaultSort);
   this.template(this.rankHist);
  };

  RankManager.prototype.template = function RM_template(hist) {
    var names = this.store.getNames();
    var infoTable = '';
    for (var i = 0; i < hist.length; i++) {
      var entry = hist[i];
      var fnName = names[entry.nameIdx];
      infoTable = infoTable + '<li>' +
        '<span>' + humanReadable(entry.selfAccu) + '</span><span>' +
         humanReadable(entry.totalAccu) + '</span>' +
        '<span>' + humanReadable(entry.selfSize) + '</span><span>' +
         humanReadable(entry.totalSize) + '</span>' +
        '<span>' + humanReadable(entry.selfPeak) + '</span><span>' +
         humanReadable(entry.totalPeak) + '</span>' +
        '<span title="' + fnName + '" class="filterable" data-filter="' + entry.nameIdx + '">' +
        fnName + '</span>' +
      '</li>';
    }
    infoTable = '<ul>' +
                  '<li> ' +
                    '<span class="sortable" data-id="selfAccu">Self Accu</span>' +
                    '<span class="sortable" data-id="totalAccu">Total Accu</span>' +
                    '<span class="sortable" data-id="selfSize">Self Size</span>' +
                    '<span class="sortable" data-id="totalSize">Total Size</span>' +
                    '<span class="sortable" data-id="selfPeak">Self Peak</span>' +
                    '<span class="sortable" data-id="totalPeak">Total Peak</span>' +
                    '<span>name</span>' +
                  '</li>' +
                 infoTable +
                '</ul>';
    this._elements.infoTable.innerHTML = infoTable;
    var matches = this._elements.infoTable.querySelectorAll('span.sortable');
    var sortItem = null;
    for (var j = 0; j < matches.length; j ++) {
      sortItem = matches[j];
      sortItem.addEventListener('click', this);
    }
    matches = this._elements.infoTable.querySelectorAll('span.filterable');
    sortItem = null;
    for (var j = 0; j < matches.length; j ++) {
      sortItem = matches[j];
      sortItem.addEventListener('click', this);
    }
  };

  RankManager.prototype.handleEvent = function RM_handleEvent(evt) {
    switch (evt.type) {
      case 'dataReady':
        this.showRankList();
        break;
      case 'click':
        if (typeof evt.target.dataset.id !== 'undefined') {
          console.log('sort:' + evt.target.dataset.id);
          this.rankHist = this.sortBY(this.rankHist, evt.target.dataset.id);
          this.template(this.rankHist);
        }
        if (typeof evt.target.dataset.filter !== 'undefined') {
          var nameIdx = +evt.target.dataset.filter;
          console.log('filter by nameIdx:' + nameIdx);
          this.filterHist = this.filterBY(nameIdx);
//          this.template(this.filterHist);
        }
        break;
      default:
        break;
    }
  };

  exports.RankManager = RankManager;
}(window));

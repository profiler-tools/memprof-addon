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
    window.addEventListener('start-record', this);
    window.addEventListener('reset-record', this);
    window.addEventListener('subset-allocated', this);
  };

  RankManager.prototype.stop = function RM_stop() {
    window.removeEventListener('dataReady', this);
    window.removeEventListener('start-record', this);
    window.removeEventListener('subset-allocated', this);
    window.removeEventListener('reset-record', this);
  };

  RankManager.prototype.sortBY = function RM_sortBY(hist, key) {
    hist.sort(function(a,b) {return b[key] - a[key];});
    return hist;
  };

  RankManager.prototype.showfilterList = function RM_showfilterList(nameIdx) {
    var p = this.store.getFilterList(nameIdx);
    p.then(function(values) {
      var sort =  this.sortBY(this.store.filterNodes, this.defaultSort);
      this.filterTemplate(this.store.filterNodes);
    }.bind(this));
  };

  RankManager.prototype.showRankList = function RM_showRankList() {
   console.log('showRankList');
   this.rankHist = this.store.getRankList();
   this.rankHist = this.sortBY(this.rankHist, this.defaultSort);
   this.infoTemplate(this.rankHist);
  };

  RankManager.prototype.showLoading = function RM_showLoading(evt) {
    this._elements.infoTable.textContent = 'loading.....';
  },

  RankManager.prototype.cleanInfoTable = function RM_cleanInfoTable() {
    this._elements.infoTable.innerHTML = '';
  };

  RankManager.prototype.handleSubset = function RM_handleSubset() {
    //this.cleanInfoTable();
    //this.showLoading();
  };

  RankManager.prototype.infoTemplate = function RM_template(hist) {
    this._template(hist, 'info');
  },

  RankManager.prototype.filterTemplate = function RM_template(hist) {
    this._template(hist, 'filter');
  },

  RankManager.prototype._template = function RM__template(hist, target) {
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
    infoTable = '<button type="button" data-root="0" id="backRoot">/</button><br/>' +
                '<ul>' +
                  '<li> ' +
                    '<span class="sortable" data-id="selfAccu" data-target="' + target +
                    '">Self Accu</span>' +
                    '<span class="sortable" data-id="totalAccu" data-target="' + target +
                    '">Total Accu</span>' +
                    '<span class="sortable" data-id="selfSize" data-target="' + target +
                    '">Self Size</span>' +
                    '<span class="sortable" data-id="totalSize" data-target="' + target +
                    '">Total Size</span>' +
                    '<span class="sortable" data-id="selfPeak" data-target="' + target +
                    '">Self Peak</span>' +
                    '<span class="sortable" data-id="totalPeak" data-target="' + target +
                    '">Total Peak</span>' +
                    '<span>name</span>' +
                  '</li>' +
                 infoTable +
                '</ul>';
    var element;
    if (target === 'filter') {
      element = this._elements.filterTable;
      this._elements.infoTable.hidden = true;
      this._elements.filterTable.hidden = false;
    } else {
      element = this._elements.infoTable;
      this._elements.filterTable.hidden = true;
      this._elements.infoTable.hidden = false;
    }
    element.innerHTML = infoTable;
    var matches = element.querySelectorAll('span.sortable');
    var sortItem = null;
    for (var j = 0; j < matches.length; j ++) {
      sortItem = matches[j];
      sortItem.addEventListener('click', this);
    }
    matches = element.querySelectorAll('span.filterable');
    sortItem = null;
    for (var j = 0; j < matches.length; j ++) {
      sortItem = matches[j];
      sortItem.addEventListener('click', this);
    }
    var backRoot = element.querySelector('#backRoot');
    backRoot.addEventListener('click', function(){
      this.showRankList();
    }.bind(this));
  };

  RankManager.prototype.handleEvent = function RM_handleEvent(evt) {
    switch (evt.type) {
      case 'start-record':
        this.showLoading();
        break;
      case 'reset-record':
        this.cleanInfoTable();
        break;
      case 'subset-allocated':
        this.handleSubset();
        break;
      case 'dataReady':
        this.showRankList();
        break;
      case 'click':
        if (typeof evt.target.dataset.id !== 'undefined') {
//          alert('sort:' + evt.target.dataset.id);
          // filter list
          if (typeof evt.target.dataset.target !== 'undefined') {
//            alert(evt.target.dataset.target);
            if (evt.target.dataset.target === 'filter') {
              this.filterHist = this.sortBY(this.store.filterNodes, evt.target.dataset.id);
              this.filterTemplate(this.filterHist);
            } else {
              this.rankHist = this.sortBY(this.rankHist, evt.target.dataset.id);
              this.infoTemplate(this.rankHist);
            }
          }
        }
        if (typeof evt.target.dataset.filter !== 'undefined') {
          var nameIdx = +evt.target.dataset.filter;
          alert('filter:' + nameIdx);
          this.showfilterList(nameIdx);
        }
        break;
      default:
        break;
    }
  };

  exports.RankManager = RankManager;
}(window));

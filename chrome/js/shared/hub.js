'use strict';
(function(exports) {
  function Hub (option) {
    this._elements = option.elements;
    this.profilerManager = option.profilerManager;
  }

  Hub.prototype = {
    start: function HUB_start () {
      this._elements.startButton.addEventListener('click', this);
      this._elements.stopButton.addEventListener('click', this);
      this._elements.resetButton.addEventListener('click', this);
      this._elements.searchBar.addEventListener('keyup', this);
      window.addEventListener('dataReady', this);
    },

    handleEvent: function HUB_handleEvent(evt) {
      switch (evt.type) {
        case 'click':
          switch (evt.target) {
            case this._elements.startButton:
              this.startRecord();
              break;
            case this._elements.stopButton:
              this.stopRecord();
              break;
            case this._elements.resetButton:
              this.resetRecord();
              break;
            case this._elements.startSearch:
              this.showSearchPanel();
              break;
          }
          break;
        case 'dataReady':
          //this.showInfo();
          break;
        case 'keyup':
          switch (evt.target) {
            case this._elements.searchBar:
              this.search();
              break;
          }
          break;
        default:
          break;
      }
    },

    startRecord: function HUB_startRecord(evt) {
      window.dispatchEvent(new CustomEvent('start-record'));
      // this.showLoading();
    },

    stopRecord: function HUB_stopRecord(evt) {
      window.dispatchEvent(new CustomEvent('stop-record'));
    },

    // showLoading: function HUB_showLoading(evt) {
    //   this._elements.infoTable.textContent = 'loading.....';
    // },

    resetRecord: function HUB_resetRecord(evt) {
      window.dispatchEvent(new CustomEvent('reset-record'));
    },

    // showInfo: function HUB_showInfo(evt) {
    //   this._elements.infoTable.textContent = 'done!!!';
    // },

    showSearchPanel: function HUB_showSearchPanel() {
      this._elements.searchPanel.classList.toggle('active');
    },

    stop: function HUB_stop() {
      this._elements.startButton.removeEventListener('click', this);
      this._elements.stopButton.removeEventListener('click', this);
      this._elements.resetButton.removeEventListener('click', this);
      this._elements.searchBar.removeEventListener('keyup', this);
      window.removeEventListener('dataReady', this);
    },

    search: function HUB_search() {
      var term = this._elements.searchBar.value;
      window.dispatchEvent(new CustomEvent('search',
        {'detail':{'term': term}}
      ));
    }
  };
  exports.Hub = Hub;
}(window));

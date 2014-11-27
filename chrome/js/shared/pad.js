'use strict';
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

(function(exports) {
  function PadManager (option) {
    this._elements = option.elements;
    this.store = option.store;
    this.tracePool = [];
    this.limit = 1000;
    this.heightRatio = 0;
    this.widthRatio = 0;
    this.padHeight = 800;
    this.rangeDrawable = false;
    this.rangeStart = 0;
    this.rangeEnd = 0;
    this.step = 0;
  }

  PadManager.prototype = {
    start: function PL_start () {
      window.addEventListener('dataReady', this);
      window.addEventListener('reset-record', this);
      this._elements.pad.addEventListener('mousedown', this);
      this._elements.pad.addEventListener('mouseup', this);
    },

    handleEvent: function PL_handleEvent(evt) {
      switch(evt.type) {
        case 'reset-record':
          this.cleanPad();
          break;
        case 'dataReady':
          this.drawTrace();
          break;
        case 'mousedown':
          this._initRange(evt);
          break;
        case 'mouseup':
          this._setupRange(evt);
          break;
        case 'mousemove':
          this._updateRange(evt);
          break;
        case 'mouseout':
          this._closeRange();
          break;
      }
    },

    _initRange: function PL_initRange(e) {
      this.rangeDrawable = true;
      this._elements.pad.addEventListener('mousemove', this);
      this._elements.pad.addEventListener('mouseout', this);
      var mousePos = getMousePos(this._elements.pad, e);
      this.rangeStart = mousePos.x / this.widthRatio;
      console.log(mousePos.x + ':' + mousePos.y);
    },
    
    _setupRange: function PL_setupRange(e) {
      if (this.rangeDrawable == false) {
        return;
      }
      var mousePos = getMousePos(this._elements.pad, e);
      this.rangeEnd = mousePos.x / this.widthRatio;
      var evtInfo = {'detail' : {}};
      evtInfo.detail.startPoint = this.rangeStart * this.step;
      evtInfo.detail.endPoint = this.rangeEnd * this.step;
      // clear up pad.
      this.cleanPad();
      this._closeRange();
      window.dispatchEvent(new CustomEvent('subset-allocated', evtInfo));
    },
    
    _updateRange: function PL_updateRange(e) {
      if (this.rangeDrawable == false) {
        return;
      }
      var mousePos = getMousePos(this._elements.pad, e);
      console.log(mousePos.x + ':' + mousePos.y);
    },
    
    _closeRange: function PL_closeRange() {
      this.rangeDrawable = false;
      this._elements.pad.removeEventListener('mousemove', this);
      this._elements.pad.removeEventListener('mouseout', this);
    },

    setupCanvas: function PL_setupCanvas() {
      var baseWidth = 10;
      this.tracePool = this.store.allocated;
      var traceCount = this.tracePool.length;
      // setup width
      if (traceCount > 0) {
        if (traceCount > this.limit) {
          traceCount = this.limit;
          this.minimizeTracePool();
          this._elements.pad.style.width = '200%';
        }
        this._elements.pad.width = traceCount * baseWidth;
      }
      var rect = this._elements.pad.getBoundingClientRect();
      var rectWidth = (rect.right - rect.left);
      this.widthRatio = Math.round(this._elements.pad.width / rectWidth);
      // setup height ratio
      var maxSize = 0;
      var entry = null;
      for (var i = 0, len = this.tracePool.length; i < len; i++ ) {
        entry = Math.abs(this.tracePool[i].size);
        if (entry > maxSize) {
          maxSize = entry;
        }
      }

      this.heightRatio = Math.round(maxSize / this.padHeight);
    },

    minimizeTracePool: function PL_minimizeTracePool() {
      this.step = Math.round(this.tracePool.length / this.limit);
      var start = 0, bound = 0, entry = null, temp = [];
      for (var chunk = 0; chunk < this.limit; chunk ++) {
        start = chunk * this.step;
        bound = (chunk + 1) * this.step;
        if (bound > this.tracePool.length) {
          bound = this.tracePool.length;
        }
        if (typeof this.tracePool[start] === 'undefined') {
          continue;
        }
        temp[chunk] = {"size":0, "traceIdx":[]};
        temp[chunk].timestamp = this.tracePool[start].timestamp;
        entry = temp[chunk];
        for (var i = start; i < bound; i++) {
          entry.size = entry.size + this.tracePool[i].size;
          entry.traceIdx.push(this.tracePool[i].traceIdx); 
        }
      }

      this.tracePool = temp;
    },

    cleanPad: function PL_cleanPad() {
      var ctx = this._elements.pad.getContext('2d');
      ctx.clearRect(0, 0, this._elements.pad.width, this._elements.pad.height);
    },

    drawTrace: function PL_drawTrace() {
      this.setupCanvas();
      var baseWidth = 10;
      var baseLine = this.padHeight / 2;  // should be 400
      var ctx = this._elements.pad.getContext('2d');
      var tracePool = this.tracePool;
      // var start = baseLine;
      this.cleanPad();
      ctx.strokeStyle = 'black';
      var entry, entryHeight, prevEntry, entryDuration;
      for (var i = 0, len = tracePool.length; i < len; i++) {
        entry = tracePool[i];
        entryHeight = (entry.size / this.heightRatio);
        if (i > 0) {
          prevEntry = tracePool[i-1];
          entryDuration = Math.round((entry.timestamp - prevEntry.timestamp)) * 4 / 1000;
        } else {
          entryDuration = 0;
        }
    
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(entryDuration + 10 + i * 10, baseLine);
        ctx.lineTo(entryDuration + 10 + i * 10, baseLine - entryHeight);
        ctx.strokeStyle = '#ff0000';
        if (entryHeight < 0) {
          ctx.strokeStyle = '#0000ff';
        } 
        ctx.stroke();
        // ctx.strokeStyle = '#000000';
        // if (i > 0) {
        //   ctx.moveTo(10 + (i - 1) * 10, start);
        //   ctx.lineTo(10 + i * 10, start - (entryHeight / 10) );
        //   ctx.stroke();
        // } 
        // start = start - entryHeight;
      }
    },

    stop: function PL_stop() {
      window.removeEventListener('dataReady', this);
      window.removeEventListener('reset-record', this);
      this._elements.pad.removeEventListener('mousedown', this);
      this._elements.pad.removeEventListener('mouseup', this);
    }
  };
  exports.PadManager = PadManager;
}(window));

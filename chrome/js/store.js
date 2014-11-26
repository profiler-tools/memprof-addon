'use strict';
function escapeHtml(html){
  var escapeHtmlDiv = document.createElement('div');
  var text = document.createTextNode(html);
  escapeHtmlDiv.appendChild(text);
  return escapeHtmlDiv.innerHTML;
}

(function(exports) {
  function Store() {
    this.names = null;
    this.traces = null;
    this.allocated = null;
    this.originAllocated = null;
    this.treeData = {};
    // all data
    this.uniData = [];
    // for filter
    this.filterCount = 0;
    this.lookupList = {};
    this.filterNodes = [];

    this.init();
  }

  Store.prototype = {
    init: function s_init() {
      window.addEventListener('search', this);
      window.addEventListener('subset-allocated', this);
    },

    stop: function s_stop() {
      window.removeEventListener('search', this);
      window.removeEventListener('subset-allocated', this);
    },

    handleEvent: function s_handleEvent(evt) {
      switch(evt.type) {
        case 'search':
          console.log(evt.detail.term.length);
          break;
        case 'subset-allocated':
          this.handleSubetAllocated(evt);
          break;
      }
    },

    create: function s_create(names, traces, allocated) {
      this.names = names;
      this.traces = traces;
      this.originAllocated = allocated;
      // generate this.allocated
      this.subsetAllocated(0, this.originAllocated.length);
      this.preprocessData();
      // notify others data is ready
      window.dispatchEvent(new CustomEvent('dataReady'));
    },

    drop: function s_drop() {
      this.names = null;
      this.traces = null;
      this.allocated = null;
      this.uniData = null;
    },

    handleSubetAllocated: function s_handleSubetAllocated(evt) {
      this.subsetAllocated(evt.detail.startPoint, evt.detail.endPoint);
      if (this.allocated.length > 0) {
        // notify others data is ready
        window.dispatchEvent(new CustomEvent('dataReady'));
      }
    },

    subsetAllocated: function s_subsetAllocated(start, end) {
      this.allocated = this.originAllocated.slice(start, end);
    },

    preprocessData: function s_preprocessData() {
      var names = this.names,
          traces = this.traces,
          allocated = this.allocated,
          hist = this.uniData,
          lookupList = this.lookupList;
      var t, e, i, j;

      for (i = 0; i < names.length; i++) {
        names[i] = escapeHtml(names[i]);
        var n = {
          nameIdx: i,
          childs: [],
          selfAccu: 0, totalAccu: 0,
          selfSize: 0, totalSize: 0,
          selfPeak: 0, totalPeak: 0
          };
        hist.push(n);
        lookupList[i] = n;
      }
    },

    getNames: function s_getNames() {
      return this.names;
    },

    // for reference
    calcTotalSize: function s_example1() {
      var names = this.names,
          traces = this.traces,
          allocated = this.allocated,
          hist = this.uniData;
      var t, e, i, j, len;

      for (i = 0, len = allocated.length; i < len; i++) {
        var visited = [];
        e = allocated[i];
        t = traces[e.traceIdx];
        hist[t.nameIdx].selfSize += e.size;
        for (j = e.traceIdx; j != 0; j = traces[j].parentIdx) {
          t = traces[j];
          if (!visited[t.nameIdx]) {
            visited[t.nameIdx] = true;
            hist[t.nameIdx].totalSize += e.size;
          }
        }
      }

      hist.sort(function(a,b) {return b.selfSize - a.selfSize;});

      console.log("    SelfSize   TotalSize  Name");
      for (i = 0; i < 20 && i < hist.length; i++) {
        console.log("%12.0f%12.0f  %s", hist[i].selfSize, hist[i].totalSize, names[hist[i].nameIdx]);
      }
    },

    // for reference
    calcTotalAccu: function s_example2() {
      var names = this.names,
          traces = this.traces,
          allocated = this.allocated,
          hist = this.uniData;
      var t, e, i, j, len;

      for (i = 0, len = allocated.length; i < len; i++) {
        var visited = [];
        e = allocated[i];
        t = traces[e.traceIdx];
        if (e.size > 0) {
          hist[t.nameIdx].selfAccu += e.size;
          for (j = e.traceIdx; j != 0; j = traces[j].parentIdx) {
            t = traces[j];
            if (!visited[t.nameIdx]) {
              visited[t.nameIdx] = true;
              hist[t.nameIdx].totalAccu += e.size;
            }
          }
        }
      }

      hist.sort(function(a,b) {return b.selfAccu - a.selfAccu;});

      console.log("    SelfAccu   TotalAccu  Name");
      for (i = 0; i < 20 && i < hist.length; i++) {
        console.log("%12.0f%12.0f  %s", hist[i].selfAccu, hist[i].totalAccu, names[hist[i].nameIdx]);
      }
    },

    // for reference
    calcTotalPeak: function s_example3() {
      var names = this.names,
          traces = this.traces,
          allocated = this.allocated,
          hist = this.uniData;
      var t, e, i, j, len;

      for (i = 0, len = allocated.length; i < len; i++) {
        var visited = [];
        e = allocated[i];
        t = traces[e.traceIdx];
        hist[t.nameIdx].selfSize += e.size;
        if (hist[t.nameIdx].selfSize > hist[t.nameIdx].selfPeak) {
          hist[t.nameIdx].selfPeak = hist[t.nameIdx].selfSize;
        }
        for (j = e.traceIdx; j != 0; j = traces[j].parentIdx) {
          t = traces[j];
          if (!visited[t.nameIdx]) {
            visited[t.nameIdx] = true;
            hist[t.nameIdx].totalSize += e.size;
            if (hist[t.nameIdx].totalSize > hist[t.nameIdx].totalPeak) {
              hist[t.nameIdx].totalPeak = hist[t.nameIdx].totalSize;
            }
          }
        }
      }

      hist.sort(function(a,b) {return b.selfPeak - a.selfPeak;});

      console.log("     SelfPeak    TotalPeak  Name");
      for (i = j = 0; j < 20 && i < hist.length; i++) {
        // if (names[hist[i].nameIdx].search(/gbemu/) != -1) {
        // }
        console.log("%12.0f%12.0f  %s", hist[i].selfPeak, hist[i].totalPeak, names[hist[i].nameIdx]);
        j++;
      }
    },

    /**
     * only show childs of target nameIdx
     */
    gatherList: function s_gatherList(nameIdx, done) {
      var n = this.lookupList[nameIdx];
//      if (this.filterCount % 100 === 0) {
//        alert('n:'+ n.nameIdx + '/cnt:'+this.filterCount);
//      }
      this.filterCount += 1;
      this.filterNodes.push(n);
      var workers = [];
      if (n.childs.length) {
        for(var i = 0, len = n.childs.length; i < len; i++) {
          var idx = n.childs[i];
          var p = new Promise(function(resolve) {
            this.gatherList(idx, resolve);
          }.bind(this));
          workers.push(p);
        }
      }
      if (workers.length) {
        Promise.all(workers).then(function(values) {
          done();
        });
      } else {
        done();
      }
    },

    // for ranklist filter
    getFilterList: function s_getFilterList(nameIdx) {
      this.filterNodes = [];
      this.filterCount = 0;
      var p = new Promise(function(resolve) {
        this.gatherList(nameIdx, resolve);
      }.bind(this));
//      p.then(function(values) {
//        return this.filterNodes;
//      }.bind(this));
      return p;
    },

    // for ranklist
    getRankList: function s_getHistogram() {
      var names = this.names,
          traces = this.traces,
          allocated = this.allocated,
          hist = this.uniData;
      var tracesEntry, allocatedEntry, parentTraceEntry, i, j, len;

      for (i = 0, len = allocated.length; i < len; i++) {
        var visited = [];
        allocatedEntry = allocated[i];
        tracesEntry = traces[allocatedEntry.traceIdx];
        if (typeof hist[tracesEntry.nameIdx] === 'undefined') {
          continue;
        }
        // add parent and childs
        parentTraceEntry = traces[tracesEntry.parentIdx];
//        // add childs
        if (typeof hist[parentTraceEntry.nameIdx] === 'undefined') {
          continue;
        } else {
//          console.log('log child '+ tracesEntry.nameIdx);
          if (hist[parentTraceEntry.nameIdx].childs.length === 0) {
            hist[parentTraceEntry.nameIdx].childs.push(tracesEntry.nameIdx);
//            console.log('directly to parent '+ parentTraceEntry.nameIdx);
          }
          else if (hist[parentTraceEntry.nameIdx].childs.indexOf(tracesEntry.nameIdx) < 0) {
            hist[parentTraceEntry.nameIdx].childs.push(tracesEntry.nameIdx);
//            console.log('to parent '+ parentTraceEntry.nameIdx);
          }
        }

        // update self stat
        if (allocatedEntry.size > 0) {
          hist[tracesEntry.nameIdx].selfAccu += allocatedEntry.size;
        }

        hist[tracesEntry.nameIdx].selfSize += allocatedEntry.size;
        if (hist[tracesEntry.nameIdx].selfSize > hist[tracesEntry.nameIdx].selfPeak) {
          hist[tracesEntry.nameIdx].selfPeak = hist[tracesEntry.nameIdx].selfSize;
        }

        // update total stat
        for (j = allocatedEntry.traceIdx; j != 0; j = traces[j].parentIdx) {
          tracesEntry = traces[j];
          if (!visited[tracesEntry.nameIdx] && typeof hist[tracesEntry.nameIdx] !== 'undefined') {
            visited[tracesEntry.nameIdx] = true;
            hist[tracesEntry.nameIdx].totalSize += allocatedEntry.size;
            if (allocatedEntry.size > 0) {
              hist[tracesEntry.nameIdx].totalAccu += allocatedEntry.size;
            }
            if (hist[tracesEntry.nameIdx].totalSize > hist[tracesEntry.nameIdx].totalPeak) {
              hist[tracesEntry.nameIdx].totalPeak = hist[tracesEntry.nameIdx].totalSize;
            }
          }
        }
      }

      return hist;
    },

    // for tree
    getTreeData: function s_getTreeData() {
      var names = this.names;
      var traces = this.traces;
      var allocated = this.allocated;
      var treeData = this.treeData;
      console.log('traces: ', traces.length);
      console.log('allocated: ', allocated.length);

      var traceIdx, traceEntry, treeEntry, allocatedEntry, size, i, len;

      for (i = 0, len = traces.length; i < len; i++) {
        traceEntry = traces[i];
        if (traceEntry.nameIdx != 0) {
          treeData[traceEntry.parentIdx].children.push(i);
        }
        traceEntry.matrix = {
          selfSize: 0,
          selfAccu: 0,
          selfPeak: 0,
          totalSize: 0,
          totalAccu: 0,
          totalPeak: 0
        };
        traceEntry.name = names[traceEntry.nameIdx];
        traceEntry.children = [];
        treeData[i] = traceEntry;
      }

      for (i = 0, len = allocated.length; i < len; i++) {
        allocatedEntry = allocated[i];
        size = allocatedEntry.size;
        treeEntry = treeData[allocatedEntry.traceIdx];

        treeEntry.matrix.selfSize += size;
        treeEntry.matrix.totalSize += size;
        if (size > 0) {
          treeEntry.matrix.selfAccu += size;
          treeEntry.matrix.totalAccu += size;
        }
        if (treeEntry.matrix.selfSize > treeEntry.matrix.selfPeak) {
          treeEntry.matrix.selfPeak = treeEntry.matrix.selfSize;
        }
        if (treeEntry.matrix.totalSize > treeEntry.matrix.totalPeak) {
          treeEntry.matrix.totalPeak = treeEntry.matrix.totalSize;
        }
        while (treeEntry.parentIdx !== 0) {
          // Update total
          treeEntry = treeData[treeEntry.parentIdx];
          treeEntry.matrix.totalSize += size;
          if (size > 0) {
            treeEntry.matrix.totalAccu += size;
          }
          if (treeEntry.matrix.totalSize > treeEntry.matrix.totalPeak) {
            treeEntry.matrix.totalPeak = treeEntry.matrix.totalSize;
          }
        }
      }

      return treeData;
    },

    _getTraceNames: function s__getTraceNames(tracesEntry) {
      var traceNames = [];
      traceNames.push(tracesEntry.nameIdx);
      while (tracesEntry.parentIdx !== 0) {
        tracesEntry = this.traces[tracesEntry.parentIdx];
        traceNames.push(tracesEntry.nameIdx);
      }
      return traceNames;
    },

    _getTraceIndecies: function s__getTraceIndecies(traceIdx, tracesEntry) {
      var traceIdxs = [];
      traceIdxs.push(traceIdx);
      while (tracesEntry.parentIdx !== 0) {
        traceIdxs.push(tracesEntry.parentIdx);
        tracesEntry = this.traces[tracesEntry.parentIdx];
      }
      return traceIdxs;
    },

    _treeAddRoot: function s__treeAddRoot(rootName, size) {
      this.treeData.root = new Node({
        name: rootName,
        nameIdx: 0,
        parentIdx: 0,
        selfSize: size,
        selfAccu: size,
        selfPeak: size
      });
    },

    _treeUpdateRoot: function s__treeUpdateRoot(size) {
      this.treeData.root.updateMatrix(size, true);
    },

    _treeAddOrUpdateChild: function s__treeAddOrUpdateChild(traceNames, size) {
      var names = this.names;
      var currentNode = this.treeData.root;
      for (var i = traceNames.length - 1; i >= 0; i--) {
        var nodeOption = {
          name: names[traceNames[i]],
          nameIdx: traceNames[i],
          isLeaf: false
        };
        // Set self size for leaf node
        if (i === 0) {
          nodeOption.isLeaf = true;
          nodeOption.selfSize = size;
          nodeOption.selfAccu = size;
          nodeOption.selfPeak = size;
        }
        // Set total size for all parent nodes
        nodeOption.totalSize = size;
        nodeOption.totalAccu = size;
        nodeOption.totalPeak = size;
        currentNode = currentNode.addOrUpdateChild(nodeOption);
      }
    },

    _treeAddChild: function s__treeAddChild(traceNames, size) {
      var names = this.names;
      var currentNode = this.treeData.root;
      for (var i = traceNames.length - 1; i >=0; i--) {
        var nodeOption = {
          name: names[traceNames[i]],
          nameIdx: traceNames[i]
        };
        // Set self size for leaf node
        if (i === 0) {
          nodeOption.selfSize = size;
          nodeOption.selfAccu = size;
          nodeOption.selfPeak = size;
        }
        // Set total size for all parent nodes
        nodeOption.totalSize = size;
        nodeOption.totalAccu = size;
        nodeOption.totalPeak = size;
        currentNode = currentNode.addChild(nodeOption);
      }
    },

    _treeUpdateChild: function s__treeUpdateChild(traceNames, size) {
      var currentNode = this.treeData.root;
      for (var i = traceNames.length - 1; i >= 0; i--) {
        currentNode = currentNode.findChildrenByNameIdx(traceNames[i]);
        // Only update total for parent nodes
        currentNode.updateMatrix(size, false);
      }
      // Only update self for leaf node
      currentNode.updateMatrix(size, true);
    },
  };

  function Node(options) {
    this.name = options.name;
    this.nameIdx = options.nameIdx;
    this.children = [];
    this.parent = null;
    this.matrix = {
      selfSize: options.selfSize || 0,
      selfAccu: options.selfAccu || 0,
      selfPeak: options.selfPeak || 0,
      totalSize: options.totalSize || 0,
      totalAccu: options.totalAccu || 0,
      totalPeak: options.totalPeak || 0
    };
  }

  Node.prototype = {
    findChildrenByNameIdx: function(nameIdx) {
      if (this.children[nameIdx]) {
        return this.children[nameIdx];
      } else {
        return null;
      }
    },

    addChild: function(nodeOption) {
      var childNode = this.findChildrenByNameIdx(nodeOption.nameIdx);
      if (!childNode) {
        childNode = new Node(nodeOption);
        childNode.parent = this;
        this.children.push(childNode);
      } else {
        // Update total if node exists, note totalSize = totalAccu = totalPeak
        childNode.updateMatrix(nodeOption.totalSize, false);
      }
      return childNode;
    },

    addOrUpdateChild: function(nodeOption) {
      var childNode = this.findChildrenByNameIdx(nodeOption.nameIdx);
      if (!childNode) {
        childNode = new Node(nodeOption);
        childNode.parent = this;
        this.children.push(childNode);
      } else {
        if (nodeOption.isLeaf) {
          // Only update self for leaf node
          childNode.updateMatrix(nodeOption.selfSize, true);
        } else {
          // Only update total for parent nodes
          childNode.updateMatrix(nodeOption.totalSize, false);
        }
      }
      return childNode;
    },

    updateMatrix: function(size, self) {
      if (self) {
        this.matrix.selfSize += size;
        if (size > 0) {
          this.matrix.selfAccu += size;
        }
        if (this.matrix.selfSize > this.matrix.selfPeak) {
          this.matrix.selfPeak = this.matrix.selfSize;
        }
      } else {
        this.matrix.totalSize += size;
        if (size > 0) {
          this.matrix.totalAccu += size;
        }
        if (this.matrix.totalSize > this.matrix.totalPeak) {
          this.matrix.totalPeak = this.matrix.totalSize;
        }
      }
    },

    walk: function(visited, depth) {
      visited.push(this.nameIdx);
      if (this.children.length > 0) {
        for (var i in this.children) {
          this.children[i].walk(visited, depth + 1);
        }
      }
    }
  };

  exports.Store = Store;
}(window));

'use strict';
(function(exports) {
  function TreeManager(option) {
    this._elements = option.elements;
    this.store = option.store;
    this.treeFrag = document.createDocumentFragment();
  }

  TreeManager.prototype = {
    start: function tm_start() {
      window.addEventListener('dataReady', this);
      window.addEventListener('reset-record', this);
      window.addEventListener('subset-allocated', this);
    },

    stop: function tm_stop() {
      window.removeEventListener('dataReady', this);
      window.removeEventListener('reset-record', this);
      window.removeEventListener('subset-allocated', this);
    },

    handleEvent: function tm_handleEvent(event) {
      switch (event.type) {
        case 'dataReady':
          this.showTreeView();
          break;
        case 'subset-allocated':
          this.handleSubset();
          break;
        case 'reset-record':
          this.cleanTreeView();
          break;
        default:
          break;
      }
    },

    handleSubset: function tm_handleSubset() {
      console.log('subset-allocated handler!!');
      //this.showTreeView();
    },

    showTreeView: function tm_showTreeView() {
      this.treeData = this.store.getTreeData();
      this.addTreeHeader();
      this.addTreeNode(this.treeData[0], 0);
      this._elements.treePanel.innerHTML = this.treeFrag.innerHTML;
      this.addNodeEventListener();
      // this.collapseRoot();
    },

    cleanTreeView: function tm_cleanTreeView() {
      this._elements.treePanel.innerHTML = '';
    },

    addTreeHeader: function tm_addTreeHeader() {
      var treeHeader = '<div class="treeHeader">' +
        '<span>selfAccu</span>' +
        '<span>totalAccu</span>' +
        '<span>selfSize</span>' +
        '<span>totalSize</span>' +
        '<span>selfPeak</span>' +
        '<span>totalPeak</span>' +
        '<span>name</span>' +
        '</div>';
      this.treeFrag.innerHTML = treeHeader;
    },

    addTreeNode: function tm_walk(node, depth) {
      var nodeClass = node.children.length > 0 ? 'treeNode' : 'treeNode leaf';
      var treeNode = '';
      treeNode = '<div class="' + nodeClass + '" data-depth="' + depth +'">' +
        '<span>' + humanReadable(node.matrix.selfAccu) + '</span>' +
        '<span>' + humanReadable(node.matrix.totalAccu) + '</span>' +
        '<span>' + humanReadable(node.matrix.selfSize) + '</span>' +
        '<span>' + humanReadable(node.matrix.totalSize) + '</span>' +
        '<span>' + humanReadable(node.matrix.selfPeak) + '</span>' +
        '<span>' + humanReadable(node.matrix.totalPeak) + '</span>' +
        '<span>' +
        '<span style="margin-left:' + depth + 'em;"' +
        ' class="collapseButton" title="Expand / Collapse"></span>' +
        '<span title="' + node.name + '">' + node.name + '</span>' +
        '</span>' +
        '</div>';
      this.treeFrag.innerHTML += treeNode;
      if (node.children.length > 0) {
        for (var i in node.children) {
          this.addTreeNode(this.treeData[node.children[i]], depth + 1);
        }
      }
    },

    addNodeEventListener: function tm_addNodeEventListener() {
      var self = this;
      Array.prototype.forEach.call(document.querySelectorAll('.collapseButton'),
        function(element) {
          element.addEventListener('click', function(e) {
            var target = e.target.parentElement.parentElement;
            if (target.classList.contains('collapsed')) {
              if (target.nextSibling) {
                target.classList.remove('collapsed');
                self.expandNode(target.nextSibling,
                                parseInt(target.nextSibling.dataset.depth, 10));
              }
            } else {
              var targetDepth = parseInt(target.dataset.depth, 10);
              self.collapseNode(target, targetDepth);
            }
          });
        });
    },

    collapseRoot: function tm_collapseRoot() {
      var rootElement = document.getElementsByClassName('treeNode')[0];
      this.collapseNode(rootElement, rootElement.dataset.depth);
    },

    collapseNode: function tm_collapseNode(nodeElement, depth) {
      nodeElement.classList.add('collapsed');
      if (parseInt(nodeElement.dataset.depth, 10) > depth) {
        nodeElement.style.display = 'none';
      }
      if (nodeElement.nextSibling) {
        this.collapseNode(nodeElement.nextSibling, depth);
      }
    },

    expandNode: function tm_expandNode(nodeElement, depth) {
      var nodeDepth = parseInt(nodeElement.dataset.depth, 10);
      if (nodeDepth == depth) {
        nodeElement.style.display = '';
      }
      if (nodeElement.nextSibling && nodeDepth >= depth) {
        this.expandNode(nodeElement.nextSibling, depth);
      }
    }
  };

  exports.TreeManager = TreeManager;
}(window));

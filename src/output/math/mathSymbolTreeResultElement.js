(function (scope) {

    /**
     * Math symbol tree
     *
     * @class MathSymbolTreeResultElement
     * @extends AbstractMathResultElement
     * @param {Object} obj
     * @constructor
     */
    function MathSymbolTreeResultElement (obj) {
        scope.AbstractMathResultElement.call(this, obj);
        if (obj) {
            this.root = obj.root;
            this.value = JSON.stringify(obj.root, null, '  ');
        }
    }

    /**
     * Inheritance property
     */
    MathSymbolTreeResultElement.prototype = new scope.AbstractMathResultElement();

    /**
     * Constructor property
     */
    MathSymbolTreeResultElement.prototype.constructor = MathSymbolTreeResultElement;

    /**
     * Get tree root
     *
     * @method getRoot
     * @returns {MathNode}
     */
    MathSymbolTreeResultElement.prototype.getRoot = function () {
        return this.root;
    };

    /**
     * Get ink ranges
     *
     * @method getInkRanges
     * @returns {Array}
     */
    MathSymbolTreeResultElement.prototype.getInkRanges = function () {
        return this.parseNode(this.getRoot());
    };

    /**
     * TODO: make it private
     * Parse the node tree
     *
     * @method parseNode
     * @param {Object} node
     * @returns {Array}
     */
    MathSymbolTreeResultElement.prototype.parseNode = function (node) {
        switch (node.type) {
            case 'nonTerminalNode':
                return this.parseNonTerminalNode(node);
            case 'terminalNode':
                return this.parseTerminalNode(node);
            case 'rule':
                return this.parseRuleNode(node);
        }
        return [];
    };

    /**
     * TODO: make it private
     * Parse non terminal node
     *
     * @method parseNonTerminalNode
     * @param {Object} node
     * @returns {Array}
     */
    MathSymbolTreeResultElement.prototype.parseNonTerminalNode = function (node) {
        return this.parseNode(node.getCandidates()[node.getSelectedCandidateIdx()]);
    };

    /**
     * TODO: make it private
     * Parse terminal node
     *
     * @method parseTerminalNode
     * @param {Object} node
     * @returns {Array}
     */
    MathSymbolTreeResultElement.prototype.parseTerminalNode = function (node) {
        return node.getInkRanges();
    };

    /**
     * TODO: make it private
     * Parse rule node
     *
     * @method parseRuleNode
     * @param {Object} node
     * @returns {Array}
     */
    MathSymbolTreeResultElement.prototype.parseRuleNode = function (node) {

        var inkRanges = [];
        for (var i in node.getChildren()) {
            var childInkRanges = this.parseNode(node.getChildren()[i]);
            for (var j in childInkRanges) {
                inkRanges.push(childInkRanges[j]);
            }
        }
        return inkRanges;
    };

    // Export
    scope.MathSymbolTreeResultElement = MathSymbolTreeResultElement;
})(MyScript);
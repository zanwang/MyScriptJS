(function (scope) {

    /**
     * Stem input component
     * @constructor
     */
    function MusicStemInputComponent () {
        this.type = 'stem';
    }

    /**
     *
     * @type {MyScript.AbstractMusicInputComponent}
     */
    MusicStemInputComponent.prototype = new scope.AbstractMusicInputComponent();

    /**
     *
     * @type {MusicStemInputComponent}
     */
    MusicStemInputComponent.prototype.constructor = MusicStemInputComponent;

    /**
     * Get stem input component value
     * @returns {String}
     */
    MusicStemInputComponent.prototype.getValue = function () {
        return this.value;
    };

    /**
     * Set stem input component value
     * @param {String} value
     */
    MusicStemInputComponent.prototype.setValue = function (value) {
        this.value = value;
    };

    // Export
    scope.MusicStemInputComponent = MusicStemInputComponent;
})(MyScript);
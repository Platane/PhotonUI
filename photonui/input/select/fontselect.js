/*
 * Copyright (c) 2014, Wanadev <http://www.wanadev.fr/>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *   * Redistributions of source code must retain the above copyright notice, this
 *     list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright notice,
 *     this list of conditions and the following disclaimer in the documentation
 *     and/or other materials provided with the distribution.
 *   * Neither the name of Wanadev nor the names of its contributors may be used
 *     to endorse or promote products derived from this software without specific
 *     prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Authored by: Fabien LOISON <http://flozz.fr/>
 */

/**
 * PhotonUI - Javascript Web User Interface.
 *
 * @module PhotonUI
 * @submodule Input
 * @namespace photonui
 */


var photonui = photonui || {};


/**
 * Font Selector.
 *
 * wEvents:
 *
 * @class FontSelect
 * @constructor
 * @extends photonui.Select
 */
photonui.FontSelect = photonui.Select.$extend({

    // Constructor
    __init__: function(params) {
        this._fonts = [];
        this.$super(params);
        if (this.fonts.length == 0) this.fonts = ["sans-serif", "serif", "monospace"];
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The font list
     *
     * @property fonts
     * @type Array
     * @default ["sans-serif", "serif", "monospace"]
     */
    _fonts: null,

    getFonts: function() {
        return this._fonts;
    },

    setFonts: function(fonts) {
        this._fonts = [];
        for (var i=0 ; i<fonts.length ; i++) {
            this.addFont(fonts[i]);
        }
    },

    /**
     * The field value.
     *
     * @property value
     * @type String (maybe)
     * @default "sans-serif"
     */
    _value: "sans-serif",

    /**
     * The placeholder displayed if nothing is selected.
     *
     * @property Placeholder
     * @type String
     * @default "Select a font..."
     */
    _placeholder: (window.Stone) ? window.Stone.lazyGettext("Select a font...") : "Select a font...",


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Public methods ======


    /**
     * Add a widget to the layout.
     *
     * @method addChild
     * @param {String} fontName
     */
    addFont: function(fontName) {
        var item = new photonui.MenuItem({value: fontName, text: fontName});
        item.html.style.fontFamily = fontName;
        this.addChild(item);
        this._fonts.push(fontName);
    }
});

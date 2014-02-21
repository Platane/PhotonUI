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
 * @submodule Container
 * @namespace photonui
 */


var photonui = photonui || {};
var _windowList = [];


/**
 * Window.
 *
 * wEvents:
 *
 *   * close-button-clicked:
 *      - description: called when the close button was clicked.
 *      - callback:    function(widget)
 *
 * @class Window
 * @constructor
 * @extends photonui.BaseWindow
 */
photonui.Window = photonui.BaseWindow.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);

        // wEvents
        this._registerWEvents(["close-button-clicked"]);

        // Bind js events
        this._bindEvent("move.dragstart", this.__html.windowTitle, "mousedown", this.__moveDragStart.bind(this));
        this._bindEvent("closeButton.click", this.__html.windowTitleCloseButton, "click", this.__closeButtonClicked.bind(this));
        this._bindEvent("totop", this.__html["window"], "mousedown", this.moveToFront.bind(this));
        this._bindEvent("closeButton.mousedown", this.__html.windowTitleCloseButton, "mousedown", function (event) { event.stopPropagation(); });

        // Update Properties
        this._updateProperties(["title", "closeButtonVisible"]);
        this.moveToFront();
    },

    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The window title.
     *
     * @property title
     * @type String
     * @default "Window"
     */
    _title: "Window",

    getTitle: function() {
        return this._title;
    },

    setTitle: function(title) {
        this._title = title;
        this.__html.windowTitleText.innerHTML = photonui.Helpers.escapeHtml(title);
    },

    /**
     * Determine if the window can be moved (drag & drop) by the user.
     *
     * @property movable
     * @type Boolean
     * @default true
     */
    _movable: true,

    isMovable: function() {
        return this._movable;
    },

    setMovable: function(movable) {
        this._movable = movable;
    },

    /**
     * Determine if the close button in the title bar is displayed or not.
     *
     * @property closeButtonVisible
     * @type Boolean
     * default: true
     */
    _closeButtonVisible: true,

    getCloseButtonVisible: function() {
        return this._closeButtonVisible;
    },

    setCloseButtonVisible: function(closeButtonVisible) {
        this._closeButtonVisible = closeButtonVisible;

        if (closeButtonVisible) {
            this.addClass("photonui-window-have-button");
            this.__html.windowTitleCloseButton.style.display = "block";
        }
        else {
            this.removeClass("photonui-window-have-button");
            this.__html.windowTitleCloseButton.style.display = "none";
        }
    },

    /**
     * HTML Element that contain the child widget HTML.
     *
     * @property containerNode
     * @type HTMLElement
     * @readOnly
     */
    getContainerNode: function() {
        return this.__html.windowContent;
    },


    setVisible: function(visible) {
        this.$super(visible);
        if (this.visible) {
            this.moveToFront();
        }
        else {
            this.moveToBack();
        }
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Public methods ======


    /**
     * Bring the window to front.
     *
     * @method moveToFront
     */
    moveToFront: function() {
        var index = _windowList.indexOf(this);
        if (index >= 0) {
            _windowList.splice(index, 1);
        }
        _windowList.unshift(this);
        this._updateWindowList();
    },

    /**
     * Bring the window to the back.
     *
     * @method moveToBack
     */
    moveToBack: function() {
        var index = _windowList.indexOf(this);
        if (index >= 0) {
            _windowList.splice(index, 1);
        }
        _windowList.push(this);
        this._updateWindowList();
    },

    /**
     * Destroy the widget.
     *
     * @method destroy
     */
    destroy: function() {
        var index = _windowList.indexOf(this);
        if (index >= 0) {
            _windowList.splice(index, 1);
        }
        this.$super();
    },


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.$super();
        this.__html["window"].className += " photonui-window";

        this.__html.windowTitle = document.createElement("div");
        this.__html.windowTitle.className = "photonui-window-title";
        this.__html["window"].appendChild(this.__html.windowTitle);

        this.__html.windowTitleCloseButton = document.createElement("button");
        this.__html.windowTitleCloseButton.className = "photonui-window-title-close-button";
        this.__html.windowTitleCloseButton.title = "Close";  // FIXME i18n
        this.__html.windowTitle.appendChild(this.__html.windowTitleCloseButton);

        this.__html.windowTitleText = document.createElement("span");
        this.__html.windowTitleText.className = "photonui-window-title-text";
        this.__html.windowTitle.appendChild(this.__html.windowTitleText);

        this.__html.windowContent = document.createElement("div");
        this.__html.windowContent.className = "photonui-container photonui-window-content photonui-container-expand-child";
        this.__html["window"].appendChild(this.__html.windowContent);
    },

    /**
     * Update all the windows.
     *
     * @method _updateWindowList
     * @private
     */
    _updateWindowList: function() {
        for (var i=_windowList.length-1, z=0 ; i>=0 ; i--, z++) {
            if (i == 0) {
                _windowList[i].getHtml().style.zIndex = 2001;
                _windowList[i].addClass("photonui-active");
            }
            else {
                _windowList[i].getHtml().style.zIndex = 1000+z;
                _windowList[i].removeClass("photonui-active");
            }
        }
    },


    //////////////////////////////////////////
    // Internal Events Callbacks            //
    //////////////////////////////////////////


    /**
     * Start moving the window.
     *
     * @method _moveDragStart
     * @private
     * @param {Object} event
     */
    __moveDragStart: function(event) {
        if (!this.movable || event.button > 0) {
            return;
        }
        var offsetX = (event.offsetX != undefined) ? event.offsetX : event.layerX;
        var offsetY = (event.offsetY != undefined) ? event.offsetY : event.layerY;
        this.__html.windowTitle.style.cursor = "move";
        this._bindEvent("move.dragging", document, "mousemove", this.__moveDragging.bind(this, offsetX, offsetY));
        this._bindEvent("move.dragend", document, "mouseup", this.__moveDragEnd.bind(this));
    },

    /**
     * Move the window.
     *
     * @method _moveDragging
     * @private
     * @param {Number} offsetX
     * @param {Number} offsetY
     * @param {Object} event
     */
    __moveDragging: function(offsetX, offsetY, event) {
        var e_body = document.getElementsByTagName("body")[0];
        var x = Math.min(Math.max(event.pageX - offsetX, 40 - this.offsetWidth), e_body.offsetWidth - 40);
        var y = Math.max(event.pageY - offsetY, 0);
        if (e_body.offsetHeight > 0) {
            y = Math.min(y, e_body.offsetHeight - this.__html.windowTitle.offsetHeight);
        }
        this.setPosition(x, y);
    },

    /**
     * Stop moving the window.
     *
     * @method _moveDragEnd
     * @private
     * @param {Object} event
     */
    __moveDragEnd: function(event) {
        this.__html.windowTitle.style.cursor = "default";
        this._unbindEvent("move.dragging");
        this._unbindEvent("move.dragend");
    },

    /**
     * Close button clicked.
     *
     * @method _closeButtonClicked
     * @private
     * @param {Object} event
     */
    __closeButtonClicked: function(event) {
        this._callCallbacks("close-button-clicked");
    }
});

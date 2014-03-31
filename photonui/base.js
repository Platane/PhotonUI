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
 * @namespace photonui
 */


var photonui = photonui || {};


/**
 * Base class for all PhotonUI Classes.
 *
 * wEvents:
 *
 *   * destroy:
 *      - description: called before the widget was destroyed.
 *      - callback:    function(widget)
 *
 * @class Base
 * @constructor
 * @param {Object} params An object that can contain any property that will be set to the class (optional).
 */
photonui.Base = Class.$extend({

    // Constructor
    __init__: function(params) {
        // New instances for object properties
        this.__events = {};
        this.__callbacks = {};

        // wEvents
        this._registerWEvents(["destroy"]);

        // Create properties from accessors
        for (var prop in this) {
            if (prop.indexOf("get") == 0) {
                var propName = prop.slice(3, 4).toLowerCase() + prop.slice(4, prop.length);
                Object.defineProperty(this, propName, {
                    get: this[prop],
                    enumerable: true,
                    configurable: true
                });
            }
            else if (prop.indexOf("set") == 0) {
                var propName = prop.slice(3, 4).toLowerCase() + prop.slice(4, prop.length);
                Object.defineProperty(this, propName, {
                    set: this[prop],
                    enumerable: true,
                    configurable: true
                });
            }
            else if (prop.indexOf("is") == 0) {
                var propName = prop.slice(2, 3).toLowerCase() + prop.slice(3, prop.length);
                Object.defineProperty(this, propName, {
                    get: this[prop],
                    enumerable: true,
                    configurable: true
                });
            }
        }

        // Apply params
        var params = params || {};
        for (param in params) {
            if (this[param] !== undefined) {
                this[param] = params[param];
            }
        }
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Private properties ======


    /**
     * Object containing references javascript events binding (for widget
     * internal use).
     *
     * @property __events
     * @type Object
     * @private
     */
    __events: {},    // Javascript internal event

    /**
     * Object containing references to registered callbacks.
     *
     * @property __callbacks
     * @type Object
     * @private
     */
    __callbacks: {},  // Registered callback


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Public methods ======


    /**
     * Destroy the class.
     *
     * @method destroy
     */
    destroy: function() {
        this._callCallbacks("destroy");
        for (var id in this.__events) {
            this._unbindEvent(id);
        }
    },

    /**
     * Register a callback for any PhotonUI/Widget event (called wEvent).
     *
     * Callback signature:
     *
     *     function(Object(Base/Widget) [, arg1 [, arg2 [, ...]]])
     *
     * @method registerCallback
     * @param {String} id An unique id for the callback.
     * @param {String} wEvent the PhotonUI/Widget event name.
     * @param {Function} callback The callback function.
     * @param {Object} thisArg The value of this (optionnal, default = current widget).
     */
    registerCallback: function(id, wEvent, callback, thisArg) {
        if (!this.__callbacks[wEvent]) {
            console.error("This widget have no '" + wEvent + "' event.");
            return;
        }
        this.__callbacks[wEvent][id] = {
            callback: callback,
            thisArg: thisArg || null
        }
    },

    /**
     * Remove a registered callback.
     *
     * @method removeCallback
     * @param {String} id The id of the callback.
     */
    removeCallback: function(id) {
        for (var wEvent in this.__callbacks) {
            if (this.__callbacks[wEvent][id]) {
                delete this.__callbacks[wEvent][id];
            }
        }
    },


    // ====== Private methods ======


    /**
     * Force the update of the given properties.
     *
     * @method _updateProperties
     * @private
     * @param {Array} properties The properties to update.
     */
    _updateProperties: function(properties) {
        for (var i=0 ; i<properties.length ; i++) {
            this[properties[i]] = this[properties[i]];
        }
    },

    /**
     * Javascript event binding (for internal use).
     *
     * @method _bindEvent
     * @private
     * @param {String} id An unique id for the event.
     * @param {DOMElement} element The element on which the event will be bind.
     * @param {String} evName The event name (e.g. "mousemove", "click",...).
     * @param {Function} callback The function that will be called when the event occured.
     */
    _bindEvent: function(id, element, evName, callback) {
        this.__events[id] = {
            evName: evName,
            element: element,
            callback: callback
        };
        this.__events[id].element.addEventListener(
                this.__events[id].evName,
                this.__events[id].callback,
                false
        );
    },

    /**
     * Unbind javascript event.
     *
     * @method _unbindEvent
     * @private
     * @param {String} id The id of the event.
     */
    _unbindEvent: function(id) {
        this.__events[id].element.removeEventListener(
                this.__events[id].evName,
                this.__events[id].callback,
                false
        );
        delete this.__events[id];
    },

    /**
     * Register available wEvent.
     *
     * @method _registerWEvents
     * @private
     * @param {Array} wEvents
     */
    _registerWEvents: function(wEvents) {
        for (var i in wEvents) {
            this.__callbacks[wEvents[i]] = {};
        }
    },

    /**
     * Call all callbacks for the given wEvent.
     *
     * NOTE: the first argument passed to the callback is the current widget.
     * NOTE²: if the thisArg of the callback is null, this will be binded to the current widget.
     *
     * @method _callCallbacks
     * @private
     * @param {String} wEvent The widget event.
     * @param {Array} params Parametters that will be sent to the callbacks.
     */
    _callCallbacks: function(wEvent, params) {
        var params = params || [];
        for (var id in this.__callbacks[wEvent]) {
            this.__callbacks[wEvent][id].callback.apply(
                    this.__callbacks[wEvent][id].thisArg || this,
                    [this].concat(params)
            );
        }
    }
});


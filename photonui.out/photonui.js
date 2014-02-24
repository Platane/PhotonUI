var photonui = (function(window, undefined) {

/*****************************************************************************
 * ../lib/classy.js                                                          *
 ****************************************************************************/

/**
 * Classy - classy classes for JavaScript
 *
 * :copyright: (c) 2011 by Armin Ronacher. 
 * :license: BSD.
 */
!function (definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this.Class = definition()
}(function (undefined) {
  var
    CLASSY_VERSION = '1.4',
    context = this,
    old = context.Class,
    disable_constructor = false;

  /* we check if $super is in use by a class if we can.  But first we have to
     check if the JavaScript interpreter supports that.  This also matches
     to false positives later, but that does not do any harm besides slightly
     slowing calls down. */
  var probe_super = (function(){$super();}).toString().indexOf('$super') > 0;
  function usesSuper(obj) {
    return !probe_super || /\B\$super\b/.test(obj.toString());
  }

  /* helper function to set the attribute of something to a value or
     removes it if the value is undefined. */
  function setOrUnset(obj, key, value) {
    if (value === undefined)
      delete obj[key];
    else
      obj[key] = value;
  }

  /* gets the own property of an object */
  function getOwnProperty(obj, name) {
    return Object.prototype.hasOwnProperty.call(obj, name)
      ? obj[name] : undefined;
  }

  /* instanciate a class without calling the constructor */
  function cheapNew(cls) {
    disable_constructor = true;
    var rv = new cls;
    disable_constructor = false;
    return rv;
  }

  /* the base class we export */
  var Class = function() {};

  /* restore the global Class name and pass it to a function.  This allows
     different versions of the classy library to be used side by side and
     in combination with other libraries. */
  Class.$noConflict = function() {
    try {
      setOrUnset(context, 'Class', old);
    }
    catch (e) {
      // fix for IE that does not support delete on window
      context.Class = old;
    }
    return Class;
  };

  /* what version of classy are we using? */
  Class.$classyVersion = CLASSY_VERSION;

  /* extend functionality */
  Class.$extend = function(properties) {
    var super_prototype = this.prototype;

    /* disable constructors and instanciate prototype.  Because the
       prototype can't raise an exception when created, we are safe
       without a try/finally here. */
    var prototype = cheapNew(this);

    /* copy all properties of the includes over if there are any */
    if (properties.__include__)
      for (var i = 0, n = properties.__include__.length; i != n; ++i) {
        var mixin = properties.__include__[i];
        for (var name in mixin) {
          var value = getOwnProperty(mixin, name);
          if (value !== undefined)
            prototype[name] = mixin[name];
        }
      }
 
    /* copy class vars from the superclass */
    properties.__classvars__ = properties.__classvars__ || {};
    if (prototype.__classvars__)
      for (var key in prototype.__classvars__)
        if (!properties.__classvars__[key]) {
          var value = getOwnProperty(prototype.__classvars__, key);
          properties.__classvars__[key] = value;
        }

    /* copy all properties over to the new prototype */
    for (var name in properties) {
      var value = getOwnProperty(properties, name);
      if (name === '__include__' ||
          value === undefined)
        continue;

      prototype[name] = typeof value === 'function' && usesSuper(value) ?
        (function(meth, name) {
          return function() {
            var old_super = getOwnProperty(this, '$super');
            this.$super = super_prototype[name];
            try {
              return meth.apply(this, arguments);
            }
            finally {
              setOrUnset(this, '$super', old_super);
            }
          };
        })(value, name) : value
    }

    /* dummy constructor */
    var rv = function() {
      if (disable_constructor)
        return;
      var proper_this = context === this ? cheapNew(arguments.callee) : this;
      if (proper_this.__init__)
        proper_this.__init__.apply(proper_this, arguments);
      proper_this.$class = rv;
      return proper_this;
    }

    /* copy all class vars over of any */
    for (var key in properties.__classvars__) {
      var value = getOwnProperty(properties.__classvars__, key);
      if (value !== undefined)
        rv[key] = value;
    }

    /* copy prototype and constructor over, reattach $extend and
       return the class */
    rv.prototype = prototype;
    rv.constructor = rv;
    rv.$extend = Class.$extend;
    rv.$withData = Class.$withData;
    return rv;
  };

  /* instanciate with data functionality */
  Class.$withData = function(data) {
    var rv = cheapNew(this);
    for (var key in data) {
      var value = getOwnProperty(data, key);
      if (value !== undefined)
        rv[key] = value;
    }
    return rv;
  };

  /* export the class */
  return Class;
});
/*****************************************************************************
 * photonui.js                                                               *
 ****************************************************************************/

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
 * @main PhotonUI
 * @namespace photonui
 */


var photonui = photonui || {};


photonui.e_parent = document.getElementsByTagName("body")[0];


/*
 * Insert a widget in the DOM/
 *
 * method domInsert
 * @param {photonui.Widget} widget The widget to insert.
 * @param {HTMLElement} element The DOM node (optional, default=photonui.e_parent)
 */
photonui.domInsert = function(widget, element) {
    var element = element || photonui.e_parent;
    element.appendChild(widget.html);
}


/*
 * Build widgets for an object or a list of object.
 *
 * @method build
 * @param {Object/Array} widgets
 */
photonui.build = function(widgets) {
    if (!(widgets instanceof Array)) {
        var widgets = [widgets];
    }

    function buildWidget(parentWidget, widget) {
        if (widget.__widget__ == undefined) {
            throw "Structure error: __widget__ is not defined";
        }
        if (photonui[widget.__widget__] == undefined) {
            throw "Structure error: The '" + widget.__widget__ + "'widget does not exist";
        }

        var w = new photonui[widget.__widget__](widget);
        if (parentWidget) {
            parentWidget.setChild(w);
        }

        if (widget.__child__ != undefined) {
            buildWidget(w, widget.__child__);
        }

        if (widget.__children__ != undefined) {
            for (var i in widget.__children__) {
                w.addChild(buildWidget(null, widget.__children__[i]));
            }
        }

        return w;
    }

    for (var i in widgets) {
        buildWidget(null, widgets[i]);
    }
}

/*****************************************************************************
 * helpers.js                                                                *
 ****************************************************************************/

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
 * @submodule Helpers
 * @main helpers
 * @namespace photonui
 */


var photonui = photonui || {};


/**
 * Helpers.
 *
 * @class Helpers
 * @constructor
 */
photonui.Helpers = function() {
}

/**
 * Escape HTML.
 *
 * @method escapeHtml
 * @static
 * @param {String} string
 * @return {String}
 */
photonui.Helpers.escapeHtml = function(string) {
    return string
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/**
 * Generate an UUID version 4 (RFC 4122)
 *
 * From:
 * http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
 *
 * @method uuid4
 * @static
 * @return {String} The generated UUID
 */
photonui.Helpers.uuid4 = function() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

/**
 * Clean node (remove all children of the node).
 *
 * @method cleanNode
 * @static
 * @param {HTMLElement} node
 */
photonui.Helpers.cleanNode = function(node) {
    while (node.hasChildNodes()) {
        node.removeChild(node.lastChild);
    }
}

/**
 * Get the absolute position of an HTML Element.
 *
 * @method getAbsolutePosition
 * @static
 * @param {HTMLElement} element
 * @return {Object} `{x: <Number>, y: <Number>}
 */
photonui.Helpers.getAbsolutePosition = function(element) {
    var css = getComputedStyle(element);
    var x = - parseInt(css.borderLeftWidth);
    var y = - parseInt(css.borderTopWidth);;

    while (element.offsetParent) {
        css = getComputedStyle(element);

        x += element.offsetLeft || 0;
        x += parseInt(css.borderLeftWidth);

        y += element.offsetTop || 0;
        y += parseInt(css.borderTopWidth);

        element = element.offsetParent;
    }

    return {x: x, y: y};
}

/*****************************************************************************
 * widget.js                                                                 *
 ****************************************************************************/

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
var _widgets = {};


/*
 * Get a widget.
 *
 * @method getWidget
 * @param {String} name The widget name.
 *
 * @return {photonui.Widget} The widget or null.
 */
photonui.getWidget = function(name) {
    if (_widgets[name] !== undefined) {
        return _widgets[name];
    }
    return null
}


/**
 * Base class for all PhotonUI widgets.
 *
 * wEvents:
 *
 *   * destroy:
 *      - description: called before the widget was destroyed.
 *      - callback:    function(widget)
 *
 *   * show:
 *      - description: called when the widget is displayed.
 *      - callback:    function(widget)
 *
 *   * hidden:
 *      - description: called when the widget is hidden.
 *      - callback:    function(widget)
 *
 * @class Widget
 * @constructor
 * @param {Object} params An object that can contain any property of the widget (optional).
 */
photonui.Widget = Class.$extend({

    // Constructor
    __init__: function(params) {
        // New instances for object properties
        this.__html = {};
        this.__events = {};
        this.__callbacks = {};
        this._layoutOptions = {};

        // Build the html
        this._buildHtml();

        // wEvents
        this._registerWEvents(["destroy", "show", "hide"]);

        // Bind properties with accessorts
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
        this._updateProperties(["visible"]);

        // Default name
        if (!this.name) {
            this.name = "widget-" + photonui.Helpers.uuid4();
        }

        // Additional className
        if (params.className) {
            this.addClass(params.className);
        }

        // Bind some events
        if (this.html) {
            this._bindEvent("pop-contextmenu", this.html, "contextmenu", this.__onContextMenu.bind(this));
        }

        // Register the widget
        _widgets[this.name] = this;
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The unique name of the widget.
     *
     * @property name
     * @type String
     * @default "widget-" + photonui.Helpers.uuid4()
     */
    _name: null,

    getName: function() {
        return this._name;
    },

    setName: function(name) {
        delete _widgets[this.name];
        this._name = name;
        _widgets[name] = this;
        if (this.html) {
            this.html.id = this.name;
        }
    },

    /**
     * Is the widget visible or hidden.
     *
     * @property visible
     * @type Boolean
     * @default true
     */
    _visible: true,

    isVisible: function() {
        return this._visible;
    },

    setVisible: function(visible) {
        this._visible = visible;
        if (!this.html) {
            return;
        }
        if (this.visible) {
            this.html.style.display = "";
            this._callCallbacks("show");
        }
        else {
            this.html.style.display = "none";
            this._callCallbacks("hide");
        }
    },

    /**
     * The name of the managed contextual menu (`photonui.PopupWindow().name`).
     *
     * @property contextMenuName
     * @type String
     * @default null (= no context menu)
     */
    _contextMenuName: null,

    getContextMenuName: function() {
        return this._contextMenuName;
    },

    setContextMenuName: function(contextMenuName) {
        this._contextMenuName = contextMenuName;
    },

    /**
     * The managed contextual menu.
     *
     * @property contextMenu
     * @type photonui.PopupWindow
     * @default null (= no context menu)
     */
    getContextMenu: function() {
        return photonui.getWidget(this.contextMenuName);
    },

    setContextMenu: function(contextMenu) {
        if (contextMenu instanceof photonui.PopupWindow) {
            this.contextMenuName = contextMenu.name
        }
        else {
            this.contextMenuName = null;
        }
    },

    /**
     * Layout options.
     *
     * @property layoutOptions
     * @type Object
     * @default {}
     */
    _layoutOptions: {},

    getLayoutOptions: function() {
        return this._layoutOptions;
    },

    setLayoutOptions: function(layoutOptions) {
        for (option in layoutOptions) {
            this._layoutOptions[option] = layoutOptions[option];
        }
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        console.warn("getHtml() method not implemented for this widget.");
        return null;
    },

    /**
     * Absolute position of the widget on the page.
     *
     * `{x: Number, y: Number}`
     *
     * @property absolutePosition
     * @type Object
     * @readOnly
     */
    getAbsolutePosition: function() {
        if (!this.html) {
            return {x: 0, y: 0};
        }
        return photonui.Helpers.getAbsolutePosition(this.html);
    },

    /**
     * Widget width (outer HTML element).
     *
     * @property offsetWidth
     * @type Number
     * @readOnly
     */
    getOffsetWidth: function() {
        if (!this.html) {
            return 0;
        }
        return this.html.offsetWidth;
    },

    /**
     * Widget height (outer HTML element).
     *
     * @property offsetHeight
     * @type Number
     * @readOnly
     */
    getOffsetHeight: function() {
        if (!this.html) {
            return 0;
        }
        return this.html.offsetHeight;
    },


    // ====== Private properties ======


    /**
     * Object containing references to the widget HTML elements
     *
     * @property __html
     * @type Object
     * @private
     */
    __html: {},      // HTML Elements

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
     * Display the widget (equivalent to widget.visible = true).
     *
     * @method show
     */
    show: function() {
        this.visible = true;
    },

    /**
     * DHide the widget (equivalent to widget.visible = false).
     *
     * @method hide
     */
    hide: function() {
        this.visible = false;
    },

    /**
     * Destroy the widget.
     *
     * @method destroy
     */
    destroy: function() {
        this._callCallbacks("destroy");
        delete _widgets[this.name];
        if (this.html) {
            this.html.parentNode.removeChild(this.html);
        }
        for (var id in this.__events) {
            this._unbindEvent(id);
        }
    },

    /**
     * Add a class to the outer HTML element of the widget.
     *
     * @method addClass
     * @param {String} className The class to add.
     */
    addClass: function(className) {
        if (!this.html) {
            return;
        }
        var classes = this.html.className.split(" ");
        if (classes.indexOf(className) < 0) {
            classes.push(className);
        }
        this.html.className = classes.join(" ");
    },

    /**
     * Remove a class from the outer HTML element of the widget.
     *
     * @method removeClass
     * @param {String} className The class to remove.
     */
    removeClass: function(className) {
        if (!this.html) {
            return;
        }
        var classes = this.html.className.split(" ");
        var index = classes.indexOf(className);
        if (index >= 0) {
            classes.splice(index, 1);
        }
        this.html.className = classes.join(" ");
    },

    /**
     * Register a callback for any widget event (called wEvent).
     *
     * Callback signature:
     *
     *     function(widget [, arg1 [, arg2 [, ...]]])
     *
     * @method registerCallback
     * @param {String} id An unique id for the callback.
     * @param {String} wEvent the widget event name.
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
     * Javascript event binding (for widget internal use).
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
     * Register widgets available events (wEvent).
     *
     * @method _registerWidgetEvents
     * @private
     * @param {Array} wEvents
     */
    _registerWEvents: function(wEvents) {
        for (var i in wEvents) {
            this.__callbacks[wEvents[i]] = {};
        }
    },

    /**
     * Call all callbacks for the given widget event (wEvent).
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
    },

    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        console.warn("_buildHtml() method not implemented for this widget.");
    },


    //////////////////////////////////////////
    // Internal Events Callbacks            //
    //////////////////////////////////////////


    /**
     * Called when the context menu should be displayed.
     *
     * @method __onContextMenu
     * @private
     * @param event
     */
    __onContextMenu: function(event) {
        event.stopPropagation();
        event.preventDefault();
        if (this.contextMenuName) {
            this.contextMenu.popupXY(event.pageX, event.pageY);
        }
    }
});

/*****************************************************************************
 * input/checkbox/checkbox.js                                                *
 ****************************************************************************/

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
 * Checkbox.
 *
 * wEvents:
 *
 *   * value-changed:
 *     - description: called when the value was modified.
 *     - callback:    function(widget, value)
 *
 * @class CheckBox
 * @constructor
 * @extends photonui.Widget
 */
photonui.CheckBox = photonui.Widget.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this.inputId = this.name + "-input";
        this._registerWEvents(["value-changed", "click"]);
        this._bindEvent("value-changed", this.__html.checkbox, "change", this.__onChange.bind(this));
        this._bindEvent("span-click", this.__html.span, "click", this.__onSpanClick.bind(this));
        this._bindEvent("checkbox-click", this.__html.checkbox, "click", this.__onCheckboxClick.bind(this));
        this._bindEvent("span-keypress", this.__html.span, "keypress", this.__onSpanKeypress.bind(this));
        this.__html.checkbox.name = this.name;
        this.__html.checkbox.id = this.inputId;
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The input value.
     *
     * @property value
     * @type Boolean
     * @default false
     */
    getValue: function() {
        return this.__html.checkbox.checked;
    },

    setValue: function(value) {
        this.__html.checkbox.checked = value;
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.outer;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.outer = document.createElement("div");
        this.__html.outer.className = "photonui-widget photonui-checkbox";

        this.__html.checkbox = document.createElement("input");
        this.__html.checkbox.type = "checkbox";
        this.__html.outer.appendChild(this.__html.checkbox);

        this.__html.span = document.createElement("span");
        this.__html.span.tabIndex = "0";
        this.__html.outer.appendChild(this.__html.span);
    },


    //////////////////////////////////////////
    // Internal Events Callbacks            //
    //////////////////////////////////////////


    __onChange: function(event) {
        this._callCallbacks("value-changed", [this.value]);
        // Focus the span if the real checkbox is hidden (happen when a label is clicked).
        if (window.getComputedStyle(this.__html.checkbox).display == "none") {
            this.__html.span.focus();
        }
    },

    __onSpanClick: function(event) {
        this.value = !this.value;
        this._callCallbacks("value-changed", [this.value]);
        this._callCallbacks("click", [event]);
    },

    __onCheckboxClick: function(event) {
        this._callCallbacks("click", [event]);
    },

    __onSpanKeypress: function(event) {
        if (event.charCode == 32 || event.keyCode == 13) {
            this.value = !this.value;
            this._callCallbacks("value-changed", [this.value]);
        }
    }
});

/*****************************************************************************
 * container/container.js                                                    *
 ****************************************************************************/

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


/**
 * Base class for container widgets.
 *
 * @class Container
 * @constructor
 * @extends photonui.Widget
 */
photonui.Container = photonui.Widget.$extend({

    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The child widget name.
     *
     * @property childName
     * @type String
     * @default null (no child)
     */
    _childName: null,

    getChildName: function() {
        return this._childName;
    },

    setChildName: function(childName) {
        if (this.childName && this.containerNode) {
            this.containerNode.removeChild(this.child.html);
        }
        this._childName = childName;
        if (this.childName && this.containerNode) {
            this.containerNode.appendChild(this.child.html);
        }
    },

    /**
     * The child widget.
     *
     * @property child
     * @type photonui.Widget
     * @default null (no child)
     */
    getChild: function() {
        return photonui.getWidget(this.childName);
    },

    setChild: function(child) {
        if (!child instanceof photonui.Widget) {
            this.childName = null;
            return;
        }
        this.childName = child.name;
    },

    /**
     * HTML Element that contain the child widget HTML.
     *
     * @property containerNode
     * @type HTMLElement
     * @readOnly
     */
    getContainerNode: function() {
        console.warn("getContainerNode() method not implemented for this widget.");
        return null;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Public methods ======


    /**
     * Destroy the widget.
     *
     * @method destroy
     */
    destroy: function() {
        if (this.childName) {
            this.child.destroy();
        }
        this.$super();
    }
});

/*****************************************************************************
 * input/color/colorpalette.js                                               *
 ****************************************************************************/

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


// The default palette
photonui.palette = [
    ["#000000", "#400000", "#404000", "#004000", "#004040", "#000040", "#400040"],
    ["#303030", "#800000", "#808000", "#008000", "#008080", "#000080", "#800080"],
    ["#606060", "#C00000", "#C0C000", "#00C000", "#00C0C0", "#0000C0", "#C000C0"],
    ["#909090", "#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF"],
    ["#C0C0C0", "#FF8080", "#FFFF80", "#80FF80", "#80FFFF", "#8080FF", "#FF80FF"],
    ["#FFFFFF", "#FFC0C0", "#FFFFC0", "#C0FFC0", "#C0FFFF", "#C0C0FF", "#FFC0FF"]
];


/**
 * A Color Palette.
 *
 * wEvents:
 *
 *   * value-changed:
 *      - description: the selected color changed.
 *      - callback:    function(widget, color)
 *
 * @class ColorPalette
 * @constructor
 * @extends photonui.Widget
 * @param {Object} params An object that can contain any property of the widget (optional).
 */
photonui.ColorPalette = photonui.Widget.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._registerWEvents(["value-changed"]);
        this._updateProperties(["palette", "value"]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The value (color).
     *
     * @property value
     * @type String
     * @default: "#FF0000"
     */
    _value: "#FF0000",

    getValue: function() {
        return this._value;
    },

    setValue: function(value) {
        this._value = value;
    },

    /**
     * The color palette.
     *
     * @property palette
     * @type Array
     * @default null (= `photonui.palette`)
     */
    _palette: null,

    getPalette: function() {
        return this._palette || photonui.palette;
    },

    setPalette: function(palette) {
        this._palette = palette;

        if (!palette) {
            var palette = photonui.palette;
        }

        // Update
        this.__html.palette.removeChild(this.__html.tbody);
        photonui.Helpers.cleanNode(this.__html.tbody);

        var e_tr, e_td, x, y;
        for (y=0 ; y<palette.length ; y++) {
            var e_tr = document.createElement("tr");
            for (x=0 ; x<palette[y].length ; x++) {
                var e_td = document.createElement("td");
                e_td.style.backgroundColor = palette[y][x];
                e_td.onclick = this.__onColorClicked.bind(this, palette[y][x]);
                e_tr.appendChild(e_td);
            }
            this.__html.tbody.appendChild(e_tr);
        }

        this.__html.palette.appendChild(this.__html.tbody);
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.palette;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.palette = document.createElement("table");
        this.__html.palette.className = "photonui-widget photonui-colorpalette";
        this.__html.tbody = document.createElement("tbody");
        this.__html.palette.appendChild(this.__html.tbody)
    },


    //////////////////////////////////////////
    // Internal Events Callbacks            //
    //////////////////////////////////////////


    __onColorClicked: function(color, event) {
        this.value = color;
        this._callCallbacks("value-changed", [color]);
    }
});

/*****************************************************************************
 * visual/label.js                                                           *
 ****************************************************************************/

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
 * @submodule Visual
 * @namespace photonui
 */


var photonui = photonui || {};


/**
 * Label.
 *
 * @class Label
 * @constructor
 * @extends photonui.Widget
 */
photonui.Label = photonui.Widget.$extend({

    // Constructor
    __init__: function(params) {
        var params = params || {};
        params.layoutOptions = params.layoutOptions || {};
        if (params.layoutOptions.verticalExpansion === undefined) {
            params.layoutOptions.verticalExpansion = false;
        }
        this.$super(params);
        this._updateProperties(["text", "textAlign", "forInputName"]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The label text.
     *
     * @property text
     * @type String
     * @default "Label"
     */
    _text: "Label",

    getText: function() {
        return this._text;
    },

    setText: function(text) {
        this._text = text;
        this.__html.label.innerHTML = photonui.Helpers.escapeHtml(text);
    },

    /**
     * The text horizontal alignement.
     *
     *   * "left",
     *   * "center",
     *   * "right".
     *
     * @property textAlign
     * @type String
     * @default "left"
     */
    _textAlign: "left",

    getTextAlign: function() {
        return this._textAlign;
    },

    setTextAlign: function(textAlign) {
        if (textAlign != "left" && textAlign != "center" && textAlign != "right") {
            throw "Text alignement sould be 'left', 'center' or 'right'.";
        }
        this._textAlign = textAlign;
        this.__html.label.style.textAlign = textAlign;
    },

    /**
     * Link the label with the given input (Field, CheckBox,...) widget.
     *
     * @property forInputName
     * @type String
     * @default null
     */
    _forInputName: null,

    getForInputName: function() {
        return this._forInputName;
    },

    setForInputName: function(forInputName) {
        this._forInputName = forInputName;
        if (this._forInputName) {
            this.__html.label.setAttribute("for",
                    photonui.Helpers.escapeHtml(this.forInput.inputId || this.forInput.name)
            );
        }
    },

    /**
     * Link the label with the given input (Field, CheckBox,...) widget.
     *
     * @property forInput
     * @type photonui.Field, photonui.CheckBox
     * @default null
     */
    getForInput: function() {
        return photonui.getWidget(this.forInputName);
    },

    setForInput: function(forInput) {
        this.forInputName = forInput.name;
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.label;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.label = document.createElement("label");
        this.__html.label.className = "photonui-widget photonui-label";
    }
});

/*****************************************************************************
 * input/field/field.js                                                      *
 ****************************************************************************/

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
 * Base class for fields.
 *
 * wEvents:
 *
 *   * value-changed:
 *     - description: called when the value was modified.
 *     - callback:    function(widget, value)
 *
 *   * keydown:
 *     - description: called when a key is pressed.
 *     - callback:    function(widget, event)
 *
 *   * keyup:
 *     - description: called when a key is released.
 *     - callback:    function(widget, event)
 *
 *   * keypress:
 *     - description: called just before the insertion of a char.
 *     - callback:    function(widget, event)
 *
 *   * selection-changed:
 *     - description: called when the selection was changed.
 *     - callback:    function(widget, selectionStart, selectionEnd, selectedText, event)
 *
 * @class Field
 * @constructor
 * @extends photonui.Widget
 */
photonui.Field = photonui.Widget.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._registerWEvents([
            "value-changed", "keydown", "keyup", "keypress",
            "selection-changed"
        ]);
        this._updateProperties(["value", "placeholder"]);
        this.__html.field.name = this.name;
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The field value.
     *
     * @property value
     * @type String (maybe)
     * @default ""
     */
    getValue: function() {
        return this.__html.field.value;
    },

    setValue: function(value) {
        this.__html.field.value = value;
    },

    /**
     * The placeholder displayed if the field is empty.
     *
     * @property Placeholder
     * @type String
     * @default ""
     */
    getPlaceholder: function() {
        return this.__html.field.placeholder;
    },

    setPlaceholder: function(placeholder) {
        this.__html.field.placeholder = placeholder;
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.field;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Bind Field events.
     *
     * @method _bindFieldEvents
     * @private
     */
    _bindFieldEvents: function() {
        this._bindEvent("value-changed", this.__html.field, "change", function(event) {
            this._callCallbacks("value-changed", [this.getValue()]);
        }.bind(this));

        this._bindEvent("keydown", this.__html.field, "keydown", function(event) {
            this._callCallbacks("keydown", [event]);
        }.bind(this));

        this._bindEvent("keyup", this.__html.field, "keyup", function(event) {
            this._callCallbacks("keyup", [event]);
        }.bind(this));

        this._bindEvent("keypress", this.__html.field, "keypress", function(event) {
            this._callCallbacks("keypress", [event]);
        }.bind(this));

        this._bindEvent("selection-changed", this.__html.field, "select", function(event) {
            this._callCallbacks("selection-changed", [
                this.__html.field.selectionStart,
                this.__html.field.selectionEnd,
                ("" + this.getValue()).substring(this.__html.field.selectionStart, this.__html.field.selectionEnd),
                event]);
        }.bind(this));
    },


    //////////////////////////////////////////
    // Internal Events Callbacks            //
    //////////////////////////////////////////


    /**
     * Called when the context menu should be displayed.
     *
     * @method __onContextMenu
     * @private
     * @param event
     */
    __onContextMenu: function(event) {
        event.stopPropagation();  // Enable context menu on fields
    }
});

/*****************************************************************************
 * visual/baseicon.js                                                        *
 ****************************************************************************/

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
 * @submodule Visual
 * @namespace photonui
 */


var photonui = photonui || {};


/**
 * Base class for icons.
 *
 * @class BaseIcon
 * @constructor
 * @extends photonui.Widget
 */
photonui.BaseIcon = photonui.Widget.$extend({});

/*****************************************************************************
 * visual/separator.js                                                       *
 ****************************************************************************/

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
 * @submodule Visual
 * @namespace photonui
 */


var photonui = photonui || {};


/**
 * Separator.
 *
 * @class Separator
 * @constructor
 * @extends photonui.Widget
 */
photonui.Separator = photonui.Widget.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._updateProperties(["orientation"]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The separator orientation ("vertical" or "horizontal").
     *
     * @property orientation
     * @type String
     * @default "horizontal"
     */
    _orientation: "horizontal",

    getOrientation: function() {
        return this._orientation;
    },

    setOrientation: function(orientation) {
        if (orientation != "vertical" && orientation != "horizontal") {
            throw "Error: The orientation should be \"vertical\" or \"horizontal\".";
            return;
        }
        this._orientation = orientation;
        this.removeClass("photonui-separator-vertical");
        this.removeClass("photonui-separator-horizontal");
        this.addClass("photonui-separator-" + this.orientation);
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.outer;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.outer = document.createElement("div");
        this.__html.outer.className = "photonui-widget photonui-separator";
        this.__html.hr = document.createElement("hr");
        this.__html.outer.appendChild(this.__html.hr);
    }
});

/*****************************************************************************
 * visual/progressbar.js                                                     *
 ****************************************************************************/

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
 * @submodule Visual
 * @namespace photonui
 */


var photonui = photonui || {};


/**
 * ProgressBar.
 *
 * @class ProgressBar
 * @constructor
 * @extends photonui.Widget
 */
photonui.ProgressBar = photonui.Widget.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._updateProperties(["orientation", "value", "pulsate"]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.outer;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * The progression (form 0.00 to 1.00).
     *
     * @property value
     * @type Number
     * @default 0
     */
    _value: 0,

    getValue: function() {
        return this._value;
    },

    setValue: function(value) {
        this._value = Math.min(Math.max(value, 0), 1);
        if (this.orientation == "horizontal") {
            this.__html.bar.style.width = Math.floor(this.value * 100) + "%";
        }
        else {
            this.__html.bar.style.height = Math.floor(this.value * 100) + "%";
        }
        this.__html.textContent.innerHTML = Math.floor(this.value * 100) + " %";
    },

    /**
     * The progressbar orientation ("vertical" or "horizontal").
     *
     * @property orientation
     * @type String
     * @default "horizontal"
     */
    _orientation: "horizontal",

    getOrientation: function() {
        return this._orientation;
    },

    setOrientation: function(orientation) {
        if (orientation != "vertical" && orientation != "horizontal") {
            throw "Error: The orientation should be \"vertical\" or \"horizontal\".";
            return;
        }
        this._orientation = orientation;
        this.removeClass("photonui-progressbar-vertical");
        this.removeClass("photonui-progressbar-horizontal");
        this.addClass("photonui-progressbar-" + this.orientation);
    },

    /**
     * Enable or disable the progressbar pulsate mode.
     *
     * @property pulsate
     * @type Boolean
     * @default false
     */
    _pulsate: false,

    isPulsate: function() {
        return this._pulsate;
    },

    setPulsate: function(pulsate) {
        this._pulsate = pulsate;
        if (pulsate) {
            this.addClass("photonui-progressbar-pulsate");
            if (this.orientation == "horizontal") {
                this.__html.bar.style.width = "";
            }
            else {
                this.__html.bar.style.height = "";
            }
        }
        else {
            this.removeClass("photonui-progressbar-pulsate");
            this.value = this.value;
        }
    },

    /**
     * Display/hide the progression text.
     *
     * @property textVisible
     * @type Boolean
     * @default true
     */
    _textVisible: true,

    isTextVisible: function() {
        return this._textVisible;
    },

    setTextVisible: function(textVisible) {
        this._textVisible = textVisible;
        if (this.textVisible) {
            this.__html.text.style.display = "";
        }
        else {
            this.__html.text.style.display = "none";
        }
    },

    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.outer = document.createElement("div");
        this.__html.outer.className = "photonui-widget photonui-progressbar";

        this.__html.text = document.createElement("div");
        this.__html.text.className = "photonui-progressbar-text";
        this.__html.outer.appendChild(this.__html.text);

        this.__html.textContent = document.createElement("span");
        this.__html.text.appendChild(this.__html.textContent);

        this.__html.bar = document.createElement("div");
        this.__html.bar.className = "photonui-progressbar-bar";
        this.__html.outer.appendChild(this.__html.bar);
    }
});

/*****************************************************************************
 * visual/faicon.js                                                          *
 ****************************************************************************/

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
 * @submodule Visual
 * @namespace photonui
 */


var photonui = photonui || {};


/**
 * Font Awesome Icon.
 *
 * Special contructor params:
 *
 *      new photonui.FAIcon( {optional params...} )
 *      new photonui.FAIcon( "iconName", {optional params...} )
 *
 * @class FAIcon
 * @constructor
 * @extends photonui.BaseIcon
 */
photonui.FAIcon = photonui.BaseIcon.$extend({

    // Constructor
    __init__: function(params1, params2) {
        var params = {};
        if (params1 && typeof(params1) == "string") {
            params.iconName = params1;
            if (params2 && typeof(params2) == "object") {
                for (var i in params2) {
                    params[i] = params2[i];
                }
            }
        }
        else if (params1) {
            params = params1;
        }
        this.$super(params);
        this._updateProperties(["iconName", "size", "color"]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The Font Awesome icon name (e.g. "fa-cog").
     *
     * Icon list: http://fontawesome.io/icons/
     *
     * @property iconName
     * @type String
     * @default ""
     */
    _iconName: "",

    getIconName: function() {
        return this._iconName;
    },

    setIconName: function(iconName) {
        this._iconName = iconName || "";
        this.__html.icon.className = "fa " + this.iconName + " " + this.size;
    },

    /**
     * Font Awesome icon size (e.g. "fa-2x").
     *
     * Icon sizes list: http://fontawesome.io/examples/#larger
     *
     * @property size
     * @type String
     * @default ""
     */
    _size: "",

    getSize: function() {
        return this._size;
    },

    setSize: function(size) {
        this._size = size || "";
        this.__html.icon.className = "fa " + this.iconName + " " + this.size;
    },

    /**
     * The icon color.
     *
     * @property color
     * @type String
     * default: "inherit"
     */
    _color: "inherit",

    getColor: function() {
        return this._color;
    },

    setColor: function(color) {
        this._color = color || "inherit";
        this.__html.icon.style.color = this.color;
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.outer;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.outer = document.createElement("span");
        this.__html.outer.className = "photonui-widget photonui-icon photonui-faicon";

        this.__html.icon = document.createElement("i");
        this.__html.outer.appendChild(this.__html.icon);
    }
});

/*****************************************************************************
 * container/layout/layout.js                                                *
 ****************************************************************************/

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


/**
 * Base class for layout.
 *
 * @class Layout
 * @constructor
 * @extends photonui.Container
 */
photonui.Layout = photonui.Container.$extend({

    // Constructor
    __init__: function(params) {
        this._childrenNames = [];  // new instance
        this.$super(params);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * Layout children widgets name.
     *
     * @property childrenNames
     * @type Array
     * @default []
     */
    _childrenNames: [],

    getChildrenNames: function() {
        return this._childrenNames;
    },

    setChildrenNames: function(childrenNames) {
        this._childrenNames = childrenNames;
        this._updateLayout();
    },

    /**
     * Layout children widgets.
     *
     * @property children
     * @type Array
     * @default []
     */
    getChildren: function() {
        var children = [];
        for (var i=0 ; i<this._childrenNames.length ; i++) {
            children.push(photonui.getWidget(this._childrenNames[i]));
        }
        return children;
    },

    setChildren: function(children) {
        var childrenNames = [];
        for (var i=0 ; i<children.length ; i++) {
            if (children[i] instanceof photonui.Widget) {
                childrenNames.push(children[i].name);
            }
        }
        this.childrenNames = childrenNames;
    },

    // Override getChildName / setChildName / getChild / setChild

    getChildName: function() {
        console.warn("Warning: You cannot use getChild() on layout widgets, please use getChildren() instead.");
        return null;
    },

    setChildName: function(childName) {
        this.childrenNames = [childName];
    },

    getChild: function() {
        console.warn("Warning: You cannot use getChild() on layout widgets, please use getChildren() instead.");
        return null;
    },

    setChild: function(child) {
        this.children = [child];
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Public methods ======


    /**
     * Add a widget to the layout.
     *
     * @method addChild
     * @param {photonui.Widget} widget The widget to add.
     * @param {Object} layoutOption Specific option for the layout (optional).
     */
    addChild: function(widget, layoutOptions) {
        if (layoutOptions) {
            widget.layoutOptions = layoutOptions;
        }
        this._childrenNames.push(widget.name);
        this._updateLayout();
    },

    /**
     * Remove a widget from the layout.
     *
     * @method removeChild
     * @param {photonui.Widget} widget The widget to remove.
     */
    removeChild: function(widget) {
        var index = this.childrenWidgets.indexOf(widget.name);
        if (index >= 0) {
            this.childrenWidgets.splice(widget.name, 1);
        }
        this._updateLayout();
    },

    /**
     * Destroy the widget.
     *
     * @method destroy
     */
    destroy: function() {
        var children = this.children;
        for (var i=0 ; i<children.length ; i++) {
            children[i].destroy();
        }
        this.$super();
    },


    // ====== Private methods ======


    /**
     * Update the layout.
     *
     * @method _updateLayout
     * @private
     */
    _updateLayout: function() {
        throw "Error: you should define the _updateLayout() method when you extend a layout widget.";
    }
});

/*****************************************************************************
 * input/field/textfield.js                                                  *
 ****************************************************************************/

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
 * Text, Password, Email, Search, Tel, URL Fields.
 *
 * @class TextField
 * @constructor
 * @extends photonui.Field
 */
photonui.TextField = photonui.Field.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._bindFieldEvents();
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * Type of the field.
     *
     *   * text
     *   * password
     *   * email
     *   * search
     *   * tel
     *   * url
     *
     * @property type
     * @type String
     * @default text
     */
    getType: function() {
        return this.__html.field.type;
    },

    setType: function(type) {
        if (type != "text" && type != "password" && type != "email" && type != "search" && type != "tel" && type != "url") {
            throw 'Error: The type should be "text", "password", "email", "search", "tel" or "url".';
            return;
        }
        this.__html.field.type = type;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.field = document.createElement("input");
        this.__html.field.className = "photonui-widget photonui-field photonui-field-text";
        this.__html.field.type = "text";
    }
});

/*****************************************************************************
 * input/field/numericfield.js                                               *
 ****************************************************************************/

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
 * Numeric field.
 *
 * @class NumericField
 * @constructor
 * @extends photonui.Field
 */
photonui.NumericField = photonui.Field.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._updateProperties(["value"]);
        this._bindFieldEvents();
        this._bindEvent("keypress", this.__html.field, "keypress", this.__onKeypress.bind(this));
        this._bindEvent("keyup", this.__html.field, "keyup", this.__onKeyup.bind(this));
        this._bindEvent("keydown", this.__html.field, "keydown", this.__onKeydown.bind(this));
        this._bindEvent("change", this.__html.field, "change", this.__onChange.bind(this));
        this._bindEvent("mousewheel", this.__html.field, "mousewheel", this.__onMouseWheel.bind(this));
        this._bindEvent("mousewheel-firefox", this.__html.field, "DOMMouseScroll", this.__onMouseWheel.bind(this));
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The minimum value of the field.
     *
     * @property min
     * @type Number
     * default null (no minimum);
     */
    _min: null,

    getMin: function() {
        return this._min;
    },

    setMin: function(min) {
        this._min = min;
    },

    /**
     * The maximum value of the field.
     *
     * @property max
     * @type Number
     * default null (no maximum);
     */
    _max: null,

    getMax: function() {
        return this._max;
    },

    setMax: function(max) {
        this._max = max;
    },

    /**
     * The incrementation step of the field.
     *
     * @property step
     * @type Number
     * default 1
     */
    _step: 1,

    getStep: function() {
        return this._step;
    },

    setStep: function(step) {
        this._step = Math.abs(step);
    },

    /**
     * The number of digit after the decimal dot.
     *
     * @property decimalDigits
     * @type Number
     * @default null (no limite)
     */
    _decimalDigits: null,

    getDecimalDigits: function() {
        return this._decimalDigits;
    },

    setDecimalDigits: function(decimalDigits) {
        this._decimalDigits = decimalDigits;
    },

    /**
     * The decimal symbol ("." or ",").
     *
     * @property decimalSymbol
     * @type String
     * @default: "."
     */
    _decimalSymbol: ".",

    getDecimalSymbol: function() {
        return this._decimalSymbol;
    },

    setDecimalSymbol: function(decimalSymbol) {
        this._decimalSymbol = decimalSymbol;
    },

    /**
     * The field value.
     *
     * @property value
     * @type Number
     * @default 0
     */
    _value: 0,

    getValue: function() {
        return parseFloat(this._value);
    },

    setValue: function(value) {
        this._updateValue(value);
        this._updateFieldValue();
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Update the value (in the widget).
     *
     * @method _updateValue
     * @private
     * @param {String|Number} value The raw value.
     */
    _updateValue: function(value) {
        value = ("" + value).replace(",", "."); // ","
        value = value.replace(/ /g, "");  // remove spaces
        value = parseFloat(value);
        if (isNaN(value)) {
            value = 0;
        }

        if (this.min != null) {
            value = Math.max(this.min, value);
        }

        if (this.max != null) {
            value = Math.min(this.max, value);
        }

        if (this.decimalDigits != null) {
            value = value.toFixed(this.decimalDigits);
        }

        this._value = value;
    },

    /**
     * Update the value in the html field.
     *
     * @method _updateFieldValue
     * @private
     */
    _updateFieldValue: function() {
        this.__html.field.value = ("" + this._value).replace(".", this.decimalSymbol);
    },

    /**
     * Validate the user inputs.
     *
     * @method _validateInput
     * @private
     * @param {String} value
     * @return {Boolean}
     */
    _validateInput: function(value) {
        var value = "" + value;
        value = value.replace(/ /g, "");  // remove spaces
        if (/^-?[0-9]*(\.|,)?[0-9]*$/.test(value)) {
            if (this.decimalDigits == 0 && !/^-?[0-9]*$/.test(value)) {
                return false;
            }
            if (this.min !== null && this.min >= 0 && value[0] == "-") {
                return false;
            }
            return true;
        }
        return false;
    },

    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.field = document.createElement("input");
        this.__html.field.className = "photonui-widget photonui-field photonui-field-numeric";
        this.__html.field.type = "text";
    },


    //////////////////////////////////////////
    // Internal Events Callbacks            //
    //////////////////////////////////////////


    /**
     * @method __onKeypress
     * @private
     * @param event
     */
    __onKeypress: function(event) {
        if (event.ctrlKey) {
            return;
        }
        else if (event.keyCode == 13) {  // Enter
            this._updateFieldValue();
            this._callCallbacks("value-changed", [this.value]);
        }
        else {
            var field = this.__html.field;
            var value = field.value.slice(0, field.selectionStart)
                        + String.fromCharCode(event.charCode)
                        + field.value.slice(field.selectionEnd);
            if (!this._validateInput(value)) {
                event.preventDefault();
            }
        }
    },

    /**
     * @method __onKeyup
     * @private
     * @param event
     */
    __onKeyup: function(event) {
        var value = this.__html.field.value.replace(/[^0-9.,-]*/g, "");
        if (value != this.__html.field.value) {
            this.__html.field.value = value;
        }
        this._updateValue(this.__html.field.value);
    },

    /**
     * @method __onChange
     * @private
     * @param event
     */
    __onChange: function(event) {
        this._updateFieldValue();
        this._callCallbacks("value-changed", [this.value]);
    },

    /**
     * @method __onMouseWheel
     * @private
     * @param event
     */
    __onMouseWheel: function(event) {
        if (document.activeElement != this.__html.field) {
            return;
        }

        var wheelDelta = null;

        // Webkit
        if (event.wheelDeltaY != undefined) {
            wheelDelta = event.wheelDeltaY;
        }
        // MSIE
        if (event.wheelDelta != undefined) {
            wheelDelta = event.wheelDelta;
        }
        // Firefox
        if (event.axis != undefined && event.detail != undefined) {
            if (event.axis == 2) { // Y
                wheelDelta = - event.detail;
            }
        }

        if (wheelDelta != null) {
            if (wheelDelta >= 0) {
                this.setValue(this.getValue() + this.step);
            }
            else {
                this.setValue(this.getValue() - this.step);
            }
            event.preventDefault();
        }
        this._callCallbacks("value-changed", [this.value]);
    },

    /**
     * @method __onKeydown
     * @private
     * @param event
     */
    __onKeydown: function(event) {
        if (event.keyCode == 38) {
            this.setValue(this.getValue() + this.step);
            event.preventDefault();
            this._callCallbacks("value-changed", [this.value]);
        }
        else if (event.keyCode == 40) {
            this.setValue(this.getValue() - this.step);
            event.preventDefault();
            this._callCallbacks("value-changed", [this.value]);
        }
    }
});

/*****************************************************************************
 * container/viewport/viewport.js                                            *
 ****************************************************************************/

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


/**
 * Viewport.
 *
 * @class Viewport
 * @constructor
 * @extends photonui.Container
 */
photonui.Viewport = photonui.Container.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._updateProperties([
            "padding", "verticalScrollbar", "horizontalScrollbar"
        ]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======

    /**
     * Window container node padding.
     *
     * @property padding
     * @type Number
     * @default 0
     */
    _padding: 0,

    getPadding: function() {
        return this._padding;
    },

    setPadding: function(padding) {
        this._padding = padding;
        this.containerNode.style.padding = padding + "px";
    },

    /**
     * Visibility of the vertical scrollbar.
     *
     *   * `true`: displayed,
     *   * `false`: hidden,
     *   * `null`: auto.
     *
     * @property verticalScrollbar
     * @type Boolean
     * @default null
     */
    _verticalScrollbar: null,

    getVerticalScrollbar: function() {
        return this._verticalScrollbar;
    },

    setVerticalScrollbar: function(visibility) {
        this._verticalScrollbar = visibility;
        if (visibility === true) {
            this.__html.viewport.style.overflowY = "scroll";
        }
        else if (visibility === false) {
            this.__html.viewport.style.overflowY = "hidden";
        }
        else {
            this.__html.viewport.style.overflowY = "auto";
        }
    },

    /**
     * Visibility of the horizontal scrollbar.
     *
     *   * `true`: displayed,
     *   * `false`: hidden,
     *   * `null`: auto.
     *
     * @property horizontalScrollbar
     * @type Boolean
     * @default null
     */
    _horizontalScrollbar: null,

    getHorizontalScrollbar: function() {
        return this._horizontalScrollbar;
    },

    setHorizontalScrollbar: function(visibility) {
        this._horizontalScrollbar = visibility;
        if (visibility === true) {
            this.__html.viewport.style.overflowX = "scroll";
        }
        else if (visibility === false) {
            this.__html.viewport.style.overflowX = "hidden";
        }
        else {
            this.__html.viewport.style.overflowX = "auto";
        }
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.viewport;
    },

    /**
     * HTML Element that contain the child widget HTML.
     *
     * @property containerNode
     * @type HTMLElement
     * @readOnly
     */
    getContainerNode: function() {
        return this.html;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.viewport = document.createElement("div");
        this.__html.viewport.className = "photonui-widget photonui-viewport photonui-container";
    },
});

/*****************************************************************************
 * input/checkbox/switch.js                                                  *
 ****************************************************************************/

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
 * Switch.
 *
 * @class Switch
 * @constructor
 * @extends photonui.CheckBox
 */
photonui.Switch = photonui.CheckBox.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this.removeClass("photonui-checkbox");
        this.addClass("photonui-switch");
    }
});

/*****************************************************************************
 * container/window/basewindow.js                                            *
 ****************************************************************************/

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


/**
 * Windows base class.
 *
 * wEvents:
 *
 *   * position-changed:
 *      - description: called when the widows is moved.
 *      - callback:    function(widget, x, y)
 *
 * @class BaseWindow
 * @constructor
 * @extends photonui.Container
 */
photonui.BaseWindow = photonui.Container.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);

        // Windows are hidden by default
        var params = params || {};
        if (params.visible === undefined) {
            this.visible = false;
        }

        // wEvents
        this._registerWEvents(["position-changed"]);

        // Insert the window in the DOM tree
        photonui.domInsert(this);

        // Update properties
        this._updateProperties([
            "position", "width", "height", "minWidth", "minHeight",
            "maxWidth", "maxHeight", "padding"
        ]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * Window position.
     *
     *     {x: Number, y: Number}
     *
     * @property position
     * @type Object
     * @default {x: 0, y: 0}
     */
    getPosition: function() {
        if (this.visible && this.html.parentNode) {
            return this.absolutePosition;
        }
        return {x: this._x, y: this._y};
    },

    setPosition: function(x, y) {
        if (typeof(x) == "object" && y == undefined) {
            this.html.style.left = x.x + "px";
            this.html.style.top = x.y + "px";
            this._x = x.x;
            this._y = x.y;
        }
        else {
            if (typeof(x) == "number") {
                this.html.style.left = x + "px";
                this._x = x;
            }
            if (typeof(y) == "number") {
                this.html.style.top = y + "px";
                this._y = y;
            }
        }
        this._callCallbacks("position-changed", [this.x, this.y]);
    },

    /**
     * The X position of the Window.
     *
     * @property x
     * @type Number
     * @default 0
     */
    _x: 0,

    getX: function() {
        return this.position.x;
    },

    setX: function(x) {
        this.setPosition(x, null);
    },

    /**
     * The Y position of the Window.
     *
     * @property y
     * @type Number
     * @default 0
     */
    _y: 0,

    getY: function() {
        return this.position.y;
    },

    setY: function(y) {
        this.setPosition(null, y);
    },

    /**
     * Width of the container node.
     *
     * @property width
     * @type Number
     * @default: null (auto)
     */
    _width: null,

    getWidth: function() {
        if (this.visible && this.html.parenNode) {
            return this.containerNode.offsetWidth;
        }
        return this._width || 0;
    },

    setWidth: function(width) {
        this._width = width || null;
        if (this._width) {
            this.containerNode.style.width = width + "px";
        }
        else {
            this.containerNode.style.width = "auto";
        }
    },

    /**
     * Height of the container node.
     *
     * @property height
     * @type Number
     * @default: null (auto)
     */
    _height: null,

    getHeight: function() {
        if (this.visible && this.html.parenNode) {
            return this.containerNode.offsetHeight;
        }
        return this._height || 0;
    },

    setHeight: function(height) {
        this._height = height || null;
        if (this._height) {
            this.containerNode.style.height = height + "px";
        }
        else {
            this.containerNode.style.height = "auto";
        }
    },

    /**
     * Minimum width of the container node.
     *
     * @property minWidth
     * @type Number
     * @default: null (no minimum)
     */
    _minWidth: null,

    getMinWidth: function() {
        return this._minWidth;
    },

    setMinWidth: function(minWidth) {
        this._minWidth = minWidth || null;
        if (this._minWidth) {
            this.containerNode.style.minWidth = minWidth + "px";
        }
        else {
            this.containerNode.style.minWidth = "0";
        }
    },

    /**
     * Minimum height of the container node.
     *
     * @property minHeight
     * @type Number
     * @default: null (no minimum)
     */
    _minHeight: null,

    getMinHeight: function() {
        return this._minHeight;
    },

    setMinHeight: function(minHeight) {
        this._minHeight = minHeight || null;
        if (this._minHeight) {
            this.containerNode.style.minHeight = minHeight + "px";
        }
        else {
            this.containerNode.style.minHeight = "0";
        }
    },

    /**
     * Maximum width of the container node.
     *
     * @property maxWidth
     * @type Number
     * @default: null (no maximum)
     */
    _maxWidth: null,

    getMaxWidth: function() {
        return this._maxWidth;
    },

    setMaxWidth: function(maxWidth) {
        this._maxWidth = maxWidth || null;
        if (this._maxWidth) {
            this.containerNode.style.maxWidth = maxWidth + "px";
        }
        else {
            this.containerNode.style.maxWidth = "auto";
        }
    },

    /**
     * Maximum height of the container node.
     *
     * @property maxHeight
     * @type Number
     * @default: null (no maximum)
     */
    _maxHeight: null,

    getMaxHeight: function() {
        return this._maxHeight;
    },

    setMaxHeight: function(maxHeight) {
        this._maxHeight = maxHeight || null;
        if (this._maxHeight) {
            this.containerNode.style.maxHeight = maxHeight + "px";
        }
        else {
            this.containerNode.style.maxHeight = "auto";
        }
    },

    /**
     * Window container node padding.
     *
     * @property padding
     * @type Number
     * @default 0
     */
    _padding: 0,

    getPadding: function() {
        return this._padding;
    },

    setPadding: function(padding) {
        this._padding = padding;
        this.containerNode.style.padding = padding + "px";
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html["window"];
    },

    /**
     * HTML Element that contain the child widget HTML.
     *
     * @property containerNode
     * @type HTMLElement
     * @readOnly
     */
    getContainerNode: function() {
        return this.html;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Public methods ======


    /**
     * Center the window.
     *
     * @method center
     */
    center: function() {
        this.setPosition(
                Math.round((photonui.e_parent.offsetWidth - this.offsetWidth) / 2),
                Math.round((photonui.e_parent.offsetHeight - this.offsetHeight) / 2)
        );
    },


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html["window"] = document.createElement("div");
        this.__html["window"].className = "photonui-widget photonui-basewindow";
    }
});

/*****************************************************************************
 * input/field/textareafield.js                                              *
 ****************************************************************************/

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
 * Multiline text field.
 *
 * @class TextAreaField
 * @constructor
 * @extends photonui.Field
 */
photonui.TextAreaField = photonui.Field.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._bindFieldEvents();
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * Number of columns.
     *
     * @property cols
     * @type Number
     * @default 20
     */
    getCols: function() {
        return parseInt(this.__html.field.cols);
    },

    setCols: function(cols) {
        this.__html.field.cols = cols;
    },

    /**
     * Number of rows.
     *
     * @property rows
     * @type Number
     * @default 3
     */
    getRows: function() {
        return parseInt(this.__html.field.rows);
    },

    setRows: function(rows) {
        this.__html.field.rows = rows;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.field = document.createElement("textarea");
        this.__html.field.className = "photonui-widget photonui-field photonui-field-textarea";
        this.__html.field.cols = 20;
        this.__html.field.rows = 3;
    }
});

/*****************************************************************************
 * container/window/window.js                                                *
 ****************************************************************************/

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

/*****************************************************************************
 * container/layout/gridlayout.js                                            *
 ****************************************************************************/

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


/**
 * Grid layout.
 *
 * Layout Options:
 *
 *     {
 *          verticalExpansion: <Boolean, default: true>,
 *          horizontalExpansion: <Boolean, default: true>,
 *          width: <Number, default: undefined>,
 *          height: <Number, default: undefined>,
 *          minWidth: <Number, default: undefined>,
 *          minHeight: <Number, default: undefined>,
 *          maxWidth: <Number, default: undefined>,
 *          maxHeight: <Number, default: undefined>,
 *          horizontalAlign: <String (left, center, right), default: center>,
 *          gridX: <Number, default: 0>,
 *          gridY: <Number, default: 0>,
 *          gridWidth: <Number, default: 1>,
 *          gridHeight: <Number, default: 1>,
 *     }
 *
 * @class GridLayout
 * @constructor
 * @extends photonui.Layout
 */
photonui.GridLayout = photonui.Layout.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._updateProperties(["verticalSpacing"]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The vertical spacing between children widgets.
     *
     * @property verticalSpacing
     * @type Number
     * @default 5
     */
    _verticalSpacing: 5,

    getVerticalSpacing: function() {
        return this._verticalSpacing;
    },

    setVerticalSpacing: function(verticalSpacing) {
        this._verticalSpacing = verticalSpacing;
        this.__html.grid.style.borderSpacing = this.verticalSpacing + "px " + this.horizontalSpacing + "px";
    },

    /**
     * The horizontal spacing between children widgets.
     *
     * @property horizontalSpacing
     * @type Number
     * @default 5
     */
    _horizontalSpacing: 5,

    getHorizontalSpacing: function() {
        return this._horizontalSpacing;
    },

    setHorizontalSpacing: function(horizontalSpacing) {
        this._horizontalSpacing = horizontalSpacing;
        this.__html.grid.style.borderSpacing = this.verticalSpacing + "px " + this.horizontalSpacing + "px";
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.outerbox;
    },

    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.outerbox = document.createElement("div");
        this.__html.outerbox.className = "photonui-widget photonui-gridlayout";

        this.__html.grid = document.createElement("table");
        this.__html.outerbox.appendChild(this.__html.grid);

        this.__html.gridBody = document.createElement("tbody");
        this.__html.grid.appendChild(this.__html.gridBody);
    },

    /**
     * Update the layout.
     *
     * @method _updateLayout
     * @private
     */
    _updateLayout: function() {
        // Calculate geometry
        var ox = Infinity;  // Offset X
        var oy = Infinity;  // Offset Y
        var nc = 0;  // Number of columns
        var nr = 0;  // Number of rows
        var children = this.children;
        for (var i=0 ; i<children.length ; i++) {
            children[i].layoutOptions.gridX = (children[i].layoutOptions.gridX != undefined) ? children[i].layoutOptions.gridX : 0;
            children[i].layoutOptions.gridY = (children[i].layoutOptions.gridY != undefined) ? children[i].layoutOptions.gridY : 0;
            children[i].layoutOptions.gridWidth = Math.max(children[i].layoutOptions.gridWidth, 1) || 1;
            children[i].layoutOptions.gridHeight = Math.max(children[i].layoutOptions.gridHeight, 1) || 1;
            ox = Math.min(ox, children[i].layoutOptions.gridX);
            oy = Math.min(oy, children[i].layoutOptions.gridY);
            nc = Math.max(nc, children[i].layoutOptions.gridX + children[i].layoutOptions.gridWidth);
            nr = Math.max(nr, children[i].layoutOptions.gridY + children[i].layoutOptions.gridHeight);
        }
        nc -= ox;
        nr -= oy;

        // Find and fix conflicts
        // TODO

        // Build
        photonui.Helpers.cleanNode(this.__html.gridBody);
        var map = [];
        for (var y=0 ; y<nr ; y++) {
            var row = [];
            for (var x=0 ; x<nc ; x++) {
                row.push(false);
            }
            map.push(row);
        }
        for (var y=0 ; y<nr ; y++) {
            var e_tr = document.createElement("tr");
            this.__html.gridBody.appendChild(e_tr);
            for (var x=0 ; x<nc ; x++) {
                if (map[y][x]) {
                    continue;
                }
                var widget = false;
                var e_td = document.createElement("td");
                e_td.className = "photonui-container photonui-gridlayout-cell";
                e_tr.appendChild(e_td);
                for (var i=0 ; i<children.length ; i++) {
                    if (children[i].layoutOptions.gridX - ox == x && children[i].layoutOptions.gridY - oy == y) {
                        widget = true;
                        var cs = children[i].layoutOptions.gridWidth;
                        var rs = children[i].layoutOptions.gridHeight;
                        e_td.colSpan = cs;
                        e_td.rowSpan = rs;
                        e_td.appendChild(children[i].html);

                        if (children[i].layoutOptions.horizontalExpansion == undefined
                        ||  children[i].layoutOptions.horizontalExpansion) {
                            e_td.className += " photonui-container-expand-child-horizontal"
                        }
                        if (children[i].layoutOptions.verticalExpansion == undefined
                        ||  children[i].layoutOptions.verticalExpansion) {
                            e_td.className += " photonui-container-expand-child-vertical"
                        }

                        // Layout Options: width
                        if (children[i].layoutOptions.width != undefined) {
                            e_td.style.height = children[i].layoutOptions.width + "px";
                        }
                        // Layout Options: height
                        if (children[i].layoutOptions.height != undefined) {
                            e_td.style.height = children[i].layoutOptions.height + "px";
                        }
                        // Layout Options: minWidth
                        if (children[i].layoutOptions.minWidth != undefined) {
                            e_td.style.minWidth = children[i].layoutOptions.minWidth + "px";
                        }
                        // Layout Options: minHeight
                        if (children[i].layoutOptions.minHeight != undefined) {
                            e_td.style.minHeight = children[i].layoutOptions.minHeight + "px";
                        }
                        // Layout Options: maxWidth
                        if (children[i].layoutOptions.maxWidth != undefined) {
                            e_td.style.maxWidth = children[i].layoutOptions.maxWidth + "px";
                        }
                        // Layout Options: maxHeight
                        if (children[i].layoutOptions.maxHeight != undefined) {
                            e_td.style.maxHeight = children[i].layoutOptions.maxHeight + "px";
                        }
                        // Layout Options: horizontalAlign
                        if (children[i].layoutOptions.horizontalAlign != undefined) {
                            e_td.style.textAlign = children[i].layoutOptions.horizontalAlign;
                        }

                        if (cs > 1 || rs > 1) {
                            for (var r=y ; r<y+rs ; r++) {
                                for (var c=x ; c<x+cs ; c++) {
                                    map[r][c] = true;
                                }
                            }
                        }
                        break;
                    }
                }
                if (!widget) {
                    e_td.innerHTML = "&nbsp;";
                }
            }
        }

        // Hack for Gecko and Trident
        //var cells = document.querySelectorAll("#" + this.name + " td");
        //var heights = [];
        //var padding = 0;
        //for (var i=0 ; i<cells.length ; i++) {
            //if (cells[i].childNodes.length == 1 && cells[i].childNodes[0] instanceof HTMLElement) {
                //padding = parseInt(getComputedStyle(cells[i].childNodes[0]).paddingTop);
                //padding += parseInt(getComputedStyle(cells[i].childNodes[0]).paddingBottom);
            //}
            //heights[i] = (cells[i].offsetHeight - padding) + "px";
        //}
        //for (var i=0 ; i<cells.length ; i++) {
            //cells[i].style.height = heights[i];
        //}
    }
});

/*****************************************************************************
 * input/slider/slider.js                                                    *
 ****************************************************************************/


/*****************************************************************************
 * container/window/popupwindow.js                                           *
 ****************************************************************************/

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


/**
 * Popup Window.
 *
 * @class PopupWindow
 * @constructor
 * @extends photonui.BaseWindow
 */
photonui.PopupWindow = photonui.BaseWindow.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._bindEvent("document-mousedown-close", document, "mousedown", this.hide.bind(this));
        this._bindEvent("popup-click-close", this.html, "click", this.hide.bind(this));
        this._bindEvent("mousedown-preventclose", this.html, "mousedown", function(event) {
            event.stopPropagation();
        }.bind(this));
    },


    /**
     * HTML Element that contain the child widget HTML.
     *
     * @property containerNode
     * @type HTMLElement
     * @readOnly
     */
    getContainerNode: function() {
        return this.__html.inner;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Public methods ======


    /**
     * Pop the window at the given position.
     *
     * @method popupXY
     * @param {Number} x
     * @param {Number} y
     */
    popupXY: function(x, y) {
        this.setPosition(-1337, -1337);
        this.show();

        var bw = document.getElementsByTagName("body")[0].offsetWidth;
        var bh = document.getElementsByTagName("body")[0].offsetHeight;
        var pw = this.offsetWidth;
        var ph = this.offsetHeight;

        if (x + pw > bw) {
            x = bw - pw;
        }

        if (y + ph > bh) {
            y -= ph;
        }

        if (x < 0) {
            x = 0;
        }
        if (y < 0) {
            y = 0;
        }

        this.setPosition(x, y);
    },

    /**
     * Pop the window at the best position for the given widget.
     *
     * @method popupWidget
     * @param {photonui.Widget} widget
     */
    popupWidget: function(widget) {
        this.setPosition(-1337, -1337);
        this.show();

        var e_body = document.getElementsByTagName("body")[0];
        var x = 0;
        var y = 0;
        var wpos = widget.absolutePosition;
        var wh = widget.offsetHeight;
        var ww = widget.offsetWidth;
        var pw = this.offsetWidth;
        var ph = this.offsetHeight;

        if (wpos.x + pw < e_body.offsetWidth) {
            x = wpos.x;
        }
        else if (wpos.x + ww < e_body.offsetWidth) {
            x = wpos.x + ww - pw;
        }
        else {
            x = e_body.offsetWidth - pw;
        }

        if (wpos.y + wh + ph < e_body.offsetHeight) {
            y = wpos.y + wh + 1;
        }
        else if (wpos.y - ph >= 0) {
            y = wpos.y - ph - 1;
        }

        if (x < 0) { x = 0 };
        if (y < 0) { y = 0 };

        this.setPosition(x, y);
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
        this.__html["window"].className += " photonui-popupwindow";

        this.__html.inner = document.createElement("div");
        this.__html["window"].appendChild(this.__html.inner);
    }
});

/*****************************************************************************
 * container/layout/boxlayout.js                                             *
 ****************************************************************************/

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


/**
 * Vertical and horizontal box layout.
 *
 * Layout Options:
 *
 *     {
 *          verticalExpansion: <Boolean, default: true>,
 *          horizontalExpansion: <Boolean, default: true>,
 *          width: <Number, default: undefined>,
 *          height: <Number, default: undefined>,
 *          minWidth: <Number, default: undefined>,
 *          minHeight: <Number, default: undefined>,
 *          maxWidth: <Number, default: undefined>,
 *          maxHeight: <Number, default: undefined>,
 *          horizontalAlign: <String (left, center, right), default: undefined>
 *     }
 *
 * @class BoxLayout
 * @constructor
 * @extends photonui.GridLayout
 */
photonui.BoxLayout = photonui.GridLayout.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._updateProperties(["orientation"]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The layout orientation ("vertical" or "horizontal").
     *
     * @property orientation
     * @type String
     * @default "vertical"
     */
    _orientation: "vertical",

    getOrientation: function() {
        return this._orientation;
    },

    setOrientation: function(orientation) {
        if (orientation != "vertical" && orientation != "horizontal") {
            throw "Error: The orientation should be \"vertical\" or \"horizontal\".";
            return;
        }
        this._orientation = orientation;
        this.removeClass("photonui-layout-orientation-vertical");
        this.removeClass("photonui-layout-orientation-horizontal");
        this.addClass("photonui-layout-orientation-" + this.orientation);
        this._updateLayout();
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.$super();
        this.__html.outerbox.className = "photonui-widget photonui-boxlayout";
    },

    /**
     * Update the layout.
     *
     * @method _updateLayout
     * @private
     */
    _updateLayout: function() {
        photonui.Helpers.cleanNode(this.__html.gridBody);

        var e_tr = null;
        if (this.getOrientation() == "horizontal") {
            e_tr = document.createElement("tr");
            this.__html.gridBody.appendChild(e_tr);
        }

        var children = this.children;

        for (var i=0 ; i<children.length ; i++) {
            if (this.getOrientation() == "vertical") {
                e_tr = document.createElement("tr");
                this.__html.gridBody.appendChild(e_tr);
            }

            var e_td = document.createElement("td");
            e_td.className = "photonui-container photonui-boxlayout-cell";
            e_tr.appendChild(e_td);

            // Layout Options: Expansion
            if (children[i].layoutOptions.horizontalExpansion == undefined
            ||  children[i].layoutOptions.horizontalExpansion) {
                e_td.className += " photonui-container-expand-child-horizontal";
            }
            if (children[i].layoutOptions.verticalExpansion == undefined
            ||  children[i].layoutOptions.verticalExpansion) {
                e_td.className += " photonui-container-expand-child-vertical";
            }

            // Layout Options: width
            if (children[i].layoutOptions.width != undefined) {
                e_td.style.height = children[i].layoutOptions.width + "px";
            }
            // Layout Options: height
            if (children[i].layoutOptions.height != undefined) {
                e_td.style.height = children[i].layoutOptions.height + "px";
            }
            // Layout Options: minWidth
            if (children[i].layoutOptions.minWidth != undefined) {
                e_td.style.minWidth = this.childrenWidgets[i].layoutOptions.minWidth + "px";
            }
            // Layout Options: minHeight
            if (children[i].layoutOptions.minHeight != undefined) {
                e_td.style.minHeight = this.childrenWidgets[i].layoutOptions.minHeight + "px";
            }
            // Layout Options: maxWidth
            if (children[i].layoutOptions.maxWidth != undefined) {
                e_td.style.maxWidth = this.childrenWidgets[i].layoutOptions.maxWidth + "px";
            }
            // Layout Options: maxHeight
            if (children[i].layoutOptions.maxHeight != undefined) {
                e_td.style.maxHeight = this.childrenWidgets[i].layoutOptions.maxHeight + "px";
            }
            // Layout Options: horizontalAlign
            if (children[i].layoutOptions.horizontalAlign != undefined) {
                e_td.style.textAlign = this.childrenWidgets[i].layoutOptions.horizontalAlign; console.log("hhhh");
            }

            e_td.appendChild(children[i].html);
        }

        // Hack for Gecko and Trident
        //var cells = document.querySelectorAll("#" + this.name + " td");
        //var heights = [];
        //var padding = 0;
        //for (var i=0 ; i<cells.length ; i++) {
            //if (cells[i].childNodes.length == 1 && cells[i].childNodes[0] instanceof HTMLElement) {
                //padding = parseInt(getComputedStyle(cells[i].childNodes[0]).paddingTop);
                //padding += parseInt(getComputedStyle(cells[i].childNodes[0]).paddingBottom);
            //}
            //heights[i] = (cells[i].offsetHeight - padding) + "px";
        //}
        //for (var i=0 ; i<cells.length ; i++) {
            //cells[i].style.height = heights[i];
        //}
    }
});

/*****************************************************************************
 * input/button/button.js                                                    *
 ****************************************************************************/

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
 * Button.
 *
 * wEvents:
 *
 *   * click:
 *     - description: called when the button was clicked.
 *     - callback:    function(widget, event)
 *
 * @class Button
 * @constructor
 * @extends photonui.Widget
 */
photonui.Button = photonui.Widget.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);

        // wEvents
        this._registerWEvents(["click"]);

        // Bind js events
        this._bindEvent("click", this.__html.button, "click", this.__onButtonClicked.bind(this));

        // Update properties
        this._updateProperties(["text", "leftIconName", "rightIconName"]);
        this._update();
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The button text.
     *
     * @property text
     * @type String
     * @default "Button"
     */
    _text: "Button",

    getText: function() {
       return this._text;
    },

    setText: function(text) {
        this._text = text;
        this.__html.text.innerHTML = photonui.Helpers.escapeHtml(text);
    },

    /**
     * Define if the button text is displayed or hidden.
     *
     * @property textVisible
     * @type Boolean
     * @default true
     */
    _textVisible: true,

    isTextVisible: function() {
        return this._textVisible;
    },

    setTextVisible: function(textVisible) {
        this._textVisible = textVisible;
        this._update();
    },

    /**
     * Left icon widget name.
     *
     * @property leftIconName
     * @type String
     * @default: null
     */
    _leftIconName: null,

    getLeftIconName: function() {
        return this._leftIconName;
    },

    setLeftIconName: function(leftIconName) {
        this._leftIconName = leftIconName;
        photonui.Helpers.cleanNode(this.__html.leftIcon);
        if (this._leftIconName) {
            this.__html.leftIcon.appendChild(this.leftIcon.html);
        }
    },

    /**
     * Left icon widget.
     *
     * @property leftIcon
     * @type photonui.BaseIcon
     * @default: null
     */
    getLeftIcon: function() {
        return photonui.getWidget(this._leftIconName);
    },

    setLeftIcon: function(leftIcon) {
        if (leftIcon instanceof photonui.BaseIcon) {
            this.leftIconName = leftIcon.name;
            return;
        }
        this.leftIconName = null;
    },

    /**
     * Define if the left icon is displayed or hidden.
     *
     * @property leftIconVisible
     * @type Boolean
     * @default true
     */
    _leftIconVisible: true,

    isLeftIconVisible: function() {
        return this._leftIconVisible;
    },

    setLeftIconVisible: function(leftIconVisible) {
        this._leftIconVisible = leftIconVisible;
        this._update();
    },

    /**
     * Right icon widget name.
     *
     * @property rightIconName
     * @type String
     * @default: null
     */
    _rightIconName: null,

    getRightIconName: function() {
        return this._rightIconName;
    },

    setRightIconName: function(rightIconName) {
        this._rightIconName = rightIconName;
        photonui.Helpers.cleanNode(this.__html.rightIcon);
        if (this._rightIconName) {
            this.__html.rightIcon.appendChild(this.rightIcon.html);
        }
    },

    /**
     * Right icon widget.
     *
     * @property rightIcon
     * @type photonui.BaseIcon
     * @default: null
     */
    getRightIcon: function() {
        return photonui.getWidget(this._rightIconName);
    },

    setRightIcon: function(rightIcon) {
        if (rightIcon instanceof photonui.BaseIcon) {
            this.rightIconName = rightIcon.name;
            return;
        }
        this.rightIconName = null;
    },

    /**
     * Define if the right icon is displayed or hidden.
     *
     * @property rightIconVisible
     * @type Boolean
     * @default true
     */
    _rightIconVisible: true,

    isRightIconVisible: function() {
        return this._rightIconVisible;
    },

    setRightIconVisible: function(rightIconVisible) {
        this._rightIconVisible = rightIconVisible;
        this._update();
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.button;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Update the button content
     *
     * @method _update
     * @private
     */
    _update: function() {
        if (this.__html.leftIcon.parentNode == this.__html.button) {
            this.__html.button.removeChild(this.__html.leftIcon);
        }
        if (this.__html.text.parentNode == this.__html.button) {
            this.__html.button.removeChild(this.__html.text);
        }
        if (this.__html.rightIcon.parentNode == this.__html.button) {
            this.__html.button.removeChild(this.__html.rightIcon);
        }

        if (this.leftIconName && this.leftIconVisible) {
            this.__html.button.appendChild(this.__html.leftIcon);
        }

        if (this.text && this.textVisible) {
            this.__html.button.appendChild(this.__html.text);
        }

        if (this.rightIconName && this.rightIconVisible) {
            this.__html.button.appendChild(this.__html.rightIcon);
        }
    },

    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.button = document.createElement("button");
        this.__html.button.className = "photonui-widget photonui-button";

        this.__html.leftIcon = document.createElement("span");
        this.__html.leftIcon.className = "photonui-button-icon";
        this.__html.button.appendChild(this.__html.leftIcon);

        this.__html.text = document.createElement("span");
        this.__html.text.className = "photonui-button-text";
        this.__html.button.appendChild(this.__html.text);

        this.__html.rightIcon = document.createElement("span");
        this.__html.rightIcon.className = "photonui-button-icon";
        this.__html.button.appendChild(this.__html.rightIcon);
    },


    //////////////////////////////////////////
    // Internal Events Callbacks            //
    //////////////////////////////////////////


    /**
     * Called when the button is clicked.
     *
     * @method __onButtonClicked
     * @private
     * @param event
     */
    __onButtonClicked: function(event) {
        this._callCallbacks("click", [event]);
    }
});

/*****************************************************************************
 * container/menu/menu.js                                                    *
 ****************************************************************************/

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


/**
 * Menu.
 *
 * @class Menu
 * @constructor
 * @extends photonui.Layout
 */
photonui.Menu = photonui.Layout.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._updateProperties(["iconVisible"]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * Define if icon on menu items are visible.
     *
     * @property iconVisible
     * @type Boolean
     * @default: true
     */
    _iconVisible: true,

    isIconVisible: function() {
        return this._iconVisible;
    },

    setIconVisible: function(iconVisible) {
        this._iconVisible = iconVisible;
        if (iconVisible) {
            this.removeClass("photonui-menu-noicon");
        }
        else {
            this.addClass("photonui-menu-noicon");
        }
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.outer;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.outer = document.createElement("div");
        this.__html.outer.className = "photonui-widget photonui-menu photonui-menu-style-default";
    },

    /**
     * Update the layout.
     *
     * @method _updateLayout
     * @private
     */
    _updateLayout: function() {
        // Detache the outer element from the document tree
        //TODO

        // Clean
        photonui.Helpers.cleanNode(this.__html.outer);

        // Append children
        var children = this.children;
        for (var i=0 ; i<children.length ; i++) {
            this.__html.outer.appendChild(children[i].html);
        }

        // Attache the outer element into the document tree
        // TODO
    }
});

/*****************************************************************************
 * container/menu/menuitem.js                                                *
 ****************************************************************************/

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


/**
 * Menu item.
 *
 * @class MenuItem
 * @constructor
 * @extends photonui.Container
 */
photonui.MenuItem = photonui.Container.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._registerWEvents(["click"]);
        this._updateProperties(["text", "icon", "active"]);

        this._bindEvent("click", this.__html.outer, "click", function(event) {
            this._callCallbacks("click", [event]);
        }.bind(this));
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The item text.
     *
     * @property text
     * @type String
     * @default "Menu Item"
     */
    _text: "Menu Item",

    getText: function() {
        return this._text;
    },

    setText: function(text) {
        this._text = text;
        this.__html.text.innerHTML = photonui.Helpers.escapeHtml(text);
    },

    /**
     * Right icon widget name.
     *
     * @property iconName
     * @type String
     * @default: null
     */
    _iconName: null,

    getIconName: function() {
        return this._iconName;
    },

    setIconName: function(iconName) {
        this._iconName = iconName;
        photonui.Helpers.cleanNode(this.__html.icon);
        if (this._iconName) {
            this.__html.icon.appendChild(this.icon.html);
        }
    },

    /**
     * Right icon widget.
     *
     * @property icon
     * @type photonui.BaseIcon
     * @default: null
     */
    getIcon: function() {
        return photonui.getWidget(this._iconName);
    },

    setIcon: function(icon) {
        if (icon instanceof photonui.BaseIcon) {
            this.iconName = icon.name;
            return;
        }
        this.iconName = null;
    },

    /**
     * Determine if the item is active (highlighted).
     *
     * @property active
     * @type Boolean
     * @default false
     */
    _active: false,

    getActive: function() {
        return this._active;
    },

    setActive: function(active) {
        this._active = active;

        if (active) {
            this.addClass("photonui-menuitem-active");
        }
        else {
            this.removeClass("photonui-menuitem-active");
        }
    },

    /**
     * Html outer element of the widget (if any).
     *
     * @property html
     * @type HTMLElement
     * @default null
     * @readOnly
     */
    getHtml: function() {
        return this.__html.outer;
    },

    /**
     * HTML Element that contain the child widget HTML.
     *
     * @property containerNode
     * @type HTMLElement
     * @readOnly
     */
    getContainerNode: function() {
        return this.__html.widget;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.__html.outer = document.createElement("div");
        this.__html.outer.className = "photonui-widget photonui-menuitem";

        this.__html.icon = document.createElement("span");
        this.__html.icon.className = "photonui-menuitem-icon";
        this.__html.outer.appendChild(this.__html.icon);

        this.__html.text = document.createElement("span");
        this.__html.text.className = "photonui-menuitem-text";
        this.__html.outer.appendChild(this.__html.text);

        this.__html.widget = document.createElement("span");
        this.__html.widget.className = "photonui-menuitem-widget";
        this.__html.outer.appendChild(this.__html.widget);
    },


    //////////////////////////////////////////
    // Internal Events Callbacks            //
    //////////////////////////////////////////


    // TODO Internal events callback here
});

/*****************************************************************************
 * container/menu/submenuitem.js                                             *
 ****************************************************************************/

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


/**
 * Submenu Menu item (fold/unfold a submenu).
 *
 * @class SubMenuItem
 * @constructor
 * @extends photonui.MenuItem
 */
photonui.SubMenuItem = photonui.MenuItem.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this.addClass("photonui-submenuitem");
        this.registerCallback("toggle-folding", "click", this.__onItemClicked, this);
        this._updateProperties(["menuName"]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The submenu widget name.
     *
     * @property menuName
     * @type String
     * @default null
     */
    _menuName: null,

    getMenuName: function() {
        return this._menuName;
    },

    setMenuName: function(menuName) {
        if (this.menuName) {
            this.menu.removeCallback("fold");
            this.menu.removeCallback("unfold");
        }
        this._menuName = menuName;
        if (this.menuName) {
            this.menu.registerCallback("fold", "hide", this.__onToggleFold, this);
            this.menu.registerCallback("unfold", "show", this.__onToggleFold, this);
            this.active = this.menu.visible;
        }
    },

    /**
     * The submenu widget.
     *
     * @property menu
     * @type photonui.Menu
     * @default null
     */
    getMenu: function() {
        return photonui.getWidget(this.menuName);
    },

    setMenu: function(menu) {
        if (menu instanceof photonui.Menu) {
            this.menuName = menu.name;
        }
        else {
            this.menuName = null;
        }
    },


    //////////////////////////////////////////
    // Internal Events Callbacks            //
    //////////////////////////////////////////


    /**
     * @method __onToggleFold
     * @private
     */
    __onToggleFold: function(widget) {
        this.active = widget.visible;
    },

    /**
     * @method __onItemClicked
     * @private
     */
    __onItemClicked: function(widget) {
        this.menu.visible = !this.menu.visible;
    }
});

/*****************************************************************************
 * composite/popupmenu.js                                                    *
 ****************************************************************************/

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
 * @submodule Composite
 * @namespace photonui
 */


var photonui = photonui || {};


/**
 * Popup Menu.
 *
 * @class PopupMenu
 * @constructor
 * @extends photonui.PopupWindow
 * @uses photonui.Layout
 * @uses photonui.Menu
 */
photonui.PopupMenu = photonui.PopupWindow.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._childrenNames = [];  // new instance
    },

    // Mixin
    __include__: [{
        getChildrenNames: photonui.Menu.prototype.getChildrenNames,
        setChildrenNames: photonui.Menu.prototype.setChildrenNames,
        getChildren:      photonui.Menu.prototype.getChildren,
        setChildren:      photonui.Menu.prototype.setChildren,
        getChildName:     photonui.Menu.prototype.getChildName,
        setChildName:     photonui.Menu.prototype.setChildName,
        getChild:         photonui.Menu.prototype.getChild,
        setChild:         photonui.Menu.prototype.setChild,
        isIconVisible:    photonui.Menu.prototype.isIconVisible,
        setIconVisible:   photonui.Menu.prototype.setIconVisible,
        addChild:         photonui.Menu.prototype.addChild,
        removeChild:      photonui.Menu.prototype.removeChild,
        destroy:          photonui.Menu.prototype.destroy,
        _updateLayout:    photonui.Menu.prototype._updateLayout
    }],


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.$super();
        photonui.Menu.prototype._buildHtml.call(this);

        this.__html.inner.appendChild(this.__html.outer);
        this.__html["window"].className += " photonui-popupmenu";
        this.__html.outer.className = "photonui-widget photonui-menu photonui-menu-style-popupmenu";
    }
});

/*****************************************************************************
 * input/button/colorbutton.js                                               *
 ****************************************************************************/

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
 * Color Button.
 *
 * wEvents:
 *
 *   * value-changed:
 *      - description: the selected color changed.
 *      - callback:    function(widget, color)
 *
 * @class ColorButton
 * @constructor
 * @extends photonui.Widget
 */
photonui.ColorButton = photonui.Button.$extend({

    // Constructor
    __init__: function(params) {
        this.$super(params);
        this._registerWEvents(["value-changed"]);
        this.popup = new photonui.PopupWindow();
        this.palette = new photonui.ColorPalette();
        this.palette.registerCallback("value-changed", "value-changed", this.__onPaletteValueChanged, this);
        this.popup.child = this.palette;
        this._updateProperties(["value"]);
    },


    //////////////////////////////////////////
    // Properties and Accessors             //
    //////////////////////////////////////////


    // ====== Public properties ======


    /**
     * The value (color).
     *
     * @property value
     * @type String
     * @default: "#FF0000"
     */
    _value: "#FF0000",

    getValue: function() {
        return this._value;
    },

    setValue: function(value) {
        this._value = value;
        this.__html.color.style.backgroundColor = this._value;
    },


    //////////////////////////////////////////
    // Methods                              //
    //////////////////////////////////////////


    // ====== Private methods ======


    /**
     * Update the button content
     *
     * @method _update
     * @private
     */
    _update: function() {
        // Do nothing
    },

    /**
     * Build the widget HTML.
     *
     * @method _buildHtml
     * @private
     */
    _buildHtml: function() {
        this.$super();
        this.__html.button = document.createElement("button");
        this.__html.button.className = "photonui-widget photonui-button";

        this.__html.button.className += " photonui-colorbutton";

        this.__html.color = document.createElement("span");
        this.__html.button.appendChild(this.__html.color);
    },


    //////////////////////////////////////////
    // Internal Events Callbacks            //
    //////////////////////////////////////////


    /**
     * Called when the button is clicked.
     *
     * @method __onButtonClicked
     * @private
     * @param event
     */
    __onButtonClicked: function(event) {
        this._callCallbacks("click", [event]);
        this.popup.popupWidget(this);
    },

    /**
     * Called when the palette color change.
     *
     * @method __onPaletteValueChanged
     * @private
     * @param {photonui.Widget} widget
     * @param {String} color
     */
    __onPaletteValueChanged: function(widget, color) {
        this.value = color;
        this._callCallbacks("value-changed", [color]);
    }
});

return photonui;
})(window);
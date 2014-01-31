var hud = (function( f ){
  return f({}, ({}).undefined)
}(function( hud, undefined ){

  var eventNames = [
    "click", "dblclick", "mousedown", "mouseup", "mouseover", "mousemove", "mouseout",
    "contextmenu", "selectstart",
    "drag", "dragstart", "dragenter", "dragover", "dragleave", "dragend", "drop",
    "keydown", "keypress", "keyup",
    "load", "unload", "abort", "error", "resize", "scroll",
    "select", "change", "submit", "reset", "focus", "blur", "beforeeditfocus",
    "focusin", "focusout", "DOMActivate",
    "DOMSubtreeModified", "DOMNodeInserted", "DOMNodeRemoved", "DOMNodeRemovedFromDocument",
    "DOMNodeInsertedIntoDocument", "DOMAttrModified", "DOMCharacterDataModified",
    "touchstart", "touchend", "touchmove", "touchenter", "touchleave", "touchcancel",
    "cut", "copy", "paste", "beforecut", "beforecopy", "beforepaste",
    "afterupdate", "beforeupdate", "cellchange", "dataavailable", "datasetchanged", "datasetcomplete", "errorupdate",
    "rowenter", "rowexit", "rowsdelete", "rowinserted",
    "beforeprint", "afterprint", "propertychange", "filterchange", "readystatechange", "losecapture"
  ]

  var customEvents = {}

  var roles = {}
    , widgets = {}
    , templates = {}

  var FILTER_PICK = 1
    , FILTER_SKIP = 2
    , FILTER_IGNORE = 3
    , FILTER_STOP = 4

  /**
   * Iterates over every child node, and according to the filter function's
   * return value, it picks, skips, or ignores a node.
   * Picked nodes will be part of the return array.
   * skipped nodes not, but their child nodes will still be checked.
   * Ignored nodes won't have their child nodes iterated recursively.
   * The root element will not be checked with the filter, only its child nodes.
   * */
  function filterElements( element, filter, deep ){
    var children = element.children || element
      , i = -1
      , l = children.length
      , ret = []
      , stack = []
    if ( !l ) return ret
    while ( ++i < l ) {
      switch ( filter(children[i]) ) {
        case FILTER_PICK:
          ret.push(children[i])
          if ( deep && i<l && children[i].children.length ) {
            stack.push([children, i, l])
            children = children[i].children
            i = -1
            l = children.length
          }
          break
        case FILTER_SKIP:
          if ( deep && i<l && children[i].children.length ) {
            stack.push([children, i, l])
            children = children[i].children
            i = -1
            l = children.length
          }
          break
        case FILTER_IGNORE:
          break
        case FILTER_STOP:
          return ret
      }
      if ( stack.length && i+1>=l ) {
        children = stack.pop()
        i = children[1]
        l = children[2]
        children = children[0]
      }
    }
    return ret
  }

  function each( arr, f ){
    for ( var i = -1, l = arr.length; ++i < l; ) {
      if ( f(arr[i], i, arr) === false ) return
    }
  }

  function extend( obj, extension ){
    for( var prop in extension ){
      obj[prop] = extension[prop]
    }
    return obj
  }
  function extendCallback( obj, extension, callback ){
    for( var prop in extension ){
      obj[prop] = extension[prop]
      callback(prop, obj[prop], extension[prop])
    }
    return obj
  }

  function merge( obj, ext ){
    return extend(extend({}, obj), ext)
  }

  function mixin( base, args ){
    args = [].slice.call(arguments)
    base = args.shift()
    base.prototype = base.prototype || {}
    each(args, function( arg ){
      extend(base.prototype, arg.prototype||arg)
    })
  }

  function defineConstructor( def, mixin, isWidget ){
    function renderComponent(  ){
      return spawn(def, mixin, [].slice.call(arguments))
    }
    def.constructor = def.constructor || function(  ){}
    renderComponent.prototype = def.constructor.prototype = def = merge(mixin.prototype, def)
    renderComponent.prototype.constructor = def.constructor
    if ( isWidget ) {
      def.constructor.roles = {}
      renderComponent.defineRole = function( name, roleDef ){
        if( roleDef == undefined ) {
          roleDef = name
          name = roleDef.constructor.name.toLowerCase()
        }
        def.constructor.roles[name] = defineConstructor(roleDef, Role)
        return renderComponent
      }
    }
    return renderComponent
  }

  function spawn( def, base, args ){
    var obj = Object.create(def.prototype)
    base.apply(obj, args)
    def.prototype.constructor.apply(obj, args)
    return obj
  }

  function renderComponents( root ){
    filterElements(root, function( el ){
      var roleAttr = el.getAttribute("role")
      if( !roleAttr ) return FILTER_SKIP
      each(roleAttr.trim().split(/\s+/), function( r ){
        if( widgets[r] ) {
          spawn(widgets[r], Widget, [el])
        }
      })
      return FILTER_SKIP
    }, true)
  }

  function findComponents( rootEl, def, name, base, roleArgs ){
    var spawned = []
    if( def == undefined ) return null
    filterElements(rootEl, function( el ){
      var roleAttr = el.getAttribute("role")
      if ( roleAttr && !!~roleAttr.split(/\s+/).indexOf(name) ) {
        spawned.push(spawn(def, base, [el].concat(roleArgs)))
        return FILTER_IGNORE
      }
      return FILTER_SKIP
    }, true)
    return spawned
  }

  function findComponent( rootEl, def, name, base, roleArgs ){
    var spawned = null
    if( def == undefined ) return null
    filterElements(rootEl, function( el ){
      var roleAttr = el.getAttribute("role")
      if ( roleAttr && !!~roleAttr.split(/\s+/).indexOf(name) ) {
        spawned = spawn(def, base, [el].concat(roleArgs))
        return FILTER_STOP
      }
      return FILTER_SKIP
    }, true)
    return spawned
  }

  function EventData( data ){
    this.data = data
  }
  EventData.prototype = {
    cancelled: false,
    cancel: function(  ){
      this.cancelled = true
    }
  }

  function EventMachine(  ){
    this.listeners = {}
  }
  EventMachine.prototype = {
    listener: function( event, callback ){
      (this.listeners[event] = this.listeners[event] || []).push(callback)
    },
    unlisten: function( event, callback ){
      if( !this.listeners[event] ) return
      var i = this.listeners[event].indexOf(callback)
      if( !~i ) return
      this.listeners[event].splice(i, 1)
    },
    trigger: function( event, msg ){
      msg = new EventData(msg)
      var context = this
      each(this.listeners[event], function( listener ){
        listener.call(context, msg)
        return msg.cancelled
      })
    },
    triggerArgs: function( event, args ){
      var context = this
      each(this.listeners[event], function( listener ){
        return listener.apply(context, args)
      })
    }
  }

  function Component(  ){}
  Component.prototype = {
    findRoles: function( name, roleArgs ){
      roleArgs = [].slice.call(arguments)
      name = roleArgs.shift()
      var def = this.constructor.roles[name] || roles[name]
      return findComponents(this.element, def, name, Role, roleArgs)
    },
    findRole: function( name, roleArgs ){
      roleArgs = [].slice.call(arguments)
      name = roleArgs.shift()
      var def = this.constructor.roles[name] || roles[name]
      return findComponent(this.element, def, name, Role, roleArgs)
    },
    findWidgets: function( name, roleArgs ){
      roleArgs = [].slice.call(arguments)
      name = roleArgs.shift()
      return findComponents(this.element, widgets, name, Widget, roleArgs)
    },
    findWidget: function( name, roleArgs ){
      roleArgs = [].slice.call(arguments)
      name = roleArgs.shift()
      return findComponent(this.element, widgets, name, Widget, roleArgs)
    },
    renderComponents: function( ){
      renderComponents(this.element)
    }
  }

  function Widget( element ){
    this.element = element
  }
  mixin(Widget, Component, EventMachine, {})

  function Role( element ){
    this.element = element
    var events = applyEvents(this, element)
    this.removeListener = function( name, callback ){
      removeListener(events, name, callback)
    }
    this.addListener = function( event, callback ){
      applyEvent(this, this.element, events, event, callback)
    }
  }
  mixin(Widget, Component, EventMachine, {})

  function Template( element ){
    this.element = element
  }
  mixin(Widget, Component, EventMachine, {
    render: function(  ){
      return this.element.cloneNode(true)
    }
  })

  hud.defineWidget = function( name, def ){
    if( def == undefined ) {
      def = name
      name = def.constructor.name.toLowerCase()
    }
    return widgets[name] = defineConstructor(def, Widget, true)
  }
  hud.defineRole = function( name, def ){
    if( def == undefined ) {
      def = name
      name = def.constructor.name.toLowerCase()
    }
    return roles[name] = defineConstructor(def, Role)
  }
  hud.defineTemplate = function( name, def ){
    templates[name] = defineConstructor(def, Template)
  }

  hud.render = renderComponents

  function removeListener( events, event, listenerCallback ){
    each(events[event], function( listener ){
      if( listener[0] == listenerCallback ) {
        listener[1]()
        return false
      }
      return true
    })
  }
  function addListener( element, name, context, callback ){
    if ( customEvents[name] ) {
      return customEvents[name](element, callback)
    }
    else {
      var listener = function( e ){
        callback.apply(context, arguments)
      }
      element.addEventListener(name, listener, false)
      return function unlisten(  ){
        element.removeEventListener(name, listener, false)
      }
    }
  }
  function registerUnlistener( listneres, event, listenerCallback, unlisten ){
    (listneres[event] = listneres[event] || []).push([listenerCallback, unlisten])
  }
  function applyEvent( context, element, events, event, callback ){
    var unlisten = addListener(element, event, context, callback)
    registerUnlistener(events, event, callback, unlisten)
  }
  function applyEvents( context, element ){
    var events = {}
    each(eventNames, function( event ){
      var callback = context["on"+event]
      if ( typeof callback == "function" ) {
        applyEvent(context, element, events, event, callback)
      }
    })
    return events
  }

  hud.defineEvent = function( name, def ){
    eventNames.push(name)
    customEvents[name] = def
  }

  function Model( original ){
    this.original = original||{}
    this.data = {}
    this.changes = []
    this.undone = []
    extend(this.data, this.original)
  }
  mixin(Model, EventMachine, {
    changed: false,
    validators: null,

    set: function( params ){
      var model = this
      this.undone = []
      this.changes.push(extend({}, this.data))
      extendCallback(this.data, params, function( param, old, n ){
        model.triggerArgs("change:"+param, [old, n])
      })
      this.changed = true
      this.trigger("change", this.changes[this.changes.length-1])
      return this
    },
    get: function( params ){
      for( var param in params ){
        params[param] = this.data[param]
      }
      return params
    },
    has: function( params ){
      for( var param in params ){
        if( this.data[param] === undefined ) return false
      }
      return true
    },
    is: function( params ){
      for( var param in params ){
        if( this.data[param] !== params[param] ) return false
      }
      return true
    },
    remove: function( params ){
      for( var param in params ){
        delete params[param]
        this.trigger("remove:"+param, params[param])
      }
      return this
    },
    undo: function(  ){
      if( this.changes.length ) {
        this.undone.push(this.data = this.changes.pop())
      }
      this.trigger("undo")
      return this
    },
    redo: function(  ){
      if( this.undone.length ) {
        this.changes.push(this.data = this.undone.pop())
      }
      this.trigger("redo")
      return this
    },
    reset: function(  ){
      this.clear()
      extend(this.data, this.original)
      this.trigger("reset")
      return this
    },
    clear: function(  ){
      this.data = {}
      this.undone = []
      this.changes = []
      this.changed = false
      return this
    },
    clone: function(  ){
      return new this.constructor(extend({}, this.data))
    },
    validateField: function( name, validator ){
      switch( typeof validator ){
        case "string":
          return this.data[name] === validator
          break
        case "function":
          return validator(this.data[name])
          break
        default :
          return validator.test(this.data[name])
      }
    },
    setValidators: function( validators ){
      this.validators = validators
      return this
    },
    validate: function( validators ){
      validators = validators||this.validators
      if ( validators != undefined ) {
        for( var field in validators ){
          if( !this.validateField(field, validators[field]) ) return false
        }
      }
      return true
    },
    save: function(  ){
      this.changed = false
      this.changes = []
      this.trigger("save")
      return this
    },
    toJSON: function(  ){
      return this.data
    },
    toJSONString: function(  ){
      return JSON.stringify(this.data)
    }
  })

  hud.defineModel = function( def ){
    def.constructor.prototype = def
    def.constructor.prototype.constructor = def.constructor
    extend(def, Model.prototype)
    return function createModel(  ){
      var model = Object.create(def)
      Model.apply(model, arguments)
      def.constructor.apply(model, arguments)
      return model
    }
  }

  return hud
}))
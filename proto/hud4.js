var hud = !function ( f ){
  return f({})
}(function ( hud ){

  function each( arr, f, context ){
    for ( var i = -1, l = arr.length; ++i < l; ) {
      if ( f.call(context, arr[i], i, arr) === false ) return false
    }
    return true
  }

  function extend( obj, extension ){
    for ( var prop in extension ) {
      obj[prop] = extension[prop]
    }
    return obj
  }

  var FILTER_PICK = 1
    , FILTER_SKIP = 2
    , FILTER_IGNORE = 3
    , FILTER_STOP = 4

  hud.FILTER_PICK = FILTER_PICK
  hud.FILTER_SKIP = FILTER_SKIP
  hud.FILTER_IGNORE = FILTER_IGNORE
  hud.FILTER_STOP = FILTER_STOP

  /**
   * Iterates over every child node, and according to the filter function's
   * return value, it picks, skips, or ignores a node.
   * Picked nodes will be part of the return array.
   * skipped nodes not, but their child nodes will still be checked.
   * Ignored nodes won't have their child nodes iterated recursively.
   * The root element will not be checked with the filter, only its child nodes.
   * */
  hud.filter = function ( element, filter, deep, childTypes ){
    deep = deep == undefined ? true : deep
    var children = element[childTypes] || element
      , i = -1
      , l = children.length
      , ret = []
      , stack = []
    if ( !l ) return ret
    while ( ++i < l ) {
      switch ( filter(children[i]) ) {
        case FILTER_PICK:
          ret.push(children[i])
          if ( deep && i < l && children[i][childTypes].length ) {
            stack.push([children, i, l])
            children = children[i][childTypes]
            i = -1
            l = children.length
          }
          break
        case FILTER_SKIP:
          if ( deep && i < l && children[i][childTypes].length ) {
            stack.push([children, i, l])
            children = children[i][childTypes]
            i = -1
            l = children.length
          }
          break
        case FILTER_IGNORE:
          break
        case FILTER_STOP:
          return ret
      }
      while ( stack.length && i + 1 >= l ) {
        children = stack.pop()
        i = children[1]
        l = children[2]
        children = children[0]
      }
    }
    return ret
  }

  hud.filterElements = function( root, filter, deep ){
    return hud.filter(root, filter, deep, "children")
  }

  hud.filterChildNodes = function ( root, filter, deep ){
    return hud.filter(root, filter, deep, "childNode")
  }

  // ====================== ROLES ======================

  function Dataset( element ){
    this.element = element
  }
  Dataset.prototype = {
    get: function( prop ){
      if( typeof prop == "string" ){
        return this.element.getAttribute("data-"+prop)
      }
      else {
        var props = {}
        for( var name in prop ){
          props[name] = this.element.getAttribute("data-"+name)
        }
        return props
      }
    },
    set: function( prop, val ){
      if( val != undefined && typeof prop == "string" ){
        this.element.setAttribute("data-"+prop, val)
      }
      else {
        for( var name in prop ){
          this.element.setAttribute("data-"+name, prop[name])
        }
      }
    },
    remove: function( prop ){
      if( typeof prop == "string" ){
        this.element.removeAttribute("data-"+prop)
      }
      else {
        for( var name in prop ){
          this.element.removeAttribute("data-"+name)
        }
      }
    }
  }

  hud.Role = function( element, def, init ){
    this.element = element
    this.events = {}
    this.channels = {}
    this.dataset = new Dataset(element)
    if ( def ) def.call(this, element, init || {})
    if ( typeof init == "function" ) init.call(this, element)
  }
  hud.Role.prototype = {
    filter: function( filter, deep ){
      return hud.filter(this.element, filter, deep)
    },
    find: function( name, deep ){
      return hud.find(this.element, name, deep)
    },
    findSub: function( name, deep ){
      return hud.findSub(this.element, name, deep)
    },
    findAll: function( name, deep ){
      return hud.findAll(this.element, name, deep)
    },
    findAllSub: function( name, deep ){
      return hud.findAllSub(this.element, name, deep)
    },

    listen: function ( channel, listener ){
      if ( this.channels )
        (this.channels[channel] || (this.channels[channel] = [])).push(listener)
      return this
    },
    unlisten: function ( channel, listener ){
      if ( this.channels == undefined ) return this
      channel = this.channels[channel]
      if ( !channel ) return this
      var i = this.channels[channel].indexOf(listener)
      if ( !!~i ) channel.splice(i, 1)
      return this
    },
    broadcast: function ( channel, message ){
      if ( this.channels == undefined ) return this
      channel = this.channels[channel]
      if ( !channel ) return this
      message = [].slice.call(arguments, 1)
      each(channel, function ( listener ){
        listener.apply(this, message)
      }, this)
      return this
    },

    on: function ( event, listener, capture ){
      function hook(){
        listener.apply(role, arguments)
      }
      // on the hook
      (this.events[event] || (this.events[event] = [])).push([listener, hook])
      var role = this
      this.element.addEventListener(event, hook, !!capture)
      return this
    },
    off: function ( event, listener, capture ){
      var role = this
      if( !this.events[event] || !this.events[event].length ) return this
      each(this.events[event], function ( l ){
        if ( l[0] == listener ) {
          // off the hook
          role.element.removeEventListener(event, l[1], !!capture)
          return false
        }
        return true
      })
      return this
    },
    once: function( event, listener, capture ){
      this.on(event, function cb(  ){
        listener.apply(this, arguments)
        this.off(event, cb, capture)
      })
    }
  }

  hud.define = function( def, proto ){
    function R( element, init ){
      if ( this instanceof R ) {
        hud.Role.call(this, element, def, init)
        return this
      }
      else return new hud.Role(element, def, init)
    }
    R.prototype = hud.Role.prototype
    if ( proto ) extend(R.prototype, proto)
    return R
  }
  hud.find = function( root, name, deep ){
    var element = null
    root = root || document.body
    hud.filter(root, function ( el ){
      if ( el.getAttribute && el.getAttribute("role") == name ) {
        element = el
        return FILTER_STOP
      }
      return FILTER_SKIP
    }, deep)
    return element
  }
  hud.findSub = function( root, name, deep ){
    var element = null
    root = root || document.body
    name = new RegExp("^"+name+"(:\\w+)*$")
    hud.filter(root, function ( el ){
      if ( el.getAttribute && name.test(el.getAttribute("role")) ) {
        element = el
        return FILTER_STOP
      }
      return FILTER_SKIP
    }, deep)
    return element
  }
  hud.findAll = function( root, name, deep ){
    root = root || document.body
    return hud.filter(root, function ( el ){
      if ( el.getAttribute && el.getAttribute("role") == name ) {
        return FILTER_PICK
      }
      return FILTER_SKIP
    }, deep)
  }
  hud.findAllSub = function( root, name, deep ){
    root = root || document.body
    name = new RegExp("^"+name+"(:\\w+)*$")
    return hud.filter(root, function ( el ){
      if ( el.getAttribute && name.test(el.getAttribute("role")) ) {
        return FILTER_PICK
      }
      return FILTER_SKIP
    }, deep)
  }

  hud.dataset = function( element ){
    return new Dataset(element)
  }

})
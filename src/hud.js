var hud = (function ( f ){
  return f({})
}(function ( hud ){

  function each( arr, f, context ){
    for ( var i = -1, l = arr.length; ++i < l; ) {
      f.call(context, arr[i], i, arr)
    }
  }

  function some( arr, f, context ){
    for ( var i = -1, l = arr.length; ++i < l; ) {
      if ( f.call(context, arr[i], i, arr) === true ) return true
    }
    return false
  }

  function extend( obj, extension ){
    for ( var prop in extension ) {
      obj[prop] = extension[prop]
    }
    return obj
  }

  function hasRole( element, role, strictMatch ){
    var roles = element.getAttribute("role")
    if ( !roles ) return false
    roles = roles.split(/\s+/)
    var i = -1, l = roles.length
    if ( strictMatch ) {
      if ( typeof role == "string" ) {
        while ( ++i < l ) {
          if ( roles[i] == role ) return true
        }
      }
      else {
        while ( ++i < l ) {
          if ( role.test(roles[i]) ) return true
        }
      }
    }
    else {
      if ( typeof role == "string" ) {
        role = new RegExp("^" + role + "($|(\\:\\w+)+)")
      }
      while ( ++i < l ) {
        if ( role.test(roles[i]) ) return true
      }
    }
    return false
  }

  function keyRole( el ){
    var role = el.getAttribute("role")
    if ( !role ) return ""
    return role.replace(/^(?:.+:)?(\w+)$/, "$1")
  }

  function extendRole( role, subRole, subRoleName ){
    if ( role[subRoleName] ) {
      if ( role[subRoleName].length ) {
        role[subRoleName].push(subRole)
      }
      else {
        role[subRoleName] = [role[subRoleName], subRole]
      }
    }
    else {
      role[subRoleName] = subRole
    }
  }

  function getSubName( roleName, element ){
    roleName = new RegExp("(?:\\s+|^)" + roleName + "\\:(\\w+)(?:\\:|$)")
    return element.getAttribute("role").replace(roleName, "$1")
  }

  hud.util = {}
  hud.util.each = each
  hud.util.some = some
  hud.util.extend = extend

  // constants used by the filter function
  var FILTER_PICK = hud.FILTER_PICK = 1
    , FILTER_SKIP = hud.FILTER_SKIP = 2
    , FILTER_IGNORE = hud.FILTER_STOP = hud.FILTER_IGNORE = 3
    , FILTER_STOP = 4
  // the event api, also a hash for custom events
    , events

  /**
   * @constructor
   * @param {Element} element - the element of the role controller
   * @param {Function} [def] - the definition function of the constructor
   * @param {Function|Object} setup - an additional function or object passed to each call of the controller
   *                                  can be an options object, which will be merged with the Role instance
   * */
  function Role( element ){
    if( element instanceof Element) this.element = element
    this.events = {}
    this.channels = {}
  }

  hud.Role = Role

  Role.extend = function ( proto ){
    extend(Role.prototype, proto)
  }

  Role.prototype = {
    /**
     * Collect values from the data attribute space where
     * attribute names are starting with `name`.
     * @param {String} name - data attribute name chunk
     * @param {Object} [defaults] - default values for the options.
     * */
    options: function ( name, defaults ){
      var options
        , regexp
      if ( typeof name == "string" ) {
        options = defaults || {}
        regexp = new RegExp("^data-" + name + "-(.+?)$")
      }
      else {
        options = defaults || name || {}
        regexp = new RegExp("^data-(.+?)$")
      }

      each(this.element.attributes, function ( attr ){
        var name = (attr.name.match(regexp) || [])[1]
        if ( name ) {
          name = name.replace(/-(.)/g, function ( match, group ){
            return group.toUpperCase()
          })
          switch ( true ) {
            case attr.value == "true":
            case attr.value == "false":
              options[name] = Boolean(attr.value)
              break
            case /^(\d*[\.,])?\d+?$/.test(attr.value):
              options[name] = Number(attr.value)
              break
            default:
              options[name] = attr.value
          }
        }
      })
      return options
    },
    extend: function ( extension ){
      return extend(this, extension)
    },
    filter: function ( filter, deep ){
      return hud.filter(this.element, filter, deep)
    },
    find: function ( name, strictMatch ){
      return hud.find(name, this.element, strictMatch)
    },
    findAll: function ( name, strictMatch ){
      return hud.findAll(name, this.element, strictMatch)
    },
    extendWithAll: function ( name, strictMatch ){
      var role = this
      this.findAll(name, strictMatch).forEach(function ( subRole ){
        extendRole(role, subRole, subRole.getAttribute("role"))
      })
      return this
    },
    extendWithSubs: function ( name, strictMatch ){
      var role = this
        , match = new RegExp("(?:^|\\s)" + name + ":(\\w+?)(?::|\\s|$)")
      this.findAll(name, strictMatch).forEach(function ( subRole ){
        var subRoleName = subRole.getAttribute("role").match(match) || []
        subRoleName = subRoleName[1]
        if ( subRoleName ) extendRole(role, subRole, subRoleName)
      })
      return this
    },
    role: function ( name, def, setup, strictMatch ){
      var element = this.find(name, strictMatch)
      if ( !element ) return null
      return hud.create(element, def, setup)
    },
    allRole: function ( name, def, setup, strictMatch ){
      var elements = this.findAll(name, strictMatch)
      each(elements, function ( el, i ){
        elements[i] = hud.create(el, def, setup)
      })
      return elements
    },
    extendWithRoles: function ( name, def, setup, strictMatch ){
      var role = this
      this.allRole(name, def, setup, strictMatch).forEach(function ( subRole ){
        var subRoleName = subRole.element.getAttribute("role")
        extendRole(role, subRole, subRoleName)
      })
      return this
    },
    extendWithSubRoles: function ( name, def, setup, strictMatch ){
      var role = this
        , match = new RegExp("(?:^|\\s)" + name + ":(\\w+?)(?::|\\s|$)")
      this.allRole(name, def, setup, strictMatch).forEach(function ( subRole ){
        var subRoleName = subRole.element.getAttribute("role").match(match) || []
        subRoleName = subRoleName[1]
        if ( subRoleName ) extendRole(role, subRole, subRoleName)
      })
      return this
    },
    render: function ( name, setup ){
      return hud.render(name, this.element, setup)
    },
    renderAll: function ( name, setup ){
      return hud.renderAll(name, this.element, setup)
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
      var i = channel.indexOf(listener)
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

      var args = [this.element, hook].concat([].slice.call(arguments, 2))
      var role = this
      if ( events[event] ) {
        var removeEventListener = events[event].apply(this, args);
        (this.events[event] || (this.events[event] = [])).push([listener, removeEventListener, hook])
      }
      else {
        // on the hook
        (this.events[event] || (this.events[event] = [])).push([listener, hook])
        this.element.addEventListener(event, hook, !!capture)
      }
      return this
    },
    off: function ( event, listener, capture ){
      var role = this
      if ( !this.events[event] || !this.events[event].length ) return this

      some(this.events[event], function ( l ){
        if ( l[0] == listener ) {
          if ( events[event] ) {
            // removeEventListener(hook, capture)
            l[1](l[2], !!capture)
          }
          else {
            // off the hook
            role.element.removeEventListener(event, l[1], !!capture)
          }
          return true
        }
        return false
      })
      return this
    },
    once: function ( event, listener, capture ){
      function once(){
        listener.apply(this, arguments)
        this.off(event, once, capture)
      }

      var args = [event, once].concat([].slice.call(arguments, 2))
      return this.on.apply(this, args)
    }
  }

  // ====================== API ======================

  hud.create = function ( element, def, setup ){
    if ( typeof def == "string" && hud[def] ) {
      return hud[def](element, setup)
    }
    var role = new Role(element)
    if ( def ) def.call(role, setup)
    return role
  }
  hud.define = function ( def, proto, base ){
    base = hud[base] ? hud[base] : base || Role
    function R( element, setup ){
      base.call(this, element, setup)
      if ( def ) {
        def.call(this, element, setup || {})
      }
    }

    function create( element, setup ){
      return new R(element, setup)
    }

    extend(R.prototype, base.prototype)
    if ( proto ) extend(R.prototype, proto)
    R.prototype.constructor = def

    create.prototype = R.prototype
    create.extend = function ( def, proto ){
      return hud.define(def, proto, R)
    }
    create.register = function ( name, def, proto ){
      return hud.register(name, def, proto, R)
    }
    create.mixin = function ( extensions ){
      return extend(R.prototype, extensions)
    }
    return create
  }
  hud.register = function ( name, def, proto, base ){
    hud[name] = hud[name] || hud.define(def, proto, base)
  }
  hud.render = function ( name, root, setup ){
    if ( !hud[name] ) return null
    if ( !setup ) {
      setup = root
      root = null
    }
    var el = hud.find(name, root, true)
    if ( !el ) return null
    return hud[name](el, setup)
  }
  hud.renderAll = function ( name, root, setup ){
    if ( !hud[name] ) return null
    if ( !setup ) {
      setup = root
      root = null
    }
    var elements = hud.findAll(name, root, true)
    var i = -1, l = elements.length
    while ( ++i < l ) {
      elements[i] = hud[name](elements[i], setup)
    }
    return elements
  }

  /**
   * Register a custom event definition by name.
   * The definition is a function that, when called,
   * should handle custom logic, event registration, etc..
   * and return a function that tears down the controllers.
   *
   * Returns a function which calls the unregister returned by the definition,
   * but only if the arguments match with the original ones.
   *
   * @example
   *
   * var clickProxy = hud.event("clickproxy", function( element, listener, capture ){
   *   element.addEventListener("click", listener, capture)
   *   return function( element, listener, capture ){
   *     // these arguments are the same as in the closure
   *     // this function body is executed if the listener and the capture values match
   *     element.removeEventListener("click", listener, capture)
   *   }
   * })
   * var unregister = clickProxy(someElement, someFunction, true)
   * unregister(someFunction, true)
   *
   * @param {String} name - a name for this event
   * @param {Function} def - the definition of this event
   * */
  hud.event = events = function registerEvent( name, def ){
    // register a definition function
    return events[name] = function addEventListener( element, listener, capture ){
      // normalize capture value for convenience
      capture = !!capture
      // when called, execute the custom logic and save the listener remover
      var doRemoveListener = def.apply(element, arguments)
      // and return a function that will call that remover
      return function removeEventListener( sameListener, sameCapture ){
        // but only if the same arguments are passed as before
        if ( sameListener === listener && sameCapture === capture ) {
          // execute custom tearing logic
          doRemoveListener(element, listener, capture)
        }
      }
    }
  }

  /**
   * Call custom event listener just once
   * */
  hud.event.once = function ( element, event, listener, capture ){
    function once(){
      listener.apply(this, arguments)
      removeListener(once, capture)
    }

    var args = [element, once].concat([].slice.call(arguments, 3))
      , removeListener
    return removeListener = events[event].apply(null, args)
  }

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
  hud.filterElements = function ( root, filter, deep ){
    return hud.filter(root, filter, deep, "children")
  }
  hud.filterChildNodes = function ( root, filter, deep ){
    return hud.filter(root, filter, deep, "childNode")
  }
  hud.hasRole = hasRole
  hud.getSubName = getSubName
  hud.find = function ( name, root, strictMatch ){
    var element = null
    if ( typeof root == "boolean" ) {
      strictMatch = root
      root = document.body
    }
    else if ( !root ) {
      root = document.body
      strictMatch = false
    }
    hud.filterElements(root, function ( el ){
      if ( hasRole(el, name, strictMatch) ) {
        element = el
        return FILTER_STOP
      }
      return FILTER_SKIP
    })
    return element
  }
  hud.findAll = function ( name, root, strictMatch ){
    if ( typeof root == "boolean" ) {
      strictMatch = root
      root = document.body
    }
    else if ( !root ) {
      root = document.body
      strictMatch = false
    }
    return hud.filterElements(root, function ( el ){
      return hasRole(el, name, strictMatch)
        ? FILTER_PICK
        : FILTER_SKIP
    })
  }

  return hud
}))
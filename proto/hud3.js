var hud = (function ( H ){

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

  H.FILTER_PICK = FILTER_PICK
  H.FILTER_SKIP = FILTER_SKIP
  H.FILTER_IGNORE = FILTER_IGNORE
  H.FILTER_STOP = FILTER_STOP

  /**
   * Iterates over every child node, and according to the filter function's
   * return value, it picks, skips, or ignores a node.
   * Picked nodes will be part of the return array.
   * skipped nodes not, but their child nodes will still be checked.
   * Ignored nodes won't have their child nodes iterated recursively.
   * The root element will not be checked with the filter, only its child nodes.
   * */
  function filterElements( element, filter, deep, includeChildNodes ){
    var childTypes = includeChildNodes ? "childNodes" : "children"
      , children = element[childTypes] || element
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

  H.filter = filterElements

  function Role( element, def, init ){
    if ( typeof element == "string" ) {
      element = hud.role.find(element)
    }
    if ( !element ) return
    this.element = element
    this.dataset = hud.dataset(element)
    this.events = {}
    this.channels = {}
    if ( def ) def.call(this, element, init || {})
    if ( typeof init == "function" ) init.call(this, element)
  }

  Role.prototype = {
    find: function ( name ){
      return H.role.find(name, this.element)
    },
    findAll: function ( name ){
      return H.role.findAll(name, this.element)
    },
    wrap: function ( nameOrEl ){
      if ( typeof nameOrEl == "string" ) {
        nameOrEl = this.find(nameOrEl)
      }
      if ( !nameOrEl ) return null
      return H.wrap(nameOrEl)
    },
    wrapAll: function ( nameOrArr ){
      if ( typeof nameOrArr == "string" ) {
        nameOrArr = this.findAll(nameOrArr)
      }
      if ( !nameOrArr ) return null
      return H.wrapAll(nameOrArr)
    },
    spawn: function ( name, element, init ){
      if ( !elements ) {
        elements = elements || name
        name = Role
      }
      if ( typeof elements == "string" ) {
        elements = hud.role.findAll(elements, this.element)
      }
      return H.spawn(name, elements)
    },
    data: function ( data ){
      for ( var prop in data ) {
        if ( data.hasOwnProperty(prop) ) this.set(prop, data[prop])
      }
    },
    listen: function ( channel, listener ){
      if ( this.channels )
        (this.channels[channel] || (this.channels[channel] = [])).push(listener)
      return this
    },
    unlisten: function ( channel, listener ){
      if ( this.channels == undefined ) return this
      channel = this.channels[channel]
      if ( !channel ) return
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
    on: function ( event, listener ){
      function hook(){
        listener.apply(role, arguments)
      }

      (this.events[event] || (this.events[event] = [])).push([listener, hook])
      var role = this
      this.element.addEventListener(event, hook, false)
      return this
    },
    off: function ( event, listener ){
      var role = this
      if( !this.events[event] || !this.events[event].length ) return
      each(this.events[event], function ( l ){
        if ( l[0] == listener ) {
          role.element.removeEventListener(event, l[1], false)
          return false
        }
        return true
      })
      return this
    },
    once: function( event, listener ){
      this.on(event, function cb(  ){
        listener.apply(this, arguments)
        this.off(event, cb)
      })
    }
  }

  function RoleList( name, elements, init ){
    var list = this.elements = []

    if ( !elements ) return

    if ( typeof elements == "string" ) {
      elements = hud.role.findAll(elements)
    }

    var role = roles[name] || name
    if ( !role ) return

    each(elements, function ( el, i ){
      list[i] = new role(el, init)
    })
  }

  RoleList.prototype = {
    data: function ( data ){
      each(this.elements, function ( el ){ el.data(data) })
      this.broadcast("change", data)
      return this
    },
    set: function ( prop, value ){
      each(this.elements, function ( el ){ el.set(prop, value) })
      this.broadcast("change:prop", value)
      return this
    },
    get: function ( prop ){
      var values = []
      each(this.elements, function ( el ){ values.push(el.get(prop)) })
      return values
    },
    has: function ( prop ){
      return each(this.elements, function ( el ){ el.has(prop) })
    },
    clear: function ( prop ){
      each(this.elements, function ( el ){ el.clear(prop)})
      this.broadcast("clear", prop)
      return this
    },
    listen: function ( channel, listener ){
      each(this.elements, function ( el ){ el.listen(channel, listener) })
      return this
    },
    unlisten: function ( channel, listener ){
      each(this.elements, function ( el ){ el.unlisten(channel, listener) })
      return this
    },
    broadcast: function ( channel, message ){
      each(this.elements, function ( el ){ el.broadcast.apply(el, arguments) })
      return this
    },
    on: function ( event, listener ){
      each(this.elements, function ( el ){ el.on(event, listener) })
      return this
    },
    off: function ( event, listener ){
      each(this.elements, function ( el ){ el.off(event, listener) })
      return this
    },
    each: function ( f ){
      each(this.elements, function ( role ){
        f(role)
      })
    },
    indexOf: function ( search ){
      var i = -1
      each(this.elements, function ( role, ii ){
        if ( role.element == search || role == search ) {
          i = ii
          return false
        }
        return true
      })
      return i
    }
  }

  var roles = H.roles = {}

  H.define = function( name, def, proto ){
    function R( element, init ){
      if ( this instanceof R ) Role.call(this, element, def, init)
      else return new Role(element, def, init)
    }

    R.prototype = Role.prototype
    if ( proto ) extend(R.prototype, proto)
    return roles[name] = R
  }

  H.find = function ( name, root ){
    var role = null
    root = root || document.body
    filterElements(root, function ( el ){
      if ( el.getAttribute && el.getAttribute("role") == name ) {
        role = el
        return FILTER_STOP
      }
      return FILTER_SKIP
    }, true)
    return role
  }

  H.findAll = function ( name, root, deep ){
    root = root || document.body
    return filterElements(root, function ( el ){
      if ( el.getAttribute &&  el.getAttribute("role") == name )
        return FILTER_PICK
      return FILTER_SKIP
    }, deep == undefined ? true : deep)
  }

  H.wrap = function (element, init){
    return new Role(element, null, init)
  }

  H.wrapAll = function (elements, init){
    return new RoleList(Role, elements, init)
  }

  H.spawn = function ( name, element, init ){
    if ( roles[name] ) return roles[name](element, init)
    return null
  }

  H.spawnAll = function (name, element, init){
    if ( roles[name] ) return new RoleList(name, element, init)
    return null
  }

  H.dataset = function ( element ){
    var dataset = {
      set: function( property, value ){
        element.setAttribute("data-"+property, value||"")
      }
    }
    each(element.attributes, function ( attr ){
      if ( /^data-/.test(attr.name) ) {
        var name = attr.name.replace(/^data-/, "").toLowerCase().replace(/-(.)/g, function ( m, g ){
          return g.toUpperCase()
        })
        switch ( true ) {
          case /^\s*\d+\s*$/.test(attr.value):
            dataset[name] = parseInt(attr.value)
            break
          case /^\s*\d*\.\d+\s*$/.test(attr.value):
            dataset[name] = parseFloat(attr.value)
            break
          case /^\s*true\s*$/.test(attr.value):
            dataset[name] = true
            break
          case /^\s*false\s*$/.test(attr.value):
            dataset[name] = false
            break
          default:
            dataset[name] = attr.value
        }
      }
    })
    return dataset
  }

  H.extendDefault = function( extension ){
    extend(Role.prototype, extension)
  }

}({}))
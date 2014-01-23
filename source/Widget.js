var hud = (function( hud, win, doc, undefined ){

  var roles = {}

  var FILTER_PICK = 1
    , FILTER_SKIP = 2
    , FILTER_IGNORE = 3

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
    if ( !l ) return ret
    while ( ++i < l ) {
      switch ( filter(children[i]) ) {
        case FILTER_PICK:
          ret.push(children[i])
          if ( deep ) ret = ret.concat(filterElements(children[i].children, filter, deep))
          break
        case FILTER_SKIP:
          if ( deep ) ret = ret.concat(filterElements(children[i].children, filter, deep))
          break
        case FILTER_IGNORE:
          break
      }
    }
    return ret
  }

  function each( arr, f ){
    for ( var i = -1, l = arr.length; ++i < l; ) {
      f(arr[i], i, arr)
    }
  }
  function extend( obj, extension ){
    for( var prop in extension ){
      obj[prop] = extension[prop]
    }
    return obj
  }

  function merge( obj, ext ){
    return extend(extend({}, obj), ext)
  }

  function findRoles( el, roleName ){
    return filterElements(this.element, function( el ){
      var roleAttr = el.getAttribute("role")
      if( !roleAttr ) return FILTER_SKIP
      each(roleAttr.split(/\s+/), function( r ){

      })
    }, true)
  }

  function Widget( element ){
    this.element = element
    this.roles = {}
  }
  Widget.prototype = {
    findRoles: function( name, roleArgs ){
      var elements
      roleArgs = [].slice.call(arguments)
      name = roleArgs.shift()
      elements = filterElements(this.element, function( el ){

      }, true)
      if( roles[name] ){
        each(elements, function( el, i ){
          return new (Function.prototype.bind.apply(roles[name], [null].concat(roleArgs)))()
        })
      }
      return elements
    },
    findRole: function( role ){

    }
  }

  function Role(  ){

  }
  Role.prototype = {

  }

  function Template(  ){

  }
  Template.prototype = {

  }

  hud.defineWidget = function( name, def ){

  }
  hud.defineRole = function( name, def ){

  }
  hud.defineTemplate = function( name, def ){

  }

  new Role()
  new Widget()
  new Template()

  hud.defineWidget("tabset", {
    constructor: function(  ){
      this.tabs = this.findRoles("tab", this)
      this.tablist = this.findRole("tablist")
    },
    closeAll: function(  ){

    }
  })
  hud.defineRole("tab", {
    constructor: function( el, tabset ){

    },
    close: function(  ){

    }
  })

}( {}, window, document ))

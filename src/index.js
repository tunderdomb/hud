var extend = require("./core/extend")
var BaseRole
var find = hud.find = require("./core/find")
hud.filter = require("./core/filter")
hud.event = require("./core/event")
hud.attribute = require("./core/attribute")
hud.request = require("./core/request")
hud.inject = require("./core/inject")

module.exports = global.hud = hud

function noop(  ){}

hud.role = hud()

function hud( name, globalInit, proto ){
  globalInit = globalInit || noop
  // lazy loading to avoid circular reference
  BaseRole = BaseRole || require("./core/Role")
  function Role( name, element, localInit, args ){
    BaseRole.call(this, name, element)
    globalInit.apply(this, args)
    if( localInit ) localInit.apply(this, args)
  }

  extend(Role.prototype, BaseRole.prototype)
  extend(Role.prototype, proto)

  function create( element ){
    if( typeof element == "string" ) {
      element = hud.find(element)
    }
    return new Role(name, element, null, [].slice.call(arguments, 1))
  }

  create.prototype = Role.prototype
  create.extend = extend.bind(null, Role.prototype)

  create.find = function( root ){
    var element = find(name, root)
    if( !element ) return null
    return new Role(name, element, null, [].slice.call(arguments, 1))
  }

  create.all = function( root, localInit ){
    var args = [].slice.call(arguments, 2)
    return find.all(name, root).map(function( element ){
      return new Role(name, element, localInit, args)
    })
  }
  create.subs = function( root, localInit ){
    var args = [].slice.call(arguments, 2)
    return find.subsOf(name, root).map(function( element ){
      return new Role(name, element, localInit, args)
    })
  }

  hud[name] = create

  return create
}
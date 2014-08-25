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

function hud( name, init, proto ){
  init = init || noop
  // lazy loading to avoid circular reference
  BaseRole = BaseRole || require("./core/Role")
  function Role( element, args ){
    BaseRole.call(this, element)
    init.apply(this, args)
  }

  extend(Role.prototype, BaseRole.prototype)
  extend(Role.prototype, proto)
  Role.prototype.role = name

  function create( element, root, args ){
    if( typeof element == "string" ) {
      if ( Array.isArray(root) ) {
        args = root
        root = null
      }
      element = find(element, root)
    }
    else {
      if ( Array.isArray(root) ) {
        args = root
        root = null
      }
      else {
        args = root
        root = null
      }
    }
    return new Role(element, args)
  }

  create.prototype = Role.prototype
  create.extend = extend.bind(null, Role.prototype)

  hud[name] = create

  return create
}
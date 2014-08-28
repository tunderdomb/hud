var extend = require("./core/extend")
var BaseRole
var find = hud.find = require("./core/find")
hud.filter = require("./core/filter")
hud.event = require("./core/event")
hud.attribute = require("./core/attribute")
hud.request = require("./core/request")
hud.inject = require("./core/inject")

module.exports = global.hud = hud

function noop(){}

hud.create = hud()

function autoCreate(){
  var roleObject = this
    , roleName = roleObject.role
  hud.find.subsOf(roleName, roleObject.element).map(function ( subElement ){
    var subName = hud.attribute.subname(roleName, subElement)
    var rawSubName = hud.attribute.rawSubname(roleName, subElement)
    var fullSubName = roleName + ":" + rawSubName
    roleObject[subName] = hud[fullSubName] ? hud[fullSubName](subElement) : hud.create({element: subElement})
  })
}

function hud( name, init, proto ){
  init = init || noop
  // lazy loading to avoid circular reference
  BaseRole = BaseRole || require("./core/Role")
  function Role( element, args, internalInit ){
    BaseRole.call(this, element)
    if ( internalInit ) internalInit.apply(this, args)
    init.apply(this, args || [])
  }

  extend(Role.prototype, BaseRole.prototype)
  extend(Role.prototype, proto)
  Role.prototype.role = name

  function create( options, args ){
    if ( !args && Array.isArray(options) ) {
      args = options
      options = {}
    }

    var root = options.root
      , element = options.element || name
      , all = !!options.all
      , auto = options.auto == undefined || !!options.auto ? autoCreate : null

    if ( typeof element == "string" ) {
      element = all
        ? hud.find.all(element, root)
        : hud.find(element, root)
    }
    if ( all ) return element.map(function ( el ){
      return new Role(el, args, auto)
    })
    return new Role(element, args, auto)
  }

  create.prototype = Role.prototype
  create.extend = extend.bind(null, Role.prototype)

  hud[name] = create

  return create
}
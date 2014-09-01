var extend = require("./core/extend")
var BaseRole
var find = hud.find = require("./core/find")
var attr = hud.attribute = require("./core/attribute")
hud.filter = require("./core/filter")
hud.event = require("./core/event")
hud.request = require("./core/request")
hud.inject = require("./core/inject")

module.exports = global.hud = hud

function noop(){}

hud.create = hud()
hud.create.auto = false

function autoCreate( multiple ){
  return function (){
    var roleObject = this
      , roleName = attr.keyRole(roleObject.role)
    find.subsOf(roleName, roleObject.element).map(function ( subElement ){
      var subName = attr.subname(roleName, subElement)
      var rawSubName = attr.rawSubname(roleName, subElement)
      var fullSubName = roleName + ":" + rawSubName
      var subRoleObject = hud[fullSubName]
        ? hud[fullSubName](subElement)
        : hud.create({element: subElement})
      if ( multiple && multiple.length && ~multiple.indexOf(rawSubName) ) {
        roleObject[subName] = roleObject[subName] || []
        roleObject[subName].push(subRoleObject)
        return
      }
      roleObject[subName] = subRoleObject
    })
  }
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
    if ( !options ) {
      options = create
      args = []
    }
    else if ( !args && Array.isArray(options) ) {
      args = options
      options = create.options
    }

    var root = options.root || create.root
      , element = options.element || create.element || name
      , all = options.all == undefined ? create.all : !!options.all
      , multiple = options.multiple || create.multiple || []
      , auto = options.auto == undefined ? create.auto : options.auto

    auto = auto && autoCreate(multiple)

    if ( typeof element == "string" ) {
      element = all
        ? find.all(element, root)
        : find(element, root)
    }
    if ( all ) return element.map(function ( el ){
      return new Role(el, args, auto)
    })
    return new Role(element, args, auto)
  }

  //noinspection JSPotentiallyInvalidConstructorUsage
  create.prototype = Role.prototype
  //noinspection JSUnresolvedFunction
  create.extend = extend.bind(null, Role.prototype)
  create.auto = true
  create.all = false
  create.root = null
  create.element = null
  create.multiple = []
  hud[name] = create

  return create
}
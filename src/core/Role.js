var undefined
var extend = require("./extend")
var event = require("./event")
var Radio = require("./Radio")
var role = require("../index")

module.exports = Role

function normalizeValue( value ){
  switch ( true ) {
    case value == "true":
    case value == "false":
      return Boolean(value)
    case /^(\d*[\.,])?\d+?$/.test(value):
      return parseFloat(value)
    default:
      return value
  }
}

function camelCase( str ){
  return str.replace(/-(.)/g, function ( match, group ){
    return group.toUpperCase()
  })
}

function addEventListener( role, type, listener, args, hook, capture ){
  if ( event.exists(type) ) {
    (role.events[type] || (role.events[type] = [])).push([listener, event.create(type, role, args), hook])
  }
  else {
    // on the hook
    (role.events[type] || (role.events[type] = [])).push([listener, hook])
    role.element.addEventListener(type, hook, !!capture)
  }
}

function removeEventListener( role, type, listener, capture ){
  if ( !role.events[type] || !role.events[type].length ) {
    return
  }
  role.events[type] = role.events[type].filter(function ( l ){
    if ( l[0] == listener ) {
      if ( event.exists(type) ) {
        // removeEventListener(hook, capture)
        l[1](l[2], !!capture)
      }
      else {
        // off the hook
        role.element.removeEventListener(type, l[1], !!capture)
      }
      return false
    }
    return true
  })
  if( !role.events[type].length ) delete role.events[type]
}

/**
 * @constructor
 * @param {String} name - the name of this role
 * @param {Element} element - the element of the role controller
 *                                  can be an options object, which will be merged with the Role instance
 * */
function Role( element ){
  this.element = element
  this.events = {}
  this.channels = {}
}

Role.extend = extend.bind(Role.prototype)
extend(Role.prototype, Radio.prototype)
extend(Role.prototype, {
  destroy: function (){
    delete this.element
    this.unListen()
    delete this.events
  },

  // data-* attributes

  /**
   * returns a single property value, or an object for a property list
   * @param {String|String[]|Object} prop a single value to return
   *                                      a list of values to filter
   *                                      a prefix to extract all prefixed data attributes
   * @param {Object} [defaultValue] a value or a hash of values the result defaults to
   * */
  getData: function ( prop, defaultValue ){
    var data = {}
    if ( typeof prop == "string" ) {
      prop = this.element.getAttribute("data-" + prop)
      return prop == undefined ? defaultValue : normalizeValue(prop)
    }
    else if ( Array.isArray(prop) ) {
      var element = this.element
      if ( defaultValue ) {
        extend(data, defaultValue)
      }
      return prop.reduce(function ( data, attr ){
        if ( element.hasAttribute("data-" + attr) ) {
          data[attr] = normalizeValue(element.getAttribute("data-" + attr))
        }
        return data
      }, data)
    }
    else {
      var regexp
        , attributes = [].slice.call(this.element.attributes)
      if ( defaultValue == undefined ) {
        data = extend({}, prop)
        regexp = new RegExp("^data-(.+?)$")
      }
      else {
        regexp = new RegExp("^data-" + prop + "-(.+?)$")
        extend(data, defaultValue)
      }
      return attributes.reduce(function ( data, attr ){
        var name = (attr.name.match(regexp) || [])[1]
        if ( name ) {
          data[camelCase(name)] = normalizeValue(attr.value)
        }
        return data
      }, data)
    }
  },
  /**
   * @param {String|Object} prop - value(s) to set
   * @param {*} [val] - value of this property if prop is a string
   * */
  setData: function ( prop, val ){
    if ( val != undefined && typeof prop == "string" ) {
      this.element.setAttribute("data-" + prop, val)
    }
    else for ( var name in prop ) {
      this.element.setAttribute("data-" + name, prop[name])
    }
  },
  /**
   * delete values from the data attribute space
   * @param {String|String[]} prop - data value(s) to remove
   * */
  removeData: function ( prop ){
    if ( typeof prop == "string" ) {
      this.element.removeAttribute("data-" + prop)
    }
    else {
      var element = this.element
      prop.forEach(function ( name ){
        element.removeAttribute("data-" + name)
      })
    }
  },
  isData: function ( prop, value ){
    return this.getData(prop) == value
  },

  // classList

  addClass: function ( cls ){
    this.element.classList.add(cls)
  },
  removeClass: function ( cls ){
    this.element.classList.remove(cls)
  },
  hasClass: function ( cls ){
    return this.element.classList.contains(cls)
  },
  toggleClass: function ( cls ){
    this.element.classList.toggle(cls)
  },

  // self extending

  extend: function ( extension ){
    return extend(this, extension)
  },
  assign: function( name, getName ){
    role[name].all(this.element).reduce(function( host, aRole ){
      var name = getName(aRole)
      if( name ) host[name] = aRole
      return host
    }, this)
  },

  // DOM events

  on: function ( type, listener, capture ){
    function hook(){
      listener.apply(role, arguments)
    }

    var args = [this.element, hook].concat([].slice.call(arguments, 2))
    var role = this
    type.split(/\s*,\s*|\s+/).forEach(function( type ){
      addEventListener( role, type, listener, args, hook, capture )
    })
    return this
  },
  off: function ( type, listener, capture ){
    var role = this
    type.split(/\s*,\s*|\s+/).forEach(function( type ){
      removeEventListener( role, type, listener, capture )
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
  },

  // DOM manipulation

  appendChild: function ( element ){
    this.element.appendChild(element)
    return this
  },
  appendTo: function ( element ){
    element.appendChild(this.element)
    return this
  },
  prependChild: function ( element ){
    if ( this.element.firstChild ) {
      this.element.insertBefore(element, this.element.firstChild)
    }
    else {
      this.element.appendChild(element)
    }
    return this
  },
  prependTo: function ( element ){
    if ( element.firstChild ) {
      element.insertBefore(this.element, element.firstChild)
    }
    else {
      element.appendChild(this.element)
    }
    return this
  },
  replaceChild: function ( newElement, refElement ){
    this.element.replaceChild(newElement, refElement)
    return this
  },
  replaceTo: function ( child ){
    child.parentNode.replaceChild(this.element, child)
    return this
  },
  insertAfter: function ( newElement, refElement ){
    if ( refElement.nextSibling ) {
      this.element.insertBefore(newElement, refElement.nextSibling)
    }
    else {
      this.element.appendChild(newElement)
    }
    return this
  },
  insertAfterTo: function ( element ){
    if ( element.nextSibling ) {
      element.parentNode.insertBefore(this.element, element.nextSibling)
    }
    else {
      element.parentNode.appendChild(this.element)
    }
    return this
  },
  insertBefore: function ( newElement, refElement ){
    this.element.insertBefore(newElement, refElement)
    return this
  },
  insertBeforeTo: function ( element ){
    element.parentNode.insertBefore(this.element, element)
    return this
  },
  removeElement: function (){
    this.element.parentNode.removeChild(this.element)
    return this
  },
  removeChild: function ( childNode ){
    this.element.removeChild(childNode)
    return this
  },
  swapChildren: function ( child1, child2 ){
    var nextSibling = child1.nextSibling
    child2.parentNode.replaceChild(child1, child2)
    if ( nextSibling ) {
      nextSibling.parentNode.insertBefore(child2, nextSibling)
    }
    else {
      nextSibling.parentNode.appendChild(child2)
    }
  },
  swapElement: function ( anotherElement ){
    var nextSibling = this.element.nextSibling
    anotherElement.parentNode.replaceChild(this.element, anotherElement)
    if ( nextSibling ) {
      nextSibling.parentNode.insertBefore(anotherElement, nextSibling)
    }
    else {
      nextSibling.parentNode.appendChild(anotherElement)
    }
  },
  contains: function ( element ){
    return this.element.contains(element)
  },
  isSame: function ( element ){
    return this.element == element
  },
  setAttribute: function ( name, value ){
    this.element.setAttribute(name, value)
    return this
  },
  removeAttribute: function ( name ){
    this.element.removeAttribute(name)
    return this
  },
  hasAttribute: function ( name ){
    return this.element.hasAttribute(name)
  },
  getAttribute: function ( name ){
    return this.element.getAttribute(name)
  },
  textContent: function ( string ){
    if ( string === undefined ) {
      return this.element.textContent
    }
    else {
      return this.element.textContent = string
    }
  },
  value: function ( value ){
    if ( value === undefined ) {
      if( this.element.tagName == "INPUT" && this.element.type == "checkbox" ) {
        return this.element.checked
      }
      return normalizeValue(this.element.value)
    }
    else {
      if( this.element.tagName == "INPUT" && this.element.type == "checkbox" ) {
        return this.element.checked = !!value
      }
      return this.element.value = value
    }
  },
  disable: function( disable ){
    this.element.disabled = disable
  },
  isDisabled: function(  ){
    return !!this.element.disabled
  },
  innerHTML: function ( html ){
    if ( html === undefined ) {
      return this.element.innerHTML
    }
    else {
      return this.element.innerHTML = html
    }
  }
})
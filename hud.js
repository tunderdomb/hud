(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = Radio

function Radio(){}

var proto = Radio.prototype = {}
proto.listen = listen
proto.unListen = unListen
proto.broadcast = broadcast
proto.listenOnce = once
proto.hasListener = hasListener

function listen( channel, listener ){
  this.channels = this.channels || {};
  (this.channels[channel] = this.channels[channel] || []).push(listener)
  return this
}

function unListen( channel, listener ){
  // remove all channels
  if ( !channel ) {
    this.channels = {}
  }
  // reset a channel
  else if ( !listener ) {
    this.channels[channel] = []
  }
  // remove a listener
  else {
    channel = this.channels[channel]
    if ( channel ) {
      var i = channel.indexOf(listener)
      if ( ~i ) {
        channel.splice(i, 1)
      }
    }
  }
  return this
}

function broadcast( channel, message ){
  message = [].slice.call(arguments, 1)
  channel = this.channels[channel]
  if ( channel ) {
    channel.forEach(function ( listener ){
      listener.apply(this, message)
    }, this)
  }
  return this
}

function once( channel, listener ){
  function proxy(){
    unListen.call(this, channel, proxy)
    listener.apply(this, arguments)
  }
  listen.call(this, channel, proxy)
  return this
}

function hasListener( channel, listener ){
  channel = this.channels[channel]
  return channel && listener && !!~channel.indexOf(listener)
}

},{}],2:[function(require,module,exports){
var undefined
var extend = require("./extend")
var event = require("./event")
var Radio = require("./Radio")
var role = require("../index")

module.exports = Role

function normalizeValue( value ){
  switch ( true ) {
    case value == "true":
      return true
    case value == "false":
      return false
      return Boolean(value)
    case /^-?(\d*[\.,])?\d+?$/.test(value):
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

Role.extend = extend.bind(null, Role.prototype)
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
},{"../index":11,"./Radio":1,"./event":4,"./extend":5}],3:[function(require,module,exports){
var attribute = module.exports = {}

attribute.contains = contains
attribute.all = all
attribute.subname = subname
attribute.rawSubname = rawSubname
attribute.keyRole = keyRole

function contains( element, role ){
  var roles = all(element)
  if ( !roles ) return false
  var i = -1
    , l = roles.length
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
  return false
}

function all( element ){
  var roles = element.getAttribute("role")
  if ( !roles ) return null
  return roles.trim().split(/\s+/)
}

function rawSubname( roleName, element ){
  var role = element.getAttribute("role")
  return role && role.replace(new RegExp("^.*?" + roleName + ":([\\w\\-]+).*?$"), "$1")
}
function subname( roleName, element ){
  var subName = rawSubname(roleName, element)
  return subName && subName
    .toLocaleLowerCase()
    .replace(/-(.)/g, function ( m, l ){
      return l.toUpperCase()
    })
}
function keyRole( roleName ){
  return roleName && roleName.match(/^(?:.+:)?(.+)$/)[1]
}
},{}],4:[function(require,module,exports){
var eventCache = {}

module.exports = event

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
function event( name, def ){
  // register a definition function
  return eventCache[name] = function addEventListener( element, listener, capture ){
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

event.exists = function ( eventName ){
  return eventCache[eventName]
}

event.create = function ( eventName, context, args ){
  eventCache[eventName].apply(context, args)
}


},{}],5:[function(require,module,exports){
module.exports = function extend( obj, extension ){
  for ( var prop in extension ) {
    if( extension.hasOwnProperty(prop) ) obj[prop] = extension[prop]
  }
  return obj
}
},{}],6:[function(require,module,exports){
/* hive.filter */

module.exports = filter

// constants used by the filter function
var FILTER_PICK = filter.FILTER_PICK = 1
/**
 * Skip node but continue with children
 * */
var FILTER_SKIP = filter.FILTER_SKIP = 2
/**
 * Ignore node
 * */
var FILTER_IGNORE = filter.FILTER_IGNORE = 3
/**
 * Pick the node and ignore children
 * */
var FILTER_IGNORE_PICK = filter.FILTER_IGNORE_PICK = 4
/**
 * Stop filtering and return
 * */
var FILTER_STOP = filter.FILTER_STOP = 5

/**
 * Iterates over every child node, and according to the filter function's
 * return value, it picks, skips, or ignores a node.
 * Picked nodes will be part of the return array.
 * skipped nodes not, but their child nodes will still be checked.
 * Ignored nodes won't have their child nodes iterated recursively.
 * The root element will not be checked with the filter, only its child nodes.
 * */
function filter( element, fn, childTypes ){
  var children = element[childTypes] || element
    , descendants
    , i = -1
    , l = children.length
    , ret = []
    , stack = []
  if ( !l ) return ret
  while ( ++i < l ) {
    switch ( fn(children[i]) ) {
      case FILTER_IGNORE_PICK:
        ret.push(children[i])
        break
      case FILTER_PICK:
        ret.push(children[i])
        descendants = children[i][childTypes]
        if ( i < l && descendants && descendants.length ) {
          stack.push([children, i, l])
          children = children[i][childTypes]
          i = -1
          l = children.length
        }
        break
      case FILTER_SKIP:
        descendants = children[i][childTypes]
        if ( i < l && descendants && descendants.length ) {
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

filter.elements = function ( root, fn ){
  return filter(root, fn, "children")
}

filter.childNodes = function ( root, fn ){
  return filter(root, fn, "childNode")
}



},{}],7:[function(require,module,exports){
var filter = require("./filter")
var attr = require("./attribute")

module.exports = find

function find( name, root ){
  var element = null
  root = root || document.body
  if ( !root ) {
    throw new Error("Couldn't search for " + name + " in root (" + root + ")")
  }
  if ( name ) filter.elements(root, function ( el ){
    if ( attr.contains(el, name) ) {
      element = el
      return filter.FILTER_STOP
    }
    return filter.FILTER_SKIP
  })
  return element
}

find.all = function ( name, root, deep ){
  if ( !name ) {
    return []
  }
  root = root || document.body
  if ( !root ) {
    throw new Error("Couldn't search for " + name + " in root (" + root + ")")
  }
  var pickStrategy = deep == true || deep == undefined
    ? filter.FILTER_PICK
    : filter.FILTER_IGNORE_PICK
  return filter.elements(root, function ( el ){
    return attr.contains(el, name)
      ? pickStrategy
      : filter.FILTER_SKIP
  })
}

find.any = function ( root, deep ){
  if ( !root ) {
    throw new Error("Couldn't search in root (" + root + ")")
  }
  var pickStrategy = deep == true || deep == undefined
    ? filter.FILTER_PICK
    : filter.FILTER_IGNORE_PICK
  return filter.elements(root, function ( el ){
    return attr.contains(el, /.*/)
      ? pickStrategy
      : filter.FILTER_SKIP
  })
}

find.subsOf = function ( name, root ){
  if ( !name ) {
    return []
  }
  root = root || document.body
  if ( !root ) {
    throw new Error("Couldn't search for " + name + " in root (" + root + ")")
  }
  var match = new RegExp("(?:^|\\s)" + name + ":([\\w\\-]+?)(?::|\\s|$)")
  return filter.elements(root, function ( el ){
    return attr.contains(el, match)
      ? filter.FILTER_PICK
      : filter.FILTER_SKIP
  })
}

},{"./attribute":3,"./filter":6}],8:[function(require,module,exports){
module.exports = inject

var LOADING = 1
  , LOADED = 2
  , FAILED = 3

function normalizeSrc( src ){
  if ( src[0] == "/" ) {
    return location.protocol + "//" + location.host + src
  }
  else {
    return src
  }
}

function cache( src ){
  cache[normalizeSrc(src)] = LOADED
}
function fail( src ){
  cache[normalizeSrc(src)] = FAILED
}
function loading( src ){
  cache[normalizeSrc(src)] = LOADING
}
function isLoaded( src ){
  return cache[normalizeSrc(src)] == LOADED
}
function isLoading( src ){
  return cache[normalizeSrc(src)] == LOADING
}
function isFailed( src ){
  return cache[normalizeSrc(src)] == FAILED
}

function asyncLoader( load ){
  return function ( sources, done ){
    if ( typeof sources == "string" ) {
      sources = [sources]
    }
    var failed
      , toLoad = sources.length

    function next( error, src ){
      if ( error ) {
        fail(src)
        failed = failed || []
        failed.push({
          src: src,
          error: error
        })
      }
      else {
        cache(src)
      }
      if ( !--toLoad ) {
        done(failed)
      }
    }

    if ( !toLoad ) done()
    else sources.forEach(function ( src ){
      if ( isLoaded(src) ) {
        next(null, src)
      }
      else if ( isLoading(src) ) {
        // TODO: add a listener to a ready queue
      }
      else {
        loading(src)
        load(src, function ( e ){
          next(e, src)
        })
      }
    })
  }
}

function syncLoader( load ){
  return function ( sources, done ){
    if ( typeof sources == "string" ) {
      sources = [sources]
    }
    var failed
      , current = -1
      , toLoad = sources.length

    function next( error, src ){
      if ( error ) {
        fail(src)
        failed = failed || []
        failed.push({
          src: src,
          error: error
        })
      }
      else {
        cache(src)
      }
      if ( ++current == toLoad ) {
        done(failed)
      }
      else {
        if ( isLoaded(src) ) {
          next(null, src)
        }
        else if ( isLoading(src) ) {
          // TODO: add a listener to a ready queue
        }
        else {
          loading(src)
          load(sources[current], function ( e ){
            next(e, sources[current])
          })
        }
      }
    }

    if ( !toLoad ) done()
    else next()
  }
}

function injectScript( src, next ){
  var ok
    , error = null
    , script = document.createElement("script")
  script.onload = function (){
    ok || next(error)
    ok = true
  }
  script.onerror = function ( e ){
    ok || next(error = e)
    ok = true
  }
  document.head.appendChild(script)
  script.async = false
  script.src = src
}

function inject( srcs, done ){
  if ( !Array.isArray(srcs) ) srcs = [srcs]
  var scripts = srcs.filter(function ( src ){
    return /\.js$/.test(src)
  })
  var css = srcs.filter(function ( src ){
    return /\.css$/.test(src)
  })
  var toLoad = 0
  if ( scripts.length ) ++toLoad
  if ( css.length ) ++toLoad
  if ( !toLoad ) done()
  var next = function (){
    if ( !--toLoad ) done()
  }
  if ( scripts.length ) inject.script(scripts, next)
  if ( css.length ) inject.css(css, next)
}

inject.script = asyncLoader(injectScript)

inject.scriptSync = syncLoader(injectScript)

inject.css = asyncLoader(function ( src, next ){
  var ok
    , error = null
    , link = document.createElement("link")
  link.onload = function ( e ){
    ok || next(error)
    ok = true
  }
  link.onerror = function ( e ){
    ok || next(error = e)
    ok = true
  }
  document.head.appendChild(link)
  link.src = src
})

},{}],9:[function(require,module,exports){
var Radio = require("./Radio")

var methods = [
  'get', 'post', 'put', 'head', 'delete', 'options', 'trace', 'copy', 'lock', 'mkcol',
  'move', 'propfind', 'proppatch', 'unlock', 'report', 'mkactivity', 'checkout',
  'merge', 'm-search', 'notify', 'subscribe', 'unsubscribe', 'patch'
]

var mime = {}
mime["html"] = mime["text"] = "text/html"
mime["json"] = "application/json"
mime["xml"] = "application/xml"
mime["urlencoded"] = mime["form"] = mime["url"] = "application/x-www-form-urlencoded"
mime["form-data"] = mime["multipart"] = "multipart/form-data"

// upgrading your browser a bit
if ( !"".trim ) {
  String.prototype.trim = function (){
    return this.replace(/(^\s*|\s*$)/g, '')
  }
}
if ( ![].forEach ) {
  Array.prototype.forEach = function ( cb, context ){
    var i = -1
      , l = this.length
    while ( ++i < l ) {
      cb.call(context, this[i], i, this)
    }
  }
}

// utils

function createError( type, message ){
  var err = new Error(message)
  err.type = type
  return err
}

function createHTTP( cors ){
  var root = window || this
  var http = null
  if ( root.XMLHttpRequest && (root.location.protocol != "file:" || !root.ActiveXObject) ) {
    http = new XMLHttpRequest
    if ( cors && !("withCredentials" in http) ) {
      http = null
    }
  } else {
    if ( cors ) {
      if ( typeof root.XDomainRequest != "undefined" ) {
        http = new root.XDomainRequest()
      }
    }
    else {
      try { return new ActiveXObject("Microsoft.XMLHTTP") }
      catch ( e ) {}
      try { return new ActiveXObject("Msxml2.XMLHTTP.6.0") }
      catch ( e ) {}
      try { return new ActiveXObject("Msxml2.XMLHTTP.3.0") }
      catch ( e ) {}
      try { return new ActiveXObject("Msxml2.XMLHTTP") }
      catch ( e ) {}
    }
  }
  return http
}

function noop(){}

function extend( obj, ext ){
  for ( var key in ext ) {
    if ( ext.hasOwnProperty(key) ) obj[key] = ext[key]
  }
  return obj
}

function parseData( data ){
  var ret = {}
  data.split("&").forEach(function ( pair ){
    var parts = pair.split("=")
    ret[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1])
  })
  return ret
}

function serializeData( data ){
  var pairs = []
  for ( var key in data ) {
    pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
  }
  return pairs.join("&")
}

/**
 * A class to orchestrate a request
 *
 * @param method{String}
 * @param url{String}
 * */
function RequestOptions( method, url ){
  this.headers = {}
  this.query = {}
  this.data = null
  this.form = null
  this.method = method
  this.url = url
}

RequestOptions.prototype = {}
RequestOptions.prototype.guessHeader = function (){
  var contentType = this.getHeader("Content-Type")
  if ( contentType ) return
  var data = this.form || this.data
  var dataType = {}.toString.call(data)
  switch ( true ) {
    case this.method == "GET":
    case this.method == "HEAD":
      break
    case typeof data == "string":
    case typeof data == "number":
    case typeof data == "boolean":
      this.setHeader("Content-Type", "text/html")
      break
    case dataType == "[object File]":
    case dataType == "[object Blob]":
    case dataType == "[object FormData]":
      break
    case dataType == "[object Object]":
    case Array.isArray(data):
    default:
      this.setHeader("Content-Type", "application/json")
  }
}
RequestOptions.prototype.createBody = function (){
  var data = this.form || this.data
  var dataType = {}.toString.call(data)
  var contentType = this.getHeader("Content-Type")
  switch ( true ) {
    case this.method == "GET":
    case this.method == "HEAD":
    case typeof data == "string":
    case dataType == "[object File]":
    case dataType == "[object Blob]":
    case dataType == "[object FormData]":
    case !contentType:
      return data
    case contentType == "application/x-www-form-urlencoded":
      return serializeData(data)
    case contentType == "application/json":
      return JSON.stringify(data)
    default:
      return data
  }
}
RequestOptions.prototype.prepare = function (){
  var http = createHTTP(this.cors)
  var query = serializeData(this.query)
  var method = this.method
  var url = this.url
  var headers = this.headers

  // query string
  if ( query ) {
    url += ~url.indexOf("?")
      ? "&" + query
      : "?" + query
  }

  // CORS
  if ( this.withCredentials ) http.withCredentials = true

  // open connection
  if ( this.user && this.password ) {
    http.open(method, url, true, this.user, this.password)
  }
  else {
    http.open(method, this.url, true)
  }

  // set request headers
  for ( var field in headers ) {
    if ( headers[field] ) {
      http.setRequestHeader(field, headers[field])
    }
  }

  return http
}
RequestOptions.prototype.attach = function ( field, file, filename ){
  if ( window.FormData ) {
    this.form = this.form || new FormData()
    if ( this.form.append ) {
      this.form.append(field, file, filename)
    }
    else {
      throw new Error("Couldn't append to " + this.form)
    }
  }
  else {
    this.addData(field, file)
  }
}
RequestOptions.prototype.setData = function ( name, value ){
  if ( value != undefined ) {
    this.data = this.data || {}
    this.data[name] = value
  }
  else {
    this.data = name
  }
  this.guessHeader()
}
RequestOptions.prototype.setForm = function ( form ){
  if ( form instanceof Element && form.tagName == "FORM" ) {
    if ( window.FormData ) {
      this.form = new FormData(form)
    }
    else {
      [].slice.call(form).forEach(function ( field ){
        if ( field.name ) this.addData(field.name, field.value)
      }, this)
    }
  }
  else {
    this.form = form
  }
  this.guessHeader()
}
RequestOptions.prototype.addData = function ( name, value ){
  this.data = this.data || {}
  if ( value != undefined ) {
    this.data[name] = value
  }
  else if ( typeof name != "string" ) extend(this.data, name)
  this.guessHeader()
}
/**
 * Get the lowercase key value of a header.
 * */
RequestOptions.prototype.getHeader = function ( name ){
  return this.headers[name.toLowerCase()]
}
/**
 * Set a single header or a hash of header key-value pairs.
 * The key is lowercased.
 * */
RequestOptions.prototype.setHeader = function ( key, value ){
  if ( value != undefined ) {
    this.headers[key.toLowerCase()] = value
  }
  else if ( typeof key != "string" ) {
    for ( var field in key ) {
      this.headers[field.toLowerCase()] = key[field]
    }
  }
}

RequestOptions.prototype.addQuery = function ( key, value ){
  if ( value != undefined ) {
    this.query[key] = value
  }
  else if ( typeof key != "string" ) {
    for ( var field in key ) {
      this.query[field] = key[field]
    }
  }
}
RequestOptions.prototype.setUser = function ( user, password ){
  this.user = user
  this.password = password
}

/**
 * An objecet representing a request
 *
 * @param method{String}
 * @param url{String}
 * */
function Request( method, url ){
  this.channels = {}
  this.options = new RequestOptions(method, url)
}

Request.prototype = {}
extend(Request.prototype, Radio.prototype)

/**
 * Set `Authorization` header field.
 *
 * @param user {String}
 * @param pass {String}
 * @return {Request}
 * */
Request.prototype.auth = function ( user, pass ){
  this.header("Authorization", "Basic" + btoa(user + ":" + pass))
  return this
}

/**
 * Set `user` and `password` arguments for http request `open` method.
 *
 * @param user {String}
 * @param pass {String}
 * @return {Request}
 * */
Request.prototype.user = function ( user, pass ){
  this.options.setUser(user, pass)
  return this
}

/**
 * Set header field(s)
 *
 * @param field {Object|String}
 * @param [value] {String}
 * @return {Request}
 * */
Request.prototype.header = function ( field, value ){
  this.options.setHeader(field, value)
  return this
}

/**
 * @param name {Object|String} a hash of query key/value pairs or a query key
 * @param [value] {String} query must be String if given
 * */
Request.prototype.query = function ( name, value ){
  this.options.addQuery(name, value)
  return this
}

/**
 * Set `Content-Type` header
 *
 * @param contentType {String}
 * @return {Request}
 * */
Request.prototype.contentType = function ( contentType ){
  contentType = mime[contentType] || contentType
  this.header("Content-Type", contentType)
  return this
}

/**
 * Set `Accept` header
 *
 * @param accept {String}
 * @return {Request}
 * */
Request.prototype.accept = function ( accept ){
  accept = mime[accept] || accept
  this.header("Accept", accept)
  return this
}

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 */
Request.prototype.withCredentials = function (){
  this.options.withCredentials = true
  return this
}

/**
 * Set the data to be sent to a form as FormData (if available)
 *
 * @param form {Element|FormData} the form to be sent
 * @return {Request}
 * */
Request.prototype.form = function ( form ){
  this.options.setForm(form)
  return this
}

/**
 * Appends data to the internal form data.
 * Using the `FormData` API.
 *
 * @param field{String}
 * @param file{Blob|File}
 * @param [filename]{String}
 * @return {Request}
 */
Request.prototype.attach = function ( field, file, filename ){
  this.options.attach(field, file, filename)
  return this
}

/**
 * Adding fields to the internal data hash.
 * Calling this without explicitly setting the Content-Type header
 * will automatically set it to `application/json`.
 * @param name{Object|String}
 * @param [value]{String}
 * @return {Request}
 * */
Request.prototype.send = function ( name, value ){
  this.options.setData(name, value)
  return this
}

/**
 * Append fields to the data to be sent.
 * @param name{Object|String}
 * @param [value]{String}
 * @return {Request}
 * */
Request.prototype.append = function ( name, value ){
  this.options.addData(name, value)
  return this
}

/**
 * Abort the request.
 * Also fires the `abort` event.
 * @return {Request}
 * */
Request.prototype.abort = function (){
  if ( this.aborted ) return this
  this.aborted = true
  this.http.abort()
  this.broadcast("abort")
  return this
}

/**
 * Set a timeout for the request.
 * If the timer expires before the request finishes
 * it aborts the request and posses a `timeout` error to the callback.
 *
 * @param ms{Number}
 * @return {Request}
 * */
Request.prototype.timeout = function ( ms ){
  this.timeoutTime = ms
  return this
}

/**
 * Enable Cross Origin requests.
 * If an explicit attempt is made for a cross origin request,
 * but such a thing is not supported by your browser,
 * the request fails before opening a connection.
 * In this case an error with a type of `cors` will be passed to the end callback.
 *
 * @return {Request}
 * */
Request.prototype.cors = function (){
  this.options.cors = true
  return this
}

/**
 * Kicks off the communication.
 *
 * @param [callback]{Function}
 * @return {Request}
 * */
Request.prototype.end = function ( callback ){
  callback = callback || noop
  var req = this
  var options = this.options
  var http = options.prepare()
  var timeoutId
  var timeout = this.timeoutTime
  this.http = http

  if ( this.options.cors && !http ) {
    callback(createError("cors", "Cross Origin requests are not supported"))
    return this
  }

  http.onreadystatechange = function (){
    if ( http.readyState != 4 ) return
    if ( http.status == 0 ) {
      if ( req.aborted ) {
        callback(createError("timeout", "Connection timed out"))
      }
      else {
        callback(createError("crossDomain", "Origin is not allowed by Access-Control-Allow-Origin"))
      }
    }
    else req.broadcast("end")
  }
  if ( http.upload ) {
    http.upload.onprogress = function ( e ){
      e.percent = e.loaded / e.total * 100
      req.broadcast("progress", e)
    }
  }

  req.listenOnce("abort", function (){
    clearTimeout(timeoutId)
  })
  req.listenOnce("end", function (){
    clearTimeout(timeoutId)
    callback(null, new Response(this))
  })

  if ( timeout ) {
    timeoutId = setTimeout(function (){
      req.abort()
    }, options.timeout)
  }

  this.broadcast("send")
  http.send(options.createBody())
  return this
}

// Response initializers

function setStatus( res, req ){
  var http = req.http
  var status = http.status
  var type = status / 100 | 0

  res.status = http.status
  res.statusType = type

  res.info = type == 1
  res.ok = type == 2
  res.clientError = type == 4
  res.serverError = type == 5
  res.error = (type == 4 || type == 5)
    ? new Error("Cannot " + req.options.method + " " + req.options.url + " " + status)
    : false

  res.created = status == 201
  res.accepted = status == 202
  res.noContent = status == 204 || status == 1223
  res.badRequest = status == 400
  res.unauthorized = status == 401
  res.notAcceptable = status == 406
  res.notFound = status == 404
  res.forbidden = status == 403
  res.internalServerError = status == 500
}

function parseHeaders( req ){
  var headers = req.http.getAllResponseHeaders()
    , lines = headers.split(/\r?\n/)
    , fields = {}

  lines.pop() // trailing CRLF
  lines.forEach(function ( line ){
    var i = line.indexOf(":")
      , field = line.slice(0, i).toLowerCase()
    fields[field] = line.slice(i + 1).trim()
  })

  fields["content-type"] = req.http.getResponseHeader("content-type")
  return fields
}

function parseBody( contentType, responseText ){
  switch ( contentType ) {
    case "application/x-www-form-urlencoded":
      return parseData(responseText)
    case "application/json":
      return JSON.parse(responseText)
    default:
      return responseText
  }
}

function parseValue( val ){
  var low = val.toLowerCase()
    , int = parseInt(val)
    , float = parseFloat(val)
  switch ( true ) {
    case low == "true":
      return true
    case low == "false":
      return false
    case low == "null":
      return null
    case !isNaN(float):
      return float
    case !isNaN(int):
      return int
    default :
      return val
  }
}

function Response( req ){
  var resp = this
  var http = req.http
  this.text = http.responseText
  setStatus(this, req)
  this.headers = parseHeaders(req)
  var contentType = this.header("Content-Type")
  if ( contentType ) contentType.split(/\s*;\s*/).forEach(function ( str ){
    var p = str.split(/\s*=\s*/)
    if ( p[1] ) {
      resp[p[0]] = p[1]
    }
    else {
      resp.contentType = p[0]
    }
  })
  this.body = req.method != "HEAD" && http.responseText && this.contentType
    ? parseBody(this.contentType, http.responseText)
    : {}
}

Response.prototype = {
  body: null,
  header: function ( field ){
    return this.headers[field.toLowerCase()]
  },
  headerParams: function ( field ){
    var header = this.header(field)
    if ( !header ) return null
    var params = {}
    header.split(/\s*[;,]\s*/).forEach(function ( str ){
      var p = str.split(/\s*=\s*/)
        , key = p[0]
        , val = p[1]
      if ( val ) {
        params[key] = parseValue(val)
      }
      else {
        params[key] = true
      }
    })
    return params
  }
}

/**
 * main request function
 *
 * @param method{String}
 * @param url{String}
 * */
function request( method, url ){
  switch ( true ) {
    case !url:
      return new Request("GET", method)
    case typeof url == "function":
      return new Request("GET", method).end(url)
    default :
      return new Request(method, url)
  }
}

// define common request methods as static functions
methods.forEach(function ( method ){
  request[method.toLowerCase()] = function ( url, fn ){
    var req = request(method.toUpperCase(), url)
    fn && req.end(fn)
    return req
  }
})

module.exports = request

},{"./Radio":1}],10:[function(require,module,exports){
(function (global){
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
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./core/Role":2,"./core/attribute":3,"./core/event":4,"./core/extend":5,"./core/filter":6,"./core/find":7,"./core/inject":8,"./core/request":9}],11:[function(require,module,exports){
module.exports=require(10)
},{"./core/Role":2,"./core/attribute":3,"./core/event":4,"./core/extend":5,"./core/filter":6,"./core/find":7,"./core/inject":8,"./core/request":9}]},{},[10])
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
  var match = new RegExp("(?:^|\\s)" + name + ":(\\w+?)(?::|\\s|$)")
  return filter.elements(root, function ( el ){
    return attr.contains(el, match)
      ? filter.FILTER_PICK
      : filter.FILTER_SKIP
  })
}

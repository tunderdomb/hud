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



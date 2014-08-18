module.exports = function extend( obj, extension ){
  for ( var prop in extension ) {
    if( extension.hasOwnProperty(prop) ) obj[prop] = extension[prop]
  }
  return obj
}
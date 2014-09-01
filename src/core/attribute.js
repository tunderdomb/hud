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
    .replace(/-(.)/, function ( m, l ){
      return l.toUpperCase()
    })
}
function keyRole( roleName ){
  return roleName && roleName.match(/^(?:.+:)?(.+)$/)[1]
}
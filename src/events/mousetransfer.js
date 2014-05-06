(function (){
  var listeners = 0
    , globalAdded = false
    , lastX
    , lastY

  function watchDoc( e ){
    lastX = e.x
    lastY = e.y
  }

  function pos( el ){
    var parent = el
      , left = 0
      , top = 0
    while ( parent && parent.offsetLeft != undefined && parent.offsetTop != undefined ) {
      left += parent.offsetLeft
      top += parent.offsetTop
      parent = parent.parentNode
    }
    return {
      top: top,
      left: left,
      right: left + el.offsetWidth,
      bottom: top + el.offsetHeight
    }
  }

  hud.event("mousetransfer", function ( element, listener, capture ){
    ++listeners
    if ( !globalAdded ) window.addEventListener("mousemove", watchDoc, false)

    function mouseover( e ){
      var direction
        , p = pos(element)
        , left = p.left
        , top = p.top
        , bottom = p.bottom
        , right = p.right
      switch ( true ) {
        case left < lastX && lastX < right:
          direction = lastY < e.y ? "top" : "bottom"
          break
        case top < lastY && lastY < bottom:
          direction = lastX < e.x ? "left" : "right"
          break
      }
      listener(direction+"-in")
    }

    function mouseout( e ){
      var direction
        , p = pos(element)
        , left = p.left
        , top = p.top
        , bottom = p.bottom
        , right = p.right
      switch ( true ) {
        case left < lastX && lastX < right:
          direction = lastY < e.y ? "bottom" : "top"
          break
        case top < lastY && lastY < bottom:
          direction = lastX < e.x ? "right" : "left"
          break
      }
      listener(direction+"-out")
    }

    element.addEventListener("mouseenter", mouseover, false)
    element.addEventListener("mouseleave", mouseout, false)
    return function ( element, listener, capture ){
      element.removeEventListener("mouseenter", mouseover, false)
      element.removeEventListener("mouseleave", mouseout, false)
      if ( !--listeners ) window.removeEventListener("mousemove", watchDoc, false)
    }
  })

}())
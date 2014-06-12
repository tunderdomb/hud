(function (){
  var getPositions = hud.dimensions

  var contact = hud.event("contact", function ( element, listener, capture ){
    function contactListener(){
      listener(getPositions(element))
    }
    window.addEventListener("scroll", contactListener, capture)
    return function ( element, listener, capture ){
      window.removeEventListener("scroll", contactListener, capture)
    }
  })
}())

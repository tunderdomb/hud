var event = require("../core/event")
var position = require("../dom/position")
event("contact", function ( element, listener, capture ){
  function vp(  ){
    return position.viewport(element)
  }
  function offset(  ){
    return position.offset(element)
  }
  function contactListener(){
    listener(vp, offset)
  }

  window.addEventListener("scroll", contactListener, capture)
  return function ( element, listener, capture ){
    window.removeEventListener("scroll", contactListener, capture)
    vp = offset = contactListener = null
  }
})
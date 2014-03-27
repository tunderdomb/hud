
hud.defineEvent("type", function( el, callback ){
  var pressed = 0
    , released = 1
  function press( e ){
    pressed && callback.call(this, e)
    released = 0
  }
  function up( e ){
    if ( !released ) {
      callback.call(this, e)
      released = 1
    }
    pressed = 0
  }
  el.addEventListener("keypress", press)
  el.addEventListener("keyup", up)
  return function removeListeners(){
    el.removeEventListener("keypress", press)
    el.removeEventListener("keyup", up)
  }
})

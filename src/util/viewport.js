(function ( hud ){
  hud.viewport = function (){
    var width = 0
      , height = 0
    if ( typeof( window.innerWidth ) == 'number' ) {
      //Non-IE
      width = window.innerWidth;
      height = window.innerHeight;
    } else if ( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
      //IE 6+ in 'standards compliant mode'
      width = document.documentElement.clientWidth
      height = document.documentElement.clientHeight
    } else if ( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
      //IE 4 compatible
      width = document.body.clientWidth
      height = document.body.clientHeight
    }
    return {
      width: width,
      height: height
    }
  }
}(hud || (hud = window.hud = {})))
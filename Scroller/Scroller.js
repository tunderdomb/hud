!function( context, f ){
  context.Scroller = f()
}( this, function(  ){

  /**
   * Scroller constructor
   * */
  function Scroller( root, options ){
    var S = this
      , doc
      , targets

    this.busy = false

    // get the actually scrollable element
    if ( !root.nodeName || !!~["iframe", "#document", "html", "body"].indexOf(root.nodeName.toLowerCase()) ) {
      doc = (root.contentWindow || root).document || root.ownerDocument || root
      root = /webkit/i.test(navigator.userAgent) || doc.compatMode == "BackCompat"
        ? doc.body
        : doc.documentElement;
    }
    this.root = root

    this.targets = targets = [].slice.call(root.querySelectorAll('[role~="scroller:target"]'))
    this.links = [].slice.call(root.querySelectorAll('[role~="scroller:link"]')).forEach(function( link ){
      link.addEventListener("click", function ( e ){
        if( S.busy ) return
        S.busy = true
        targets.some(function ( target ){
          if ( target.dataset.target == this.dataset.target ) {
            S.scrollTo(target)
            return true
          }
          return false
        }, this)
      }, false)
    })
  }
  Scroller.prototype = {
    delta: 10,
    fps: 60,
    scrollTo: function( target ){
      var S = this
      if ( S.onScroll ) {
        S.onScroll(S.root, target, function(  ){
          S.busy = false
        })
      }
      else {
        var id
          , fromTop = 0
        while ( target && target != S.root ) {
          fromTop += target.offsetTop
          target = target.offsetParent
        }
        // scroll up
        if ( fromTop < 0 ) {
          id = setTimeout(function(  ){
            // keep decreasing the target distance
            fromTop += S.delta
            // if default delta would overscroll,
            // just scroll with the difference of the remaining distance
            // and the default delta to reach destination
            if ( 0 < fromTop ) {
              S.root.scrollTop -= fromTop
              S.busy = false
              clearTimeout(id)
            }
            S.root.scrollTop -= S.delta
          }, 1000 / S.fps)
        }
        // scroll down
        else if ( 0 < fromTop ) {
          id = setTimeout(function (){
            fromTop -= S.delta
            if ( fromTop < 0 ) {
              S.root.scrollTop -= fromTop
              S.busy = false
              clearTimeout(id)
            }
            S.root.scrollTop += S.delta
          }, 1000 / S.fps)
        }
      }
    },
    onScroll: function( root, target, done ){
      done()
    }
  }
  return Scroller
} )
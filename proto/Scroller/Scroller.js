!function( context, f ){
  context.Scroller = f()
}( this, function(  ){

  /**
   * Scroller constructor
   * */
  function Scroller( root, options ){
    options = options || {}
    var S = this
      , doc
      , targets

    S.busy = false

    S.delta = options.delta || S.delta
    S.fps = options.fps || S.fps

    // get the actually scrollable element
    if ( !root.nodeName || !!~["iframe", "#document", "html", "body"].indexOf(root.nodeName.toLowerCase()) ) {
      doc = (root.contentWindow || root).document || root.ownerDocument || root
      root = /webkit/i.test(navigator.userAgent) || doc.compatMode == "BackCompat"
        ? doc.body
        : doc.documentElement;
    }
    S.root = root

    S.targets = targets = [].slice.call(root.querySelectorAll('[role~="scroller:target"]'))
    S.links = [].slice.call(root.querySelectorAll('[role~="scroller:link"]')).forEach(function( link ){
      link.addEventListener("click", function ( e ){
        if( S.busy ) return
        S.busy = true
        targets.some(function ( target ){
          if ( target.dataset.target == this.dataset.target ) {
            S.scrollTo(target, function(  ){
              S.busy = false
            })
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
    scrollTo: function( target, done ){
      var S = this
      if ( S.onScroll ) {
        S.onScroll(S.root, target, function(  ){
          done && done()
        })
      }
      else {
        var id
          , fromTop = 0
        while ( target && target != S.root ) {
          fromTop += target.offsetTop
          target = target.offsetParent
        }
        if ( S.root.scrollTop < fromTop ) {
          fromTop -= S.root.scrollTop
        }
        else if ( fromTop < S.root.scrollTop ) {
          fromTop += S.root.scrollTop
        }
        // scroll up
        if ( fromTop < 0 ) {
          id = setInterval(function(  ){
            // keep decreasing the target distance
            fromTop += S.delta
            // if default delta would overscroll,
            // just scroll with the difference of the remaining distance
            // and the default delta to reach destination
            if ( 0 < fromTop ) {
              S.root.scrollTop -= S.delta - fromTop
              clearInterval(id)
              done && done()

            }
            else S.root.scrollTop -= S.delta
          }, 1000 / S.fps)
        }
        // scroll down
        else if ( 0 < fromTop ) {
          id = setInterval(function (){
            fromTop -= S.delta
            if ( fromTop < 0 ) {
              S.root.scrollTop += S.delta + fromTop
              clearInterval(id)
              done && done()
            }
            else S.root.scrollTop += S.delta
          }, 1000 / S.fps)
        }
      }
    },
    onScroll: null
  }
  return Scroller
} )
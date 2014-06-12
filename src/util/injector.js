(function ( hud ){

  function asyncLoader( load ){
    return function ( sources, done ){
      if ( typeof sources == "string" ) {
        sources = [sources]
      }
      var failed
        , toLoad = sources.length

      function next( error, src ){
        if ( error ) {
          failed = failed || []
          failed.push({
            src: src,
            error: error
          })
        }
        if ( !--toLoad ) {
          done(failed)
        }
      }

      if ( !toLoad ) done()
      else sources.forEach(function ( src ){
        load(src, next)
      })
    }
  }

  function syncLoader( load ){
    return function ( sources, done ){
      if ( typeof sources == "string" ) {
        sources = [sources]
      }
      var failed
        , current = -1
        , toLoad = sources.length

      function next( error, src ){
        if ( error ) {
          failed = failed || []
          failed.push({
            src: src,
            error: error
          })
        }
        if ( ++current == toLoad ) {
          done(failed)
        }
        else {
          load(sources[current], next)
        }
      }

      if ( !toLoad ) done()
      else next()
    }
  }

  function injectScript( src, next ){
    var script = document.createElement("script")
    script.src = src
    script.async = false
    document.head.appendChild(script)
    var ok
      , error = null
    script.onload = function (){
      ok || next(error, src)
      ok = true
    }
    script.onerror = function ( e ){
      ok || next(error = e, src)
      ok = true
    }
  }

  hud.inject = {}

  hud.inject.script = asyncLoader(injectScript)

  hud.inject.scriptSync = syncLoader(injectScript)

  hud.inject.css = asyncLoader(function ( src, next ){
    var script = document.createElement("script")
    script.src = src
    script.async = false
    document.head.appendChild(script)
    var ok
      , error = null
    script.onload = function ( e ){
      ok || next(error, src)
      ok = true
    }
    script.onerror = function ( e ){
      ok || next(error = e, src)
      ok = true
    }
  })
}(hud || (hud = window.hud = {})))

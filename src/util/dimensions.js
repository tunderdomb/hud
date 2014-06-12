(function( hud ){

  function getElementPosition( el ){
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
      bottom: top + el.offsetHeight,
      height: el.offsetHeight,
      width: el.offsetWidth
    }
  }

  function getScrollPosition(){
    var el = getScrollable()
    return {
      top: el.scrollTop,
      left: el.scrollLeft
    }
  }

  function getStyle( el, prop ){
    var value = ""
    if ( window.getComputedStyle ) {
      value = getComputedStyle(el).getPropertyValue(prop)
    }
    else if ( el.currentStyle ) {
      try {
        value = el.currentStyle[prop]
      }
      catch ( e ) {}
    }
    return value;
  }

  var getScrollable = hud.getScrollable
    , getViewPortSize = hud.getViewPortSize

  if( !getScrollable ) throw new Error("Missing component 'hud.scrollable'")
  if( !getViewPortSize ) throw new Error("Missing component 'hud.viewport'")

  /**
   * Return <element-side>From<viewport-side> variations
   * */
  hud.dimensions = function( element ){
    var dims = getElementPosition(element)
    dims.paddingWidth = dims.width
      + parseInt(getStyle(element, "padding-left"))
      + parseInt(getStyle(element, "padding-right"))
    dims.paddingHeight = dims.height
      + parseInt(getStyle(element, "padding-top"))
      + parseInt(getStyle(element, "padding-bottom"))
    dims.borderWidth = dims.paddingWidth
      + parseInt(getStyle(element, "border-left"))
      + parseInt(getStyle(element, "border-right"))
    dims.borderHeight = dims.paddingHeight
      + parseInt(getStyle(element, "border-top"))
      + parseInt(getStyle(element, "border-bottom"))
    dims.marginWidth = dims.paddingWidth
      + parseInt(getStyle(element, "margin-left"))
      + parseInt(getStyle(element, "margin-right"))
    dims.marginHeight = dims.paddingHeight
      + parseInt(getStyle(element, "margin-top"))
      + parseInt(getStyle(element, "margin-bottom"))
    return dims
  }

  hud.positions = function( element ){
    var scrollPos = getScrollPosition()
      , elementPos = getElementPosition(element)
      , viewPort = getViewPortSize()
      , viewPortCenterY = (viewPort.height / 2) >> 0
      , viewPortCenterX = (viewPort.width / 2) >> 0
      , elementCenterY = (elementPos.height / 2) >> 0
      , elementCenterX = (elementPos.width / 2) >> 0

      , topFromTop = elementPos.top - scrollPos.top
      , topFromCenter = topFromTop - viewPortCenterY
      , topFromBottom = topFromTop - viewPort.height

      , bottomFromTop = topFromTop + elementPos.height
      , bottomFromCenter = topFromCenter + elementPos.height
      , bottomFromBottom = topFromBottom + elementPos.height

      , leftFromLeft = elementPos.left - scrollPos.left
      , leftFromCenter = leftFromLeft - viewPortCenterX
      , leftFromRight = leftFromLeft - viewPort.width

      , rightFromLeft = leftFromLeft + elementPos.width
      , rightFromCenter = leftFromCenter + elementPos.width
      , rightFromRight = leftFromRight + elementPos.width

      , centerFromCenterY = topFromCenter + elementCenterY
      , centerFromCenterX = leftFromCenter + elementCenterX

    return {
      topFromTop: topFromTop,
      topFromCenter: topFromCenter,
      topFromBottom: topFromBottom,
      leftFromLeft: leftFromLeft,
      leftFromCenter: leftFromCenter,
      leftFromRight: leftFromRight,
      rightFromLeft: rightFromLeft,
      rightFromCenter: rightFromCenter,
      rightFromRight: rightFromRight,
      bottomFromTop: bottomFromTop,
      bottomFromCenter: bottomFromCenter,
      bottomFromBottom: bottomFromBottom,
      centerFromCenterY: centerFromCenterY,
      centerFromCenterX: centerFromCenterX
    }
  }

}(hud || (hud = {})))
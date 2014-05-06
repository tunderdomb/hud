(function (){

  var getScrollable = hud.getScrollable
    , getViewPortSize = hud.getViewPortSize

  if( !getScrollable ) throw new Error("Missing component 'hud.scrollable'")
  if( !getViewPortSize ) throw new Error("Missing component 'hud.viewport'")

  function getScrollPosition(){
    var el = getScrollable()
    return {
      top: el.scrollTop,
      left: el.scrollLeft
    }
  }

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

  /**
   * Return <element-side>From<viewport-side> variations
   * */
  function createContactEvent( element ){
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

  var contact = hud.event("contact", function ( element, listener, capture ){
    function contactListener(){
      listener(createContactEvent(element))
    }
    window.addEventListener("scroll", contactListener, capture)
    return function ( element, listener, capture ){
      window.removeEventListener("scroll", contactListener, capture)
    }
  })

  contact.createContactEvent = createContactEvent
  contact.getScrollPosition = getScrollPosition
  contact.getElementPosition = getElementPosition

}())

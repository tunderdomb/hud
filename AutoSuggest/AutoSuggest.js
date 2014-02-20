!function( context, f ){
  context.AutoSuggest = f()
}( this, function(  ){

  /**
   * AutoSuggest constructor
   * @param container{Element} the root element to look for components.
   * @param options{Object} [optional] options object.
   *
   * */
  function AutoSuggest( container, options ){
    var AS = this

    for( var prop in options ){
      if( AS[prop] ) AS[prop] = options[prop]
    }

    // actual option elements
    AS.options = [].slice.call(container.querySelector('[role="autosuggest:select"]').options)
    // suggestion container for elements
    AS.list = container.querySelector('[role="autosuggest:list"]')
    // suggestion menu flag
    AS.isOpen = false
    // text input
    AS.name = container.querySelector('[role="autosuggest:input"]')
    // active real option element
    AS.active = null
    // generated options
    AS.elements = []
    // highlighted option index
    AS.highlighted = -1
    // filtered options
    AS.suggestions = []

    // init suggestion list
    AS.options.forEach(function( option ){
      var el = document.createElement("li")
      el.className = "city-option"
      el.textContent = option.textContent
      // on select
      el.addEventListener("click", function ( e ){
        e.stopPropagation()
        e.preventDefault()
        AS.select(option)
      }, false)
      AS.list.appendChild(el)
      AS.elements.push(el)
      AS.suggestions.push(el)
    })

    // open menu
    container.addEventListener("click", function ( e ){
      e.stopPropagation()
      AS.filter(AS.name.value)
      AS.open()
    }, false)

    // close menu on blur
    AS.name.addEventListener("blur", function(  ){
      AS.select(AS.name.value)
      // stop disappearing immediately on select (click on list item)
      setTimeout(function(  ){
        AS.close()
      }, 500)
    }, false)

    // close on valid select or esc
    AS.name.addEventListener("keydown", function ( e ){
      switch( e.keyCode ){
        case 27:
          e.preventDefault()
          AS.close()
          break
        case 13:
          e.preventDefault()
          AS.select(AS.highlighted)
          break
        case 38:
          e.preventDefault()
          if( !AS.suggestions.length )
            break
          AS.highlight(AS.highlighted - 1 < 0
            ? AS.suggestions.length-1
            : AS.highlighted-1)
          break
        case 40:
          e.preventDefault()
          if( !AS.suggestions.length )
            break
          AS.highlight(AS.highlighted + 1 >= AS.suggestions.length
            ? 0
            : AS.highlighted+1)
          break
      }
    }, false)

    // filter list on type
    AS.name.addEventListener("keyup", function ( e ){
      switch( e.keyCode ){
        case 27:
        case 13:
        case 38:
        case 40:
          e.preventDefault()
          break
        default:
          AS.open()
          AS.filter(AS.name.value)
      }
    }, false)
  }

  AutoSuggest.spawn = function( container, options ){
    return new AutoSuggest(container, options)
  }

  AutoSuggest.spawnAll = function( containers, options ){
    var list = []
    containers.forEach(function( container ){
      list.push(new AutoSuggest(container, options))
    })
    return list
  }

  AutoSuggest.prototype = {
    setSelections: function( selections ){
      if ( selections instanceof Element ) {

      }
      else if( selections.length ) {

      }
    },
    /**
     * Used to show a suggestion element
     * */
    show: function( el ){
      el.style.display = "block"
    },
    /**
     * Used to hide a suggestion element
     * */
    hide: function( el ){
      el.style.display = "none"
    },
    /**
     * Open the suggestion list
     * */
    open:function (  ){
      this.onopen(this.list)
      this.isOpen = true
    },
    /**
     * Called when opening the suggestion list
     * should make the list visible
     * */
    onOpen: function( el ){
      el.classList.add("open")
    },
    /**
     * Close the suggestion list
     * */
    close: function (  ){
      this.onClose(this.list)
      this.isOpen = false
    },
    /**
     * Called when closing suggestion list
     * should make the list disappear
     * */
    onClose: function( el ){
      el.classList.remove("open")
    },
    /**
     * Select a suggestion item.
     * It actually updates the selected option element's `selected` attribute
     * if the selection is valid. Then closes the suggestion menu.
     * @param sel{String|Number|HTMLOptionElement} the item to select
     * */
    select: function( sel ){
      var AS = this
      if ( typeof sel == "string" ) {
        var term = new RegExp("^"+sel+"$", 'i')
        sel = null
        AS.suggestions.forEach(function( el ){
          if( term.test(el.textContent) ){
            sel = AS.options[AS.elements.indexOf(el)]
          }
        }, this)
      }
      else if ( typeof sel == "number" ){
        if ( ~sel && AS.suggestions[sel] ) {
          sel = AS.options[AS.elements.indexOf(AS.suggestions[sel])]
        }
        else sel = null
      }
      if( !sel ) return
      if( AS.active ) AS.active.selected = false
      sel.selected = true
      AS.active = sel
      AS.name.value = sel.textContent
      AS.close()
      AS.onSelect && AS.onSelect.call(AS)
    },
    /**
     * Called when selecting an option.
     * */
    onSelect: function(  ){},
    /**
     * Filters the suggestions according to the current value in the
     * input element.
     * Should update the internal `suggestion` list with appropriate elements.
     * @param value{String} the current value of the input element.
     * */
    filter: function( value ){
      var AS = this
      var term = new RegExp(value, 'i')
      AS.suggestions = []
      AS.elements.forEach(function( option ){
        option.classList.remove("selected")
        if( !term.test(option.textContent) ){
          AS.hide(option)
        }
        else {
          AS.show(option)
          AS.suggestions.push(option)
        }
      })
      AS.highlight(0)
    },
    /**
     * Highlight a generated list element
     * */
    highlight: function( i ){
      var AS = this
      if( !AS.suggestions.length ) return
      if( ~AS.highlighted && AS.suggestions[AS.highlighted] )
        AS.onDimSuggestion(AS.suggestions[AS.highlighted])
      if( ~i && this.suggestions[i] ){
        AS.onHighlightSuggestion(AS.suggestions[i])
        AS.scrollIntoView(AS.suggestions[i])
      }
      AS.highlighted = i
    },
    /**
     * Called when a list element is highlighted.
     * Should make it look distinct from the others.
     * */
    onHighlightSuggestion: function( el ){
      el.classList.add("highlighted")
    },
    /**
     * Called when dimming the highlight on an element.
     * Should clear the item's highlighted state.
     * */
    onDimSuggestion: function( el ){
      el.classList.remove("highlighted")
    },
    /**
     * Scroll a generated list element into the view,
     * if it overflows the suggestion list.
     * */
    scrollIntoView: function ( el ){
      var AS = this
      var fromTop = el.offsetTop-AS.list.scrollTop
        , fromBottom = AS.list.offsetHeight-(fromTop+el.offsetHeight)
      if ( fromTop < 0 )
        AS.list.scrollTop += fromTop
      else if( fromBottom < 0 )
        AS.list.scrollTop -= fromBottom
    }
  }

  return AutoSuggest
} )
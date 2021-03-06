(function ( window, $, Fancy ) {

    Fancy.require( {
        jQuery: false,
        Fancy : "1.0.8"
    } );

    var i       = 1,
        NAME    = "FancyTooltip",
        VERSION = "1.1.2",
        logged  = false,
        mouse   = {
            x: 0,
            y: 0
        };

    function truncated( obj ) {
        return obj[ 0 ].scrollWidth > obj[ 0 ].clientWidth;
    }

    var Observer = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

    function FancyTooltip( element, settings ) {
        var SELF      = this;
        SELF.id       = i;
        SELF.name     = NAME;
        SELF.version  = VERSION;
        SELF.element  = element;
        SELF.hasTitle = false;
        SELF.timer    = {};
        i++;

        SELF.settings = $.extend( {}, Fancy.settings [ NAME ], settings );
        SELF.html     = {
            tooltip: $( "<div/>", {
                id   : NAME,
                class: SELF.settings.animation
            } ),
            inner  : $( "<div/>", {
                id: NAME + "-inner"
            } ),
            arrow  : $( "<div/>", {
                id: NAME + "-arrow"
            } )
        };
        SELF.html.tooltip.append( SELF.html.arrow );
        SELF.html.tooltip.append( SELF.html.inner );

        if ( !logged ) {
            logged = true;
            Fancy.version( SELF );
            $( document ).on( "mousemove." + NAME, function ( e ) {
                mouse.x = e.clientX || e.pageX;
                mouse.y = e.clientY || e.pageY;
            } );
        }

        SELF.hide();
        if ( SELF.settings.zIndex >= 0 ) {
            SELF.html.tooltip.css( "zIndex", SELF.settings.zIndex );
        }

        SELF.getOffset = function () {
            var left = mouse.x + SELF.settings.left,
                top  = mouse.y + SELF.settings.top,
                css  = {};
            SELF.html.tooltip.css( {
                whiteSpace: "nowrap"
            } );
            SELF.html.tooltip.removeClass( "left" );


            var width = SELF.html.tooltip.outerWidth( true );
            if ( left + width + 60 >= window.innerWidth ) {
                SELF.html.tooltip.addClass( "left" );
                left -= width + SELF.settings.left * 2;
            }
            if ( SELF.settings.clip !== "mouse" ) {
                var relative = $( SELF.element.parents().filter( function () {
                        return $( this ).css( "position" ) == "relative" && $( this ).css( "overflowX" ) != "hidden";
                    } )[ 0 ] ),
                    parent   = SELF.element.offsetParent();


                if ( SELF.settings.clip == "left" ) {
                    SELF.html.tooltip.addClass( "left" );
                    left -= element.outerWidth() + SELF.settings.left + SELF.html.tooltip.outerWidth();
                    top += Fancy( element ).fullHeight( true ) / 2 + SELF.settings.top;
                } else if ( SELF.settings.clip == "right" ) {
                    left += element.outerWidth() + SELF.settings.left;
                    top += element.height() / 2 + SELF.settings.top;
                }
                if ( !relative.length ) {
                    relative = $( "body" );
                    relative.append( SELF.html.tooltip );
                    element      = relative.is( parent ) ? SELF.element : parent;
                    var position = element.offset();
                    top          = position.top;
                    left         = position.left;
                    if ( SELF.settings.clip == "left" ) {
                        SELF.html.tooltip.addClass( "left" );
                        left -= element.outerWidth() + SELF.settings.left + SELF.html.tooltip.outerWidth();
                        top += element.height() / 2 + SELF.settings.top;
                    } else if ( SELF.settings.clip == "right" ) {
                        left += element.outerWidth() + SELF.settings.left;
                        top += element.height() / 2 + SELF.settings.top;
                    }
                } else {
                    relative.append( SELF.html.tooltip );
                    element    = relative.is( parent ) ? SELF.element : parent;
                    position   = element.position();
                    top        = position.top;
                    left       = position.left;
                    var scroll = Fancy.scrollParent( element );
                    if ( scroll.length ) {
                        top += scroll[ 0 ].scrollTop;
                    }

                }
            }
            SELF.html.tooltip.css( {
                whiteSpace: ""
            } );
            css.top      = top;
            css.left     = left;
            css.parent   = parent;
            css.position = "fixed";

            return css;
        };

        SELF.element.addClass( SELF.name + "-element" );
        SELF.element.data( SELF.name, SELF );
        if ( SELF.element.attr( "title" ) ) {
            SELF.hasTitle = SELF.element.attr( "title" );
            if ( !SELF.element.data( "title" ) ) {
                SELF.element.data( "title", SELF.hasTitle );
            }
            SELF.element.removeAttr( "title" );
        }

        if ( SELF.settings.cursor && SELF.element.css( "cursor" ) == "auto" ) {
            SELF.element.css( "cursor", SELF.settings.cursor );
        }

        if ( Observer ) {
            SELF.observer = new Observer( function ( mutation ) {
                mutation.forEach( function ( mut ) {
                    if ( mut.type = "attributes" && mut.attributeName == "title" && SELF.element[ 0 ].hasAttribute( "title" ) ) {
                        if ( SELF.element.attr( "title" ) ) {
                            SELF.element.data( "title", SELF.element.attr( "title" ) );
                            SELF.element.removeAttr( "title" );
                        } else {
                            SELF.element.data( "title", null );
                        }
                    }
                } );
            } );
            SELF.observer.observe( SELF.element [ 0 ], {
                attributes: true
            } );
        }


        SELF.DOMNodeRemovedFromDocument = function () {
            SELF.hide();
        };
        SELF.element [ 0 ].addEventListener( "DOMNodeRemovedFromDocument", SELF.DOMNodeRemovedFromDocument, false );

        SELF.element.hover( function () {
            do {
                var tt = $( "#" + NAME );
                tt.remove();
            } while ( tt.length );
            clearTimeout( SELF.timer[ "hide" ] );
            SELF.timer[ "show" ] = setTimeout( function () {
                if ( SELF.settings.query.call( SELF, SELF.element, SELF.settings.ever, truncated( SELF.element ) ) && !SELF.settings.disabled ) {
                    if ( !SELF.settings.disabled ) {
                        SELF.show();
                    }
                    if ( SELF.settings.move && SELF.settings.clip == "mouse" ) {
                        $( document ).on( "mousemove." + NAME + "-" + SELF.id, function () {
                            if ( !SELF.html.tooltip.hasClass( "in" ) ) {
                                SELF.html.tooltip.addClass( "in" );
                            }
                            SELF.html.tooltip.css( SELF.getOffset() );
                        } );
                    }
                }
            }, SELF.settings.delay );
        }, function () {
            clearTimeout( SELF.timer[ "show" ] );
            SELF.timer[ "hide" ] = setTimeout( function () {
                SELF.hide();
                if ( SELF.settings.move ) {
                    $( document ).unbind( "." + NAME + "-" + SELF.id );
                }
                SELF.element.removeClass( NAME + "-hover" );
            }, 50 );
        } );

        return SELF;
    }

    FancyTooltip.api = FancyTooltip.prototype = {};
    FancyTooltip.api.version = VERSION;
    FancyTooltip.api.name    = NAME;
    FancyTooltip.api.disable = function () {
        this.elements.removeClass( NAME );
        this.settings.disabled = true;
        this.hide();
        return this;
    };
    FancyTooltip.api.enable  = function () {
        this.settings.disabled = false;
        this.elements.addClass( NAME );
        return this;
    };
    FancyTooltip.api.show    = function () {
        var SELF = this;
        if ( this.settings.animation ) {
            clearTimeout( this.timer );
            SELF.html.tooltip.removeClass( "in out" ).addClass( "in" );
        } else {
            SELF.html.tooltip.css( "opacity", 1 );
        }

        SELF.element.addClass( NAME + "-hover" );
        SELF.html.inner.html( SELF.settings.text || SELF.element.data( "title" ) || (SELF.element[ 0 ].nodeName === "INPUT" || SELF.element[ 0 ].nodeName === "TEXTAREA" ? SELF.element.val() : SELF.element.html()) );


        var offset = SELF.getOffset();
        SELF.html.tooltip.css( {
            position: offset.position,
            top     : offset.top,
            left    : offset.left,
            maxWidth: window.innerWidth / 3
        } );
        return this;
    };
    FancyTooltip.api.destroy = function () {
        var SELF = this;
        SELF.hide();
        SELF.element.removeClass( NAME + "-hover" ).removeClass( NAME + "-element" ).off( "mouseenter mouseleave" );
        $( document ).unbind( "." + NAME + "-" + SELF.id );
        delete SELF.element.data()[ NAME ];
        SELF.element.css( "cursor", "" );
        SELF.element [ 0 ].removeEventListener( "DOMNodeRemovedFromDocument", SELF.DOMNodeRemovedFromDocument, false );
        if ( SELF.observer ) {
            SELF.observer.disconnect();
        }
        if ( SELF.hasTitle ) {
            SELF.element.attr( "title", SELF.hasTitle );
        }
    };
    FancyTooltip.api.hide    = function () {
        var SELF = this;
        if ( SELF.settings.animation ) {
            SELF.html.tooltip.addClass( "out" );
            SELF.timer = setTimeout( function () {
                SELF.html.tooltip.remove();
            }, SELF.settings.animationTimeout );
        } else {
            SELF.html.tooltip.remove();
        }
        return this;
    };

    Fancy.settings [ NAME ] = {
        top             : 0,
        left            : 0,
        ever            : true,
        text            : false,
        move            : true,
        delay           : 0,
        disabled        : false,
        animation       : false,
        animationTimeout: 200,
        query           : function () {
            return true;
        },
        cursor          : false,
        clip            : "right"
    };

    Fancy.tooltip     = VERSION;
    Fancy.api.tooltip = function ( settings ) {
        return this.set( NAME, function ( el ) {
            return new FancyTooltip( el, settings );
        } );
    };
})( window, jQuery, Fancy );

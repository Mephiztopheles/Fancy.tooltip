(function ( $ ) {

    Fancy.require ( {
        jQuery: false,
        Fancy : "1.0.1"
    } );

    var i       = 1,
        NAME    = "FancyTooltip",
        VERSION = "1.0.2",
        logged  = false,
        mouse   = {
            x: 0,
            y: 0
        };

    function truncated ( obj ) {
        return obj[ 0 ].scrollWidth > obj[ 0 ].clientWidth;
    }

    var Observer = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

    function FancyTooltip ( element, settings ) {
        var SELF     = this;
        SELF.id      = i;
        SELF.name    = NAME;
        SELF.version = VERSION;
        SELF.element = element;
        SELF.timer   = {};
        i++;

        SELF.settings = $.extend ( {}, Fancy.settings [ NAME ], settings );
        SELF.html     = {
            tooltip: $ ( '<div/>', {
                id   : NAME,
                class: SELF.settings.animation
            } ),
            inner  : $ ( '<div/>', {
                id: NAME + '-inner'
            } ),
            arrow  : $ ( '<div/>', {
                id: NAME + '-arrow'
            } )
        };
        SELF.html.tooltip.append ( SELF.html.arrow );
        SELF.html.tooltip.append ( SELF.html.inner );

        if ( !logged ) {
            logged = true;
            Fancy.version ( SELF );
            $ ( document ).on ( 'mousemove.' + NAME, function ( e ) {
                mouse.x = e.clientX || e.pageX;
                mouse.y = e.clientY || e.pageY;
            } );
        }

        SELF.hide ();
        if ( SELF.settings.zIndex >= 0 )
            SELF.html.tooltip.css ( 'zIndex', SELF.settings.zIndex );

        SELF.getOffset = function () {
            var left = mouse.x - SELF.settings.left + (Fancy.scrollParent ( SELF.element ) [ 0 ].scrollLeft || 0),
                top  = mouse.y + SELF.settings.top + (Fancy.scrollParent ( SELF.element ) [ 0 ].scrollTop || 0),
                css  = {};

            SELF.html.tooltip.css ( {
                whiteSpace: 'nowrap'
            } );
            SELF.html.tooltip.removeClass ( "left" );
            if ( left + SELF.html.tooltip.width () + 60 >= window.innerWidth ) {
                SELF.html.tooltip.addClass ( "left" );
                left -= SELF.html.tooltip.outerWidth () + SELF.settings.left * 2;
            }
            SELF.html.tooltip.css ( {
                whiteSpace: ''
            } );
            css.top  = top;
            css.left = left;

            return css;
        };

        SELF.element.addClass ( SELF.name + "-element" );
        SELF.element.data ( SELF.name, SELF );
        if ( !SELF.element.data ( 'title' ) )
            SELF.element.data ( 'title', SELF.element.attr ( 'title' ) );
        SELF.element.removeAttr ( 'title' );

        if ( SELF.settings.cursor && SELF.element.css ( 'cursor' ) == 'auto' )
            SELF.element.css ( 'cursor', SELF.settings.cursor );

        var observer = new Observer ( function ( mutation ) {
            var mut = mutation [ 0 ];
            if ( mut.type = "attributes" && mut.attributeName == "title" && SELF.element.attr ( 'title' ) ) {
                SELF.element.data ( 'title', SELF.element.attr ( 'title' ) );
                SELF.element.removeAttr ( 'title' );
            }
        } );
        observer.observe ( SELF.element [ 0 ], {
            attributes: true
        } );

        SELF.element [ 0 ].addEventListener ( "DOMNodeRemovedFromDocument", function () {
            SELF.hide ();
        }, false );

        SELF.element.hover ( function ( e ) {
            clearTimeout ( SELF.timer[ "hide" ] );
            SELF.timer[ "show" ] = setTimeout ( function () {
                if ( SELF.settings.query ( SELF.element, SELF.settings.ever, truncated ( SELF.element ) ) && !SELF.settings.disabled ) {
                    if ( !SELF.settings.disabled )
                        SELF.show ();
                    if ( SELF.settings.move ) {
                        $ ( document ).on ( 'mousemove.' + NAME + "-" + SELF.id, function () {
                            if ( !SELF.html.tooltip.hasClass ( 'in' ) )
                                SELF.html.tooltip.addClass ( 'in' );
                            SELF.html.tooltip.css ( SELF.getOffset () );
                        } );
                    }
                }
            }, SELF.settings.delay );
        }, function () {
            SELF.timer[ "hide" ] = setTimeout ( function () {
                clearTimeout ( SELF.timer[ "show" ] );
                SELF.hide ();
                if ( SELF.settings.move ) {
                    $ ( document ).unbind ( "." + NAME + "-" + SELF.id );
                }
                SELF.element.removeClass ( NAME + "-hover" );
            }, 50 );
        } );

        return SELF;
    }


    FancyTooltip.api = FancyTooltip.prototype = {};
    FancyTooltip.api.version = VERSION;
    FancyTooltip.api.name    = NAME;
    FancyTooltip.api.disable = function () {
        this.elements.removeClass ( NAME );
        this.settings.disabled = true;
        this.hide ();
        return this;
    };

    FancyTooltip.api.enable = function () {
        this.settings.disabled = false;
        this.elements.addClass ( NAME );
        return this;
    };

    FancyTooltip.api.show = function () {
        var SELF = this;
        $ ( "body" ).append ( SELF.html.tooltip );
        if ( this.settings.animation ) {
            clearTimeout ( this.timer );
            SELF.html.tooltip.removeClass ( 'in out' ).addClass ( 'in' );
        } else {
            SELF.html.tooltip.css ( 'opacity', 1 );
        }

        SELF.element.addClass ( NAME + "-hover" );
        SELF.html.inner.html ( SELF.element.data ( 'title' ) || SELF.element.html () );
        SELF.html.tooltip.css ( {
            position: 'absolute',
            top     : SELF.getOffset ().top,
            left    : SELF.getOffset ().left,
            maxWidth: window.innerWidth / 3
        } );
        return this;
    };

    FancyTooltip.api.destroy = function () {
        var SELF = this;
        SELF.hide ();
        SELF.element.removeClass ( NAME + '-hover' );
        $ ( document ).unbind ( '.' + NAME + "-" + SELF.id );
    };

    FancyTooltip.api.hide = function () {
        var SELF = this;
        if ( SELF.settings.animation ) {
            SELF.html.tooltip.addClass ( 'out' );
            SELF.timer = setTimeout ( function () {
                SELF.html.tooltip.remove ();
            }, 200 );
        } else {
            SELF.html.tooltip.remove ();
        }
        return this;
    };

    Fancy.settings [ NAME ] = {
        top     : 30,
        left    : 30,
        ever    : true,
        text    : false,
        move    : true,
        delay   : 0,
        disabled: false,
        query   : function () {
            return true;
        },
        cursor  : false
    };

    Fancy.tooltip     = VERSION;
    Fancy.api.tooltip = function ( settings ) {
        return this.set ( NAME, function ( el ) {
            return new FancyTooltip ( el, settings );
        } );
    };
}) ( jQuery );

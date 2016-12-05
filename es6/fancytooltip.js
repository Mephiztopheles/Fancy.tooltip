(function ( window, $, Fancy ) {

    /*Fancy.require( {
        jQuery: false,
        Fancy : "1.0.8"
    } );*/

    function truncated( obj ) {
        return obj[ 0 ].scrollWidth > obj[ 0 ].clientWidth;
    }

    var Observer = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

    var i      = 1,
        logged = false,
        mouse  = { x: 0, y: 0 };

    class FancyTooltip {

        static get index() {
            return i;
        }

        static get defaults() {
            return {
                top     : 30,
                left    : 30,
                ever    : true,
                text    : false,
                move    : true,
                delay   : 0,
                disabled: false,
                query   : () => true,
                cursor  : false
            };
        }

        static get version() {return "2.0.0"}

        static get logged() {return logged}

        static get name() {return "FancyTooltip"}

        constructor( element = null, settings ) {
            // super();
            this.element  = element;
            this.settings = $.extend( {}, FancyTooltip.defaults, settings );
            if ( !this.element ) {
                throw "Error: Element required";
            }

            this.id    = i;
            this.timer = {};
            i++;

            this.html = {
                tooltip: $(
                    "<div/>", {
                        id   : FancyTooltip.name,
                        class: this.settings.animation
                    }
                ),
                inner  : $(
                    "<div/>", {
                        id: FancyTooltip.name + "-inner"
                    }
                ),
                arrow  : $(
                    "<div/>", {
                        id: FancyTooltip.name + "-arrow"
                    }
                )
            };
            this.html.tooltip.append( this.html.arrow );
            this.html.tooltip.append( this.html.inner );

            if ( !logged ) {
                logged = true;
                Fancy.version( this );
                $( document ).on( "mousemove." + FancyTooltip.name, function ( e ) {
                    mouse.x = e.clientX || e.pageX;
                    mouse.y = e.clientY || e.pageY;
                } );
            }

            this.hide();
            if ( this.settings.zIndex >= 0 ) {
                this.html.tooltip.css( "zIndex", this.settings.zIndex );
            }

            this.getOffset = function () {
                var left = mouse.x - this.settings.left,
                    top  = mouse.y + this.settings.top,
                    css  = {};

                this.html.tooltip.css( {
                    whiteSpace: "nowrap"
                } );
                this.html.tooltip.removeClass( "left" );
                if ( left + this.html.tooltip.outerWidth() + 60 >= window.innerWidth ) {
                    this.html.tooltip.addClass( "left" );
                    left -= this.html.tooltip.outerWidth() + this.settings.left * 2;
                }
                this.html.tooltip.css( {
                    whiteSpace: ""
                } );
                css.top  = top;
                css.left = left;

                return css;
            };

            this.element.addClass( this.name + "-element" );
            this.element.data( this.name, this );
            if ( !this.element.data( "title" ) ) {
                this.element.data( "title", this.element.attr( "title" ) );
            }
            this.element.removeAttr( "title" );

            if ( this.settings.cursor && this.element.css( "cursor" ) == "auto" ) {
                this.element.css( "cursor", this.settings.cursor );
            }

            if ( Observer ) {
                var observer = new Observer( ( mutation )=> {
                    var mut = mutation [ 0 ];
                    if ( mut.type == "attributes" && mut.attributeName == "title" && this.element.attr( "title" ) ) {
                        this.element.data( "title", this.element.attr( "title" ) );
                        this.element.removeAttr( "title" );
                    }
                } );
                observer.observe( this.element [ 0 ], {
                    attributes: true
                } );
            }

            this.element [ 0 ].addEventListener( "DOMNodeRemovedFromDocument", ()=> {
                this.hide();
            }, false );

            this.element.hover( ( e )=> {
                clearTimeout( this.timer[ "hide" ] );
                this.timer[ "show" ] = setTimeout( ()=> {
                    if ( this.settings.query( this.element, this.settings.ever, truncated( this.element ) ) && !this.settings.disabled ) {
                        if ( !this.settings.disabled ) {
                            this.show();
                        }
                        if ( this.settings.move ) {
                            $( document ).on( "mousemove." + FancyTooltip.name + "-" + this.id, ()=> {
                                if ( !this.html.tooltip.hasClass( "in" ) ) {
                                    this.html.tooltip.addClass( "in" );
                                }
                                this.html.tooltip.css( this.getOffset() );
                            } );
                        }
                    }
                }, this.settings.delay );
            }, ()=> {
                clearTimeout( this.timer[ "show" ] );
                this.timer[ "hide" ] = setTimeout( ()=> {
                    this.hide();
                    if ( this.settings.move ) {
                        $( document ).unbind( "." + FancyTooltip.name + "-" + this.id );
                    }
                    this.element.removeClass( FancyTooltip.name + "-hover" );
                }, 50 );
            } );

            return this;
        }

        disable() {
            this.settings.disabled = true;
            this.elements.removeClass( this.name );
            this.hide();
            return this;
        }

        enable() {
            this.settings.disabled = false;
            this.elements.addClass( this.name );
        }

        show() {
            $( "body" ).append( this.html.tooltip );
            if ( this.settings.animation ) {
                clearTimeout( this.timer );
                this.html.tooltip.removeClass( "in out" ).addClass( "in" );
            } else {
                this.html.tooltip.css( "opacity", 1 );
            }

            this.element.addClass( this.name + "-hover" );
            this.html.inner.html( this.element.data( "title" ) || (this.element[ 0 ].nodeName === "INPUT" || this.element[ 0 ].nodeName === "TEXTAREA" ? this.element.val() : this.element.html()) );
            this.html.tooltip.css( {
                position: "fixed",
                top     : this.getOffset().top,
                left    : this.getOffset().left,
                maxWidth: window.innerWidth / 3
            } );
            return this;
        }

        destroy() {
            this.element.removeClass( this.name + "-hover" );
            $( document ).unbind( "." + this.name + "-" + this.id );
        }

        hide() {
            if ( this.settings.animation ) {
                this.html.tooltip.addClass( "out" );
                this.timer = setTimeout( ()=> {
                    this.html.tooltip.remove();
                }, 200 );
            } else {
                this.html.tooltip.remove();
            }
            return this;
        }
    }
    /*
        function FancyTooltip( element, settings ) {
            var SELF     = this;
            SELF.id      = i;
            SELF.name    = NAME;
            SELF.version = VERSION;
            SELF.element = element;
            SELF.timer   = {};
            i++;

            SELF.settings = $.extend( {}, Fancy.settings [ NAME ], settings );
            SELF.html     = {
                tooltip: $(
                    "<div/>", {
                        id   : NAME,
                        class: SELF.settings.animation
                    }
                ),
                inner  : $(
                    "<div/>", {
                        id: NAME + "-inner"
                    }
                ),
                arrow  : $(
                    "<div/>", {
                        id: NAME + "-arrow"
                    }
                )
            };
            SELF.html.tooltip.append( SELF.html.arrow );
            SELF.html.tooltip.append( SELF.html.inner );

            if( !logged ) {
                logged = true;
                Fancy.version( SELF );
                $( document ).on( "mousemove." + NAME, function( e ) {
                    mouse.x = e.clientX || e.pageX;
                    mouse.y = e.clientY || e.pageY;
                } );
            }

            SELF.hide();
            if( SELF.settings.zIndex >= 0 )
                SELF.html.tooltip.css( "zIndex", SELF.settings.zIndex );

            SELF.getOffset = function() {
                var left = mouse.x - SELF.settings.left,
                    top  = mouse.y + SELF.settings.top,
                    css  = {};

                SELF.html.tooltip.css( {
                    whiteSpace: "nowrap"
                } );
                SELF.html.tooltip.removeClass( "left" );
                if( left + SELF.html.tooltip.outerWidth() + 60 >= window.innerWidth ) {
                    SELF.html.tooltip.addClass( "left" );
                    left -= SELF.html.tooltip.outerWidth() + SELF.settings.left * 2;
                }
                SELF.html.tooltip.css( {
                    whiteSpace: ""
                } );
                css.top  = top;
                css.left = left;

                return css;
            };

            SELF.element.addClass( SELF.name + "-element" );
            SELF.element.data( SELF.name, SELF );
            if( !SELF.element.data( "title" ) )
                SELF.element.data( "title", SELF.element.attr( "title" ) );
            SELF.element.removeAttr( "title" );

            if( SELF.settings.cursor && SELF.element.css( "cursor" ) == "auto" )
                SELF.element.css( "cursor", SELF.settings.cursor );

            if( Observer ) {
                var observer = new Observer( function( mutation ) {
                    var mut = mutation [ 0 ];
                    if( mut.type = "attributes" && mut.attributeName == "title" && SELF.element.attr( "title" ) ) {
                        SELF.element.data( "title", SELF.element.attr( "title" ) );
                        SELF.element.removeAttr( "title" );
                    }
                } );
                observer.observe( SELF.element [ 0 ], {
                    attributes: true
                } );
            }

            SELF.element [ 0 ].addEventListener( "DOMNodeRemovedFromDocument", function() {
                SELF.hide();
            }, false );

            SELF.element.hover( function( e ) {
                    clearTimeout( SELF.timer[ "hide" ] );
                    SELF.timer[ "show" ] = setTimeout( function() {
                        if( SELF.settings.query( SELF.element, SELF.settings.ever, truncated( SELF.element ) ) && !SELF.settings.disabled ) {
                            if( !SELF.settings.disabled )
                                SELF.show();
                            if( SELF.settings.move ) {
                                $( document ).on( "mousemove." + NAME + "-" + SELF.id, function() {
                                    if( !SELF.html.tooltip.hasClass( "in" ) )
                                        SELF.html.tooltip.addClass( "in" );
                                    SELF.html.tooltip.css( SELF.getOffset() );
                                } );
                            }
                        }
                    }, SELF.settings.delay );
                }, function() {
                    clearTimeout( SELF.timer[ "show" ] );
                    SELF.timer[ "hide" ] = setTimeout( function() {
                        SELF.hide();
                        if( SELF.settings.move ) {
                            $( document ).unbind( "." + NAME + "-" + SELF.id );
                        }
                        SELF.element.removeClass( NAME + "-hover" );
                    }, 50 );
                }
            );

            return SELF;
        }

        FancyTooltip.api = FancyTooltip.prototype = {};
        FancyTooltip.api.version = VERSION;
        FancyTooltip.api.name    = NAME;
        FancyTooltip.api.disable = function() {
            this.elements.removeClass( NAME );
            this.settings.disabled = true;
            this.hide();
            return this;
        };
        FancyTooltip.api.enable  = function() {
            this.settings.disabled = false;
            this.elements.addClass( NAME );
            return this;
        };
        FancyTooltip.api.show    = function() {
            var SELF = this;
            $( "body" ).append( SELF.html.tooltip );
            if( this.settings.animation ) {
                clearTimeout( this.timer );
                SELF.html.tooltip.removeClass( "in out" ).addClass( "in" );
            } else {
                SELF.html.tooltip.css( "opacity", 1 );
            }

            SELF.element.addClass( NAME + "-hover" );
            SELF.html.inner.html( SELF.element.data( "title" ) || (SELF.element[ 0 ].nodeName === "INPUT" || SELF.element[ 0 ].nodeName === "TEXTAREA" ? SELF.element.val() : SELF.element.html()) );
            SELF.html.tooltip.css( {
                position: "fixed",
                top     : SELF.getOffset().top,
                left    : SELF.getOffset().left,
                maxWidth: window.innerWidth / 3
            } );
            return this;
        };
        FancyTooltip.api.destroy = function() {
            var SELF = this;
            SELF.hide();
            SELF.element.removeClass( NAME + "-hover" );
            $( document ).unbind( "." + NAME + "-" + SELF.id );
        };
        FancyTooltip.api.hide    = function() {
            var SELF = this;
            if( SELF.settings.animation ) {
                SELF.html.tooltip.addClass( "out" );
                SELF.timer = setTimeout( function() {
                    SELF.html.tooltip.remove();
                }, 200 );
            } else {
                SELF.html.tooltip.remove();
            }
            return this;
        };*/

    window.FancyTooltip = FancyTooltip;
    /*Fancy.tooltip     = VERSION;
    Fancy.api.tooltip = function ( settings ) {
        return this.set( NAME, function ( el ) {
            return new FancyTooltip( el, settings );
        } );
    };*/
})( window, jQuery, Fancy );

class Person {
    @readonly
    name() { return `${this.first} ${this.last}` }
}
function readonly() {
    console.log( arguments );
}
/*
@isTestable(true)
class MyClass { }

function isTestable(value) {
    return function decorator(target) {
        target.isTestable = value;
    }
}*/

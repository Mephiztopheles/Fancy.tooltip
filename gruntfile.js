module.exports = function ( grunt ) {

    grunt.initConfig( {
        uglify: {
            options: {
                mangle   : true,
                sourceMap: true
            },
            dev    : {
                files: {
                    "fancytooltip.min.js": [ "fancytooltip.js" ]
                }
            }
        }
    } );

    grunt.loadNpmTasks( "grunt-contrib-uglify" );
};
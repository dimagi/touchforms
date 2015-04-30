module.exports = function(grunt) {
    var buildDir = 'formplayer/static/formplayer/script/build/';
    var jstFiles = {};
    jstFiles[buildDir + 'fullform-ui.templates.js'] = [
        'formplayer/templates/formplayer/fullform-ui/*.html'
    ];

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jst: {
            compile: {
                files: jstFiles
            }
        },
        watch: {
            files: 'formplayer/templates/formplayer/fullform-ui/*.html',
            tasks: ['jst']
        },
        clean: [buildDir + '*']
    });

    grunt.registerTask(
        'build',
        'Compiles all of the templates into the build directory.',
        ['clean', 'jst']
    );

    // Load the plugin that provides the "jst" task.
    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
};

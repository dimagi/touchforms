module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jst: {
            compile: {
                files: {
                    'formplayer/static/formplayer/script/fullform-ui.templates.js': [
                        'formplayer/templates/formplayer/fullform-ui/*.html'
                    ]
                }
            }
        },
        watch: {
            files: 'formplayer/templates/formplayer/fullform-ui/*.html',
            tasks: ['jst']
        }
    });

    // Load the plugin that provides the "jst" task.
    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-watch');
};

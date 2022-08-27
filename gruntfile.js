//gruntfile.js
const puppeteer = require('puppeteer');

var config = {
    langs: [ "en-us", "pt-br" ],
    content: "./src/main/content/$lang.js",
    html: {
        srcIndex: 'src/main/index.pug',
        src: 'src/main/**/*.pug',
        dist: 'dist/Luis Float CV ($lang).html',
    },
    pdf: {
        src: "file://" + __dirname + "/dist/Luis Float CV ($lang).html",
        dist: "dist/Luis Float CV ($lang).pdf",
    },
};

const vlang = (prop, lang) => prop.replaceAll("$lang", lang);

async function renderPdf() {
    let done = this.async();

    for(let lang of config.langs) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(vlang(config.pdf.src, lang), {
            waitUntil: 'networkidle2',
        });
        await page.pdf({ path: vlang(config.pdf.dist, lang), format: "a4" });

        await browser.close();
    }

    done();
}

function renderHtml() {
    const pugConfig = {};

    for(let lang of config.langs) {
        const files = {};
        files[vlang(config.html.dist, lang)] = [ config.html.srcIndex ];

        pugConfig[lang] = {
            options: {
                data: (dest, src) => require(vlang(config.content, lang))
            },
            files,
        };
    }

    return pugConfig;
}

const watchConfig = (file, task) => { return {
    files: [ config.html.src ],
    tasks: [ 'main:compile:pug' ],
    options: {
        spawn: false,
    },
}}; 

module.exports = function(grunt) {
    grunt.initConfig({
        pug: renderHtml(),
        stylus: {
            compile: {
                options: {
                    paths: [ '' ],
                    relativeDest: '',
                    "include css": true,
                },
                files: {
                    'dist/style.css': [ 'src/main/index.styl' ],
                },
            },
        },
        watch: {
            html: watchConfig(config.html.src, 'main:compile:pug'),
            css: watchConfig('src/main/**/*.styl', 'main:compile:styl'),
        },
    });
  
    grunt.loadNpmTasks('grunt-contrib-pug');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-stylus');
  
    grunt.registerTask('dev', [ 'watch' ]);
    grunt.registerTask('main:compile:pug', [ 'pug' ]);
    grunt.registerTask('main:compile:styl', [ 'stylus' ]);

    grunt.registerTask('main:build', 'Render PDF', renderPdf);
};
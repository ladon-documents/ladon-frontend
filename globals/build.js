const esBuild = require('esbuild');

try {
    esBuild.build({
        entryPoints: ['./main.js'],
        bundle: true,
        minify: true,
        sourcemap: true,
        outfile: './dist/ladon-globals.js',
        platform: 'browser',
        target: ['es2015'],
    });
} catch (e) {
    process.exit(1)
}
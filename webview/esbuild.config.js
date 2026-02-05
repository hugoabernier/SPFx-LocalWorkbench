/**
 * esbuild configuration for webview bundle
 */

const esbuild = require('esbuild');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function build() {
    const ctx = await esbuild.context({
        entryPoints: ['webview/src/main.tsx'],
        bundle: true,
        outfile: 'dist/webview/webview.js',
        loader: { '.tsx': 'tsx', '.ts': 'ts' },
        format: 'iife',
        target: 'es2020',
        platform: 'browser',
        sourcemap: !production,
        minify: production,
        treeShaking: true,
        external: [],
        alias: {
            'react': './webview/react-shim.js',
            'react-dom': './webview/react-dom-shim.js',
            '@fluentui/react': './webview/fluent-shim.js'
        },
        define: {
            'process.env.NODE_ENV': production ? '"production"' : '"development"'
        },
        logLevel: 'info'
    });

    if (watch) {
        await ctx.watch();
        console.log('Watching webview files for changes...');
    } else {
        await ctx.rebuild();
        await ctx.dispose();
        console.log('Webview build complete');
    }
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});

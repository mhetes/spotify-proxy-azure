const fs = require('fs');
const path = require('path');
const mix = require('laravel-mix');

// Specify 'build' dir
const buildDir = path.join(__dirname, 'build');

// Delete 'build' dir if exists
if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
}

// Compile React & CSS files
mix.ts('src/app.tsx', 'build')
    .react()
    .sass('src/styles.scss', 'build')
    .copyDirectory('public', 'build')
    .disableNotifications()
    .sourceMaps(false, 'source-map')
    .options({
        terser: {
            extractComments: false
        }
    });

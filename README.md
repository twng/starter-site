# starter-site
Gulp-based starter kit for web development

Full featured Gulp build pipeline for web development

Features:

SASS preprocessing
CSS optimization
Javascript linting
Script concatenation and minification
CSS and JS Sourcemaps
Browser preview with live reload
Image compression


run `npm install` to install development dependencies.

src folder: source files here: html, js, scss and static assets.

public folder: miscellaneous files for deploying to live server eg. favicon, crossdomain.xml etc.


CSS and SASS
----
Enter paths to any 3rd party SASS libraries (in node_modules) in the PATHS object in the gulpfile

Update the COMPATIBILITY option in the PATHS object for css browser compatibility
(see https://github.com/ai/browserslist)



Javascript
----------
List all scripts for concatenation in the PATHS object.

Images
------

Put images in assets/img folder
If gulp is running, changes will be detected and browsers reloaded.
When building for production, images will be minified with imagemin, set the compression options in the gulp task.

Getting started
---------------

run `npm install` to install development dependencies.


run `npm run start` to start build the site and run the development server.
Site is served from dist.

run `npm run build` to build the production version of the site. Files are compiled to dist.

run `npm run clean` to clean the dist folder and clear the cache.

To do:
Update lint options for PRODUCTION.
Create a build task for processing SVG icons

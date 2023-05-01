const resource = [
    /* --- CSS --- */
    '/killerkenobi.github.io/assets/css/style.css',

    /* --- PWA --- */
    '/killerkenobi.github.io/app.js',
    '/killerkenobi.github.io/sw.js',

    /* --- HTML --- */
    '/killerkenobi.github.io/index.html',
    '/killerkenobi.github.io/404.html',

    
        '/killerkenobi.github.io/categories/',
    
        '/killerkenobi.github.io/tags/',
    
        '/killerkenobi.github.io/archives/',
    
        '/killerkenobi.github.io/about/',
    

    /* --- Favicons & compressed JS --- */
    
    
        '/killerkenobi.github.io/assets/img/favicons/android-chrome-192x192.png',
        '/killerkenobi.github.io/assets/img/favicons/android-chrome-512x512.png',
        '/killerkenobi.github.io/assets/img/favicons/apple-touch-icon.png',
        '/killerkenobi.github.io/assets/img/favicons/favicon-16x16.png',
        '/killerkenobi.github.io/assets/img/favicons/favicon-32x32.png',
        '/killerkenobi.github.io/assets/img/favicons/favicon.ico',
        '/killerkenobi.github.io/assets/img/favicons/mstile-150x150.png',
        '/killerkenobi.github.io/assets/js/dist/categories.min.js',
        '/killerkenobi.github.io/assets/js/dist/commons.min.js',
        '/killerkenobi.github.io/assets/js/dist/misc.min.js',
        '/killerkenobi.github.io/assets/js/dist/page.min.js',
        '/killerkenobi.github.io/assets/js/dist/post.min.js'
];

/* The request url with below domain will be cached */
const allowedDomains = [
    

    'localhost:4000',

    

    'fonts.gstatic.com',
    'fonts.googleapis.com',
    'cdn.jsdelivr.net',
    'polyfill.io'
];

/* Requests that include the following path will be banned */
const denyUrls = [
    
];


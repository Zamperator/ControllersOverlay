module.exports = {
    plugins: [
        require('postcss-nesting'),
        require('autoprefixer'),
        // nur im Build „hübsch“ formatieren
        ...(process.env.NODE_ENV === 'production' ? [require('postcss-prettify')] : [])
    ]
}
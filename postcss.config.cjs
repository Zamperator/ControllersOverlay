module.exports = {
    plugins: [
        require('postcss-nesting'),
        require('autoprefixer'),
        ...(process.env.NODE_ENV === 'production' ? [require('postcss-prettify')] : [])
    ]
}
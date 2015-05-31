var Handlebars = require('handlebars');
var less = require('less');
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
var browserify = require('browserify');
var moment = require('moment');

Handlebars.registerHelper('lowercase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('date', function (val) {
  return moment(val).format('MMM GGGG');
});

module.exports = {
  paths: {
    hbs: path.join(__dirname, 'index.hbs'),
    less: path.join(__dirname, 'index.less'),
    js: path.join(__dirname, 'index.js')
  },
  render: Promise.method(function (resume, opts) {
    opts = opts || {};
    var paths = module.exports.paths;
    return Promise.join(
      // compile template
      fs.readFileAsync(paths.hbs, 'utf8')
        .then(Handlebars.compile),

      // compile styles
      fs.readFileAsync(paths.less, 'utf8')
        .then(function (style) {
          return less.render(style, {
            filename: paths.less,
            compress: true,
            rootpath: path.relative(process.cwd(), __dirname)
          });
        })
        .then(function (res) { return res.css; }),

      Promise.promisifyAll(browserify({
        entries: paths.js,
        transform: [[require('uglifyify'), {global: true}]]
      })).bundleAsync(),

      // compile styles and resume into template to create HTML
      function (render, css, js) {
        var phone = (resume.basics || {}).phone;
        if (phone) resume.basics.cleanedPhone = phone.replace(/[^\d]/g, '');

        return render({
          resume: resume,
          css: css,
          js: js + (opts.js || {}).append || ''
        });
      });
  })
};

var Handlebars = require('handlebars');
var lessc = require('less');
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
var browserify = require('browserify');
var moment = require('moment');
var extend = require('util')._extend;

Handlebars.registerHelper('lowercase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('date', function (val) {
  return moment(val).format('MMM GGGG');
});

function identity (val) { return val; }

module.exports = {
  __dirname: __dirname,
  DEFAULT_OPTS: {
    paths: {
      hbs: 'index.hbs',
      less: 'index.less',
      js: 'index.js'
    },
    hbs: {},
    less: {append: ''},
    js: {append: ''},
    prerender: identity
  },
  render: Promise.method(function (resume, opts) {
    opts = extend(opts || {}, module.exports.DEFAULT_OPTS);
    return Promise
      .props({
        render: fs.readFileAsync(opts.paths.hbs, 'utf8')
          .then(function (hbs) { return Handlebars.compile(hbs, opts.hbs.opts); }),

        css: fs.readFileAsync(opts.paths.less, 'utf8')
          .then(function (less) {
            return lessc.render(less + opts.less.append, extend({
              filename: opts.paths.less,
              compress: true,
              rootpath: path.relative(process.cwd(), __dirname)
            }, opts.less.opts));
          })
          .get('css'),

        js: Promise.promisifyAll(browserify(extend({
          entries: opts.paths.js,
          transform: [[require('uglifyify'), {global: true}]]
        }, opts.js.opts))).bundleAsync()
      })
      .then(opts.prerender)
      .then(function (result) {
        var phone = (resume.basics || {}).phone;
        if (phone) resume.basics.cleanedPhone = phone.replace(/[^\d]/g, '');

        return result.render({
          resume: resume,
          css: result.css,
          js: result.js
        });
      });
  })
};

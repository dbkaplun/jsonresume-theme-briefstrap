var Handlebars = require('handlebars');
var lessc = require('less');
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
var browserify = require('browserify');
var moment = require('moment');
var _ = require('lodash');

Handlebars.registerHelper('lowercase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('date', function (val) {
  return moment(val).format('MMM GGGG');
});

module.exports = {
  __dirname: __dirname,
  DEFAULT_OPTS: {
    paths: {
      hbs: path.resolve(__dirname, 'index.hbs'),
      less: path.resolve(__dirname, 'index.less'),
      js: [path.resolve(__dirname, 'index.js')]
    },
    hbs: {},
    less: {append: ''},
    js: {}
  },
  render: Promise.method(function (resume, opts) {
    opts = _.merge({}, module.exports.DEFAULT_OPTS, opts);
    return Promise
      .props({
        render: fs.readFileAsync(opts.paths.hbs, 'utf8')
          .then(function (hbs) { return Handlebars.compile(hbs, opts.hbs.opts); }),

        css: fs.readFileAsync(opts.paths.less, 'utf8')
          .then(function (less) {
            return lessc.render(less + opts.less.append, _.merge({
              filename: opts.paths.less,
              compress: true,
              rootpath: path.relative(process.cwd(), __dirname)
            }, opts.less.opts));
          })
          .get('css'),

        js: Promise.promisifyAll(browserify(_.merge({
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

var Handlebars = require('handlebars');
var less = require('less');
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
var browserify = require('browserify');
var moment = require('moment');

Handlebars.registerHelper('randomColor', function () {
  var channels = [];
  for (var i = 0; i < 3; i++) channels.push(Math.random()*192|0);
  return 'rgb('+channels.join(',')+')';
});

Handlebars.registerHelper('lowercase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('date', function (val) {
  return moment(val).format('MMM GGGG');
});

module.exports = {
  paths: {
    hbs: path.join(__dirname, 'resume.hbs'),
    less: path.join(__dirname, 'index.less'),
    js: path.join(__dirname, 'index.js')
  },
  render: Promise.method(function (resume) {
    var paths = module.exports.paths;
    return Promise.join(
      // compile template
      fs.readFileAsync(paths.hbs, 'utf8')
        .then(Handlebars.compile),

      // compile styles
      fs.readFileAsync(paths.less, 'utf8')
        .then(function (style) { return less.render(style, {filename: paths.less, compress: true}); })
        .then(function (res) { return res.css; }),

      (function () {
        var b = Promise.promisifyAll(browserify({
          entries: paths.js
        }));
        return b.bundleAsync();
      })(),

      // compile styles and resume into template to create HTML
      function (render, css, js) {
        resume.showSkillsTable = (resume.skills || []).some(function (skill) {
          return skill.name;
        });
        return render({resume: resume, css: css, js: js});
      });
  })
};

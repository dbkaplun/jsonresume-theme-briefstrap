var Handlebars = require('handlebars');
var less = require('less');
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));

Handlebars.registerHelper('labelColor', function () {
	var channels = [];
	for (var i = 0; i < 3; i++) channels.push(Math.random()*192|0);
  return 'rgb('+channels.join(',')+')';
});

Handlebars.registerHelper('lowercase', function (str) {
	return str.toLowerCase();
});

module.exports = {
  paths: {
    hbs: path.join(__dirname, 'resume.hbs'),
    less: path.join(__dirname, 'style.less')
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

      // compile styles and resume into template to create HTML
      function (render, css) {
        return render({resume: resume, css: css});
      });
  })
};

var $ = window.jQuery = require('jquery');

$(function () {
  $('#print-button').click(function (evt) {
    evt.preventDefault();
    window.print();
  });
});

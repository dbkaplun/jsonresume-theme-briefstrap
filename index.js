var $ = window.jQuery = require('jquery');
require('bootstrap/js/tooltip');

$(function () {
  $('[data-toggle="tooltip"]').tooltip({container: 'body'});
  $('#print-button').click(function (evt) { evt.preventDefault(); window.print(); });
});

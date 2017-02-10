(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;
        if (!u && a)
          return a(o, !0);
        if (i)
          return i(o, !0);
        var f = new Error("Cannot find module '" + o + "'");
        throw f.code = "MODULE_NOT_FOUND", f
      }
      var l = n[o] = {
        exports : {}
      };
      t[o][0].call(l.exports, function(e) {
        var n = t[o][1][e];
        return s(n ? n : e)
      }, l, l.exports, e, t, n, r)
    }
    return n[o].exports
  }
  var i = typeof require == "function" && require;
  for (var o = 0; o < r.length; o++)
    s(r[o]);
  return s
})({
  1 : [ function(require, module, exports) {
    function corslite(url, callback, cors) {
      var sent = false;

      if (typeof window.XMLHttpRequest === 'undefined') {
        return callback(Error('Browser not supported'));
      }

      if (typeof cors === 'undefined') {
        var m = url.match(/^\s*https?:\/\/[^\/]*/);
        cors = m && (m[0] !== location.protocol + '//' + location.domain + (location.port ? ':' + location.port : ''));
      }

      var x = new window.XMLHttpRequest();

      function isSuccessful(status) {
        return status >= 200 && status < 300 || status === 304;
      }

      if (cors && !('withCredentials' in x)) {
        // IE8-9
        x = new window.XDomainRequest();

        // Ensure callback is never called synchronously, i.e., before
        // x.send() returns (this has been observed in the wild).
        // See https://github.com/mapbox/mapbox.js/issues/472
        var original = callback;
        callback = function() {
          if (sent) {
            original.apply(this, arguments);
          } else {
            var that = this, args = arguments;
            setTimeout(function() {
              original.apply(that, args);
            }, 0);
          }
        }
      }

      function loaded() {
        if (
        // XDomainRequest
        x.status === undefined ||
        // modern browsers
        isSuccessful(x.status))
          callback.call(x, null, x);
        else
          callback.call(x, x, null);
      }

      // Both `onreadystatechange` and `onload` can fire. `onreadystatechange`
      // has [been supported for longer](http://stackoverflow.com/a/9181508/229001).
      if ('onload' in x) {
        x.onload = loaded;
      } else {
        x.onreadystatechange = function readystate() {
          if (x.readyState === 4) {
            loaded();
          }
        };
      }

      // Call the callback with the XMLHttpRequest object as an error and prevent
      // it from ever being called again by reassigning it to `noop`
      x.onerror = function error(evt) {
        // XDomainRequest provides no evt parameter
        callback.call(this, evt || true, null);
        callback = function() {
        };
      };

      // IE9 must have onprogress be set to a unique function.
      x.onprogress = function() {
      };

      x.ontimeout = function(evt) {
        callback.call(this, evt, null);
        callback = function() {
        };
      };

      x.onabort = function(evt) {
        callback.call(this, evt, null);
        callback = function() {
        };
      };

      // GET is the only supported HTTP Verb by XDomainRequest and is the
      // only one supported here.
      x.open('GET', url, true);

      // Send the request. Sending data is not supported.
      x.send(null);
      sent = true;

      return x;
    }

    if (typeof module !== 'undefined')
      module.exports = corslite;
  }, {} ],
  2 : [ function(require, module, exports) {
  }, {} ],
  3 : [ function(require, module, exports) {
    (function(global) {
      (function() {
        'use strict';

        var L = (typeof window !== "undefined" ? window.L : typeof global !== "undefined" ? global.L : null);
        var corslite = require('corslite');
        var polyline = require('polyline');

        L.Elevation = L.Elevation || {};

        L.Elevation.Widget = L.Class.extend({
          options : {
            serviceUrl : (typeof serviceUrl != "undefined" || serviceUrl != null) ? serviceUrl : server.dev,
            timeout : 30 * 1000
          },

          initialize : function(accessToken, options) {
            L.Util.setOptions(this, options);
            this._accessToken = accessToken;
            this._graphdata = [];
            this._graphoptions = {
                    axislabels : {
                      show : true
                    },
                    threshold : {
                      below : 0,
                      color : "#eee"
                    },
                    grid : {
                     // hoverable : true,
                     /// clickable : true,
                     // autoHighlight : true
                      borderWidth: 1,
                      minBorderMargin: 20,
                      labelMargin: 10,
                      backgroundColor: {
                          colors: ["#fff", "#eee"]
                      },
                      margin: {
                          top: 8,
                          bottom: 25,
                          left: 20
                      }
                    },
                    xaxis : {
                      min : 0,
                      //axisLabel : 'Range',
                      labelWidth: 30,
                      axisLabelUseCanvas : true,
                      axisLabelFontSizePixels : 14,
                      axisLabelFontFamily : 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
                      axisLabelPadding : 10
                    },
                    yaxis : {
                     // axisLabel : 'Height',
                      labelWidth: 30,
                      axisLabelUseCanvas : true,
                      axisLabelFontSizePixels : 14,
                      axisLabelFontFamily : 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
                      axisLabelPadding : 10
                    },
                    series : {
                      stack : true,
                      lines : {
                        show : true,
                        fill : true
                      },
                      points : {
                        radius : 0,
                        show : true,
                        fill : true,
                        fillColor : '#83ce16'
                      },
                    },
                    legend : {
                      show: false
                    },
                    lines : {
                      fill : true,
                      lineWidth : 3,
                    }
                  };
            //initilizing placeholder graph so that user knows there is graph
            $.plot($('#graph'), [[]], this._graphoptions);
            var xaxisLabel = $("<div class='axisLabel xaxisLabel'></div>").text("Range (m)").appendTo($('#graph'));
            var yaxisLabel = $("<div class='axisLabel yaxisLabel'></div>").text("Height (m)").appendTo($('#graph'));
            yaxisLabel.css("margin-top", yaxisLabel.width() / 2 - 20);
          },

          resetChart : function() {
            var plot = $.plot($('#graph'), this._graphdata, this._graphoptions);
            plot.destroy();
            $('#graph').empty();
          },

          profile : function(locations, sampling, marker_update, callback, context, options) {
            var timedOut = false, options = options || {};

            var url = this.buildProfileUrl(locations, sampling, options);

            var timer = setTimeout(function() {
              timedOut = true;
              callback.call(context || callback, {
                status : -1,
                message : 'request timed out.'
              });
            }, this.options.timeout);

            corslite(url, L.bind(function(err, resp) {
              var elevresult;
              clearTimeout(timer);
              if (!timedOut) {
                if (!err) {
                  elevresult = JSON.parse(resp.responseText);
                  marker_update(elevresult);
                  this._graphdata = [ {
                    "data" : elevresult.range_height,
                    "points" : {
                      "symbol" : "circle",
                      "fillColor" : "#eee"
                    },
                    "color" : '#444'
                  } ];
                  $.plot($('#graph'), this._graphdata, this._graphoptions);
                  var xaxisLabel = $("<div class='axisLabel xaxisLabel'></div>").text("Range (m)").appendTo($('#graph'));
                  var yaxisLabel = $("<div class='axisLabel yaxisLabel'></div>").text("Height (m)").appendTo($('#graph'));
                  yaxisLabel.css("margin-top", yaxisLabel.width() / 2 - 20);
                }
              }
            }, this), true);

            return this;
          },
          
          buildProfileUrl : function(locations, sampling, options) {
            var locs = [], locationKey, hint;

            var params = JSON.stringify({
              shape : locations,
              range : true,
              resample_distance : sampling
            });

            // reset service url & access token if environment has changed
            (typeof serviceUrl != 'undefined' || serviceUrl != null) ? this.options.serviceUrl = serviceUrl : this.options.serviceUrl = server.dev;
            (typeof token != "undefined" || token != null) ? this._accessToken = token : this._accessToken = accessToken.dev;

            console.log(this.options.serviceUrl + 'height?json=' + params + '&api_key=' + this._accessToken);

            return this.options.serviceUrl + 'height?json=' + params + '&api_key=' + this._accessToken;
          },

          getDataPoints : function(elevresult) {
            var dataPoints = [];
            for (var xy = 0; xy < elevresult.range_height.length; xy++) {
              dataPoints.push({
                x : elevresult.range_height[xy][0] != null ? elevresult.range_height[xy][0] : 0,
                y : elevresult.range_height[xy][1] != null ? elevresult.range_height[xy][1] : 0
              });
            }
            return dataPoints;
          },

          showTooltip : function(x, y, contents, z) {
            $('<div id="tooltip">' + contents + '</div>').css({
              position : 'absolute',
              display : 'none',
              'font-weight' : 'bold',
              border : '1px solid rgb(255, 221, 221)',
              padding : '2px',
              'background-color' : z,
              opacity : '0.8'
            }).appendTo("body").show();
          },

          bindEvents : function(plot) {
            $('#graph').on('plothover', function(event, pos, item) {
              if (item) {
                if ((previousPoint != item.dataIndex) || (previousLabel != item.series.label)) {
                  previousPoint = item.dataIndex;
                  previousLabel = item.series.label;

                  $("#flot-tooltip").remove();

                  var x = getDataPoints(item.dataPoints[0]), y = item.dataPoints[1];
                  z = item.series.color;

                  showTooltip(item.pageX, item.pageY, "<b>" + item.series.label + "</b><br /> " + x + " = " + y + "mm", z);
                }
              } else {
                $("#flot-tooltip").remove();
                previousPoint = null;
              }
            });
          },

          _locationKey : function(location) {
            return location[0] + ',' + location[1];
          }
        });

        L.Elevation.widget = function(accessToken, options) {
          return new L.Elevation.Widget(accessToken, options);
        };

        module.exports = L.Elevation;
      })();

    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, {
    "corslite" : 1,
    "polyline" : 2
  } ]
}, {}, [ 3 ]);

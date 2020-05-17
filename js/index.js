(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _createForOfIteratorHelper(o) {
    if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
      if (Array.isArray(o) || (o = _unsupportedIterableToArray(o))) {
        var i = 0;

        var F = function () {};

        return {
          s: F,
          n: function () {
            if (i >= o.length) return {
              done: true
            };
            return {
              done: false,
              value: o[i++]
            };
          },
          e: function (e) {
            throw e;
          },
          f: F
        };
      }

      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    var it,
        normalCompletion = true,
        didErr = false,
        err;
    return {
      s: function () {
        it = o[Symbol.iterator]();
      },
      n: function () {
        var step = it.next();
        normalCompletion = step.done;
        return step;
      },
      e: function (e) {
        didErr = true;
        err = e;
      },
      f: function () {
        try {
          if (!normalCompletion && it.return != null) it.return();
        } finally {
          if (didErr) throw err;
        }
      }
    };
  }

  var userGoodReads = '17586923';
  var key = '0JTylMsQ9GNCaSNAIoFDXQ';
  var url = "https://cors-anywhere.herokuapp.com/https://www.goodreads.com/review/list/".concat(userGoodReads, ".xml?key=").concat(key, "&v=2&v=2&shelf=ALL&page=1&per_page=200");
  var config = {
    method: 'GET',
    headers: {
      'Content-Type': 'text/plain',
      'X-Requested-With': 'XMLHttpRequest'
    }
  }; //Get data from the API-MONOLITO-XML. We are in 2020, right?

  fetch(url, config).then(function (data) {
    return data.text().then(function (str) {
      var parseString = new DOMParser().parseFromString(str, 'application/xml');
      var jsonFromXml = xmlToJson(parseString);
      cleanResponse(jsonFromXml);
    });
  }); //Convert XML to JSON https://davidwalsh.name/convert-xml-json

  function xmlToJson(xml) {
    var obj = {};

    if (xml.nodeType == 1) {
      // element
      // do attributes
      if (xml.attributes.length > 0) {
        obj["@attributes"] = {};

        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType == 3) {
      // text
      obj = xml.nodeValue;
    } // do children


    if (xml.hasChildNodes()) {
      for (var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;

        if (typeof obj[nodeName] == "undefined") {
          obj[nodeName] = xmlToJson(item);
        } else {
          if (typeof obj[nodeName].push == "undefined") {
            var old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }

          obj[nodeName].push(xmlToJson(item));
        }
      }
    }

    return obj;
  } //I only want the books that the user has finished reading


  function cleanResponse(json) {
    var books = json.GoodreadsResponse.reviews.review;
    var filterBooksFinished = books.filter(function (book) {
      return Object.keys(book.started_at).length !== 0;
    });
    filterBooksFinished = filterBooksFinished.filter(function (book) {
      return Object.keys(book.read_at).length !== 0;
    });
    formatBooksObject(filterBooksFinished);
  } //The object is still a fucking shit, we are going to do some operations to clean and calculate


  function formatBooksObject(books) {
    console.log("books", books);
    books.forEach(function (d) {
      d.title = Object.values(d.book.title)[0];
      d.pages = Object.values(d.book.num_pages)[0];
      d.started = FFDR(d.started_at);
      d.read = FFDR(d.read_at);
      d.days = Math.abs(d.read - d.started) / 86400000;
      d.average = d.pages / d.days;
    });
    createNewObjectBooks(books);
  } //WTF: we need a function to format date XML-Rails API, kill me madafaka.


  function FFDR(string) {
    console.log("string", string);

    var splitDate = function splitDate(stringDate) {
      return stringDate.split(' ');
    };

    var first = Object.values(string);
    var second = splitDate(first[0]);
    var third = new Date("".concat(second[1], " ").concat(second[2], " ").concat(second[5]));
    return third;
  }
  /*The MONOLITO only returns the day the book started reading, and the day it ended. So we calculate the total reading days: d.days = Math.abs(d.read - d.started) / 86400000. For each day of reading we create a new object, so I can build a timeline.*/


  function createNewObjectBooks(books) {
    var booksClean = []; //Iterate object

    var _iterator = _createForOfIteratorHelper(books),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var item = _step.value;

        //Iterate days to create different objects.
        for (var index = 0; index < item.days; index++) {
          var theDate = new Date(item.started);
          var myNewDate = new Date(theDate);
          myNewDate.setDate(myNewDate.getDate() + index);
          booksClean.push({
            title: item.title,
            day: myNewDate,
            pages: item.pages,
            pagesReaded: item.average * index,
            days: item.days
          });
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    createLineChart(booksClean);
  } //And finally I can create a chart, happy ends...
  //And finally I can create a chart, happy ends...


  function createLineChart(datos) {
    var margin = {
      top: 24,
      right: 24,
      bottom: 24,
      left: 24
    };
    var width = 0;
    var height = 0;
    var chart = d3.select('.ringlera-chart');
    var svg = chart.select('svg');
    var scales = {};

    function setupScales() {
      var countX = d3.scaleTime().domain(d3.extent(datos, function (d) {
        return d.day;
      }));
      var countY = d3.scaleLinear().domain([0, d3.max(datos, function (d) {
        return d.pages;
      })]);
      scales.count = {
        x: countX,
        y: countY
      };
    }

    function setupElements() {
      var g = svg.select('.ringlera-chart-container');
      g.append('g').attr('class', 'axis axis-x');
      g.append('g').attr('class', 'axis axis-y');
      g.append('g').attr('class', 'ringlera-chart-container-dos');
    }

    function updateScales(width, height) {
      scales.count.x.range([0, width]);
      scales.count.y.range([height, 0]);
    }

    function drawAxes(g) {
      var axisX = d3.axisBottom(scales.count.x);
      g.select('.axis-x').attr('transform', "translate(0,".concat(height, ")")).call(axisX);
      var axisY = d3.axisLeft(scales.count.y).tickFormat(d3.format('d')).ticks(5).tickSizeInner(-width);
      g.select('.axis-y').call(axisY);
    }

    function updateChart(datos) {
      var w = chart.node().offsetWidth;
      var h = 600;
      width = w - margin.left - margin.right;
      height = h - margin.top - margin.bottom;
      svg.attr('width', w).attr('height', h);
      var translate = "translate(".concat(margin.left, ",").concat(margin.top, ")");
      var g = svg.select('.ringlera-chart-container');
      g.attr('transform', translate);
      updateScales(width, height);
      var dataComb = d3.nest().key(function (d) {
        return d.title;
      }).entries(datos);
      var container = chart.select('.ringlera-chart-container-dos');
      var colors = ['#b114c0', '#9C1B12', '#759CA7', '#CEBAC6', '#2D3065'];
      var color = d3.scaleOrdinal(colors);
      var line = d3.line().x(function (d) {
        return scales.count.x(d.day);
      }).y(function (d) {
        return scales.count.y(d.pagesReaded);
      });
      container.selectAll('.line').remove().exit().data(dataComb);
      dataComb.forEach(function (d) {
        container.append('path').attr('class', 'line ' + d.key).style('stroke', function () {
          return d.color = color(d.key);
        }).style('stroke-width', "2px").attr('d', line(d.values));
      });
      drawAxes(g);
    }

    function resize() {
      updateChart(datos);
    }

    function loadData() {
      setupElements();
      setupScales();
      updateChart(datos);
    }

    window.addEventListener('resize', resize);
    loadData();
  }

})));

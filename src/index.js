import { xmlToJson } from "./helpers.js";

const { SNOWPACK_PUBLIC_GOODREADS_APP_KEY } = import.meta.env;
let userGoodReads = '67134749';
let arrayColors = [];
let booksClean = [];

const url = `https://cors-anywhere.herokuapp.com/https://www.goodreads.com/review/list/${userGoodReads}.xml?key=${SNOWPACK_PUBLIC_GOODREADS_APP_KEY}&v=2&v=2&shelf=ALL&page=1&per_page=200`;

const config = {
  method: 'GET',
  headers: {
    'Content-Type': 'text/plain',
    'X-Requested-With': 'XMLHttpRequest',
  },
};

//Get data from the API-MONOLITO-XML. We are in 2020, right?
async function getUserAsync() {
  let response = await fetch(url, config);
  let data = await response.text()
  return data;
}

getUserAsync()
  .then(data => {
    const parseString = new DOMParser().parseFromString(data, 'application/xml');
    const jsonFromXml = xmlToJson(parseString);

    cleanResponse(jsonFromXml);
  });

//I only want the books that the user has finished reading
function cleanResponse(json) {
  const {
    GoodreadsResponse: {
      reviews: { review: books },
    },
  } = json;

  let filterBooksFinished = books.filter(
    (book) => Object.keys(book.started_at).length !== 0 && Object.keys(book.read_at).length !== 0
  )

  formatBooksObject(filterBooksFinished);
}

//The object is still a fucking shit, we are going to do some operations to clean and calculate
function formatBooksObject(books) {
  books.forEach((d) => {
    d.title = Object.values(d.book.title)[0];
    d.pages = Object.values(d.book.num_pages)[0];
    d.started = FFDR(d.started_at);
    d.read = FFDR(d.read_at);
    d.days = Math.abs(d.read - d.started) / 86400000;
    d.average = d.pages / d.days;
  });
  createNewObjectBooks(books);
}

//WTF: we need a function to format date XML-Rails API, kill me madafaka.
function FFDR(string) {
  const splitDate = (stringDate) => stringDate.split(' ');

  const first = Object.values(string);

  const second = splitDate(first[0]);

  const third = new Date(`${second[1]} ${second[2]} ${second[5]}`);

  return third;
}

/*The MONOLITO only returns the day when the book started reading, and the day it ended. So we calculate the total reading days: d.days = Math.abs(d.read - d.started) / 86400000. For each day of reading we create a new object, now I can build a timeline.*/
function createNewObjectBooks(books) {
  //Iterate object
  for (let item of books) {
    //Iterate days to create an array of objects.
    for (let index = 0; index < item.days; index++) {
      const { title, pages, days, started, average } = item;
      const theDate = new Date(started);
      let myNewDate = new Date(theDate);
      myNewDate.setDate(myNewDate.getDate() + index);
      booksClean.push({
        title: title,
        day: myNewDate,
        pages: pages,
        pagesReaded: average,
        days: days,
      });
    }
  }

  getRandomColor(books.length);
}

function getRandomColor(elements) {
  const promiseColors = fetch(
    `http://www.colr.org/json/colors/random/${elements}`
  );

  promiseColors
    .then((response) => response.json())
    .then((datos) => {
      addElement(datos);
    })
    .catch(function(err) {
      console.error(err);
    });
}

function addElement(datos) {
  const { colors: colors } = datos;

  for (let item of colors) {
    arrayColors.push(`#${item.hex}`);
  }

  createLineChart(booksClean, arrayColors);
}


//And finally I can create a chart, happy ends...
function createLineChart(datos, colors) {
  const margin = { top: 24, right: 24, bottom: 24, left: 24 };
  let width = 0;
  let height = 0;
  const chart = d3.select('.ringlera-chart');
  const svg = chart.select('svg');
  const scales = {};
  const tooltip = d3
    .select('.ringlera-chart')
    .append('div')
    .attr('class', 'tooltip tooltip-book')
    .style('opacity', 0);

  function setupScales() {
    const countX = d3.scaleTime().domain(d3.extent(datos, (d) => d.day));

    const countY = d3.scaleLinear().domain([0, d3.max(datos, (d) => d.pages)]);

    scales.count = { x: countX, y: countY };
  }

  function setupElements() {
    const g = svg.select('.ringlera-chart-container');

    g.append('g').attr('class', 'axis axis-x');

    g.append('g').attr('class', 'axis axis-y');

    g.append('g').attr('class', 'ringlera-chart-container-dos');
  }

  function updateScales(width, height) {
    scales.count.x.range([0, width]);
    scales.count.y.range([height, 0]);
  }

  function drawAxes(g) {
    const axisX = d3.axisBottom(scales.count.x);

    g.select('.axis-x').attr('transform', `translate(0,${height})`).call(axisX);

    const axisY = d3
      .axisLeft(scales.count.y)
      .tickFormat(d3.format('d'))
      .ticks(5)
      .tickSizeInner(-width);

    g.select('.axis-y').call(axisY);
  }

  function updateChart(datos, colors) {
    console.log("datos", datos);
    const w = chart.node().offsetWidth;
    const h = 600;

    width = w - margin.left - margin.right;
    height = h - margin.top - margin.bottom;

    svg.attr('width', w).attr('height', h);

    const translate = `translate(${margin.left},${margin.top})`;

    const g = svg.select('.ringlera-chart-container');

    g.attr('transform', translate);

    updateScales(width, height);

    const dataComb = d3
      .nest()
      .key((d) => d.title)
      .entries(datos);

    const container = chart.select('.ringlera-chart-container-dos');

    const color = d3.scaleOrdinal(colors);

    const line = d3
      .line()
      .x((d) => scales.count.x(d.day))
      .y((d) => scales.count.y(d.pages));

    container.selectAll('.line').remove().exit().data(dataComb);

    dataComb.forEach((d) => {
      container
        .append('path')
        .attr('class', 'book')
        .style('stroke', () => (d.color = color(d.key)))
        .attr('d', line(d.values))
        .on('mouseover', () => {
          const positionX = scales.count.x(d.year);
          const postionWidthTooltip = positionX + 270;
          const tooltipWidth = 210;
          const positionleft = `${d3.event.pageX}px`;
          const positionright = `${d3.event.pageX - tooltipWidth}px`;
          tooltip.transition();
          tooltip.attr('class', 'tooltip tooltip-book');
          tooltip
            .style('opacity', 1)
            .html(
              `<h3 class="tooltip-book-title">${
                d.values[0].title
              }</h3><p class="tooltip-book-text">Te ha costado ${d.values[0].days.toFixed(
                0
              )} días leerte las ${d.values[0].pages} páginas.<p/>`
            )
            .style(
              'left',
              postionWidthTooltip > w ? positionright : positionleft
            )
            .style('top', `${d3.event.pageY - 28}px`);
        })
        .on('mouseout', () => {
          tooltip.transition().duration(200).style('opacity', 0);
        });
    });

    drawAxes(g);
  }

  function resize() {
    updateChart(datos);
  }

  function loadData() {
    setupElements();
    setupScales();
    updateChart(datos, colors);
  }

  window.addEventListener('resize', resize);

  loadData();
}

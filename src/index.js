import { xmlToJson } from "./helpers.js";

const { SNOWPACK_PUBLIC_GOODREADS_APP_KEY } = import.meta.env;
let userGoodReads = '';
let arrayColors = ["rgb(96,28,136)", "rgb(125,162,193)", "rgb(17,105,102)", "rgb(47,221,206)", "rgb(15,94,176)", "rgb(242,176,246)", "rgb(199,98,142)", "rgb(233,55,168)", "rgb(87,80,90)", "rgb(163,105,219)"]
let booksClean = [];
const spinnerDiv = document.getElementById('ringlera-loader')

const config = {
  method: 'GET',
  headers: {
    'Content-Type': 'text/plain',
    'X-Requested-With': 'XMLHttpRequest',
  },
};

document.getElementById('ringlera-btn-build').addEventListener("click", getIdFromInput);

function getIdFromInput() {
  userGoodReads = document.getElementById('ringlera-input-user').value
  spinnerDiv.style.display = 'block'
  const url = `https://cors-anywhere.herokuapp.com/https://www.goodreads.com/review/list/${userGoodReads}.xml?key=${SNOWPACK_PUBLIC_GOODREADS_APP_KEY}&v=2&v=2&shelf=ALL&page=1&per_page=200`;

  //Get data from the API-MONOLITO-XML. We are in 2020, right?
  async function getUserAsync() {
    let response = await fetch(url, config);
    let data = await response.text()
    return data;
  }

  getUserAsync()
    .then(data => {
      console.log("data", data);
      const parseString = new DOMParser().parseFromString(data, 'application/xml');
      const jsonFromXml = xmlToJson(parseString);
      console.log("jsonFromXml", jsonFromXml);

      cleanResponse(jsonFromXml);
    });
}

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
    d.started = parseStrangeDateRailsAPI(d.started_at);
    d.read = parseStrangeDateRailsAPI(d.read_at);
    d.days = Math.abs(d.read - d.started) / 86400000;
    d.average = d.pages / d.days;
  });
  spinnerDiv.style.display = 'none'
  const mainDiv = document.querySelector('main')
  mainDiv.style.display = 'block'
  mainDiv.scrollIntoView({behavior: "smooth"});
  createNewObjectBooks(books);
}

//WTF: we need a function to format date XML-Rails API, kill me madafaka.
function parseStrangeDateRailsAPI(string) {
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
      let getYearBook = myNewDate.getFullYear()
      myNewDate.setDate(myNewDate.getDate() + index);
      booksClean.push({
        title: title,
        day: myNewDate,
        year: getYearBook,
        pages: pages,
        pagesReaded: average,
        days: days,
      });
    }
  }

  createLineChart(booksClean);
}

//And finally I can create a chart, happy ends...
function createLineChart(datos) {
  const margin = { top: 24, right: 24, bottom: 24, left: 48 };
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
    const { count: { x, y } } = scales
    x.range([0, width]);
    y.range([height, 0]);
  }

  function drawAxes(g) {
    const { count: { x, y } } = scales
    const axisX = d3.axisBottom(x);

    g.select('.axis-x').attr('transform', `translate(0,${height})`).call(axisX);

    const axisY = d3
      .axisLeft(y)
      .tickFormat(d => `${d} pp.`)
      .ticks(5)
      .tickSizeInner(-width);

    g.select('.axis-y').call(axisY);
  }

  function updateChart(datos) {
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

    const color = d3.scaleOrdinal(arrayColors);

    const line = d3
      .line()
      .x((d) => scales.count.x(d.day))
      .y((d) => scales.count.y(d.pages));

    container.selectAll('.line').remove().exit().data(dataComb);

    dataComb.forEach((d) => {
      container
        .append('path')
        .attr('class', 'book')
        .style('stroke', () => (d.color = color(d.values[0].year)))
        .attr('d', line(d.values))
        .on('mouseover', () => {
          const positionX = scales.count.x(d.values[0].day);
          const tooltipMargin = 50;
          const positionTooltip = `${positionX + tooltipMargin}px`;
          tooltip.transition().duration(300);
          tooltip.attr('class', 'tooltip tooltip-book');
          tooltip
            .style('opacity', 1)
            .html(
              `<h3 class="tooltip-book-title">${
                d.values[0].title
              }</h3>
              <p class="tooltip-book-text"><strong>Days:</strong> ${d.values[0].days.toFixed(0)} <p/>
              <p class="tooltip-book-text"><strong>Pages:</strong> ${d.values[0].pages} <p/>`
            )
            .style(
              'left',
              positionTooltip
            )
            .style('top', `${scales.count.y(d.values[0].pages)}px`);
        })
        .on('mouseout', () => {
          tooltip.transition().duration(300).style('opacity', 0);
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
    updateChart(datos);
  }

  window.addEventListener('resize', resize);

  loadData();
}

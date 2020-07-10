import __SNOWPACK_ENV__ from '/__snowpack__/env.js';
import.meta.env = __SNOWPACK_ENV__;

import { xmlToJson, parseStrangeDateRailsAPI } from "./helpers.js";
const {
  SNOWPACK_PUBLIC_GOODREADS_APP_KEY
} = import.meta.env;
let userGoodReads = '';
let userName = '';
let booksClean = [];
const spinnerDiv = document.getElementById('ringlera-loader');
const config = {
  method: 'GET',
  headers: {
    'Content-Type': 'text/plain',
    'X-Requested-With': 'XMLHttpRequest'
  }
};
document.getElementById('ringlera-btn-build').addEventListener("click", getIdFromInput);

function getIdFromInput() {
  userGoodReads = document.getElementById('ringlera-input-user').value;
  spinnerDiv.style.display = 'block';
  const url = `https://cors-anywhere.herokuapp.com/https://www.goodreads.com/review/list/${userGoodReads}.xml?key=${SNOWPACK_PUBLIC_GOODREADS_APP_KEY}&v=2&v=2&shelf=ALL&page=1&per_page=200`; //Get data from the API-MONOLITO-XML. We are in 2020, right?

  async function getUserAsync() {
    let response = await fetch(url, config);
    let data = await response.text();
    return data;
  }

  getUserAsync().then(data => {
    const parseString = new DOMParser().parseFromString(data, 'application/xml');
    const jsonFromXml = xmlToJson(parseString);
    cleanResponse(jsonFromXml);
  });
  getUserName();
}

function getUserName() {
  userGoodReads = document.getElementById('ringlera-input-user').value;
  const userUrl = `https://cors-anywhere.herokuapp.com/https://www.goodreads.com/user/show/${userGoodReads}.xml?key=${SNOWPACK_PUBLIC_GOODREADS_APP_KEY}`; //Get data from the API-MONOLITO-XML. We are in 2020, right?

  async function getUserAsync() {
    let response = await fetch(userUrl, config);
    let data = await response.text();
    return data;
  }

  getUserAsync().then(data => {
    const parseString = new DOMParser().parseFromString(data, 'application/xml');
    const jsonFromXml = xmlToJson(parseString);
    const {
      GoodreadsResponse: {
        user: {
          name
        }
      }
    } = jsonFromXml;
    userName = Object.values(name);
    const setName = document.getElementById('ringlera-user-api');
    setName.textContent = userName || '';
  });
} //I only want the books that the user has finished reading


function cleanResponse(json) {
  const {
    GoodreadsResponse: {
      reviews: {
        review: books
      }
    }
  } = json;
  let filterBooksFinished = books.filter(book => Object.keys(book.started_at).length !== 0 && Object.keys(book.read_at).length !== 0);
  formatBooksObject(filterBooksFinished);
} //The object is still a fucking shit, we are going to do some operations to clean and calculate


function formatBooksObject(books) {
  books.forEach(d => {
    d.title = Object.values(d.book.title)[0];
    d.pages = Object.values(d.book.num_pages)[0];
    d.author = Object.values(d.book.authors.author.name)[0];
    d.image = Object.values(d.book.image_url)[0] || '';
    d.started = parseStrangeDateRailsAPI(d.started_at);
    d.read = parseStrangeDateRailsAPI(d.read_at);
    d.days = Math.abs(d.read - d.started) / 86400000;
    d.average = d.pages / d.days;
  });
  spinnerDiv.style.display = 'none';
  const mainDiv = document.querySelector('main');
  mainDiv.style.display = 'block';
  mainDiv.scrollIntoView({
    behavior: "smooth"
  });
  createNewObjectBooks(books);
}
/*The MONOLITO only returns the day when the book started reading, and the day it ended. So we calculate the total reading days: d.days = Math.abs(d.read - d.started) / 86400000. For each day of reading we create a new object, now I can build a timeline.*/


function createNewObjectBooks(books) {
  //Iterate object
  for (let item of books) {
    //Iterate days to create an array of objects.
    for (let index = 0; index < item.days; index++) {
      const {
        title,
        pages,
        days,
        started,
        average,
        image,
        author
      } = item;
      const theDate = new Date(started);
      let myNewDate = new Date(theDate);
      let getYearBook = myNewDate.getFullYear();
      myNewDate.setDate(myNewDate.getDate() + index);
      booksClean.push({
        title: title,
        image: image,
        author: author,
        day: myNewDate,
        year: +getYearBook,
        pages: +pages,
        pagesReaded: +average,
        days: +days
      });
    }
  }

  createLineChart(booksClean);
  createMetrics(booksClean);
}

function createMetrics(data) {
  const cleanData = removeDuplicates(data);

  function getBookFaster() {
    const value = 'days';
    const book = getMinValue(value, cleanData);
    const sectionValue = 'addictive';
    const objectProperties = buildObjectBook(book, sectionValue);
    updateText(objectProperties);
  }

  function getMinPages() {
    const value = 'pages';
    const book = getMinValue(value, cleanData);
    const sectionValue = 'short';
    const objectProperties = buildObjectBook(book, sectionValue);
    updateText(objectProperties);
  }

  function getMaxSlower() {
    const value = 'days';
    const book = getMaxValue(value, cleanData);
    const sectionValue = 'boring';
    const objectProperties = buildObjectBook(book, sectionValue);
    updateText(objectProperties);
  }

  function getMaxPages() {
    const value = 'pages';
    const book = getMaxValue(value, cleanData);
    const sectionValue = 'fat';
    const objectProperties = buildObjectBook(book, sectionValue);
    updateText(objectProperties);
  }

  function buildObjectBook(books, sectionValue) {
    let booksProperties = [];

    for (let item of books) {
      const {
        title,
        pages,
        days,
        image,
        author
      } = item;
      booksProperties.push({
        title: title,
        pages: +pages,
        sectionTitle: sectionValue,
        days: +days,
        image: image,
        author: author
      });
    }

    return booksProperties;
  }

  getBookFaster();
  getMinPages();
  getMaxSlower();
  getMaxPages();
}

function getMinValue(propertyValue, data) {
  let sortData = data.sort((a, b) => a[propertyValue] > b[propertyValue]);
  const results = Object.entries(sortData).slice(0, 3).map(entry => entry[1]);
  return results;
}

function getMaxValue(propertyValue, data) {
  let sortData = data.sort((a, b) => a[propertyValue] > b[propertyValue]);
  const results = Object.entries(sortData).slice(-3).map(entry => entry[1]);
  return results;
}

function updateText(books) {
  console.log("books", books);
  let index = 0;

  for (let book of books) {
    const {
      title,
      image,
      author,
      text,
      sectionTitle,
      pages,
      days
    } = book;
    let titleBook = document.getElementById(`ringlera-metrics-${sectionTitle}-title-${index}`);
    let pagesBook = document.getElementById(`ringlera-metrics-${sectionTitle}-pages-${index}`);
    let authorBook = document.getElementById(`ringlera-metrics-${sectionTitle}-author-${index}`);

    if (sectionTitle === 'short' || sectionTitle === 'fat') {
      pagesBook.textContent = pages;
    } else {
      const stringDays = days > 1 ? 'days' : 'day';
      pagesBook.textContent = `${days} ${stringDays} `;
    }

    titleBook.textContent = title || '';
    authorBook.textContent = author || '';
    index++;
  }
}

function removeDuplicates(data) {
  let cleanData = data.reduce((acc, current) => {
    const x = acc.find(item => item.title === current.title);

    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);
  return cleanData;
}

let arrayColors = ["rgb(96,28,136)", "rgb(125,162,193)", "rgb(17,105,102)", "rgb(47,221,206)", "rgb(15,94,176)", "rgb(242,176,246)", "rgb(199,98,142)", "rgb(233,55,168)", "rgb(87,80,90)", "rgb(163,105,219)"]; //And finally I can create a chart, happy ends...

function createLineChart(datos) {
  const margin = {
    top: 24,
    right: 24,
    bottom: 24,
    left: 48
  };
  let width = 0;
  let height = 0;
  const chart = d3.select('.ringlera-chart');
  const svg = chart.select('svg');
  const scales = {};
  const tooltip = d3.select('.ringlera-chart').append('div').attr('class', 'tooltip tooltip-book').style('opacity', 0);

  function setupScales() {
    const countX = d3.scaleTime().domain(d3.extent(datos, d => d.day));
    const countY = d3.scaleLinear().domain([0, d3.max(datos, d => d.pages)]);
    scales.count = {
      x: countX,
      y: countY
    };
  }

  function setupElements() {
    const g = svg.select('.ringlera-chart-container');
    g.append('g').attr('class', 'axis axis-x');
    g.append('g').attr('class', 'axis axis-y');
    g.append('g').attr('class', 'ringlera-chart-container-dos');
  }

  function updateScales(width, height) {
    const {
      count: {
        x,
        y
      }
    } = scales;
    x.range([0, width]);
    y.range([height, 0]);
  }

  function drawAxes(g) {
    const {
      count: {
        x,
        y
      }
    } = scales;
    const axisX = d3.axisBottom(x);
    g.select('.axis-x').attr('transform', `translate(0,${height})`).call(axisX);
    const axisY = d3.axisLeft(y).tickFormat(d => `${d} pp.`).ticks(5).tickSizeInner(-width);
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
    const dataComb = d3.nest().key(d => d.title).entries(datos);
    const container = chart.select('.ringlera-chart-container-dos');
    const color = d3.scaleOrdinal(arrayColors);
    const line = d3.line().x(d => scales.count.x(d.day)).y(d => scales.count.y(d.pages));
    container.selectAll('.line').remove().exit().data(dataComb);
    dataComb.forEach(d => {
      container.append('path').attr('class', 'book').style('stroke', () => d.color = color(d.values[0].year)).attr('d', line(d.values)).on('mouseover', () => {
        const positionX = scales.count.x(d.values[0].day);
        const tooltipMargin = 50;
        const positionTooltip = `${positionX + tooltipMargin}px`;
        tooltip.transition().duration(300);
        tooltip.attr('class', 'tooltip tooltip-book');
        tooltip.style('opacity', 1).html(`<h3 class="tooltip-book-title">${d.values[0].title}</h3>
              <p class="tooltip-book-text"><strong>Days:</strong> ${d.values[0].days.toFixed(0)} <p/>
              <p class="tooltip-book-text"><strong>Pages:</strong> ${d.values[0].pages} <p/>`).style('left', positionTooltip).style('top', `${scales.count.y(d.values[0].pages)}px`);
      }).on('mouseout', () => {
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
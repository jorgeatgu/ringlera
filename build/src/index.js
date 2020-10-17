import __SNOWPACK_ENV__ from '/__snowpack__/env.js';
import.meta.env = __SNOWPACK_ENV__;

import { xmlToJson, parseStrangeDateRailsAPI, removeDuplicates } from "./helpers.js";
import { createTimeLine, lineChart } from "./charts.js";
/* eslint-disable */

const {
  SNOWPACK_PUBLIC_GOODREADS_APP_KEY
} = import.meta.env;
/* eslint-enable */

let userGoodReads = '67134749';
let userName = '';
let booksClean = [];
let booksCleanDuplicates = [];
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
  /*booksClean = books.filter((book) => book.pages.length !== 0)*/
  //Iterate object
  for (let item of books) {
    //Iterate days to create an array of objects.
    for (let index = 0; index < item.days; index++) {
      const {
        title: _title,
        pages: _pages,
        days: _days,
        started: _started,
        average: _average,
        image: _image,
        author: _author,
        read: _read
      } = item;

      const _theDate = new Date(_started);

      const _theReadDate = new Date(_read);

      var monthRead = _theReadDate.getMonth();

      var yearRead = _theReadDate.getFullYear();

      const readDate = monthRead + "/" + yearRead;

      let _myNewDate = new Date(_theDate);

      let _getYearBook = _myNewDate.getFullYear();

      _myNewDate.setDate(_myNewDate.getDate() + index);

      booksCleanDuplicates.push({
        title: _title,
        image: _image,
        author: _author,
        day: _myNewDate,
        d3data: readDate,
        year: +_getYearBook,
        pages: +_pages,
        pagesReaded: Math.round(+_average),
        days: +_days
      });
    }

    const {
      title,
      pages,
      days,
      started,
      average,
      image,
      author,
      read
    } = item;
    const theDate = new Date(started);
    const theReadDate = new Date(read);
    let myNewDate = new Date(theDate);
    let getYearBook = myNewDate.getFullYear();
    myNewDate.setDate(myNewDate.getDate());
    booksClean.push({
      title: title,
      image: image,
      author: author,
      day: myNewDate,
      year: +getYearBook,
      pages: +pages,
      pagesReaded: Math.round(+average),
      days: +days
    });
  }

  createTimeLine(booksCleanDuplicates);
  createMetrics(booksCleanDuplicates);
  lineChart(booksClean);
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
  let sortData = data.sort((a, b) => a[propertyValue] < b[propertyValue]);
  const results = Object.entries(sortData).slice(0, 3).map(entry => entry[1]);
  return results;
}

function updateText(books) {
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
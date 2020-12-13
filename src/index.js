import { getUserBooks, getUserInfo } from "./factory.js";
import { xmlToJson, parseStrangeDateRailsAPI, removeDuplicates, getTotalValues } from "./helpers.js";
import { createTimeLine, barChartPages, scatterBooks, sliderD3 } from "./charts.js";

let userGoodReads = '';
let userName = '';
let booksClean = [];
let booksCleanDuplicates = [];
let allBooks = [];
const spinnerDiv = document.getElementById('ringlera-loader')
const errorDiv = document.getElementById('ringlera-error')
const closeButton = document.getElementById('ringlera-error-close-button')

document.getElementById('ringlera-btn-build').addEventListener("click", async => {
  getUserBooks()
    .then(data => {
      const parseString = new DOMParser().parseFromString(data, 'application/xml');
      const jsonFromXml = xmlToJson(parseString);
      cleanResponse(jsonFromXml)
    })

  getUserInfo()
    .then(data => {
      const parseString = new DOMParser().parseFromString(data, 'application/xml');
      const jsonFromXml = xmlToJson(parseString);
      const { GoodreadsResponse: { user: { name, joined = '' } } } = jsonFromXml

      if (jsonFromXml) {
        userName = Object.values(name) || ''
        const userJoinedDate = Object.values(joined)
        const setName = document.getElementById('ringlera-user-api')
        const dateJoined = document.getElementById('ringlera-user-api-joined')
        setName.textContent = userName
        dateJoined.textContent = userJoinedDate
      }
    });
});

closeButton.addEventListener("click", closeError);

function closeError() {
  errorDiv.style.display = 'none'
  userGoodReads = document.getElementById('ringlera-input-user')
  userGoodReads.value = ''
}

//I only want the books that the user has finished reading
function cleanResponse(json) {
  const {
    GoodreadsResponse: {
      reviews: { review: books },
    },
  } = json;

  let filterBooksStartedFinished = books.filter(
    (book) => Object.keys(book.started_at).length !== 0 && Object.keys(book.read_at).length !== 0
  )

  let filterBooksFinished = books.filter(
    (book) => Object.keys(book.read_at).length !== 0
  )

  formatBooksObject(filterBooksStartedFinished);
  formatAllBooks(filterBooksFinished);

}

function formatAllBooks(books) {
  books.forEach((d) => {
    d.title = Object.values(d.book.title)[0];
    d.author = Object.values(d.book.authors.author.name)[0];
    d.read = parseStrangeDateRailsAPI(d.read_at);
    d.pages = Object.values(d.book.num_pages)[0];
  });

  for (let item of books) {
    const { title, pages, author, read } = item;
    const theDate = new Date(read);
    let myNewDate = new Date(theDate);
    let getYearBook = myNewDate.getFullYear()
    myNewDate.setDate(myNewDate.getDate());
    allBooks.push({
      title: title,
      author: author,
      read: myNewDate,
      year: +getYearBook,
      pages: +pages || 0
    });
  }

  const totalPages = getTotalValues(allBooks, 'pages');
  const totalBooks = allBooks.length;
  const userBooks = document.getElementById('ringlera-user-api-books')
  const userPages = document.getElementById('ringlera-user-api-pages')

  userBooks.textContent = totalBooks
  userPages.textContent = totalPages

  scatterBooks(allBooks)
  createTableAllBooks(books)

}

function createTableAllBooks(books) {
  let tableBooks = []
  books.forEach((d) => {
    d.title = Object.values(d.book.title);
    d.author = Object.values(d.book.authors.author.name);
    d.read = parseStrangeDateRailsAPI(d.read_at);
    d.pages = Object.values(d.book.num_pages);
    d.publication = Object.values(d.book.publication_year)
    d.rating = Object.values(d.book.average_rating)
  });

  for (let item of books) {
    const { title, pages, author, read, publication, rating } = item;
    const theDate = new Date(read);
    let myNewDate = new Date(theDate);
    let getYearBook = `${myNewDate.getMonth() + 1}/${myNewDate.getFullYear()}`
    myNewDate.setDate(myNewDate.getDate());
    tableBooks.push({
      title: title,
      author: author,
      read: getYearBook,
      pages: +pages || 0,
      publication: publication,
      rating: rating
    });
  }
}

//The object is still a fucking shit, we are going to do some operations to clean and calculate
function formatBooksObject(books) {

  books.forEach((d) => {
    d.title = Object.values(d.book.title)[0];
    d.pages = Object.values(d.book.num_pages)[0];
    d.author = Object.values(d.book.authors.author.name)[0];
    d.image = Object.values(d.book.image_url)[0] || '';
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

/*The MONOLITO only returns the day when the book started reading, and the day it ended. So we calculate the total reading days: d.days = Math.abs(d.read - d.started) / 86400000. For each day of reading we create a new object, now I can build a timeline.*/
function createNewObjectBooks(books) {
  //Iterate object
  for (let item of books) {
    //Iterate days to create an array of objects.
    const { title, pages, days, started, average, image, author, read } = item;
    for (let index = 0; index < item.days; index++) {
      const theDate = new Date(started);
      const theReadDate = new Date(read);
      var monthRead = theReadDate.getMonth();
      var yearRead = theReadDate.getFullYear();
      const readDate = monthRead + "/" + yearRead
      let myNewDate = new Date(theDate);
      let getYearBook = myNewDate.getFullYear()
      myNewDate.setDate(myNewDate.getDate() + index);
      booksCleanDuplicates.push({
        title: title,
        image: image,
        author: author,
        day: myNewDate,
        d3data: readDate,
        year: +getYearBook,
        pages: +pages,
        pagesReaded: Math.round(+average),
        days: Math.round(+days)
      });
    }

    const theDate = new Date(started);
    const theReadDate = new Date(read);
    let myNewDate = new Date(theDate);
    let getYearBook = myNewDate.getFullYear()
    myNewDate.setDate(myNewDate.getDate());
    booksClean.push({
      title: title,
      image: image,
      author: author,
      day: myNewDate,
      year: +getYearBook,
      pages: +pages,
      pagesReaded: Math.round(+average),
      days: Math.round(+days)
    });
  }

  createTimeLine(booksCleanDuplicates);
  createMetrics(booksCleanDuplicates)
  barChartPages(booksClean)
  sliderD3(booksClean)
}

function createMetrics(data) {

  const cleanData = removeDuplicates(data)

  function getBookFaster() {
    const value = 'days'
    const book = getMinValue(value, cleanData)
    const sectionValue = 'addictive'
    const objectProperties = buildObjectBook(book, sectionValue)
    updateText(objectProperties)
  }

  function getMinPages() {
    const value = 'pages'
    const book = getMinValue(value, cleanData)
    const sectionValue = 'short'
    const objectProperties = buildObjectBook(book, sectionValue)
    updateText(objectProperties)
  }

  function getMaxSlower() {
    const value = 'days'
    const book = getMaxValue(value, cleanData)
    const sectionValue = 'boring'
    const objectProperties = buildObjectBook(book, sectionValue)
    updateText(objectProperties)
  }

  function getMaxPages() {
    const value = 'pages'
    const book = getMaxValue(value, cleanData)
    const sectionValue = 'fat'
    const objectProperties = buildObjectBook(book, sectionValue)
    updateText(objectProperties)
  }

  function buildObjectBook(books, sectionValue) {
    let booksProperties = []
    for (let item of books) {
      const { title, pages, days, image, author } = item;
      booksProperties.push({
        title: title,
        pages: +pages,
        sectionTitle: sectionValue,
        days: +days,
        image: image,
        author: author
      });
    }

    return booksProperties
  }

  getBookFaster()
  getMinPages()
  getMaxSlower()
  getMaxPages()
}

function getMinValue(propertyValue, data) {
  let sortData = data.sort((a, b) => a[propertyValue] > b[propertyValue]);
  const results = Object.entries(sortData).slice(0,3).map(entry => entry[1]);
  return results
}

function getMaxValue(propertyValue, data) {
  let sortData = data.sort((a, b) => a[propertyValue] < b[propertyValue]);
  const results = Object.entries(sortData).slice(0,3).map(entry => entry[1]);
  return results
}

function updateText(books) {
  let index = 0
  for (let book of books) {
    const { title, image, author, text, sectionTitle, pages, days } = book

    let titleBook = document.getElementById(`ringlera-metrics-${sectionTitle}-title-${index}`)
    let pagesBook = document.getElementById(`ringlera-metrics-${sectionTitle}-pages-${index}`)
    let extraBook = document.getElementById(`ringlera-metrics-${sectionTitle}-EXTRA-${index}`)
    let authorBook = document.getElementById(`ringlera-metrics-${sectionTitle}-author-${index}`)

    if (sectionTitle === 'short' || sectionTitle === 'fat') {
      pagesBook.textContent = pages
    } else {
      const stringDays = days > 1 ? 'days' : 'day'
      pagesBook.textContent = `${days} ${stringDays} `
    }

    titleBook.textContent = title || ''
    authorBook.textContent = author || ''
    index++
  }
}

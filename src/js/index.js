let userGoodReads = '17586923'
let key = '0JTylMsQ9GNCaSNAIoFDXQ'

const url = `https://cors-anywhere.herokuapp.com/https://www.goodreads.com/review/list/${userGoodReads}.xml?key=${key}&v=2&v=2&shelf=ALL&page=1&per_page=200`

const config = {
  method: 'GET',
  headers: {
    'Content-Type': 'text/plain',
    'X-Requested-With': 'XMLHttpRequest'
  }
}

//Get data from the API-MONOLITO-XML. We are in 2020, right?
fetch(url, config)
  .then(data => data.text()
    .then((str) => {
      const parseString = new DOMParser().parseFromString(str, 'application/xml')
      const jsonFromXml = xmlToJson(parseString)

      cleanResponse(jsonFromXml)
    })
  )

//Convert XML to JSON https://davidwalsh.name/convert-xml-json
function xmlToJson(xml) {

  let obj = {}

  if (xml.nodeType == 1) { // element
    // do attributes
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {}
      for (let j = 0; j < xml.attributes.length; j++) {
        const attribute = xml.attributes.item(j)
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue
      }
    }
  } else if (xml.nodeType == 3) { // text
    obj = xml.nodeValue
  }

  // do children
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i)
      const nodeName = item.nodeName
      if (typeof(obj[nodeName]) == "undefined") {
        obj[nodeName] = xmlToJson(item)
      } else {
        if (typeof(obj[nodeName].push) == "undefined") {
          const old = obj[nodeName]
          obj[nodeName] = []
          obj[nodeName].push(old)
        }
        obj[nodeName].push(xmlToJson(item))
      }
    }
  }
  return obj
}

//I only want the books that the user has finished reading
function cleanResponse(json) {
  const {
    GoodreadsResponse: {
      reviews: {
        review: books
      }
    }
  } = json

  let filterBooksFinished = books.filter(book => Object.keys(book.started_at).length !== 0)
  filterBooksFinished = filterBooksFinished.filter(book => Object.keys(book.read_at).length !== 0)
  formatBooksObject(filterBooksFinished)
}

//The object is still a fucking shit, we are going to do some operations to clean and calculate
function formatBooksObject(books) {
  console.log("books", books)
  books.forEach(d => {
    d.title = Object.values(d.book.title)[0]
    d.pages = Object.values(d.book.num_pages)[0]
    d.started = FFDR(d.started_at)
    d.read = FFDR(d.read_at)
    d.days = Math.abs(d.read - d.started) / 86400000
    d.average = d.pages / d.days
  })

  createNewObjectBooks(books)
}

//WTF: we need a function to format date XML-Rails API, kill me madafaka.
function FFDR(string) {
  console.log("string", string)
  const splitDate = stringDate => stringDate.split(' ')

  const first = Object.values(string)

  const second = splitDate(first[0])

  const third = new Date(`${second[1]} ${second[2]} ${second[5]}`)

  return third
}

/*The MONOLITO only returns the day the book started reading, and the day it ended. So we calculate the total reading days: d.days = Math.abs(d.read - d.started) / 86400000. For each day of reading we create a new object, so I can build a timeline.*/
function createNewObjectBooks(books) {
  let booksClean = []

  //Iterate object
  for (let item of books) {
    //Iterate days to create different objects.
    for (let index = 0; index < item.days; index++) {
      const theDate = new Date(item.started)
      let myNewDate = new Date(theDate)
      myNewDate.setDate(myNewDate.getDate() + index)
      booksClean.push({
        title: item.title,
        day: myNewDate,
        pages: item.pages,
        pagesReaded: item.average * index,
        days: item.days
      })
    }
  }

  createLineChart(booksClean)
}


//And finally I can create a chart, happy ends...
//And finally I can create a chart, happy ends...
function createLineChart(datos) {
  const margin = { top: 24, right: 24, bottom: 24, left: 24 }
  let width = 0
  let height = 0
  const chart = d3.select('.ringlera-chart')
  const svg = chart.select('svg')
  const scales = {}

  function setupScales() {
    const countX = d3
      .scaleTime()
      .domain(d3.extent(datos, d => d.day))

    const countY = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(datos, d => d.pages)
      ])

    scales.count = { x: countX, y: countY }
  };

  function setupElements() {
    const g = svg.select('.ringlera-chart-container')

    g.append('g').attr('class', 'axis axis-x')

    g.append('g').attr('class', 'axis axis-y')

    g.append('g').attr('class', 'ringlera-chart-container-dos')
  };

  function updateScales(width, height) {
    scales.count.x.range([0, width])
    scales.count.y.range([height, 0])
  };

  function drawAxes(g) {
    const axisX = d3.axisBottom(scales.count.x)

    g.select('.axis-x')
      .attr('transform', `translate(0,${height})`)
      .call(axisX)

    const axisY = d3
      .axisLeft(scales.count.y)
      .tickFormat(d3.format('d'))
      .ticks(5)
      .tickSizeInner(-width)

    g.select('.axis-y').call(axisY)
  };

  function updateChart(datos) {
    const w = chart.node().offsetWidth
    const h = 600

    width = w - margin.left - margin.right
    height = h - margin.top - margin.bottom

    svg.attr('width', w).attr('height', h)

    const translate = `translate(${margin.left},${margin.top})`

    const g = svg.select('.ringlera-chart-container')

    g.attr('transform', translate)

    updateScales(width, height)

    const dataComb = d3
      .nest()
      .key((d) => d.title)
      .entries(datos)

    const container = chart.select('.ringlera-chart-container-dos')

    const colors = ['#b114c0', '#9C1B12', '#759CA7', '#CEBAC6', '#2D3065']

    const color = d3.scaleOrdinal(colors)

    const line = d3
      .line()
      .x((d) => scales.count.x(d.day))
      .y((d) => scales.count.y(d.pagesReaded))

    container
      .selectAll('.line')
      .remove()
      .exit()
      .data(dataComb)


    dataComb.forEach((d) => {
      container
        .append('path')
        .attr('class', 'line ' + d.key)
        .style('stroke', () => (d.color = color(d.key)))
        .style('stroke-width', "2px")
        .attr('d', line(d.values))
    })

    drawAxes(g)
  };

  function resize() {
    updateChart(datos)
  }


  function loadData() {
    setupElements()
    setupScales()
    updateChart(datos)
  }

  window.addEventListener('resize', resize)

  loadData()
};

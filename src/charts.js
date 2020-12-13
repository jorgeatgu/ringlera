import { getTotalValues } from "./helpers.js";

let arrayColors = ["rgb(96,28,136)", "rgb(125,162,193)", "rgb(17,105,102)", "rgb(47,221,206)", "rgb(15,94,176)", "rgb(242,176,246)", "rgb(199,98,142)", "rgb(233,55,168)", "rgb(87,80,90)", "rgb(163,105,219)"]

const color = d3.scaleOrdinal(arrayColors);

//And finally I can create a chart, happy ends...
function scatterBooks(data) {
  const margin = { top: 24, right: 24, bottom: 40, left: 62 };
  let width;
  let height;
  let w;
  let h;
  const chart = d3.select('.ringlera-chart-all');
  const svg = chart.select('svg');
  const scales = {};
  let dataz;

  function setupScales(dataz) {

    const countX = d3
      .scaleTime()
      .domain(d3.extent(dataz, d => d.read))

    const countY = d3.scaleLinear()
      .domain([d3.min(dataz, d => d.pages), d3.max(dataz, d => d.pages)]);

    scales.count = { x: countX, y: countY };
  };

  function setupElements() {
    const g = svg.select('.ringlera-chart-all-container');

    g.append('g').attr('class', 'axis axis-x');

    g.append('g').attr('class', 'axis axis-y');

    g.append('g').attr('class', 'ringlera-chart-all-dos-container');
  };

  function updateScales(width, height) {
    scales.count.x.range([10, width]);
    scales.count.y.range([height, 0]);
  };

  function drawAxes(g) {

    const axisX = d3
      .axisBottom(scales.count.x)

    g.select('.axis-x')
      .attr('transform', `translate(0,${height})`)
      .call(axisX)

    const axisY = d3
      .axisLeft(scales.count.y)
      .tickFormat(d => `${d} pp.`)
      .ticks(5)
      .tickPadding(7)
      .tickSizeInner(-width);

    g.select('.axis-y').call(axisY);
  };

  function updateChart(data) {
    w = chart.node().offsetWidth;
    h = 600;

    width = w - margin.left - margin.right;
    height = h - margin.top - margin.bottom;

    svg.attr('width', w).attr('height', h);

    const translate = `translate(${margin.left},${margin.top})`;

    const g = svg.select('.ringlera-chart-all-container');

    g.attr('transform', translate);

    updateScales(width, height);

    const container = chart.select('.ringlera-chart-all-dos-container');

    const layer = container.selectAll('.scatter-circles').data(data);

    const newLayer = layer
      .enter()
      .append('circle')
      .attr('class', 'scatter-circles');

    layer
      .merge(newLayer)
      .attr('cx', (d) => scales.count.x(d.read))
      .attr('cy', (d) => scales.count.y(d.pages))
      .attr('r', 5)

    drawAxes(g);
  };

  function resize() {
    loadData();
  };

  function loadData() {
    const parseDate = d3.timeFormat("%m-%Y")

    data.sort((a, b) => a.read - b.read)

    setupScales(data);
    updateChart(data)
  };

  window.addEventListener('resize', resize);

  setupElements();
  loadData();

}

function createTimeLine(datos) {
  const margin = { top: 24, right: 24, bottom: 24, left: 62 };
  let width = 0;
  let height = 0;
  const chart = d3.select('.ringlera-chart-read');
  const svg = chart.select('svg');
  const scales = {};
  const tooltip = d3
    .select('.ringlera-chart-read')
    .append('div')
    .attr('class', 'tooltip tooltip-book')
    .style('opacity', 0);

  function setupScales() {
    const countX = d3.scaleTime().domain(d3.extent(datos, (d) => d.day));

    const countY = d3.scaleLinear().domain([0, d3.max(datos, (d) => d.pages * 1.25)]);

    scales.count = { x: countX, y: countY };
  }

  function setupElements() {
    const g = svg.select('.ringlera-chart-container-read');

    g.append('g').attr('class', 'axis axis-x');

    g.append('g').attr('class', 'axis axis-y');

    g.append('g').attr('class', 'ringlera-chart-container-dos-read');
  }

  function updateScales(width, height) {
    const { count: { x, y } } = scales
    x.range([10, width]);
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
      .tickPadding(7)
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

    const g = svg.select('.ringlera-chart-container-read');

    g.attr('transform', translate);

    updateScales(width, height);

    const dataComb = d3
      .nest()
      .key((d) => d.title)
      .entries(datos);

    const container = chart.select('.ringlera-chart-container-dos-read');

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
          const tooltipMargin = 75;
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
    loadData(datos);
  }

  function loadData() {
    setupElements();
    setupScales();
    updateChart(datos);
  }

  window.addEventListener('resize', resize);

  loadData();
}

function barChartPages(dataz) {

  const margin = { top: 24, right: 24, bottom: 32, left: 32 };
  let width = 0;
  let height = 0;
  const chart = d3.select('.line-chart');
  const svg = chart.select('#bar-chart');
  const scales = {};

  const labelPages = d3.select('.chart-label-pages')

  function setupScales(dataz) {
    const countX = d3
      .scaleBand()
      .domain(dataz.map((d) => d.key))

    const countY = d3
      .scaleLinear()
      .domain([0, d3.max(dataz, (d) => d.value * 1.5)]);

    scales.count = {
      x: countX,
      y: countY
    };
  };

  function setupElements() {
    const g = svg.select('.line-chart-container');

    g.selectAll('.axis').remove()
    g.selectAll('.line-chart-container-dos').remove()

    g.append('g').attr('class', 'axis axis-x');

    g.append('g').attr('class', 'axis axis-y');

    g.append('g').attr('class', 'line-chart-container-dos');
  };

  function updateScales(width, height) {
    scales.count.x.range([20, width]).paddingInner(0.35);
    scales.count.y.range([height, 0]);
  };

  function drawAxes(g) {
    const axisX = d3
      .axisBottom(scales.count.x)
      .tickValues(scales.count.x.domain().filter((d, i) => !(i % 5)))
      .tickPadding(5)

    g.select('.axis-x')
      .attr('transform', `translate(0,${height})`)
      .call(axisX);

    const axisY = d3
      .axisLeft(scales.count.y)
      .tickFormat(d3.format('d'))
      .ticks(5)
      .tickSize(-width)
      .tickPadding(5);

    g.select('.axis-y')
      .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .call(axisY)
  };

  function updateChart(dataz) {
    const w = chart.node().offsetWidth;
    const h = 450;

    width = w - margin.left - margin.right;
    height = h - margin.top - margin.bottom;

    svg
      .attr('width', w).attr('height', h);

    const translate = `translate(${margin.left},${margin.top})`;

    const g = svg
      .select('.line-chart-container');

    g.attr('transform', translate);

    updateScales(width, height);

    const container = chart
      .select('.line-chart-container-dos');

    const layer = container
      .selectAll('.bar-vertical')
      .remove()
      .exit()
      .data(dataz);

    const newLayer = layer
      .enter()
      .append('rect')
      .style('fill', d => {
        let valuesDate = d.key.split('-')
        let year = valuesDate[1]
        return d.color = color(year)
      });

    layer
      .merge(newLayer)
      .attr('width', scales.count.x.bandwidth())
      .attr('x', (d) => scales.count.x(d.key))
      .attr('y', height)
      .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .attr('width', scales.count.x.bandwidth())
      .attr('x', (d) => scales.count.x(d.key))
      .attr('y', (d) => scales.count.y(d.value))
      .attr('height', (d) => height - scales.count.y(d.value))

    drawAxes(g);
  };

  function resize() {
    loadData()
  };

  function loadData() {
    const parseDate = d3.timeFormat("%m-%Y")

    dataz.sort((a, b) => a.day - b.day)

    let datos = d3.nest()
      .key(d => parseDate(d.day))
      .rollup((d) => d3.sum(d, (book) => book.pages))
      .entries(dataz);


    let totalPages
    let yearSelected = datos[0].key.split('-')
    yearSelected = yearSelected[1]
    totalPages = getTotalValues(dataz, 'pages');

    labelPages.html(`In <strong>${yearSelected}</strong> you've read <strong>${totalPages}</strong> pages.`)

    setupScales(datos);
    updateChart(datos)
  };

  window.addEventListener('resize', resize);

  setupElements();
  loadData();
};


//https://bl.ocks.org/shashank2104/d7051d80e43098bf9a48e9b6d3e10e73
function sliderD3(books) {
  let arrayYears = books.map(book => book.year);
  arrayYears = [...new Set(arrayYears)];
  let yearMin = Math.min(...arrayYears)
  let yearMax = Math.max(...arrayYears)

  let margin = { left: 30, right: 30 }
  const chart = d3.select('.line-chart');
  const width = chart.node().offsetWidth;
  let height = 60
  let range = [yearMin, yearMax]
  let step = 1;

  const svg = d3.select('#slider')
    .attr('width', width)
    .attr('height', height);

  const slider = svg.append('g')
    .classed('slider', true)
    .attr('transform', `translate(${margin.left}, ${height / 2})`);

  // using clamp here to avoid slider exceeding the range limits
  const xScale = d3.scaleLinear()
    .domain(range)
    .range([0, width - margin.left - margin.right])
    .clamp(true);

  // array useful for step sliders
  const rangeValues = d3.range(range[0], range[1], step || 1).concat(range[1]);
  const xAxis = d3.axisBottom(xScale).tickValues(rangeValues).tickFormat(d => d);

  xScale.clamp(true);
  // drag behavior initialization
  const drag = d3.drag()
    .on('start.interrupt', function() {
      slider.interrupt();
    }).on('start drag', function() {
      dragged(d3.event.x);
    });

  // initial transition
  slider.transition().duration(750)
    .tween("drag", function() {
      dragged(xScale(yearMin));
    });

  // this is the main bar with a stroke (applied through CSS)
  const track = slider
    .append('line')
    .attr('class', 'track')
    .attr('x1', xScale.range()[0])
    .attr('x2', xScale.range()[1]);

  const ticks = slider.append('g').attr('class', 'ticks').attr('transform', 'translate(0, 4)')
    .call(xAxis);

  // drag handle
  const handle = slider.append('circle').classed('handle', true)
    .attr('r', 8);

  // this is the bar on top of above tracks with stroke = transparent and on which the drag behaviour is actually called
  // try removing above 2 tracks and play around with the CSS for this track overlay, you'll see the difference
  const trackOverlay = d3.select(slider.node().appendChild(track.node().cloneNode())).attr('class', 'track-overlay')
    .call(drag);


  function dragged(value) {
    var x = xScale.invert(value),
      index = null,
      midPoint, cx, xVal;
    if (step) {
      // if step has a value, compute the midpoint based on range values and reposition the slider based on the mouse position
      for (var i = 0; i < rangeValues.length - 1; i++) {
        if (x >= rangeValues[i] && x <= rangeValues[i + 1]) {
          index = i;
          break;
        }
      }
      midPoint = (rangeValues[index] + rangeValues[index + 1]) / 2;
      if (x < midPoint) {
        cx = xScale(rangeValues[index]);
        xVal = rangeValues[index];
      } else {
        cx = xScale(rangeValues[index + 1]);
        xVal = rangeValues[index + 1];
      }
    } else {
      // if step is null or 0, return the drag value as is
      cx = xScale(x);
      xVal = x.toFixed(3);
    }
    // use xVal as drag value
    handle.attr('cx', cx);

    let booksFiltered = books.filter(d => d.year === xVal)

    barChartPages(booksFiltered)
  }
}

export { createTimeLine, barChartPages, scatterBooks, sliderD3 }

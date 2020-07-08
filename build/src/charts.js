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

export { createLineChart };
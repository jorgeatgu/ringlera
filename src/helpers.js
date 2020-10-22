//Convert XML to JSON https://davidwalsh.name/convert-xml-json
function xmlToJson(xml) {
  let obj = {};

  if (xml.nodeType == 1) {
    // element
    // do attributes
    if (xml.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let j = 0; j < xml.attributes.length; j++) {
        const attribute = xml.attributes.item(j);
        obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType == 3) {
    // text
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      const nodeName = item.nodeName;
      if (typeof obj[nodeName] == 'undefined') {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof obj[nodeName].push == 'undefined') {
          const old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
}

//WTF: we need a function to format date XML-Rails API, kill me madafaka.
function parseStrangeDateRailsAPI(string) {
  const splitDate = (stringDate) => stringDate.split(' ');

  const first = Object.values(string);

  const second = splitDate(first[0]);

  const third = new Date(`${second[1]} ${second[2]} ${second[5]}`);

  return third;
}

function removeDuplicates(data) {
  let cleanData = data.filter((book) => book.pages > 0).reduce((acc, current) => {
    const x = acc.find(item => item.title === current.title);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);
  return cleanData
}


export { xmlToJson, parseStrangeDateRailsAPI, removeDuplicates }

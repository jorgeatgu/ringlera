/* eslint-disable */
const { SNOWPACK_PUBLIC_GOODREADS_APP_KEY } = import.meta.env;
/* eslint-enable */
const spinnerDiv = document.getElementById('ringlera-loader')
const errorDiv = document.getElementById('ringlera-error')

const config = {
  method: 'GET',
  headers: {
    'Content-Type': 'text/plain',
    'X-Requested-With': 'XMLHttpRequest',
  },
};

//Get data from the API-MONOLITO-XML. We are in 2020, right?
async function getUserBooks() {
  let userGoodReads = document.getElementById('ringlera-input-user').value
  const url = `https://cors-anywhere.herokuapp.com/https://www.goodreads.com/review/list/${userGoodReads}.xml?key=${SNOWPACK_PUBLIC_GOODREADS_APP_KEY}&v=2&v=2&shelf=read&per_page=200&page=1`;
  spinnerDiv.style.display = 'block'
  let response = await fetch(url, config)

  if (response.status === 404) {
    apiError()
  } else {
    let data = await response.text()
    return data;
  }
}

async function getUserInfo() {
  const userUrl = `https://cors-anywhere.herokuapp.com/https://www.goodreads.com/user/show/${userGoodReads}.xml?key=${SNOWPACK_PUBLIC_GOODREADS_APP_KEY}`
  let userGoodReads = document.getElementById('ringlera-input-user').value
  let response = await fetch(userUrl, config);
  let data = await response.text()
  return data;
}

function apiError() {
  spinnerDiv.style.display = 'none'
  errorDiv.style.display = 'block'
  return false
}

export { getUserBooks, getUserInfo }

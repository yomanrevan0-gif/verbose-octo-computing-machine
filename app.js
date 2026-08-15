const API =
  "https://api.coinpaprika.com/v1/tickers?quotes=USD";

let coins = [];
let currentFilter = "all";


/* =========================
   FORMATTERS
========================= */

function money(value) {

  if (!value || isNaN(value)) {
    return "$0";
  }

  if (value >= 1_000_000_000_000) {
    return "$" + (value / 1_000_000_000_000).toFixed(2) + "T";
  }

  if (value >= 1_000_000_000) {
    return "$" + (value / 1_000_000_000).toFixed(2) + "B";
  }

  if (value >= 1_000_000) {
    return "$" + (value / 1_000_000).toFixed(2) + "M";
  }

  if (value >= 1) {
    return "$" + value.toLocaleString("en-US", {
      maximumFractionDigits: 2
    });
  }

  return "$" + value.toFixed(6);
}


function percent(value) {

  if (value === null || value === undefined) {
    return "--";
  }

  const number = Number(value);

  return (number >= 0 ? "+" : "") +
    number.toFixed(2) + "%";
}


function logo(id) {

  return `https://static.coinpaprika.com/coin/${id}/logo.png`;

}


/* =========================
   LOAD DATA
========================= */

async function loadCoins() {

  const table = document.getElementById("coinTable");

  table.innerHTML = `
    <tr>
      <td colspan="8" class="loading">
        Loading live cryptocurrency data...
      </td>
    </tr>
  `;

  try {

    const response = await fetch(API);

    if (!response.ok) {
      throw new Error("API error");
    }

    const data = await response.json();

    coins = data
      .filter(c =>
        c.quotes &&
        c.quotes.USD &&
        c.quotes.USD.market_cap
      )
      .sort((a, b) =>
        b.quotes.USD.market_cap -
        a.quotes.USD.market_cap
      )
      .slice(0, 100);

    updateOverview();

    renderTrending();

    renderTable();

  } catch (error) {

    console.error(error);

    table.innerHTML = `
      <tr>
        <td colspan="8" class="loading">
          Unable to load market data.
          Please refresh the page.
        </td>
      </tr>
    `;

  }

}


/* =========================
   OVERVIEW
========================= */

function updateOverview() {

  let marketCap = 0;
  let volume = 0;

  coins.forEach(coin => {

    const usd = coin.quotes.USD;

    marketCap += usd.market_cap || 0;
    volume += usd.volume_24h || 0;

  });


  document.getElementById("globalMarketCap")
    .textContent = money(marketCap);

  document.getElementById("globalVolume")
    .textContent = money(volume);

  document.getElementById("coinCount")
    .textContent = coins.length;


  const btc = coins.find(c =>
    c.symbol === "BTC"
  );

  if (btc) {

    let btcMarketCap =
      btc.quotes.USD.market_cap || 0;

    let dominance =
      marketCap > 0
        ? (btcMarketCap / marketCap) * 100
        : 0;

    document.getElementById("btcDominance")
      .textContent = dominance.toFixed(2) + "%";

  }

}


/* =========================
   TRENDING
========================= */

function renderTrending() {

  const container =
    document.getElementById("trendingCoins");

  const trending = [...coins]
    .sort((a, b) =>
      (b.quotes.USD.percent_change_24h || 0) -
      (a.quotes.USD.percent_change_24h || 0)
    )
    .slice(0, 4);


  container.innerHTML = trending.map(coin => {

    const usd = coin.quotes.USD;

    const change =
      usd.percent_change_24h || 0;

    return `

      <div class="trending-card">

        <div class="coin-head">

          <img
            class="coin-logo"
            src="${logo(coin.id)}"
            onerror="this.style.display='none'"
          >

          <div>

            <div class="coin-name">
              ${coin.name}
            </div>

            <div class="coin-symbol">
              ${coin.symbol}
            </div>

          </div>

        </div>

        <div class="coin-price">
          ${money(usd.price)}
        </div>

        <div class="${change >= 0 ? "green" : "red"}">
          ${percent(change)}
        </div>

      </div>

    `;

  }).join("");

}


/* =========================
   TABLE
========================= */

function renderTable() {

  const table =
    document.getElementById("coinTable");

  let list = [...coins];


  if (currentFilter === "gainers") {

    list.sort((a, b) =>
      (b.quotes.USD.percent_change_24h || 0) -
      (a.quotes.USD.percent_change_24h || 0)
    );

  }


  if (currentFilter === "losers") {

    list.sort((a, b) =>
      (a.quotes.USD.percent_change_24h || 0) -
      (b.quotes.USD.percent_change_24h || 0)
    );

  }


  table.innerHTML = list.map((coin, index) => {

    const usd = coin.quotes.USD;

    const c1h = usd.percent_change_1h || 0;
    const c24h = usd.percent_change_24h || 0;
    const c7d = usd.percent_change_7d || 0;


    return `

      <tr>

        <td>
          ${index + 1}
        </td>


        <td>

          <div class="coin-cell">

            <img
              src="${logo(coin.id)}"
              onerror="this.style.display='none'"
            >

            <div>

              <strong>
                ${coin.name}
              </strong>

              <small>
                ${coin.symbol}
              </small>

            </div>

          </div>

        </td>


        <td>
          <strong>
            ${money(usd.price)}
          </strong>
        </td>


        <td class="${c1h >= 0 ? "green" : "red"}">
          ${percent(c1h)}
        </td>


        <td class="${c24h >= 0 ? "green" : "red"}">
          ${percent(c24h)}
        </td>


        <td class="${c7d >= 0 ? "green" : "red"}">
          ${percent(c7d)}
        </td>


        <td>
          ${money(usd.market_cap)}
        </td>


        <td>
          ${money(usd.volume_24h)}
        </td>

      </tr>

    `;

  }).join("");

}


/* =========================
   FILTER
========================= */

function filterCoins(type, button) {

  currentFilter = type;

  document.querySelectorAll(".filter")
    .forEach(btn =>
      btn.classList.remove("active")
    );

  button.classList.add("active");

  renderTable();

}


/* =========================
   SEARCH
========================= */

function searchCoins() {

  const query =
    document.getElementById("coinSearch")
      .value
      .toLowerCase()
      .trim();


  if (!query) {

    renderTable();

    return;

  }


  const original = [...coins];

  const filtered = original.filter(coin =>

    coin.name.toLowerCase().includes(query) ||

    coin.symbol.toLowerCase().includes(query)

  );


  const table =
    document.getElementById("coinTable");


  table.innerHTML = filtered.map((coin, index) => {

    const usd = coin.quotes.USD;

    const c24h =
      usd.percent_change_24h || 0;


    return `

      <tr>

        <td>${index + 1}</td>

        <td>

          <div class="coin-cell">

            <img
              src="${logo(coin.id)}"
              onerror="this.style.display='none'"
            >

            <div>

              <strong>${coin.name}</strong>

              <small>${coin.symbol}</small>

            </div>

          </div>

        </td>

        <td>${money(usd.price)}</td>

        <td>--</td>

        <td class="${c24h >= 0 ? "green" : "red"}">
          ${percent(c24h)}
        </td>

        <td>--</td>

        <td>${money(usd.market_cap)}</td>

        <td>${money(usd.volume_24h)}</td>

      </tr>

    `;

  }).join("");

}


/* =========================
   SEARCH MODAL
========================= */

function openSearch() {

  document
    .getElementById("searchModal")
    .classList.add("show");

  document
    .getElementById("modalSearch")
    .focus();

}


function closeSearch() {

  document
    .getElementById("searchModal")
    .classList.remove("show");

}


function modalSearchCoins() {

  const query =
    document.getElementById("modalSearch")
      .value
      .toLowerCase();


  const result =
    document.getElementById("modalResults");


  if (!query) {

    result.innerHTML = "";

    return;

  }


  const found = coins
    .filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.symbol.toLowerCase().includes(query)
    )
    .slice(0, 8);


  result.innerHTML = found.map(c => `

    <div class="modal-result">

      <img
        src="${logo(c.id)}"
        onerror="this.style.display='none'"
      >

      <div>

        <strong>
          ${c.name}
        </strong>

        <small>
          ${c.symbol}
        </small>

      </div>

    </div>

  `).join("");

}


/* =========================
   SCROLL
========================= */

function scrollToMarket() {

  document
    .getElementById("market")
    .scrollIntoView({
      behavior: "smooth"
    });

}


/* =========================
   START
========================= */

loadCoins();


/*
   Refresh market every 60 seconds
*/

setInterval(() => {

  loadCoins();

}, 60000);

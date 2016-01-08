// Mozilla demo server (flushed every day)
var server = "https://kinto.dev.mozaws.net/v1";
// Simplest credentials ever.
var authorization =  "Basic " + btoa("public:notsecret");

// Kinto bucket/collection.
var bucket = "kinto_flappy";
var collection = "scores";

// Resuable HTTP headers.
var headers = {
  "Accept":        "application/json",
  "Content-Type":  "application/json",
  "Authorization": authorization,
};
var options = {headers: headers};

var bucketURL = `${server}/buckets/${bucket}`;
var collectionURL = `${bucketURL}/collections/${collection}`;
var recordsURL = `${collectionURL}/records`;


// Create bucket if necessary
// And show scores on startup
install()
 .then(refreshScores);


function publishScore(score) {
  // Ignore null scores
  if (score <= 0)
    return;

  var player = document.getElementById("player").value || "Anonymous";

  // Only one score per player:
  // Generate a record UUID based on player name
  var hash = md5(player);  // from md5.js
  var input = string2ascii(hash);
  var recordId = uuid.v4({random: input});

  var url = `${recordsURL}/${recordId}`;
  var data = {player: player, score: score, date: new Date().toISOString()};
  var body = JSON.stringify({data: data});
  var putOptions = Object.assign({method: "PUT", body: body}, options);

  fetch(url, options)
    .then(function (response) {
      if (response.status == 404) {
        // Create.
        return fetch(url, putOptions);
      }
      // Replace if higher.
      return response.json().
        then(function (result) {
          if (score > result.data.score) {
            return fetch(url, putOptions);
          }
        });
    })
    .then(refreshScores);
}


function install() {
  var putHeaders = Object.assign({"If-None-Match": "*"}, headers);
  var putOptions = {method: "PUT", headers: putHeaders};
  return fetch(bucketURL, putOptions)
    .then(function (response) {
      return fetch(collectionURL, putOptions);
    });
}


function refreshScores() {
  // Fetch 10 biggest scores
  var url = `${recordsURL}?_sort=-score&_limit=10`;
  fetch(url, options)
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      var items = result.data.map(function (r) {
        return `<li><strong>${r.score}</strong> ${r.player} (${r.date})</li>`;
      });
      document.getElementById('top10').innerHTML = items.join("");
    });
}


function string2ascii(str) {
  var cc = [];
  for(var i = 0; i < str.length; ++i)
    cc.push(str.charCodeAt(i));
  return cc;
}

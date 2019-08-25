"use strict";

const request = require('request');

const knex = require('knex')({
  client: 'pg',
  connection: {
    database: 'promise-test'
  },
  //debug: true
});

const pg = require('knex')({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
  searchPath: 'knex,public'
});

var queryUSDAFarmersMarkets = (zipCode) => {
  return new Promise((resolve, reject) => {
    const baseUrl = 'http://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=';
    request(baseUrl + zipCode, (err, resp, body) => {
      if (err) reject(err);
      resolve(body);
    });
  });
};

Promise.resolve(knex.schema.createTableIfNotExists('markets', (table) => {
  table.string('id');
  table.string('marketname');
}))
  .then(() => {
    console.log('Fetching list of markets from USDA server...');
    return queryUSDAFarmersMarkets(10004).then((respBody) => {
      return JSON.parse(respBody).results;
    });
  })
  .then((markets) => {
    console.log('Inserting query results into the db...');
    return Promise.all(markets.map((market) => {
      return knex('markets').insert(market);
    }));
  })
  .then((result) => {
    console.log('Retrieving all the records in markets table...');
    return knex.select('*').from('markets').then((result) => {
      return result;
    });
  })
  .then((result) => {
    console.log('Now we should have data in our table!');
    console.log('Contents of market table: ', result);
  })
  .catch((err) => {
    console.log(err);
  });
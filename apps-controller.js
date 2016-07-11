/* jshint esversion:6 , node: true , multistr:true */
'use strict';

var ORM = require('./orm');
var moment = require('moment');
moment.utc();

module.exports = {

  find: (request, reply) => {

    ORM.apps.find().then((rows) => {
      reply(rows);
    }).catch((err) => {
      reply(err);
    });

  },

  getBySlug: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {
      reply(rows[0]);
    }).catch((err) => {
      reply(err);
    });

  },

  deleteBySlug: (request, reply) => {

    ORM.apps.deleteBySlug(request.params.appslug).then((rows) => {
      reply('OK');
    }).catch((err) => {
      reply(err);
    });

  },

  insert: (request, reply) => {

    ORM.apps.insert({
      slug: request.payload.slug,
      name: request.payload.name,
      name_single: request.payload.name_single,
      created: moment().format('YYYY-MM-DD HH:mm:ss'),
      modified: moment().format('YYYY-MM-DD HH:mm:ss')
    }).then((rows) => {
      reply(rows[0]);
    }).catch((err) => {
      console.log(err);
      reply(err);
    });

  },

  update: (request, reply) => {

    let data = {
      modified: moment().format('YYYY-MM-DD HH:mm:ss')
    };

    if (request.payload.name !== undefined) {
      data.name = request.payload.name;
    }
    if (request.payload.name_single !== undefined) {
      data.name_single = request.payload.name_single;
    }

    ORM.apps.update(data, request.params.appslug).then((rows) => {
      reply(rows[0]);
    }).catch((err) => {
      console.log(err);
      reply(err);
    });

  }

};

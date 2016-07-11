/* jshint esversion:6 , node: true , multistr:true */
'use strict';

var ORM = require('./orm');
var moment = require('moment');
moment.utc();

module.exports = {

  find: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {
      ORM.fields.findByAppId(rows[0].id).then((rows) => {
        reply(rows);
      }).catch((err) => {
        reply(err);
      });
    }).catch((err) => {
      reply(err);
    });

  },

  getBySlug: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {
      ORM.fields.findByAppIdAndSlug(rows[0].id, request.params.fieldslug).then((rows) => {
        reply(rows[0]);
      }).catch((err) => {
        reply(err);
      });
    }).catch((err) => {
      reply(err);
    });

  },

  deleteBySlug: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {
      ORM.fields.deleteByAppIdAndSlug(rows[0].id, request.params.fieldslug).then((rows) => {
        reply('OK');
      }).catch((err) => {
        reply(err);
      });
    }).catch((err) => {
      reply(err);
    });

  },

  insert: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {
      ORM.fields.insert({
        app_id: rows[0].id,
        slug: request.payload.slug,
        name: request.payload.name,
        srt: request.payload.srt,
        typ: request.payload.typ,
        required: request.payload.required,
        settings: JSON.stringify(request.payload.settings),
        multiple: JSON.stringify(request.payload.multiple),
        created: moment().format('YYYY-MM-DD HH:mm:ss'),
        modified: moment().format('YYYY-MM-DD HH:mm:ss')
      }).then((rows) => {
        reply(rows[0]);
      }).catch((err) => {
        console.log(err);
        reply(err);
      });
    }).catch((err) => {
      reply(err);
    });

  },

  update: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {

      let data = {
        modified: moment().format('YYYY-MM-DD HH:mm:ss'),
        app_id: rows[0].id,
      };

      if (request.payload.name !== undefined) {
        data.name = request.payload.name;
      }
      if (request.payload.srt !== undefined) {
        data.srt = request.payload.srt;
      }
      if (request.payload.typ !== undefined) {
        data.typ = request.payload.typ;
      }
      if (request.payload.required !== undefined) {
        data.required = request.payload.required;
      }
      if (request.payload.settings !== undefined) {
        data.settings = JSON.stringify(request.payload.settings);
      }
      if (request.payload.multiple !== undefined) {
        data.multiple = JSON.stringify(request.payload.multiple);
      }

      ORM.fields.update(data, request.params.fieldslug).then((rows) => {
        reply(rows[0]);
      }).catch((err) => {
        console.log(err);
        reply(err);
      });

    }).catch((err) => {
      reply(err);
    });

  }

};

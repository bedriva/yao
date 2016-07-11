/* jshint esversion:6 , node: true , multistr:true */
'use strict';

var ORM = require('./orm');
var moment = require('moment');
moment.utc();

module.exports = {

  find: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {
      ORM.entries.findByAppId(rows[0].id).then((rows) => {

        var newRows = [];
        var row = {};

        var lastId = 0;

        // Build row entries
        rows.forEach(function(r) {

          if (r.id !== lastId) {
            if (lastId > 0) {
              newRows.push(row);
            }

            row = {
              id: r.id,
              app_id: r.app_id,
              created: r.created,
              modified: r.modified,
              fields: []
            };
          }

          lastId = r.id;

          row.fields.push({
            field_id: r.field_id,
            field_slug: r.slug,
            data: [{value1: r.value1, value2: r.value2}]
          });

        });

        newRows.push(row);

        reply(newRows);
      });

    }).catch((err) => {
      reply(err);
    });

  },

  getById: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {
      ORM.entries.findByAppIdAndId(rows[0].id, request.params.entryid).then((rows) => {
        var newRows = [];
        var row = {};

        var lastId = 0;

        // Build row entries
        rows.forEach(function(r) {

          if (r.id !== lastId) {
            if (lastId > 0) {
              newRows.push(row);
            }

            row = {
              id: r.id,
              app_id: r.app_id,
              created: r.created,
              modified: r.modified,
              fields: []
            };
          }

          lastId = r.id;

          row.fields.push({
            field_id: r.field_id,
            field_slug: r.slug,
            data: [{value1: r.value1, value2: r.value2}]
          });

        });

        newRows.push(row);

        reply(newRows[0]);

      }).catch((err) => {
        reply(err);
      });
    }).catch((err) => {
      reply(err);
    });

  },

  deleteById: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {
      ORM.entries.deleteByAppIdAndId(rows[0].id, request.params.entryid).then((rows) => {
        reply('OK');
      }).catch((err) => {
        reply(err);
      });
    }).catch((err) => {
      reply(err);
    });

  },

  getByIdNice: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {
      ORM.entries.findByAppIdAndId(rows[0].id, request.params.entryid).then((rows) => {
        var newRows = [];
        var row = {};

        var lastId = 0;

        // Build row entries
        rows.forEach(function(r) {

          if (r.id !== lastId) {
            if (lastId > 0) {
              newRows.push(row);
            }

            row = {
              id: r.id,
              app_id: r.app_id,
              created: r.created,
              modified: r.modified,
              fields: {}
            };
          }

          lastId = r.id;

          row.fields[r.slug] = r.value1;
          if (r.value2 !== '' && r.value2 !== null) {
            row.fields[r.slug + '___2'] = r.value2;
          }

        });

        newRows.push(row);

        reply(newRows[0]);

      }).catch((err) => {
        reply(err);
      });
    }).catch((err) => {
      reply(err);
    });

  },

  insertNice: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {
      ORM.entries.insert({
        app_id: rows[0].id,
        created: moment().format('YYYY-MM-DD HH:mm:ss'),
        modified: moment().format('YYYY-MM-DD HH:mm:ss')
      }).then((entryRows) => {

        var fields = [];

        for (let i in request.payload.fields) {
          let field = {
            entry_id: entryRows[0].id,
            field_slug: i,
            app_id: rows[0].id,
            value1_bigtext: request.payload.fields[i],
            created: moment().format('YYYY-MM-DD HH:mm:ss'),
            modified: moment().format('YYYY-MM-DD HH:mm:ss')
          };

          fields.push(field);
        }

        var fieldPromises = fields.map(ORM.entryFields.insert);

        Promise.all(fieldPromises).then(function(results) {

          ORM.entries.findByAppIdAndId(rows[0].id, entryRows[0].id).then((rows) => {
            var newRows = [];
            var row = {};

            var lastId = 0;

            // Build row entries
            rows.forEach(function(r) {

              if (r.id !== lastId) {
                if (lastId > 0) {
                  newRows.push(row);
                }

                row = {
                  id: r.id,
                  app_id: r.app_id,
                  created: r.created,
                  modified: r.modified,
                  fields: {}
                };
              }

              lastId = r.id;

              row.fields[r.slug] = r.value1;
              if (r.value2 !== '' && r.value2 !== null) {
                row.fields[r.slug + '___2'] = r.value2;
              }

            });

            newRows.push(row);

            reply(newRows[0]);

          }).catch(function(err) {
            reply(new Error('Field failed'));
          });
        }).catch(function(err) {
          reply(new Error('Field failed'));
        });

      }).catch((err) => {
        console.log(err);
        reply(err);
      });
    }).catch((err) => {
      reply(err);
    });

  },

  updateNice: (request, reply) => {

    ORM.apps.findBySlug(request.params.appslug).then((rows) => {
      ORM.entries.update({
        app_id: rows[0].id,
        modified: moment().format('YYYY-MM-DD HH:mm:ss')
      }, request.params.entryid).then((entryRows) => {

        var fields = [];

        for (let i in request.payload.fields) {
          let field = {
            entry_id: entryRows[0].id,
            field_slug: i,
            app_id: rows[0].id,
            value1_bigtext: request.payload.fields[i],
            modified: moment().format('YYYY-MM-DD HH:mm:ss')
          };

          fields.push(field);
        }

        var fieldPromises = fields.map(ORM.entryFields.update);

        Promise.all(fieldPromises).then(function(results) {

          ORM.entries.findByAppIdAndId(rows[0].id, entryRows[0].id).then((rows) => {
            var newRows = [];
            var row = {};

            var lastId = 0;

            // Build row entries
            rows.forEach(function(r) {

              if (r.id !== lastId) {
                if (lastId > 0) {
                  newRows.push(row);
                }

                row = {
                  id: r.id,
                  app_id: r.app_id,
                  created: r.created,
                  modified: r.modified,
                  fields: {}
                };
              }

              lastId = r.id;

              row.fields[r.slug] = r.value1;
              if (r.value2 !== '' && r.value2 !== null) {
                row.fields[r.slug + '___2'] = r.value2;
              }

            });

            newRows.push(row);

            reply(newRows[0]);

          }).catch(function(err) {
            reply(new Error('Field failed'));
          });
        }).catch(function(err) {
          reply(new Error('Field failed'));
        });

      }).catch((err) => {
        reply(err);
      });
    }).catch((err) => {
      reply(err);
    });

  }

};

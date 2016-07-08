/* jshint esversion:6 */
/* jshint node: true */
/* jshint multistr:true */
/* globals console */
'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Joi = require('joi');

var moment = require('moment');
moment.utc();

var http = require("http");


var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'yao'
});

connection.connect();



var cluster    = require('cluster');
var os = require('os');
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {

const options = {
  info: {
          'title': 'YAO API documentation',
          'version': '0.1',
      }
  };

const server = new Hapi.Server();
server.connection({
      host: 'localhost',
      port: 8000
  });

server.register([
    Inert,
    Vision,
    {
        'register': HapiSwagger,
        'options': options
    }], (err) => {
        server.start( (err) => {
           if (err) {
                console.log(err);
            } else {
                console.log('Server running at:', server.info.uri);
            }
        });
    });

  let FIELDS_ID = 3;
  let FIELDS = [
    {
      id: 1,
      app_id: 1,
      srt: 1,
      slug: 'name',
      name: 'Namn',
      type: 'text',
      required: true,
      settings: {
        suffix: 'pengar'
      },
      multiple: {
        enabled: false
      }
    },
    {
      id: 2,
      app_id: 1,
      srt: 2,
      slug: 'hourly_rate',
      name: 'Timpris',
      type: 'number',
      required: false,
      settings: {
        suffix: 'kr',
        min: 0
      },
      multiple: {
        enabled: false
      }
    },
    {
      id: 3,
      app_id: 1,
      srt: 3,
      slug: 'business',
      name: 'Branscher',
      type: 'choice',
      required: false,
      settings: {
        options: [
          {
            key: 1,
            srt: 2,
            value: 'IT'
          },
          {
            key: 2,
            srt: 1,
            value: 'Bygg'
          },
          {
            key: 2,
            srt: 3,
            value: 'Övrigt'
          }
        ]
      },
      multiple: {
        enabled: true,
        min: 0,
        max: 5
      }
    }
  ];

  let ENTRIES_ID = 1;
  let ENTRIES = [
    {
      id: 1,
      app_id: 1,
      fields: [
        {
          field_id: 1,
          data: [
            {
              value1: 'Bedriva Sverige AB'
            }
          ]
        },
        {
          field_id: 2,
          data: [
            {
              value1: 700
            }
          ]
        },
        {
          field_id: 3,
          data: [
            {
              value1: 1
            }
          ]
        }
      ]
    }
  ];

  let Routes = [

    /*
     * Apps
     */
    {
        method: 'GET',
        path:'/apps',
        config: {
          handler: (request, reply) => {

            connection.query('SELECT * FROM apps', function(err, rows, fields) {
              if (err) throw err;

              reply(rows);
            });

          },
          description: 'List apps',
          notes: 'List all your apps',
          tags: ['api', 'apps']
        }
    },

    {
        method: 'GET',
        path:'/apps/{appslug}',
        config: {
          handler: (request, reply) => {

            connection.query(mysql.format('SELECT * FROM apps WHERE slug LIKE ? LIMIT 0, 1', [
              request.params.appslug
            ]), function(err, rows, fields) {
              if (err) throw err;

              if (rows) {
                reply(rows[0]);
              } else {
                reply({});
              }
            });

          },
          description: 'View app',
          notes: 'Retrieve an app',
          tags: ['api', 'apps']
        }
    },

    {
        method: 'POST',
        path:'/apps',
        config: {
          handler: (request, reply) => {

            connection.query(mysql.format('INSERT INTO apps SET ?', {
              slug: request.payload.slug,
              name: request.payload.name,
              name_single: request.payload.name_single,
              created: moment().format('YYYY-MM-DD HH:mm:ss'),
              modified: moment().format('YYYY-MM-DD HH:mm:ss')
            }), function(err, result) {
              if (err) throw err;

              connection.query(mysql.format('SELECT * FROM apps WHERE id = ?', [
                result.insertId
              ]), function(err, rows, fields) {
                if (err) throw err;

                if (rows) {
                  reply(rows[0]);
                } else {
                  reply({});
                }
              });
            });

          },
          description: 'Create app',
          notes: 'Create an app',
          tags: ['api', 'apps'],
          validate: {
              payload: {
                  slug: Joi.string().max(20)
                      .required()
                      .description('URL slug in plural form (e.g. customers)'),
                  name: Joi.string().max(25)
                      .required()
                      .description('App name in plural form (e.g. Customers)'),
                  name_single: Joi.string().max(25)
                      .required()
                      .description('App name in singular form (e.g. Customer)')
              }
          }
        }
    },

    /*
     * Fields
     */
    {
        method: 'GET',
        path:'/apps/{appslug}/fields',
        config: {
          handler: (request, reply) => {

            connection.query(mysql.format('SELECT * FROM apps WHERE slug LIKE ? LIMIT 0, 1', [
              request.params.appslug
            ]), function(err, rows, fields) {
              if (err) throw err;

              if (rows) {

                connection.query(mysql.format('SELECT * FROM fields WHERE app_id = ?', [
                  rows[0].id
                ]), function(err, rows, fields) {
                  if (err) throw err;

                  reply(rows);
                });

              } else {
                reply([]);
              }
            });

          },
          description: 'List fields',
          notes: 'List all your fields',
          tags: ['api', 'fields']
        }
    },

    {
        method: 'GET',
        path:'/apps/{appslug}/fields/{fieldslug}',
        config: {
          handler: (request, reply) => {

            connection.query(mysql.format('SELECT * FROM apps WHERE slug LIKE ? LIMIT 0, 1', [
              request.params.appslug
            ]), function(err, rows, fields) {
              if (err) throw err;

              if (rows) {

                connection.query(mysql.format('SELECT * FROM fields WHERE app_id = ? AND slug LIKE ?', [
                  rows[0].id,
                  request.params.fieldslug
                ]), function(err, rows, fields) {
                  if (err) throw err;

                  if (rows) {
                    reply(rows[0]);
                  } else {
                    reply({});
                  }

                });

              } else {
                reply([]);
              }
            });

          },
          description: 'View field',
          notes: 'Retrieve a field',
          tags: ['api', 'fields']
        }
    },

    {
        method: 'POST',
        path:'/apps/{appslug}/fields',
        config: {
          handler: (request, reply) => {

            connection.query(mysql.format('SELECT * FROM apps WHERE slug LIKE ? LIMIT 0, 1', [
              request.params.appslug
            ]), function(err, rows, fields) {
              if (err) throw err;

              if (rows) {

                connection.query(mysql.format('INSERT INTO fields SET ?', {
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
                }), function(err, result) {
                  if (err) throw err;

                  connection.query(mysql.format('SELECT * FROM fields WHERE id = ?', [
                    result.insertId
                  ]), function(err, rows, fields) {
                    if (err) throw err;

                    if (rows) {
                      reply(rows[0]);
                    } else {
                      reply({});
                    }
                  });
                });

              } else {
                reply([]);
              }
            });

          },
          description: 'Create field',
          notes: 'Create a field on an app',
          tags: ['api', 'fields'],
          validate: {
              payload: {
                  srt: Joi.number().min(-500).max(500)
                      .required()
                      .description('Sorting index'),
                  slug: Joi.string().max(20)
                      .required()
                      .description('URL slug/machine name (e.g. name or customer_number)'),
                  name: Joi.string().max(25)
                      .required()
                      .description('Field name (e.g. Name or Customer number)'),
                  typ: Joi.any().allow(['text', 'number', 'choice'])
                      .required()
                      .description('Field type'),
                  required: Joi.boolean()
                      .required()
                      .description('Whether this field is required'),
                  settings: Joi.object()
                      .required()
                      .description('A setting object. Content depends on the type field'),
                  multiple: Joi.object().keys({
                        enabled: Joi.boolean().required().description('Whether multiple functionality is enabled'),
                        min: Joi.number().min(0),
                        max: Joi.number().min(1)
                      })
                      .required()
                      .description('A setting object for the multiple property'),
              }
          }
        }
    },

    /*
     * Data
     */
    {
        method: 'GET',
        path:'/apps/{appslug}/entries',
        config: {
          handler: (request, reply) => {

            connection.query(mysql.format('SELECT * FROM apps WHERE slug LIKE ? LIMIT 0, 1', [
              request.params.appslug
            ]), function(err, rows, fields) {
              if (err) throw err;

              if (rows) {

                connection.query(mysql.format('SELECT e.id, e.app_id, f.field_id, e.created, e.modified \
                                            	, CONCAT(IF(f.value1_bigtext IS NULL, "", f.value1_bigtext), \
                                                IF(f.value1_text IS NULL, "", f.value1_text), \
                                                IF(f.value1_int IS NULL, "", f.value1_int)) value1 \
                                              , CONCAT(IF(f.value2_bigtext IS NULL, "", f.value2_bigtext), \
                                                IF(f.value2_text IS NULL, "", f.value2_text), \
                                                IF(f.value2_int IS NULL, "", f.value2_int)) value2 \
                                              , fi.slug, fi.multiple \
                                                FROM entries e \
                                              LEFT JOIN entry_fields f ON e.id = f.entry_id \
                                              LEFT JOIN fields fi ON f.field_id = fi.id \
                                              WHERE e.app_id = ?', [
                  rows[0].id
                ]), function(err, rows, fields) {
                  if (err) throw err;

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

                    row.fields.push({
                      field_id: r.field_id,
                      field_slug: r.slug,
                      data: [{value1: r.value1, value2: r.value2}]
                    });

                  });

                  newRows.push(row);

                  reply(newRows);
                });

              } else {
                reply([]);
              }
            });

          },
          description: 'List entries',
          notes: 'List all your entries',
          tags: ['api', 'apps']
        }
    },

    {
        method: 'GET',
        path:'/apps/{appslug}/entries/{entryid}',
        config: {
          handler: (request, reply) => {

            connection.query(mysql.format('SELECT * FROM apps WHERE slug LIKE ? LIMIT 0, 1', [
              request.params.appslug
            ]), function(err, rows, fields) {
              if (err) throw err;

              if (rows) {

                connection.query(mysql.format('SELECT e.id, e.app_id, f.field_id, e.created, e.modified \
                                            	, CONCAT(IF(f.value1_bigtext IS NULL, "", f.value1_bigtext), \
                                                IF(f.value1_text IS NULL, "", f.value1_text), \
                                                IF(f.value1_int IS NULL, "", f.value1_int)) value1 \
                                              , CONCAT(IF(f.value2_bigtext IS NULL, "", f.value2_bigtext), \
                                                IF(f.value2_text IS NULL, "", f.value2_text), \
                                                IF(f.value2_int IS NULL, "", f.value2_int)) value2 \
                                              , fi.slug, fi.multiple \
                                                FROM entries e \
                                              LEFT JOIN entry_fields f ON e.id = f.entry_id \
                                              LEFT JOIN fields fi ON f.field_id = fi.id \
                                              WHERE e.app_id = ? AND e.id = ?', [
                  rows[0].id,
                  request.params.entryid
                ]), function(err, rows, fields) {
                  if (err) throw err;

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

                    row.fields.push({
                      field_id: r.field_id,
                      field_slug: r.slug,
                      data: [{value1: r.value1, value2: r.value2}]
                    });

                  });

                  newRows.push(row);

                  reply(newRows[0]);
                });

              } else {
                reply([]);
              }
            });

          },
          description: 'View entry',
          notes: 'Retrieve an entry',
          tags: ['api', 'entries']
        }
    },

    {
        method: 'GET',
        path:'/apps/{appslug}/entries/{entryid}.nice',
        config: {
          handler: (request, reply) => {

            connection.query(mysql.format('SELECT * FROM apps WHERE slug LIKE ? LIMIT 0, 1', [
              request.params.appslug
            ]), function(err, rows, fields) {
              if (err) throw err;

              if (rows) {

                connection.query(mysql.format('SELECT e.id, e.app_id, f.field_id, e.created, e.modified \
                                            	, CONCAT(IF(f.value1_bigtext IS NULL, "", f.value1_bigtext), \
                                                IF(f.value1_text IS NULL, "", f.value1_text), \
                                                IF(f.value1_int IS NULL, "", f.value1_int)) value1 \
                                              , CONCAT(IF(f.value2_bigtext IS NULL, "", f.value2_bigtext), \
                                                IF(f.value2_text IS NULL, "", f.value2_text), \
                                                IF(f.value2_int IS NULL, "", f.value2_int)) value2 \
                                              , fi.slug, fi.multiple \
                                                FROM entries e \
                                              LEFT JOIN entry_fields f ON e.id = f.entry_id \
                                              LEFT JOIN fields fi ON f.field_id = fi.id \
                                              WHERE e.app_id = ? AND e.id = ?', [
                  rows[0].id,
                  request.params.entryid
                ]), function(err, rows, fields) {
                  if (err) throw err;

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

                    row.fields[r.slug] = r.value1;
                    row.fields[r.slug + '___2'] = r.value2;

                  });

                  newRows.push(row);

                  reply(newRows[0]);
                });

              } else {
                reply([]);
              }
            });

          },
          description: 'View entry in nice format',
          notes: 'Retrieve an entry in the nice format, with the values assigned to field properties',
          tags: ['api', 'entries']
        }
    },

    {
        method: 'POST',
        path:'/apps/{appslug}/entries.nice',
        config: {
          handler: (request, reply) => {

            connection.query(mysql.format('SELECT * FROM apps WHERE slug LIKE ? LIMIT 0, 1', [
              request.params.appslug
            ]), function(err, rows, fields) {
              if (err) throw err;

              if (rows) {

                connection.query(mysql.format('INSERT INTO entries SET ?', {
                  app_id: rows[0].id,
                  created: moment().format('YYYY-MM-DD HH:mm:ss'),
                  modified: moment().format('YYYY-MM-DD HH:mm:ss')
                }), function(err, result) {
                  if (err) throw err;

                  reply({id: result.insertId});

                  for (let i in request.payload.fields) {
                    let field = {
                      entry_id: result.insertId,
                      field_id: 1, // todo
                      value1_bigtext: request.payload.fields[i],
                      created: moment().format('YYYY-MM-DD HH:mm:ss'),
                      modified: moment().format('YYYY-MM-DD HH:mm:ss')
                    };

                    connection.query(mysql.format('INSERT INTO entry_fields SET ?', field), function(err, result) {
                      if (err) throw err;
                    });
                  }

                });

              } else {
                reply([]);
              }
            });

          },
          description: 'Create entry',
          notes: 'Create an entry in an app',
          tags: ['api', 'entries'],
          validate: {
              payload: {
                  fields: Joi.object()
                      .required()
                      .description('The fields data. Field slug is key, field data is value.'),
              }
          }
        }
    },

  ];

server.route(Routes);

}

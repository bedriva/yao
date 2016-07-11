/* jshint esversion:6 , node: true , multistr:true */
'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Joi = require('joi');

var moment = require('moment');
moment.utc();

var http = require("http");

var OrmProvider = require('./orm');
OrmProvider.setup('yao', 'localhost', 'root', '');

var cluster    = require('cluster');
var os = require('os');
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
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

  //let handlers = require('./route-handlers');
  let appsController = require('./apps-controller');
  let fieldsController = require('./fields-controller');
  let entriesController = require('./entries-controller');

  let Routes = [

    /*
     * Apps
     */
    {
        method: 'GET',
        path:'/apps',
        config: {
          handler: appsController.find,
          description: 'List apps',
          notes: 'List all your apps',
          tags: ['api', 'apps']
        }
    },

    {
        method: 'GET',
        path:'/apps/{appslug}',
        config: {
          handler: appsController.getBySlug,
          description: 'View app',
          notes: 'Retrieve an app',
          tags: ['api', 'apps']
        }
    },

    {
        method: 'DELETE',
        path:'/apps/{appslug}',
        config: {
          handler: appsController.deleteBySlug,
          description: 'Delete app',
          notes: 'Deletes an app',
          tags: ['api', 'apps']
        }
    },

    {
        method: 'POST',
        path:'/apps',
        config: {
          handler: appsController.insert,
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

    {
        method: 'PUT',
        path:'/apps/{appslug}',
        config: {
          handler: appsController.update,
          description: 'Update app',
          notes: 'Update an app',
          tags: ['api', 'apps'],
          validate: {
              payload: {
                  name: Joi.string().max(25)
                      .description('App name in plural form (e.g. Customers)'),
                  name_single: Joi.string().max(25)
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
          handler: fieldsController.find,
          description: 'List fields',
          notes: 'List all your fields',
          tags: ['api', 'fields']
        }
    },

    {
        method: 'GET',
        path:'/apps/{appslug}/fields/{fieldslug}',
        config: {
          handler: fieldsController.getBySlug,
          description: 'View field',
          notes: 'Retrieve a field',
          tags: ['api', 'fields']
        }
    },

    {
        method: 'DELETE',
        path:'/apps/{appslug}/fields/{fieldslug}',
        config: {
          handler: fieldsController.deleteBySlug,
          description: 'Delete field',
          notes: 'Delete a field',
          tags: ['api', 'fields']
        }
    },

    {
        method: 'POST',
        path:'/apps/{appslug}/fields',
        config: {
          handler: fieldsController.insert,
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

    {
        method: 'PUT',
        path:'/apps/{appslug}/fields/{fieldslug}',
        config: {
          handler: fieldsController.update,
          description: 'Update field',
          notes: 'Update a field on an app',
          tags: ['api', 'fields'],
          validate: {
              payload: {
                  srt: Joi.number().min(-500).max(500)
                      .description('Sorting index'),
                  name: Joi.string().max(25)
                      .description('Field name (e.g. Name or Customer number)'),
                  typ: Joi.any().allow(['text', 'number', 'choice'])
                      .description('Field type'),
                  required: Joi.boolean()
                      .description('Whether this field is required'),
                  settings: Joi.object()
                      .description('A setting object. Content depends on the type field'),
                  multiple: Joi.object().keys({
                        enabled: Joi.boolean().description('Whether multiple functionality is enabled'),
                        min: Joi.number().min(0),
                        max: Joi.number().min(1)
                      })
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
          handler: entriesController.find,
          description: 'List entries',
          notes: 'List all your entries',
          tags: ['api', 'apps']
        }
    },

    {
        method: 'GET',
        path:'/apps/{appslug}/entries/{entryid}',
        config: {
          handler: entriesController.getById,
          description: 'View entry',
          notes: 'Retrieve an entry',
          tags: ['api', 'entries']
        }
    },

    {
        method: 'DELETE',
        path:'/apps/{appslug}/entries/{entryid}',
        config: {
          handler: entriesController.deleteById,
          description: 'Delete entry',
          notes: 'Deletes an entry',
          tags: ['api', 'entries']
        }
    },

    {
        method: 'GET',
        path:'/apps/{appslug}/entries/{entryid}.nice',
        config: {
          handler: entriesController.getByIdNice,
          description: 'View entry in nice format',
          notes: 'Retrieve an entry in the nice format, with the values assigned to field properties',
          tags: ['api', 'entries']
        }
    },

    {
        method: 'POST',
        path:'/apps/{appslug}/entries.nice',
        config: {
          handler: entriesController.insertNice,
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

    {
        method: 'PUT',
        path:'/apps/{appslug}/entries/{entryid}.nice',
        config: {
          handler: entriesController.updateNice,
          description: 'Update entry',
          notes: 'Update an entry in an app',
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

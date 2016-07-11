/* jshint esversion:6 , node: true , multistr:true */
'use strict';

var mysql      = require('mysql');

var OrmProvider = {
  apps: {},
  entries: {},
  fields: {},
  entryFields: {}
};

OrmProvider.setup = (db_name, host, username, password) => {

    this.connection = mysql.createConnection({
      host     : host,
      user     : username,
      password : password,
      database : db_name
    });

    this.connection.connect();
};

OrmProvider.select = (query, params) => {

  var that = this;

  return new Promise(function(resolve, reject) {
    that.connection.query( mysql.format(query, params), (err, rows, fields) => {
       if (!err) {
          resolve(rows);  // fulfilled successfully
       } else {
          reject(err);  // error, rejected
       }
    });
  });

};

OrmProvider.insert = (query, params) => {

  var that = this;

  return new Promise(function(resolve, reject) {
    that.connection.query( mysql.format(query, params), (err, rows, fields) => {
       if (!err) {
          resolve(rows);  // fulfilled successfully
       } else {
          reject(err);  // error, rejected
       }
    });
  });

};

OrmProvider.update = (query, params, field, whereId, field2, whereId2) => {

  var that = this;

  if (field2 === undefined) {
    field2 = '1';
  }
  if (whereId2 === undefined) {
    whereId2 = '1';
  }

  return new Promise(function(resolve, reject) {
    that.connection.query( mysql.format((query + ' WHERE ' + field + ' = ' + that.connection.escape(whereId) + ' AND ' + field2 + ' = ' + that.connection.escape(whereId2)), params), (err, rows, fields) => {
       if (!err) {
          resolve(rows);  // fulfilled successfully
       } else {
          reject(err);  // error, rejected
       }
    });
  });

};

OrmProvider.delete = (query, params) => {

  var that = this;

  console.log(mysql.format(query, params));

  return new Promise(function(resolve, reject) {
    that.connection.query( mysql.format(query, params), (err, rows) => {
       if (!err) {
          resolve(rows);  // fulfilled successfully
       } else {
          reject(err);  // error, rejected
       }
    });
  });

};

OrmProvider.apps.find = () => {
  return OrmProvider.select('SELECT * FROM apps');
};

OrmProvider.apps.findBySlug = (slug) => {
  return OrmProvider.select('SELECT * FROM apps WHERE slug LIKE ? LIMIT 0, 1', [
    slug
  ]);
};

OrmProvider.apps.deleteBySlug = (slug) => {
  return OrmProvider.delete('DELETE FROM apps WHERE slug LIKE ? LIMIT 1', [
    slug
  ]);
};

OrmProvider.apps.findById = (id) => {
  return OrmProvider.select('SELECT * FROM apps WHERE id LIKE ? LIMIT 0, 1', [
    id
  ]);
};

OrmProvider.apps.insert = (data) => {
  return new Promise(function(resolve, reject) {

    OrmProvider.apps.findBySlug(data.slug).then((rows) => {

      if (rows.length) {
        reject(new Error('Slug exists'));
      } else {
        OrmProvider.insert('INSERT INTO apps SET ?', data).then((result) => {

          OrmProvider.apps.findById(result.insertId).then((rows) => {
            resolve(rows);
          }).catch((err) => {
            reject(err);
          });

        }).catch((err) => {
          reject(err);
        });
      }
    }).catch((err) => {
      reject(err);
    });

  });

};

OrmProvider.apps.update = (data, whereId) => {
  return new Promise(function(resolve, reject) {

    OrmProvider.update('UPDATE apps SET ?', data, 'slug', whereId).then((result) => {

      OrmProvider.apps.findBySlug(whereId).then((rows) => {
        resolve(rows);
      }).catch((err) => {
        reject(err);
      });

    }).catch((err) => {
      reject(err);
    });

  });

};

OrmProvider.fields.findByAppId = (appId) => {
  return OrmProvider.select('SELECT * FROM fields WHERE app_id = ? LIMIT 0, 1', [
    appId
  ]);
};

OrmProvider.fields.findByAppIdAndSlug = (appId, slug) => {
  return OrmProvider.select('SELECT * FROM fields WHERE slug LIKE ? AND app_id = ? LIMIT 0, 1', [
    slug,
    appId
  ]);
};

OrmProvider.fields.deleteByAppIdAndSlug = (appId, slug) => {
  return OrmProvider.delete('DELETE FROM fields WHERE slug LIKE ? AND app_id = ? LIMIT 1', [
    slug,
    appId
  ]);
};

OrmProvider.fields.findByAppIdAndId = (appId, id) => {
  return OrmProvider.select('SELECT * FROM fields WHERE id LIKE ? AND app_id = ? LIMIT 0, 1', [
    id,
    appId
  ]);
};

OrmProvider.fields.insert = (data) => {
  return new Promise(function(resolve, reject) {

    OrmProvider.fields.findByAppIdAndSlug(data.app_id, data.slug).then((rows) => {

      if (rows.length) {
        reject(new Error('Slug exists'));
      } else {
        OrmProvider.insert('INSERT INTO fields SET ?', data).then((result) => {

          OrmProvider.fields.findByAppIdAndId(data.app_id, result.insertId).then((rows) => {
            resolve(rows);
          }).catch((err) => {
            reject(err);
          });

        }).catch((err) => {
          reject(err);
        });
      }
    }).catch((err) => {
      reject(err);
    });

  });

};

OrmProvider.fields.update = (data, whereId) => {
  return new Promise(function(resolve, reject) {

    OrmProvider.update('UPDATE fields SET ?', data, 'slug', whereId, 'app_id', data.app_id).then((result) => {

      OrmProvider.apps.findBySlug(whereId).then((rows) => {
        resolve(rows);
      }).catch((err) => {
        reject(err);
      });

    }).catch((err) => {
      reject(err);
    });

  });

};

OrmProvider.entries.findByAppId = (appId) => {
  return OrmProvider.select('SELECT e.id, e.app_id, f.field_id, e.created, e.modified \
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
    appId
  ]);
};

OrmProvider.entries.findByAppIdAndId = (appId, id) => {
  return OrmProvider.select('SELECT e.id, e.app_id, f.field_id, e.created, e.modified \
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
    appId,
    id
  ]);
};

OrmProvider.entries.deleteByAppIdAndId = (appId, id) => {
  return OrmProvider.delete('DELETE FROM fields WHERE id = ? AND app_id = ? LIMIT 1', [
    id,
    appId
  ]);
};

OrmProvider.entries.insert = (data) => {
  return new Promise(function(resolve, reject) {

    OrmProvider.insert('INSERT INTO entries SET ?', data).then((result) => {

      OrmProvider.entries.findByAppIdAndId(data.app_id, result.insertId).then((rows) => {
        resolve(rows);
      }).catch((err) => {
        reject(err);
      });

    }).catch((err) => {
      reject(err);
    });

  });

};

OrmProvider.entries.update = (data, whereId) => {
  return new Promise(function(resolve, reject) {

    OrmProvider.update('UPDATE entries SET ?', data, 'id', whereId).then((result) => {

      OrmProvider.entries.findByAppIdAndId(data.app_id, whereId).then((rows) => {
        resolve(rows);
      }).catch((err) => {
        reject(err);
      });

    }).catch((err) => {
      reject(err);
    });

  });

};

OrmProvider.entryFields.insert = (data) => {

  return new Promise(function(resolve, reject) {

    OrmProvider.fields.findByAppIdAndSlug(data.app_id, data.field_slug).then((result) => {

      delete data.app_id;
      delete data.field_slug;
      data.field_id = result[0].id;

      OrmProvider.insert('INSERT INTO entry_fields SET ?', data).then((r) => {
        resolve(r);
      }).catch((err) => {
        reject(err);
      });

    }).catch((err) => {
      reject(err);
    });

  });

};

OrmProvider.entryFields.update = (data, whereId) => {

  return new Promise(function(resolve, reject) {

    OrmProvider.fields.findByAppIdAndSlug(data.app_id, data.field_slug).then((result) => {

      let slug = data.field_slug;
      delete data.app_id;
      delete data.field_slug;
      data.field_id = result[0].id;

      OrmProvider.update('UPDATE entry_fields SET ?', data, 'field_id', data.field_id, 'entry_id', data.entry_id).then((r) => {
        resolve(r);
      }).catch((err) => {
        reject(err);
      });

    }).catch((err) => {
      reject(err);
    });

  });

};

module.exports = OrmProvider;

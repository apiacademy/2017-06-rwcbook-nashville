/*******************************************************
 * TPS - Task Processing Service
 * note connector (server)
 * May 2015
 * Mike Amundsen (@mamund)
 * Soundtrack : Complete Collection : B.B. King (2008)
 *******************************************************/

// handles HTTP resource operations 
var qs = require('querystring');
var wstl = require('./../wstl.js');
var utils = require('./utils.js');

var components = {};
components.note = require('./../components/note-component.js');
components.task = require('./../components/task-component.js');

var content = "";
content += '<div class="ui segment">';
content += '<h3>Manage your TPS Notes here.</h3>';
content += '<p>You can do the following:</p>';
content += '<ul>';
content += '<li>Add, Edit and Delete notes</li>';
content += '<li>Assign notes to a task</li>';
content += '<li>Filter the list by Title and Text content.</li>';
content += '</ul>';
content += '</div>';

module.exports = main;

function main(req, res, parts, respond) {
  var flag;
  
  flag = false;
  switch (req.method) {
    case 'GET':
      if(flag===false && parts[1]==="assign" && parts[2]) {
        flag=true;
        sendAssignPage(req, res, respond, parts[2]);
      }
      if(flag===false && parts[1] && parts[1].indexOf('?')===-1) {
        flag = true;
        sendItemPage(req, res, respond, parts[1]);
      }
      if(flag===false) {
        sendListPage(req, res, respond);
      }
    break;
    case 'POST':
      if(parts[1] && parts[1].indexOf('?')===-1) {
        switch(parts[1].toLowerCase()) {
          case "assign":
            assignTask(req, res, respond, parts[2]);
            break;
          default:
            respond(req, res, 
              utils.errorResponse(req, res, 'Method Not Allowed', 405)
            );
            break;          
        }
      }
      else {
        addNote(req, res, respond);
      }
    break;  
    case "PUT":
      if(parts[1] && parts[1].indexOf('?')===-1) {
        updateNote(req, res, respond, parts[1]);
      }
      else {
        respond(req, res, 
          utils.errorResponse(req, res, 'Method Not Allowed', 405)
        );          
      }
    break;
    case 'DELETE':
      if(parts[1] && parts[1].indexOf('?')===-1) {
        removeNote(req, res, respond, parts[1]);
      }
      else {
        respond(req, res, 
          utils.errorResponse(req, res, 'Method Not Allowed', 405)
        );          
      }
    break;    
  default:
    respond(req, res, utils.errorResponse(req, res, 'Method Not Allowed', 405));
    break;
  }
}

function sendListPage(req, res, respond) {
  var doc, coll, root, q, qlist, code, related;

  root = '//'+req.headers.host;
  coll = [];
  data = [];
  related = {};
  
  // parse any filter on the URL line
  // or just pull the full set
  q = req.url.split('?');
  if(q[1]!==undefined) {
    qlist = qs.parse(q[1]);
    data = components.note('filter', qlist);
  }
  else {
    data = components.note('list');
  }
  
  // load related data
  related.tasklist = components.task('list');
  
  // top-level links
  tran = wstl.append({name:"homeLink",href:"/home/",
    rel:["collection","/rels/home"],root:root}, coll);
  tran = wstl.append({name:"taskLink",href:"/task/",
    rel:["collection","/rels/task"],root:root},coll); 
  tran = wstl.append({name:"userLink",href:"/user/",
    rel:["collection","rels/user"],root:root},coll);
  tran = wstl.append({name:"noteLink",href:"/note/",
    rel:["collection","/rels/note"],root:root},coll);

  // item links
  wstl.append({name:"noteLinkItem",href:"/note/{id}",
    rel:["item"],root:root},coll);
  wstl.append({name:"noteAssignLink",href:"/note/assign/{id}",
    rel:["edit-form","/rels/noteAssignTask"],root:root},coll);

  // add template
  wstl.append({name:"noteFormAdd",href:"/note/",
    rel:["create-form","/rels/noteAdd"],root:root},coll);

  // list queries
  wstl.append({name:"noteFormListByTitle",href:"/note/",
    rel:["search","/rels/noteByTitle"],root:root},coll);
  wstl.append({name:"noteFormListByText",href:"/note/",
    rel:["search","/rels/noteByText"],root:root},coll);
  
  // compose graph 
  doc = {};
  doc.title = "TPS - Notes";
  doc.actions = coll;
  doc.data =  data;
  doc.related = related;
  doc.content = content;

  // send the graph
  respond(req, res, {
    code : 200,
    doc : {
      note : doc
    }
  });
  
}

function sendItemPage(req, res, respond, id) {
  var doc, coll, data, code, related;

  root = '//'+req.headers.host;
  coll = [];
  data = [];
  related = {};

  related.tasklist = components.task('list');
  
  // load data item
  item = components.note('read',id);
  if(item.length===0) {
    doc = utils.errorResponse(req, res, "File Not Found", 404);
    respond(req, res, {code: 404, doc:doc});
  }
  else {
    data = item;
  
    // top-level links
    tran = wstl.append({name:"homeLink",href:"/home/",
      rel:["collection","/rels/home"],root:root}, coll);
    tran = wstl.append({name:"taskLink",href:"/task/",
      rel:["collection","/rels/task"],root:root},coll); 
    tran = wstl.append({name:"userLink",href:"/user/",
      rel:["collection","rels/user"],root:root},coll);
    tran = wstl.append({name:"noteLink",href:"/note/",
      rel:["collection","/rels/note"],root:root},coll);

    // item links
    wstl.append({name:"noteLinkItem",href:"/note/{id}",
      rel:["item"],root:root},coll);
    wstl.append({name:"noteAssignLink",href:"/note/assign/{id}",
      rel:["edit-form","/rels/noteAssignTask"],root:root},coll);

    // add template
    wstl.append({name:"noteFormAdd",href:"/note/",
      rel:["create-form","/rels/noteAdd"],root:root},coll);

    // compose graph 
    doc = {};
    doc.title = "TPS - Notes";
    doc.actions = coll;
    doc.data =  data;
    doc.related = related;
    doc.content = content;

    // send the graph
    respond(req, res, {
      code : 200,
      doc : {
        note : doc
      }
    });
  }  
}

function sendAssignPage(req, res, respond, id) {
  var doc, coll, data, code, related;

  root = '//'+req.headers.host;
  coll = [];
  data = [];
  related = {};

  // load related data
  related.tasklist = components.task('list');
  
  // load data item
  item = components.note('read',id);
  if(item.length===0) {
    doc = utils.errorResponse(req, res, "File Not Found", 404);
    respond(req, res, {code: 404, doc:doc});
  }
  else {
    data = item;
  
    // top-level links
    tran = wstl.append({name:"homeLink",href:"/home/",
      rel:["collection","/rels/home"],root:root}, coll);
    tran = wstl.append({name:"taskLink",href:"/task/",
      rel:["collection","/rels/task"],root:root},coll); 
    tran = wstl.append({name:"userLink",href:"/user/",
      rel:["collection","rels/user"],root:root},coll);
    tran = wstl.append({name:"noteLink",href:"/note/",
      rel:["collection","/rels/note"],root:root},coll);

    // item links
    wstl.append({name:"noteLinkItem",href:"/note/{id}",
      rel:["item"],root:root},coll);
    wstl.append({name:"noteAssignLink",href:"/note/assign/{id}",
      rel:["edit-form","/rels/noteAssignTask"],root:root},coll);

    // edit form
    wstl.append({name:"noteAssignForm",href:"/note/assign/{id}",
      rel:["create-form","/rels/noteAssign"],root:root},coll);

    // compose graph 
    doc = {};
    doc.title = "TPS - Notes";
    doc.actions = coll;
    doc.data =  data;
    doc.related = related;
    doc.content =  content;

    // send the graph
    respond(req, res, {
      code : 200,
      doc : {
        note : doc
      }
    });
  }  
}

function addNote(req, res, respond) {
  var body, doc, msg;

  body = '';
  
  // collect body
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    try {
      msg = utils.parseBody(body, req.headers["content-type"]);
      doc = components.note('add', msg);
      if(doc && doc.type==='error') {
        doc = utils.errorResponse(req, res, doc.message, doc.code);
      }
    } 
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, {code:303, doc:"", 
        headers:{'location':'//'+req.headers.host+"/note/"}
      });
    } 
    else {
      respond(req, res, doc);
    }
  });
}

function updateNote(req, res, respond, id) {
  var body, doc, msg;

  body = '';
  
  // collect body
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    try {
      msg = utils.parseBody(body, req.headers["content-type"]);
      doc = components.note('update', id, msg);
      if(doc && doc.type==='error') {
        doc = utils.errorResponse(req, res, doc.message, doc.code);
      }
    } 
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, 
        {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/note/"}}
      );
    } 
    else {
      respond(req, res, doc);
    }
  })
}

function assignTask(req, res, respond, id) {
  var body, doc, msg;

  body = '';
  
  // collect body
  req.on('data', function(chunk) {
    body += chunk;
  });

  // process body
  req.on('end', function() {
    try {
      msg = utils.parseBody(body, req.headers["content-type"]);
      doc = components.note('assign-task', id, msg);
      if(doc && doc.type==='error') {
        doc = utils.errorResponse(req, res, doc.message, doc.code);
      }
    } 
    catch (ex) {
      doc = utils.errorResponse(req, res, 'Server Error', 500);
    }

    if (!doc) {
      respond(req, res, 
        {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/note/"}}
      );
    } 
    else {
      respond(req, res, doc);
    }
  })
}

function removeNote(req, res, respond, id) {
  var doc;
  
  // execute
  try {
    doc = components.note('remove', id);
    if(doc && doc.type==='error') {
      doc = utils.errorResponse(req, res, doc.message, doc.code);    
    }
  } 
  catch (ex) {
    doc = utils.errorResponse(req, res, 'Server Error', 500);
  }
  
  if (!doc) {
    respond(req, res, 
      {code:303, doc:"", headers:{'location':'//'+req.headers.host+"/note/"}}
    );
  } 
  else {
    respond(req, res, doc);
  }
}

// EOF


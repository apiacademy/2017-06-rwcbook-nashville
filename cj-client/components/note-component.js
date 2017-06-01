/*******************************************************
 * TPS - Task Processing Service
 * note middleware component (server)
 * May 2015
 * Mike Amundsen (@mamund)
 * Soundtrack : Complete Collection : B.B. King (2008)
 *******************************************************/

var component = {};
component.task = require('./task-component.js');

var storage = require('./../storage.js');
var utils = require('./../connectors/utils.js');

module.exports = main;

// app-level actions for tasks
function main(action, args1, args2, args3) {
  var name, rtn, props;
    
  props = ["id","title","text","assignedTask","dateCreated","dateUpdated"];
  elm = 'note';

  // shared profile info for this object
  profile = {
    "id" : {"prompt" : "ID", "display" : true},
    "title" : {"prompt" : "Title", "display" : true},
    "text" : {"prompt" : "Text", "display" : true},
    "assignedTask" : {"prompt" : "Assigned Task", "display" : true},
    "dateCreated" :  {"prompt" : "Created", "display" : false},
    "dateUpdated" :  {"prompt" : "Updated", "display" : false}
  };

  switch (action) {
    case 'exists':
      rtn = (storage(elm, 'item', args1)===null?false:true);
      break;
    case 'props' :
      rtn = utils.setProps(args1,props);
      break;  
    case 'profile':
      rtn = profile;
      break;
    case 'list':
      rtn = utils.cleanList(storage(elm, 'list'));
      break;
    case 'read':
      rtn = utils.cleanList(storage(elm, 'item', args1));
      break;
    case 'filter':
      rtn = utils.cleanList(storage(elm, 'filter', args1));
      break;
    case 'add':
      rtn = addNote(elm, args1, props);
      break;
    case 'update':
      rtn = updateNote(elm, args1, args2, props);
      break;
    case 'remove':
      rtn = removeNote(elm, args1, args2, props);
      break;
    case 'assign-task':
      rtn = assignTask(elm, args1, args2, props);
      break;
    default:
      rtn = null;
      break;
  }
  return rtn;
}

function addNote(elm, note, props) {
  var rtn, item, error;
  
  error = "";
  
  item = {}
  item.title = (note.title||"");
  item.text = (note.text||"");
  item.assignedTask = (note.assignedTask||"");
  
  if(item.title === "") {
    error += "Missing Title ";
  }
  if(item.assignedTask==="") {
    error += "Missing Assigned Task ";
  } 
  if(component.task('exists', item.assignedTask)===false) {
    error += "Task ID not found. ";
  }  
  
  if(error.length!==0) {
    rtn = utils.exception(error);
  }
  else {
    storage(elm, 'add', utils.setProps(item,props));
  }
  
  return rtn;
}

function updateNote(elm, id, note, props) {
  var rtn, check, item, error;
  
  error = "";
  check = storage(elm, 'item', id);
  if(check===null) {
    rtn = utils.exception("File Not Found", "No record on file", 404);
  }
  else {
    item = check;
    item.id = id;      
    item.title = (note.title===undefined?check.title:note.title);
    item.text = (note.text===undefined?check.text:note.text);
    item.assignedTask = check.assignedTask

    if(item.title === "") {
      error += "Missing Title ";
    }
    if(item.assignedTask==="") {
      error += "Missing Assigned Task ";
    } 
    if(component.task('exists', item.assignedTask)===false) {
      error += "Task ID not found. ";
    }  
    
    if(error!=="") {
      rtn = utils.exception(error);
    } 
    else {
      storage(elm, 'update', id, utils.setProps(item, props));
    }
  }
  
  return rtn;
}

function removeNote(elm, id) {
  var rtn, check;
  
  check = storage(elm, 'item', id);
  if(check===null) {
    rtn = utils.exception("File Not Found", "No record on file", 404);
  }
  else {
    storage(elm, 'remove', id);
  }
  
  return rtn;
  
}

function assignTask(elm, id, note, props) {
  var rtn, check, item, error;
  
  error = "";
  check = storage(elm, 'item', id);
  if(check===null) {
    rtn = utils.exception("File Not Found", "No record on file", 404);
  }
  else {
    if(note.assignedTask===undefined||note.assignedTask.length===0) {
      error += "Missing Assigned Task ";
    }
    if(component.task('exists',note.assignedTask)===false) {
      error += "Task ID not found ";
    }
    
    if(error==="") {
      item = check;
      item.id = id;      
      item.title = check.title;
      item.text = check.text;
      item.assignedTask = note.assignedTask;
    }

    if(error!=="") {
      rtn = utils.exception(error);
    } 
    else {
      storage(elm, 'update', id, utils.setProps(item, props));
    }
  }
  
  return rtn;
}

// EOF


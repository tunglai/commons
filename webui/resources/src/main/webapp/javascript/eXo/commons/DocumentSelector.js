
if (!eXo) 
  eXo = {};

if (!eXo.commons) 
  eXo.commons = {};

function DocumentSelector(){
  this.defaultDriveType = "personal";
  this.getDrives = "";
  this.getFoldersAndFiles = "";
  this.deleteFolderOrFile = "";
  this.createFolder = "";
  this.isFolderOnlyParam = "";
  this.folderNameParam = "";
  this.driveTypeParam = "";
  this.driveNameParam = "";
  this.workspaceNameParam = "";
  this.currentFolderParam = "";
  this.itemPathParam = "";
  this.xmlHttpRequest = false;
  this.selectFile = null;
  this.selectFileLink = null;
  this.selectFolderLink = null;
  this.allowDeleteItem = true;
  this.dataId = null;
  this.selectedItem = null;
};

function DocumentItem(){
  driveType = null;
  driveName = null;
  workspaceName = null;
  currentFolder = null;
  jcrPath = null;
};

DocumentSelector.prototype.init = function(uicomponentId, restContext){
  var me = eXo.commons.DocumentSelector;
  this.uiComponent = document.getElementById(uicomponentId);
  this.selectFileLink = eXo.core.DOMUtil.findFirstDescendantByClass(this.uiComponent, "a", "SelectFile");
  this.selectFolderLink = eXo.core.DOMUtil.findFirstDescendantByClass(this.uiComponent, "a", "SelectFolder");
  this.getDrivesURL = restContext + this.getDrives;
  this.getFoldersAndFilesURL = restContext + this.getFoldersAndFiles;
  this.deleteFolderOrFileURL = restContext + this.deleteFolderOrFile;
  this.createFolderURL = restContext + this.createFolder;
  var documentItem = new DocumentItem();
  documentItem.driveType = this.defaultDriveType;
  me.renderDetails(documentItem);
};

DocumentSelector.prototype.changeDrive = function(selectBox){
  var documentItem = new DocumentItem();
  documentItem.driveType = selectBox.value;
  eXo.commons.DocumentSelector.renderDetails(documentItem);
};

DocumentSelector.prototype.renderDetails = function(documentItem) {
  var me = eXo.commons.DocumentSelector;
  var domUtil = eXo.core.DOMUtil;
  // Clear old data
  var rightWS = domUtil.findFirstDescendantByClass(this.uiComponent, "div",
      "RightWorkspace");
  var tblRWS = domUtil.findDescendantsByTagName(rightWS, "table")[0];
  var rowsRWS = domUtil.findDescendantsByTagName(tblRWS, "tr");
  if (rowsRWS && rowsRWS.length > 0) {
    for ( var i = 0; i < rowsRWS.length; i++) {
      if (i > 0)
        tblRWS.deleteRow(rowsRWS[i].rowIndex);
    }
  }
  me.selectedItem = documentItem;
  me.renderBreadcrumbs(documentItem, null);
  if (!documentItem.driveName) {
    me.renderDrives(tblRWS, documentItem);
  } else {    
    me.renderDetailsFolder(tblRWS, documentItem);
  }
};

DocumentSelector.prototype.renderDrives = function(tableContainer, documentItem) {
 var me = eXo.commons.DocumentSelector;
 var driveType = documentItem.driveType;
 var url = this.getDrivesURL;
 url += "?" + this.driveTypeParam + "=" + driveType;
 var data = me.request(url);
 var folderContainer = data.getElementsByTagName("Folders")[0];
 var folderList = folderContainer.getElementsByTagName("Folder");
 if (!folderList || folderList.length <= 0) {
   var tdNoContent = tableContainer.insertRow(1).insertCell(0);
   tdNoContent.innerHTML = "There is no drive";
   tdNoContent.className = "Item TRNoContent";
   //if (me.allowDeleteItem == true) {
     //tdNoContent.setAttribute("colspan", 4);
   //} else {
     //tdNoContent.setAttribute("colspan", 3);
   //}   
   return;
 }
 var clazz = 'EventItem';
 var k = 0;
 for ( var i = 0; i < folderList.length; i++) {
   k = i + 1;
   //if (clazz == 'EventItem') {
     //clazz = 'OddItem';
   //} else if (clazz == 'OddItem') {
     //clazz = 'EventItem';
   //}
   var name = folderList[i].getAttribute("name");
   var driveName = folderList[i].getAttribute("name");
   var workspaceName = folderList[i].getAttribute("workspaceName");
   var canAddChild = folderList[i].getAttribute("canAddChild");
   var newRow = tableContainer.insertRow(i + 1);
   newRow.className = clazz + " Cell";
   var cellZero = newRow.insertCell(0);
   cellZero.onclick = function() {
     eXo.commons.DocumentSelector.browseFolder(this);
   }
   cellZero.innerHTML = '<a class="Item Folder" name="' + name
        + '" driveType="' + driveType+ '" driveName="' + driveName
        + '" workspaceName="' + workspaceName + '" canAddChild="' + canAddChild
        + '" onclick="javascript:void(0);">' + decodeURIComponent(name)
        + '</a>';
   //newRow.insertCell(1);
   //newRow.insertCell(2);
   //if (me.allowDeleteItem == true) {
     //newRow.insertCell(3);
   //}
 }
};

DocumentSelector.prototype.renderDetailsFolder = function(tableContainer,documentItem) {
  var me = eXo.commons.DocumentSelector;
  var driveType = documentItem.driveType;
  var driveName = documentItem.driveName;
  var workSpaceName = documentItem.workspaceName;
  var currentFolder = documentItem.currentFolder;
  if (!currentFolder)
    currentFolder = "";
  var url = this.getFoldersAndFilesURL;
  url += "?" + this.driveNameParam + "=" + driveName;
  url += "&" + this.workspaceNameParam + "=" + workSpaceName;
  url += "&" + this.currentFolderParam + "=" + currentFolder;
  url += "&" + this.isFolderOnlyParam + "=false";
  var data = me.request(url);
  var folderContainer = data.getElementsByTagName("Folders")[0];
  var folderList = folderContainer.getElementsByTagName("Folder");
  var fileContainer = data.getElementsByTagName("Files")[0];
  var fileList = fileContainer.getElementsByTagName("File");

  if ((!fileList || fileList.length <= 0)
      && (!folderList || folderList.length <= 0)) {
    var tdNoContent = tableContainer.insertRow(1).insertCell(0);
    tdNoContent.innerHTML = "There is no folder or file";
    tdNoContent.className = "Item TRNoContent";
    //if (me.allowDeleteItem == true) {
      //tdNoContent.setAttribute("colspan", 4);
    //} else {
      //tdNoContent.setAttribute("colspan", 3);
    //}    
    return;
  } else {
    var listItem = '';
    var clazz = 'EventItem';
    var k = 0;
    for ( var i = 0; i < folderList.length; i++) {
      k = i + 1;
      //if (clazz == 'EventItem') {
        //clazz = 'OddItem';
      //} else if (clazz == 'OddItem') {
        //clazz = 'EventItem';
      //}
      var clazzItem = me.getClazzIcon(folderList[i].getAttribute("nodeType"));
      var jcrPath = folderList[i].getAttribute("path");
      var nodeType = folderList[i].getAttribute("folderType");
      var name = folderList[i].getAttribute("name");
      
      var childFolder = folderList[i].getAttribute("currentFolder");
      var canRemove = folderList[i].getAttribute("canRemove");
      var canAddChild = folderList[i].getAttribute("canAddChild");

      var newRow = tableContainer.insertRow(i + 1);
      newRow.className = clazz + " Cell";
      
      var cellZero = newRow.insertCell(0);
      cellZero.onclick = function() {
        eXo.commons.DocumentSelector.browseFolder(this);
      }
      cellZero.innerHTML = '<a class="Item Folder ' + clazzItem + '" name="'
          + name + '" driveType="' + driveType + '" driveName="'
          + driveName + '"workSpaceName="' + workSpaceName + '" canAddChild="' + canAddChild
          + '" currentFolder="' + childFolder + '" jcrPath="' + jcrPath
          + '" onclick="javascript:void(0);">' + decodeURIComponent(name)
          + '</a>';
      //newRow.insertCell(1);
      //newRow.insertCell(2);
      //if (me.allowDeleteItem == true) {
        //var cellThird = newRow.insertCell(3);
        //cellThird.onclick = function() {
          //eXo.commons.DocumentSelector.remove(this);
        //}
        //cellThird.innerHTML = '<a class="Item" name="' + name + '"driveName="'
            //+ driveName + '"workSpaceName="' + workSpaceName + '"itemPath="'
            //+ childFolder + '" onclick="javascript:void(0);">Remove</a>';
      //}
    }
    for ( var j = 0; j < fileList.length; j++) {
      //if (clazz == 'EventItem') {
        //clazz = 'OddItem';
      //} else if (clazz == 'OddItem') {
        //clazz = 'EventItem';
      //}
      var jcrPath = fileList[j].getAttribute("path");
      var nodeType = fileList[j].getAttribute("nodeType");
      var nodeTypeIcon = nodeType.replace(":", "_") + "48x48Icon Folder";
      var node = fileList[j].getAttribute("name");
      var size = fileList[j].getAttribute("size");
      if (size < 1024)
        size += '&nbsp;Byte(s)';
      else if (size > 1024 && size < (1024 * 1024)) {
        size = (Math.round(size / 1024 * 100)) / 100;
        size += '&nbsp;KB';
      } else {
        size = (Math.round(size / (1024 * 1024) * 100)) / 100;
        size += '&nbsp;MB';
      }
      var clazzItem = me.getClazzIcon(fileList[j].getAttribute("nodeType"));
      var newRow = tableContainer.insertRow(k + j + 1);
      newRow.className = clazz + " Cell";
      var cellZero = newRow.insertCell(0);
      cellZero.onclick = function() {
        eXo.commons.DocumentSelector.submitSelectedFile(this);
      }
      cellZero.innerHTML = '<a class="Item ' + clazzItem + '" jcrPath="'
          + jcrPath + '" name="'+ node+'" onclick="javascript:void(0);">'
          + decodeURIComponent(node) + '</a>';
      //newRow.insertCell(1).innerHTML = '<div class="Item">' + fileList[j]
          //.getAttribute("dateCreated") + '</div>';
      //newRow.insertCell(2).innerHTML = '<div class="Item">' + size + '</div>';
      //if (me.allowDeleteItem == true) {
        //var cellThird = newRow.insertCell(3);
        //cellThird.onclick = function() {
          //eXo.commons.DocumentSelector.remove(this);
        //}
        //cellThird.innerHTML = '<a class="Item"  name="' + node
            //+ '" driveName="' + driveName + '"workSpaceName="'
            //+ workSpaceName + '"itemPath="' + currentFolder + '/' + node
            //+ '" onclick="javascript:void(0);">Remove</a>';
      //}
    }
  }
};

DocumentSelector.prototype.submitSelectedFile = function(tableCell){
  var me = eXo.commons.DocumentSelector;
  var domUtil = eXo.core.DOMUtil;
  var detailNode = domUtil.getChildrenByTagName(tableCell, "a")[0];
  var nodePath = detailNode.getAttribute("jcrPath");
  var fileName = detailNode.getAttribute("name");
  if (me.selectFileLink) {
    var link = me.selectFileLink.href;
    var endParamIndex = link.lastIndexOf("')");
    if (endParamIndex > 0)
      link = link.substring(0, endParamIndex) + "&"+ me.dataId +"=" + nodePath + "')";
    window.location = link;
  }
  if (me.selectFile) {
    if (eXo.core.DOMUtil.hasClass(me.selectFile, "Selected")) {
      eXo.core.DOMUtil.removeClass(me.selectFile, "Selected");
    }
  }
  me.selectFile = tableCell.parentNode;
  domUtil.addClass(me.selectFile, "Selected");
  if (me.selectedItem) {
    me.renderBreadcrumbs(me.selectedItem, fileName);
  }
};

DocumentSelector.prototype.submitSelectedFolder = function(documentItem){
  var me = eXo.commons.DocumentSelector;
  var workspaceName = documentItem.workspaceName;
  var jcrPath = documentItem.jcrPath;
  if (me.selectFolderLink) {
    var link = me.selectFolderLink.href;
    var endParamIndex = link.lastIndexOf("')");
    if (endParamIndex > 0)
      link = link.substring(0, endParamIndex) + "&" + me.dataId + "="
          + workspaceName + jcrPath + "')";
    window.location = link;
  }
};

DocumentSelector.prototype.browseFolder = function(tableCell){
  var me = eXo.commons.DocumentSelector;
  var domUtil = eXo.core.DOMUtil;
  var detailNode = domUtil.getChildrenByTagName(tableCell, "a")[0];
  var documentItem = new DocumentItem();
  documentItem.driveType = detailNode.getAttribute("driveType");
  documentItem.driveName = detailNode.getAttribute("driveName");
  documentItem.workspaceName = detailNode.getAttribute("workspaceName");
  documentItem.currentFolder = detailNode.getAttribute("currentFolder");
  documentItem.jcrPath = detailNode.getAttribute("jcrPath");
  documentItem.canAddChild = detailNode.getAttribute("canAddChild");
  me.renderDetails(documentItem);
  me.submitSelectedFolder(documentItem);
};

DocumentSelector.prototype.remove = function(tableCell) {
  var me = eXo.commons.DocumentSelector;
  var domUtil = eXo.core.DOMUtil;
  var detailNode = domUtil.getChildrenByTagName(tableCell, "a")[0];
  var name = detailNode.getAttribute("name");
  var r = confirm("Are you sure you want remove " + name + " ?");
  if (r == false)
    return;
  var driveName = detailNode.getAttribute("driveName");
  var workspaceName = detailNode.getAttribute("workspaceName");
  var itemPath = detailNode.getAttribute("itemPath");
  var url = me.deleteFolderOrFileURL;
  url += "?" + me.driveNameParam + "=" + driveName;
  url += "&" + me.workspaceNameParam + "=" + workspaceName;
  url += "&" + me.itemPathParam + "=" + itemPath;
  me.request(url);
  if (me.selectedItem) {
    me.renderDetails(me.selectedItem);
  }

};

DocumentSelector.prototype.newFolder = function(inputFolderName){
  var me = eXo.commons.DocumentSelector; 
  var domUtil = eXo.core.DOMUtil;
  
  var msg_new_folder_not_allow = inputFolderName.getAttribute("msg_new_folder_not_allow");
  var msg_select_folder = inputFolderName.getAttribute("msg_select_folder");
  var msg_enter_folder_name = inputFolderName.getAttribute("msg_enter_folder_name");
  var msg_empty_folder_name = inputFolderName.getAttribute("msg_empty_folder_name");
  
  if (!me.selectedItem || !me.selectedItem.driveName) {
    alert(msg_select_folder);
    return;
  }

  var folderName = prompt(msg_enter_folder_name, "");
  if (folderName == null || folderName == "") {
    alert(msg_empty_folder_name);
    return;
  }

  var canAddChild = me.selectedItem.canAddChild;
  if (canAddChild == "false") {
    alert(msg_new_folder_not_allow);
    return;
  }
  var driveName = me.selectedItem.driveName;
  var workspaceName = me.selectedItem.workspaceName;
  var currentFolder = me.selectedItem.currentFolder;
  if (!currentFolder)
    currentFolder = '';
  var url = me.createFolderURL;
  url += "?" + me.driveNameParam + "=" + driveName;
  url += "&" + me.workspaceNameParam + "=" + workspaceName;
  url += "&" + me.currentFolderParam + "=" + currentFolder;
  url += "&" + me.folderNameParam + "=" + folderName;  
  me.request(url);
  me.renderDetails(me.selectedItem);
};

DocumentSelector.prototype.actionBreadcrumbs = function(driveType, driveName,
    workspaceName, currentFolder) {
  var documentItem = new DocumentItem();
  documentItem.driveType = driveType;
  documentItem.driveName = driveName;
  documentItem.workspaceName = workspaceName;
  documentItem.currentFolder = currentFolder;
  eXo.commons.DocumentSelector.renderDetails(documentItem);
}

DocumentSelector.prototype.renderBreadcrumbs = function(documentItem, fileName) {
  var domUtil = eXo.core.DOMUtil;
  var breadcrumbContainer = domUtil.findFirstDescendantByClass(
      this.uiComponent, "div", "BreadcumbsContainer");
  breadcrumbContainer.innerHTML = '';
  var breadCrumbObject = new BreadCrumbs();
  breadCrumbObject.breadCrumb = breadcrumbContainer;
  if (fileName){
    breadCrumbObject.renderFileName(documentItem,fileName);
  } else if (documentItem.currentFolder){
    breadCrumbObject.renderFolder(documentItem,fileName);    
  } else if (documentItem.driveName){
    breadCrumbObject.renderDrive(documentItem,fileName);
  } else {
    breadCrumbObject.renderDriveType(documentItem,fileName);
  }
  var linkNode = eXo.core.DOMUtil.findDescendantsByTagName(breadcrumbContainer,
      "a");
  eXo.core.DOMUtil.replaceClass(linkNode[linkNode.length - 1], 'Normal',
      'Selected');
};

DocumentSelector.prototype.scrollBottom = function() {
  var listView = eXo.core.DOMUtil.findFirstDescendantByClass(
      this.uiComponent, "div", "ListView");
  listView.scrollTop = listView.scrollHeight;
};

function BreadCrumbs() {
  breadCrumb = null;
  
  BreadCrumbs.prototype.renderDriveType = function(documentItem) {
    if (this.breadCrumb){
      this.appendBreadCrumbNode(documentItem, '/');
    }
  };

  BreadCrumbs.prototype.renderDrive = function(documentItem) {
    if (this.breadCrumb) {
      var tmpDocumentItem = new DocumentItem();
      tmpDocumentItem.driveType = documentItem.driveType;
      this.renderDriveType(tmpDocumentItem);
      this.appendBreadCrumbNode(documentItem, documentItem.driveName);
    }
  };

  BreadCrumbs.prototype.renderFolder = function(documentItem) {
    if (this.breadCrumb) {
      var tmpDocumentItem = new DocumentItem();
      tmpDocumentItem.driveType = documentItem.driveType;
      tmpDocumentItem.driveName = documentItem.driveName;
      tmpDocumentItem.workspaceName = documentItem.workspaceName;
      this.renderDrive(tmpDocumentItem);
      var breadCrumbItem = documentItem.currentFolder.split("/");
      tmpDocumentItem.currentFolder = '';
      for ( var i = 0; i < breadCrumbItem.length; i++) {
        tmpDocumentItem.currentFolder += breadCrumbItem[i];
        this.appendBreadCrumbNode(tmpDocumentItem, breadCrumbItem[i]);
        tmpDocumentItem.currentFolder += "/";
      }
    }
  };
  

  BreadCrumbs.prototype.renderFileName = function(documentItem, fileName) {
  if (this.breadCrumb) {
      this.renderFolder(documentItem)
      var fileNode = document.createElement("div");
      fileNode.className = 'BreadcumbTab';
      fileNode.innerHTML = '<a class="Normal">' + decodeURIComponent(fileName) + '</a>';
      this.breadCrumb.appendChild(fileNode);
    }
  };
  
  BreadCrumbs.prototype.appendBreadCrumbNode = function(documentItem, name) {
    var node = document.createElement("div");
    var driveType = documentItem.driveType;
    if (driveType)
      driveType = "'" + driveType + "'";
    var driveName = documentItem.driveName;
    if (driveName)
      driveName = "'" + driveName + "'";
    var workspaceName = documentItem.workspaceName;
    if (workspaceName)
      workspaceName = "'" + workspaceName + "'";
    var currentFolder = documentItem.currentFolder;
    if (currentFolder)
      currentFolder = "'" + currentFolder + "'";
    node.className = 'BreadcumbTab';
    strOnclick = "eXo.commons.DocumentSelector.actionBreadcrumbs(" + driveType
        + "," + driveName + "," + workspaceName + "," + currentFolder + ");";
    node.innerHTML = '<a class="Normal" href="javascript:void(0);" onclick="'
        + strOnclick + '">' + decodeURIComponent(name)
        + '</a>&nbsp;&nbsp;';
    this.breadCrumb.appendChild(node);
  };
};


DocumentSelector.prototype.getClazzIcon = function(nodeType){
  var strClassIcon = '';
  if (!nodeType) {
    strClassIcon = ".nt_file";
    return strClassIcon;
  }
  strClassIcon = nodeType.replace("/", "_").replace(":", "_").toLowerCase() + "16x16Icon";
  return strClassIcon;
};

DocumentSelector.prototype.request = function(url){
  var xmlHttpRequest = false;
  if (window.XMLHttpRequest) {
    xmlHttpRequest = new window.XMLHttpRequest();
    xmlHttpRequest.open("GET", url, false);
    xmlHttpRequest.send("");
    if (xmlHttpRequest.responseXML) 
      return xmlHttpRequest.responseXML;
  }
  else 
    if (ActiveXObject("Microsoft.XMLDOM")) { // for IE
      xmlHttpRequest = new ActiveXObject("Microsoft.XMLDOM");
      xmlHttpRequest.async = false;
      xmlHttpRequest.load(urlRequestXML);
      return xmlHttpRequest;
    }
  return null;
};

String.prototype.trunc = function(n, useWordBoundary){
  var toLong = this.length > n, s_ = toLong ? this.substr(0, n - 1) : this;
  s_ = useWordBoundary && toLong ? s_.substr(0, s_.lastIndexOf(' ')) : s_;
  return toLong ? s_ + '...' : s_;
};

eXo.commons.DocumentSelector = new DocumentSelector();
// ==UserScript==
// @name        Flag Lister for 4chan
// @namespace   flaglister.4chan
// @description Lists all flags in the current page. Inspired by Extra Flags for 4chan.
// @author      ebinBuddha 
// @include     http*://boards.4chan.org/int/*
// @include     http*://boards.4chan.org/sp/*
// @include     http*://boards.4chan.org/pol/*
// @include     http*://boards.4chan.org/bant/*
// @exclude     http*://boards.4chan.org/int/catalog
// @exclude     http*://boards.4chan.org/sp/catalog
// @exclude     http*://boards.4chan.org/pol/catalog
// @exclude     http*://boards.4chan.org/bant/catalog
// @version     0.1.3
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @run-at      document-end
// @updateURL   https://github.com/ebinBuddha/Flag-Lister-for-4chan/raw/master/Flag-Lister-for-4chan.meta.js
// @downloadURL https://github.com/ebinBuddha/Flag-Lister-for-4chan/raw/master/Flag-Lister-for-4chan.user.js
// ==/UserScript==

var regions = [];
var posts = [];
var postNrs = [];
var allPostsOnPage = [];
var tableID = 'flagTable';
var bodyID = 'flagBodyID';
var classes = [];
var decimatedPostNrs = [];
var buttonID = 'toggleButton';
var RefreshID = 'refreshButton';
var panelStatus = false;
var panelStatusVariable = 'panelStatusVariable';
var mainCheckBoxID = "mainCheckBoxID";
var flagColumnID = "flagColumnID";
var regionDivider = "||";
var flegs = false;
var flegsStatusVariable = 'flegsStatusVariable';
var flagTree = new Tree();
var maxDepth = 0;


/* support classes */
function Node(title, className, imgUrl, post, parent) {
    this.title = title
    this.className = className;
    this.imgUrl = imgUrl;
    this.post = post;
    this.parent = null;
    this.children = [];
}


function Tree() {
    var node = new Node("root", "", "", "", null);
    this._root = node;
}


Tree.prototype.getNode = function(path) {
    
    var node = null;
    var curNode = null;
    
    if (path !== "") {
        var postedRegions = path.split(regionDivider);
        curNode = this._root;
        var done = false;
        
        if (postedRegions.length>0) {
            (function recurse(regionsArray) {

                if (curNode.contains(regionsArray[0]) === true) {

                    if (regionsArray.length>1) {
                        var trimmedRegionsArray = regionsArray.splice(0, 1);
                        recurse(trimmedRegionsArray);
                    } else {
                        done = true;
                        node = curNode.getChild(regionsArray[0]);
                    }
                }
            })(postedRegions);
        }
    } else {
        node = this._root;
    }
    return node;
}


Node.prototype.contains = function(title) {
    var res = false;
    
    for (var i = 0, length = this.children.length; i < length; i++) {
        var child = this.children[i];
        if (this.children[i].title === title) {
            return true;
        }
    }
    
    return false;
}


Node.prototype.getChild = function(title) {
    for (var i = 0, length = this.children.length; i < length; i++) {
        if (this.children[i].title === title) {
            return this.children[i];
        }
    }
    return null;
}


Node.prototype.addChild = function(title, className, imgUrl, post) {
    
    if (this.contains(title)) {
        return null;
    } else {
        var child = new Node(title, className, imgUrl, post, this);
        this.children.push(child);
        return child;
    }
}


Tree.prototype.add = function(path, title, className, imgUrl, post) {
    var res = null;
    
    var parent = this.getNode(path);
    if (parent !== null) {
       res = parent.addChild (title, className, imgUrl, post, parent);
    } else {  // add to root if no parent specified
       res = this._root.addChild (title, className, imgUrl, post, this._root);
    }
    
    return res;
};
/* end of support classes */


/** Setup, preferences */
var setup = {
    namespace: 'flaglister.4chan.',
    id: "FlagLister-setup",
    setupTable: function () {
        
        var htmlButton;
        htmlButton='<button id="' + buttonID + '" name="toggle">▲</button>';

        var htmlFixedStart = '<div id="upperDiv"><div class="innerDiv">'+ htmlButton + '</div>\
                              <div class="innerDiv">Flag lister for 4chan v0.1</div></div>';
        
		var htmlList = '<div id="tablediv"><br/>\
                        <button id="' + RefreshID + '" name="refresh" title="force table refresh">↺</button>\
                        <input id="' + mainCheckBoxID +'" type="checkbox" name="check">\
                        <label for="' + mainCheckBoxID +'">List ExtraFlags</label><br/>\
                        <div id="tablediv2"><table border=2 id="' + tableID + '">';
		var htmlHeader = '<col id="' + flagColumnID + '" /><col width=87 /><col width=87 /><col width=102 />\
                        <thead><tr id="headRow">\
						<th>Flag</th>\
						<th>Name</th>\
						<th>className</th>\
						<th>go to</th>\
						</tr></thead>';
        var htmlListEnd = '<tbody id="' + bodyID + '"></tbody></table></div></div>';
        
		htmlList +=  htmlHeader + htmlListEnd;
        return htmlFixedStart + htmlList;

    },
    loadToggle: function() {
        var toggleStatus = setup.load(panelStatusVariable);
        if (toggleStatus === "" || toggleStatus === "undefined" || (toggleStatus!==false && toggleStatus!==true)) {
            panelStatus = true;
        }
        setup.setToggleVisibility();
    },
    loadCheck: function() {
        var flegStatus = setup.load(flegsStatusVariable);
        if (flegStatus === "" || flegStatus === "undefined" || (flegStatus!==false && flegStatus!==true)) {
            flegs = true;
        }
        document.getElementById(mainCheckBoxID).checked = flegs;
    },
    setToggleVisibility: function () {
        var tableDiv = document.getElementById("tablediv");
        if (panelStatus === true) tableDiv.style.display = "block";
        if (panelStatus === false) tableDiv.style.display = "none";
        var toggleButton = document.getElementById(buttonID);
        if (panelStatus === true) {toggleButton.innerHTML = "▲"; toggleButton.title = "Hide table"; }
        if (panelStatus === false){toggleButton.innerHTML = "▼"; toggleButton.title = "Show table"; }
    },
    show: function () {
        /* remove setup window if existing */
         var setup_el = document.getElementById(setup.id);
         if (setup_el) {
           setup_el.parentNode.removeChild(setup_el);
         }
         /* create new setup window */
         GM_addStyle('\
           #tablediv2 { max-height:400px; overflow:auto;}\
           #headRow { height:30px;}\
           #upperDiv { text-align:center;}\
           .innerDiv { display: inline-block; vertical-align: middle;}\
           #' + mainCheckBoxID + ' { vertical-align:middle; }\
           #' + setup.id + ' { position:fixed;z-index:10001;top:40px;right:40px;padding:20px 30px;background-color:white;width:auto;border:1px solid black }\
           #' + setup.id + ' * { color:black;text-align:left;line-height:normal;font-size:12px }\
           #' + setup.id + ' div { text-align:center;font-weight:bold;font-size:14px; overflow:auto;}\
           #' + tableID + ' th, td { border: 1px solid; padding-top: 1px; padding-bottom: 1px; padding-left: 3px; padding-right: 3px; text-align: left;}\
           #' + tableID + ' th {background-color:#E0E0E0}\
           #' + tableID + ' { border-collapse: collapse; overflow-y: auto; overflow-x:hidden; }');
        
         setup_el = document.createElement('div');
         setup_el.id = setup.id;
         setup_el.innerHTML = setup.setupTable();

         document.body.appendChild(setup_el);
         
         setup.loadToggle();
         setup.loadCheck();
         setup.q('check').addEventListener('click', function () {
             onCBClick();
         }, false);

         setup.q('toggle').addEventListener('click', function () {
             toggleButton();
             setup.setToggleVisibility();
         }, false);
        
         setup.q('refresh').addEventListener('click', function () {
             clearTable();
             parseOriginalPosts();
             resolveRefFlags();
         }, false);

    },
    q: function (n) {
        return document.querySelector('#' + this.id + ' *[name="' + n + '"]');
    },
    save: function (k, v) {
        GM_setValue(setup.namespace + k, v);
    },
    load: function (k) {
        return GM_getValue(setup.namespace + k);
    },
    init: function () {
        GM_registerMenuCommand('Flag Catcher', setup.show);
    }
};

function toggleButton() {
    panelStatus= !panelStatus;
    setup.save(panelStatusVariable, panelStatus);
}


function onCBClick() {
    flegs = document.getElementById(mainCheckBoxID).checked;
    setup.save(flegsStatusVariable, flegs);
    onFlagsLoad();
}


/** parse the posts already on the page before thread updater kicks in */
function parseOriginalPosts() {
    var tempAllPostsOnPage = document.getElementsByClassName('postContainer');
    allPostsOnPage = Array.prototype.slice.call(tempAllPostsOnPage); //convert from element list to javascript array
    postNrs = allPostsOnPage.map(function (p) {
        return p.id.replace("pc", "");
    });
}


function clearTable() {
    maxDepth = 0;
    
    var tbl = document.getElementById(bodyID);
    
    while (tbl.rows.length>0)
    {
        tbl.deleteRow(tbl.rows.length - 1);
    }
    
    var root= flagTree._root;
    
    (function deleteAll(node) {
        if (node.children.length>0) {
            for (var i = 0; i < node.children.length; i++) {
                deleteAll(node.children[i]);
            }
            node.children=[];
        }
        node.parent=null;
    }) (root);
}

/** the function to get the flags from the db uses postNrs
 *  member variable might not be very nice but it's the easiest approach here */
function onFlagsLoad() {
    
    var boardID = window.location.pathname.split('/')[1];
    
    clearTable();
    var tbl = document.getElementById(bodyID);
    postNrs.forEach(function (post) {
        var postToAddFlagTo = document.getElementById("pc" + post),
        postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0],
        nameBlock = postInfo.getElementsByClassName('nameBlock')[0],
        currentFlag = nameBlock.getElementsByClassName('flag')[0];
        
        if (!currentFlag) return;
        
        /* ok the main flag exists, now look for regionals and fill the tree */
        
        var className = currentFlag.className;
        var title = currentFlag.title;
        var link = post.toString();
        var img = currentFlag.cloneNode(true);
        
        var extraFlags = nameBlock.getElementsByClassName('extraFlag');
        addFlags(title, className, img, link, extraFlags);
        
        if (flegs) {
             maxDepth = Math.max(extraFlags.length+1,maxDepth);
        } else {
             maxDepth = 1;
        }
        
    });
    
    var column = document.getElementById(flagColumnID);
    column.width = 14+16*maxDepth;
    
    populateTable();

}


function populateTable() {
    var boardID = window.location.pathname.split('/')[1];
    var tbl = document.getElementById(bodyID);
    var root= flagTree._root;
    var startLevel = 0;
    
    (function addRow(node, level) {
        if (level>1 && !flegs) {return;}
        if (level>0) {
            var row = tbl.insertRow(-1);    
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);

            var img;
            var className = node.className;
            var title = node.title;
            var link = document.createTextNode(boardID + ' ' + node.post.toString());
            var a = document.createElement('a');
            a.appendChild(link);
            a.href = '#pc' + node.post.toString();
            a.style.color="#0000FF";

            img = node.imgUrl.cloneNode(true);
            if (level>0) { img.style.paddingLeft = (level-1)*16 + "px"; }
            cell1.appendChild(img);
            cell2.innerHTML = title;
            cell3.innerHTML = className;
            cell4.appendChild(a);
        }

        if (node.children.length>0) {
            for (var i = 0; i < node.children.length; i++) {
                addRow(node.children[i],level+1);
            }
        }

    }) (root, startLevel);
}


/* parses extraflags and stores in tree */
function addFlags(title, className, img, link, extraFlags) {
    // if not present add main flag to the tree
    if (flagTree.getNode(title) === null) {
        flagTree.add("",title,className,img,link);
    }
    
    // parse extraFlags array
    if (extraFlags.length >0) {
        
        var curNode = flagTree.getNode(title);
        
        for (var i = 0; i < extraFlags.length; i++) {
            var extraFlag = extraFlags[i];
            var child = extraFlag.childNodes[0];
            var eTitle = child.title;
            var eClass = "extraFlag";
            var eLink = link;
            var img = child.cloneNode(true);
            var newNode = null;
            
            if (curNode.contains(eTitle)) {
                newNode = curNode.getChild(eTitle);
            } else {
                newNode = curNode.addChild(eTitle, eClass, img, eLink, curNode);
            }
                
            curNode= newNode;
            
        }
    }
}


/** add flags to table */
function resolveRefFlags() {
    var boardID = window.location.pathname.split('/')[1];
    if (boardID === "int" || boardID === "sp" || boardID === "pol" || boardID === "bant") {

        onFlagsLoad();
    }
}


// I still need these two events to handle the update as extraFlags seems not to trigger our event
// everytime, and to me this work without regionals if extraFlags isn't installed 
/** Listen to post updates from the thread updater for 4chan x v2 (loadletter) and v3 (ccd0 + ?) */
document.addEventListener('ThreadUpdate', function (e) {
    console.log('threadupdate');
    var evDetail = e.detail || e.wrappedJSObject.detail;
    var evDetailClone = typeof cloneInto === 'function' ? cloneInto(evDetail, unsafeWindow) : evDetail;

    //ignore if 404 event
    if (evDetail[404] === true) {
      return;
    }

    setTimeout(function () {
        //add to temp posts and the DOM element to allPostsOnPage
        evDetailClone.newPosts.forEach(function (post_board_nr) {
            var post_nr = post_board_nr.split('.')[1];
            postNrs.push(post_nr);
            var newPostDomElement = document.getElementById("pc" + post_nr);
            allPostsOnPage.push(newPostDomElement);
        });
    }, 0);

    //setTimeout to support greasemonkey 1.x
    setTimeout(resolveRefFlags, 0);
}, false);

/** Listen to post updates from the thread updater for inline extension */
document.addEventListener('4chanThreadUpdated', function (e) {
    console.log('4chanthreadupdated');
    var evDetail = e.detail || e.wrappedJSObject.detail;

    var threadID = window.location.pathname.split('/')[3];
    var postsContainer = Array.prototype.slice.call(document.getElementById('t' + threadID).childNodes);
    var lastPosts = postsContainer.slice(Math.max(postsContainer.length - evDetail.count, 1)); //get the last n elements (where n is evDetail.count)

    //add to temp posts and the DOM element to allPostsOnPage
    lastPosts.forEach(function (post_container) {
      var post_nr = post_container.id.replace("pc", "");
      postNrs.push(post_nr);
      allPostsOnPage.push(post_container);
    });

    //setTimeout to support greasemonkey 1.x
    setTimeout(resolveRefFlags, 0);
}, false);


/** setup init and start first calls */
panelStatus = setup.load(panelStatusVariable);
if (panelStatus === "" || panelStatus === "undefined" || (panelStatus!==false && panelStatus!==true)) {
    panelStatus = true;
}
flegs = setup.load(flegsStatusVariable);
if (flegs === "" || flegs === "undefined" || (flegs!==false && flegs!==true)) {
    flegs = true;
}
setup.init();
setup.show();
clearTable();
parseOriginalPosts();

// we need the event to trigger the stuff as GreaseMonkey script execution order seems useless
document.addEventListener('doneExtraFlags', function(event){ clearTable(); resolveRefFlags();},false);

// kick in a first run: seems the event above is not fired if no extraflags is present in the thread...
clearTable();
resolveRefFlags();

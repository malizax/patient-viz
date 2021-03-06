/**
 * Created by krause on 2014-09-29.
 */

function EventView(sel) {
  var that = this;
  var singleSlot = false;
  var singleType = false;
  var events = [];
  var full = sel.classed("popover", true).style({
    "display": "none",
    "position": "fixed",
    "left": "20px",
    "top": "80px",
    "max-width": 325 + "px"
  });
  var header = full.append("h3").classed("popover-title", true).text("Selection");
  var list = full.append("div").classed("popover-content", true).style({
    "overflow": "auto",
    "max-height": "200px"
  });
  var sortAndGroup = null;
  var dropdown = header.append("select").classed("dropdown", true).on("change", function() {
    var dd = dropdown.node();
    var sag = d3.select(dd.options[dd.selectedIndex]).datum();
    that.selectSortAndGroup(sag);
  }).style({
    "position": "absolute",
    "right": "14px"
  });
  // TODO
  this.resize = function(allowedHeight, bodyPadding) {
    full.style({
      "top": (bodyPadding + 20) + "px"
    });
    list.style({
      "max-height": (allowedHeight - 80) + "px"
    });
  };

  this.connectPool = function(pool) {
    pool.addSelectionListener(function(es, types, singleSlot, singleType) {
      if(es.length && singleSlot) {
        var tmp = [];
        pool.traverseEventsForEventTime(es[0], function(e) {
          tmp.push(e);
        });
        that.setEvents(tmp, singleSlot, singleType);
      } else {
        that.setEvents(es, singleSlot, singleType);
      }
    });
  };

  this.setEvents = function(es, ss, st) {
    events = es;
    singleSlot = ss;
    singleType = st;
    that.updateList();
  };

  this.updateList = function() {
    var groups;
    if(sortAndGroup && sortAndGroup.group) {
      var set = {};
      events.forEach(function(e) {
        var g = sortAndGroup.group(e);
        if(!(g.id in set)) {
          set[g.id] = {
            id: g.id,
            desc: g.desc,
            events: []
          };
        }
        set[g.id].events.push(e);
      });
      groups = [];
      Object.keys(set).sort().forEach(function(id) {
        groups.push(set[id]);
      });
    } else {
      groups = [{
        id: "events",
        desc: "Events",
        events: events
      }];
    }

    var gs = list.selectAll("p.eP").data(groups, function(g) {
      return g.id;
    }).order();
    gs.exit().remove();
    var gsE = gs.enter().append("p").classed("eP", true);
    gsE.append("h5").classed("eHead", true);
    gsE.append("ul").classed({
      "list-unstyled": true,
      "eUl": true
    }).style({
      "font-size": "10px",
      "font-family": "monospace",
      "white-space": "nowrap"
    });

    // groups won't get properly propagated to
    // elements created in the enter section
    function propagateGroup(g) {
      groups.forEach(function(ref) {
        if(ref.id !== g.id) return;
        g.events = ref.events;
        g.desc = ref.desc;
      });
    };

    var groupHeaders = gs.selectAll("h5.eHead");
    groupHeaders.each(propagateGroup);
    groupHeaders.text(function(g) {
      return g.desc;
    });

    var eu = gs.selectAll("ul.eUl").each(propagateGroup);
    var es = eu.selectAll("li.pElem").data(function(g) {
      return g.events;
    }, function(e) {
      return e.getId();
    });
    es.exit().remove();
    es.enter().append("li").classed("pElem", true).each(function(e) {
      var li = d3.select(this);
      e.createListEntry(li);
    });
    if(sortAndGroup && sortAndGroup.sort) {
      es.sort(sortAndGroup.sort);
    }
    es.each(function(e) {
      var li = d3.select(this);
      e.updateListEntry(li, singleSlot, singleType);
    });

    full.style({
      "display": events.length ? "block" : "none"
    });
  };

  this.addSortAndGroup = function(desc, sort, group) {
    // TODO
    var g = {
      desc: desc,
      sort: sort,
      group: group
    };
    dropdown.append("option").datum(g).text(g.desc);
    return g;
  };
  this.selectSortAndGroup = function(sg) {
    sortAndGroup = sg;
    // TODO
    that.updateList();
  };
} // EventView

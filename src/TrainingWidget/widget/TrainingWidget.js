define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "TrainingWidget/lib/jquery-1.11.2",
    "dojo/text!TrainingWidget/widget/template/TrainingWidget.html"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, _jQuery, widgetTemplate) {
    "use strict";

    var $ = _jQuery.noConflict(true);

    return declare("TrainingWidget.widget.TrainingWidget", [_WidgetBase, _TemplatedMixin], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements
        canvas: null,
        // Parameters configured in the Modeler.
        circleEntity: null,
        rectangleEntity: null,
        borderRadius: null,
        shapeToFlow: null,
        radius: null,
        width: null,
        height: null,
        xcoord: null,
        ycoord: null,

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            this._handles = [];
        },
        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            logger.debug(this.id + ".postCreate");
        },
        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            logger.debug(this.id + ".update");
            var _this = this;
            if (obj) {
                let ctxId = obj.getGuid();
                this.canvas.innerHTML = "";
                this.retrieveEntity(this.circleEntity, this.shapeToFlow, ctxId)
                    .then(function (circles) {
                        _this.drawCircles(circles)
                    });
                this.retrieveEntity(this.rectangleEntity, this.shapeToFlow, ctxId)
                    .then(function (rectObjs) {
                        _this.drawRectangles(rectObjs);
                    });
            } else {
                console.log("No context object!");
            }
            this._executeCallback(callback, "_updateRendering"); // We're passing the callback to updateRendering to be called after DOM-manipulation
        },
        retrieveEntity: function (shapeEntity, association, referredId) {
            return new Promise(function (resolve) {
                var xPath = "//" + shapeEntity + "[" + association.split("/")[0] + "=" + referredId + "]";
                mx.data.get({
                    xpath: xPath,
                    "callback": function (results) {
                        resolve(results);
                    }
                });
            })
        },
        drawCircles: function (cirleObjects) {
            cirleObjects.forEach(function (circle) {
                this.drawCircle(circle, this.canvas);
            }, this);
        },
        drawRectangles: function (rectObjs) {
            rectObjs.forEach(function (rect) {
                this.drawRectangle(rect, this.canvas);
            }, this);
        },
        resize: function (box) {
            logger.debug(this.id + ".resize");
        },
        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
            logger.debug(this.id + ".uninitialize");
        },
        // Rerender the interface.
        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");

            if (this._contextObj !== null) {
                dojoStyle.set(this.domNode, "display", "block");

                var xPath = "//" + this.shapeEntity + "[" + this.shapeToFlow.split("/")[0] + "=" + this._contextObj.getGuid() + "]";
                mx.data.get({
                    xpath: xPath,
                    "callback": function (results) {
                        results.forEach(function (aShape) {
                            this.drawCircle(aShape);
                        }, this)
                    }.bind(this)
                });
            } else {
                dojoStyle.set(this.domNode, "display", "none");
            }
            // The callback, coming from update, needs to be executed, to let the page know it finished rendering
            this._executeCallback(callback, "_updateRendering");
        },

        drawCircle: function (circleEntity, canvas) {
            var radius = circleEntity.get(this.radius);
            var xcoord = circleEntity.get(this.xCoord);
            var ycoord = circleEntity.get(this.yCoord);
            var color = circleEntity.get(this.color);
            var circleDom = dojoConstruct.toDom("<div></div>");
            dojoStyle.set(circleDom, "width", radius * 2 + "px");
            dojoStyle.set(circleDom, "height", radius * 2 + "px");
            dojoStyle.set(circleDom, "position", "absolute");
            dojoStyle.set(circleDom, "border-radius", "50%");
            dojoStyle.set(circleDom, "background-color", color);
            dojoStyle.set(circleDom, "top", ycoord + "px");
            dojoStyle.set(circleDom, "left", xcoord + "px");
            dojoConstruct.place(circleDom, canvas);
        },
        drawRectangle: function (rectObj, canvas) {
            var width = rectObj.get(this.width) * 1;
            var height = rectObj.get(this.height) * 1;
            var borderRadius = rectObj.get(this.borderRadius) * 1;
            var xcoord = rectObj.get(this.xCoord) * 1;
            var ycoord = rectObj.get(this.yCoord) * 1;
            var color = rectObj.get(this.color);
            var rectDom = dojoConstruct.toDom("<div></div>");
            dojoStyle.set(rectDom, "width", width + "px");
            dojoStyle.set(rectDom, "height", height + "px");
            dojoStyle.set(rectDom, "position", "absolute");
            dojoStyle.set(rectDom, "border-radius", borderRadius + "px");
            dojoStyle.set(rectDom, "background-color", color);
            dojoStyle.set(rectDom, "top", ycoord + "px");
            dojoStyle.set(rectDom, "left", xcoord + "px");
            dojoConstruct.place(rectDom, canvas);
        },
        // Shorthand for running a microflow
        _execMf: function (mf, guid, cb) {
            logger.debug(this.id + "._execMf");
            if (mf && guid) {
                mx.ui.action(mf, {
                    params: {
                        applyto: "selection",
                        guids: [guid]
                    },
                    callback: lang.hitch(this, function (objs) {
                        if (cb && typeof cb === "function") {
                            cb(objs);
                        }
                    }),
                    error: function (error) {
                        console.debug(error.description);
                    }
                }, this);
            }
        },

        // Shorthand for executing a callback, adds logging to your inspector
        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["TrainingWidget/widget/TrainingWidget"]);

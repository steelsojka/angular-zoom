angular.module("angular-zoom", []).directive("ngZoomable" , [function() {

  var forEach = angular.forEach;
  var isUndefined = angular.isUndefined;
  var vendors = ["-webkit-", "-moz-", "-ms-", "-o-", ""];
  
  var setStyles = function(element, prop, value, propPrefix) {
    requestAnimationFrame(function() {
      var styles = {};

      forEach(vendors, function(vendor) {
        styles[vendor + prop] = propPrefix ? vendor + value : value;
      });

      element.css(styles);
    });
  };

  var setTransform = function(element, scale, transX, transY) {
    setStyles(element, "transform", "scale(" + scale + ") translateY(" + -transY + "px) translateX(" + -transX + "px) translateZ(0)");
  };

  var setTransition = function(element, fn) {
    setStyles(element, "transition", "transform 1s ease-in-out", true);
    fn();

    prefixEventBind(element, "transitionend", function() {
      setStyles(element, "transition", "");
    });
  };

  var prefixEventBind = function(element, type, callback, unbind) {
    var fn = unbind ? element.off : element.on;
    for (var i = 0, len = vendors.length; i < len; i++) {
      fn.call(element, vendors[i].replace("-", "") + type.toLowerCase(), callback);
    }
  };

  var apply = function(scope, fn) {
    return function() {
      scope.$apply(fn);
    };
  };

  return {
    restrict: "A",
    require: "ngZoomable",
    scope: {
      zoomAmount: "=",
      maxZoom: "="
    },
    controller: ["$scope", function($scope) {
      this.target = null;
    }],
    link: function(scope, element, attrs, ctrl) {
      var startX = 0;
      var startY = 0;
      var transX = 0;
      var transY = 0;
      var isDragging = false;

      scope.onMouseDown = function(e) {
        startX = e.clientX + transX;
        startY = e.clientY + transY;
        isDragging = true;
      };

      scope.onMouseUp = function(e) {
        isDragging = false;
      };

      scope.onMouseMove = function(e) {
        if (!isDragging) {
          return;
        }

        // TODO: divide by scope.zoomAmount to account for zoomed panning
        transX = startX - e.clientX;
        transY = startY - e.clientY;

        setTransform(ctrl.target, scope.zoomAmount, transX, transY);
      };

      scope.onDoubleClick = apply(scope, function(e) {
        if (scope.zoomAmount >= scope.maxZoom) {
          return;
        }

        setTransition(ctrl.target, function() {
          scope.zoomAmount = 2;
        });
      });

      element.on("mousemove", scope.onMouseMove);
      element.on("mousedown", scope.onMouseDown);
      element.on("mouseup", scope.onMouseUp);
      element.on("dblclick", scope.onDoubleClick);

      scope.$watch(function() {
        return scope.zoomAmount;
      }, function(val) {
        setTransform(ctrl.target, val, transX, transY);
      });
    }
  };
}])
.directive("ngZoomableTarget", [function() {
  return {
    restrict: "A",
    require: "^ngZoomable",
    link: function(scope, element, attrs, ctrl) {
      ctrl.target = element;
    }
  };
}]);

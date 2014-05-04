angular.module("angular-zoom", []).directive("ngZoomable" , ["$q", "$timeout", function($q, $timeout) {

  var forEach = angular.forEach;
  var isUndefined = angular.isUndefined;
  var bind = angular.bind;
  var vendors = ["-webkit-", "-moz-", "-ms-", "-o-", ""];
  
  var setStyles = function(element, prop, value, propPrefix) {
    var styles = {};

    forEach(vendors, function(vendor) {
      styles[vendor + prop] = propPrefix ? vendor + value : value;
    });

    element.css(styles);
  };


  var setTransition = function(element, fn) {
    var deferred = $q.defer();
    var done = false;

    setStyles(element, "transition", "transform 1s ease-in-out", true);

    var onTransitionEnd = function() {
      if (!done) {
        setStyles(element, "transition", "");
        prefixEventBind(element, "transitionend", onTransitionEnd, true);
        done = true;
        deferred.resolve();
      }
    };

    prefixEventBind(element, "transitionend", onTransitionEnd);

    fn();

    $timeout(onTransitionEnd, 1010, false);

    return deferred.promise;
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
      zoomMax: "=",
      zoomIncrement: "=",
      zoomTransition: "&",
      snapback: "&"
    },
    controller: ["$scope", function($scope) {
      this.target = null;
    }],
    link: function(scope, element, attrs, ctrl) {
      var startX = 0;
      var startY = 0;
      var transX = 0;
      var transY = 0;
      var posX = 0;
      var posY = 0;

      var isDragging = false;

      var setTransform = function() {
        setStyles(ctrl.target, "transform", "scale(" + scope.zoomAmount + ") translate3d(" + posX + "px, " + posY +"px, 0)");
      };

      var setZoomAmount = function(amount) {
        scope.zoomAmount = amount;
      };

      var zoom = function(amount) {
        if (scope.zoomAmount >= scope.zoomMax) {
          return;
        }

        if (scope.zoomTransition()) {
          setTransition(ctrl.target, bind(this, setZoomAmount, amount));
        } else {
          setZoomAmount(amount)
        }

        setTransform();
      };

      scope.onMouseDown = function(e) {
        startX = e.clientX;
        startY = e.clientY;
        startPosX = posX;
        startPosY = posY;
        isDragging = true;
      };

      scope.onMouseUp = function(e) {
        transX = 0;
        transY = 0;
        isDragging = false;

        if (scope.snapback()) {
          // TODO: add snapback effect
        }
      };

      scope.onMouseMove = function(e) {
        if (!isDragging) {
          return;
        }

        transX = e.clientX - startX;
        transY = e.clientY - startY;
        posX = startPosX + transX / scope.zoomAmount;
        posY = startPosY + transY / scope.zoomAmount;

        setTransform();
      };

      scope.onDoubleClick = apply(scope, function() {
        // TODO: make this zoom amount the increment
        zoom(2);
      });


      element.on("mousemove", scope.onMouseMove)
        .on("mousedown", scope.onMouseDown)
        .on("mouseup", scope.onMouseUp)
        .on("dblclick", scope.onDoubleClick);

      scope.$watch(function() {
        return scope.zoomAmount;
      }, zoom);
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

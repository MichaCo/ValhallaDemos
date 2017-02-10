(function() {
	'use strict';

	L.Routing.Control = L.Routing.Itinerary.extend({
		options: {
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);
			this._router = this.options.router || new L.Routing.OSRM(options);
			this._plan = this.options.plan || L.Routing.plan(undefined, { geocoder: this.options.geocoder });
			if (this.options.waypoints) {
				this._plan.setWaypoints(this.options.waypoints);
			}
			if (this.options.date_time) {
			  this.setDateTime(this.options.date_time);
			}

			L.Routing.Itinerary.prototype.initialize.call(this, this._router);

			this.on('routeselected', this._routeSelected, this);
			this._plan.on('waypointschanged', this._route, this);

			this._route();
		},

		onAdd: function(map) {
			var container = L.Routing.Itinerary.prototype.onAdd.call(this, map);

			this._map = map;
			this._map.addLayer(this._plan);

			if (this.options.geocoder) {
				container.insertBefore(this._plan.createGeocoders(this.options.geocoder), container.firstChild);
			}
			return container;
		},

		onRemove: function(map) {
			if (this._line) {
				map.removeLayer(this._line);
			}
			map.removeLayer(this._plan);
			return L.Routing.Itinerary.prototype.onRemove.call(this, map);
		},

		setWaypoints: function(waypoints) {
			this._plan.setWaypoints(waypoints);
		},

		setDateTime: function(date_time) {
                  this._plan.setDateTime(date_time);
                },

		spliceWaypoints: function() {
			var removed = this._plan.spliceWaypoints.apply(this._plan, arguments);
			return removed;
		},

		_routeSelected: function(e) {
			var route = e.route;

			if (this._line) {
				this._map.removeLayer(this._line);
			}

			this._line = L.Routing.line(route);
			this._line.addTo(this._map);
			this._map.fitBounds(this._line.getBounds());
			this._hookEvents(this._line);
			$(document).trigger("routeselected:done");
		},

		_hookEvents: function(l) {
			l.on('linetouched', function(e) {
				this._plan.dragNewWaypoint(e);
			}, this);
		},

		_route: function() {
			if (this._plan.isReady()) {
				this._router.route(this._plan.getWaypoints());
			}
		}
	});

	L.Routing.control = function(options) {
		return new L.Routing.Control(options);
	};
})();
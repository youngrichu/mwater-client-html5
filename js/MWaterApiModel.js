function MWaterApiModel(syncServer) {
	var that = this;

	this.init = function(success, error) {
		success();
	};

	function processJqXhrs(jqXhrs, success, error) {
		// If none left, call success
		if (jqXhrs.length == 0) {
			success();
			return;
		}

		// Call error or recurse next success
		var jq = _.first(jqXhrs);
		jq.success(function() {
			processJqXhrs(_.rest(jqXhrs), success, error);
		});
		jq.error(error);
	}


	this.transaction = function(callback, error, success) {
		var tx = {
			jqXhrs : [],
		};
		callback(tx);
		$.when.apply(window, tx.jqXhrs).done(success).fail(error);
	}

	function makeUrl(addr) {
		return syncServer.baseUrl + addr + "?clientuid=" + syncServer.getClientUid();
	}


	this.insertRow = function(tx, table, values) {
		console.log("Begin insert");
		tx.jqXhrs.push($.ajax(makeUrl(table + "/" + values.uid), {
			type : "PUT",
			data : values,
			success: function() {
				console.log("Insert completed");
			}
		}));
	}


	this.updateRow = function(tx, row, values) {
		console.log("Begin update");
		tx.jqXhrs.push($.ajax(makeUrl(row.table + "/" + row.uid), {
			type : "POST",
			data : values,
			success: function() {
				console.log("Update completed");
			}
		}));
	}


	this.deleteRow = function(tx, row) {
		tx.jqXhrs.push($.ajax(makeUrl(row.table + "/" + row.uid), {
			type : "DELETE",
		}));
	}

	function Row(table) {
		this.table = table;
	}

	function rowifyArray(array, table) {
		for (var i=0;i<array.length;i++)
			_.extend(array[i], new Row(table));
		return array;
	}

	this.queryNearbySources = function(latitude, longitude, search, success, error) {
		console.log("Begin query");
		var lat = (latitude - 1) + "," + (latitude + 1);
		var lng = (longitude - 1) + "," + (longitude + 1);

		// TODO include own sources with no location?

		$.get(makeUrl("sources"), {
			latitude : lat,
			longitude : lng
		}, function(data) {
			var src = data.sources;
			src = _.sortBy(src, function(s) {
				return (latitude - s.latitude) * (latitude - s.latitude) + (longitude - s.longitude) * (longitude - s.longitude);
			});

			if (search)
				src = _.filter(src, function(s) {
					return (s.name && s.name.indexOf(search) != -1) || (s.code && s.code.indexOf(search) != -1);
				});
			
			rowifyArray(src, "sources");
			success(src);
		}).error(error);
	}

    this.queryUnlocatedSources = function(createdBy, search, success, error) {
		$.get(makeUrl("sources"), {
			latitude : "null",
		}, function(data) {
			var src = data.sources;
			if (search)
				src = _.filter(src, function(s) {
					return (s.name && s.name.indexOf(search) != -1) || (s.code && s.code.indexOf(search) != -1);
				});
			rowifyArray(src, "sources");
			success(src);
		}).error(error);
    	
    }

	this.querySourceByUid = function(uid, success, error) {
		$.get(makeUrl("sources/" + uid), function(data) {
			success(_.extend(data, new Row("sources")));
		}).error(error);
	}


	this.querySamplesAndTests = function(sourceUid, success, error) {
		$.get(makeUrl("sources/" + sourceUid), {
			samples : "all"
		}, function(data) {
			success(rowifyArray(data.samples, "samples"));
		}).error(error);
	};

	this.querySourceNotes = function(sourceUid, success, error) {
		$.get(makeUrl("sources/" + sourceUid + "/source_notes"), function(data) {
			success(rowifyArray(data.source_notes, "source_notes"));
		}).error(error);
	}


	this.querySourceNoteByUid = function(uid, success, error) {
		$.get(makeUrl("source_notes/" + uid), function(data) {
			success(_.extend(data, new Row("source_notes")));
		}).error(error);
	}


	this.queryTests = function(createdBy, success, error) {
		$.get(makeUrl("tests"), {
			created_by : createdBy
		}, function(data) {
			success(rowifyArray(data.tests, "tests"));
		}).error(error);
	}


	this.queryTestByUid = function(uid, success, error) {
		$.get(makeUrl("tests/" + uid), function(data) {
			success(_.extend(data, "tests"));
		}).error(error);
	}

	// List of source type ids
	// TODO replace with query
	this.sourceTypes = _.range(16);

	/* Obsolote: this.queryLatLngSources = function(rect, since, limit, success, error) {
	 var where;
	 // If wraps
	 if (rect.x1 >= rect.x2)
	 where = " WHERE (latitude >= ? AND latitude <= ?) AND (longitude >= ? OR longitude <= ?)"
	 else
	 where = " WHERE (latitude >= ? AND latitude <= ?) AND (longitude >= ? AND longitude <= ?)"

	 if (since)
	 where += " AND uid > ?";

	 var sql = "SELECT * FROM sources" + where + " ORDER BY uid";
	 if (limit)
	 sql += " LIMIT " + limit;

	 var params = [rect.y1, rect.y2, rect.x1, rect.x2];
	 if (since)
	 params.push(since);

	 query(sql, params, new Row("sources"), success, error);
	 }*/
}

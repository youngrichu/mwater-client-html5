/* Responsible for connecting to a sync server. Persists login information in localstorage */

// baseUrl: api url, ending in "/"
function SyncServer(baseUrl) {
	var that = this;
	
	this.baseUrl = baseUrl;

	this.manualLogin = function(username, clientUid) {
		localStorage.setItem("username", username);
		localStorage.setItem("clientUid", clientUid);
	}


	this.signup = function(email, username, password, success, error) {
		$.ajax(baseUrl + "users/" + username, {
			type : "PUT",
			data : {
				email : email,
				password : password
			}
		}).success(function(data) {
			that.manualLogin(username, data.clientuid);
			success();
		}).error(error);
	}


	this.login = function(username, password, success, error) {
		$.post(baseUrl + "users/" + username, {
			password : password
		}).success(function(data) {
			that.manualLogin(username, data.clientuid);
			success();
		}).error(error);
	}


	this.logout = function(success, error) {
		that.manualLogin("", "");
		$.ajax(baseUrl + "clients/" + this.getClientUid(), {
			type : "DELETE",
			success : success,
			error : error
		});
	}


	this.getUsername = function() {
		return localStorage.getItem("username");
	}


	this.getClientUid = function() {
		return localStorage.getItem("clientUid");
	}


	this.loggedIn = function() {
		return this.getClientUid() != null && this.getClientUid() != "";
	}

}

SyncServer.prototype.uploadChanges = function(changes, success, error) {
	$.post(this.baseUrl + "sync", {
		clientuid : this.getClientUid(),
		changeset : JSON.stringify(changes)
	}).success(success).error(error);
}

SyncServer.prototype.downloadChanges = function(sliceMap, success, error) {
	$.get(this.baseUrl + "sync", {
		clientuid : this.getClientUid(),
		slices : JSON.stringify(sliceMap)
	}).success(function(data) {
		success(data);
	}).error(error);
}

SyncServer.prototype.getImageThumbnailUrl = function(imageUid) {
	return this.baseUrl + "images/" + imageUid + "/thumbnail";
}

SyncServer.prototype.getImageUrl = function(imageUid) {
	return this.baseUrl + "images/" + imageUid;
}

SyncServer.prototype.requestSourceCodes = function(number, success, error) {
	$.post(this.baseUrl + "source_codes", {
		clientuid : this.getClientUid(),
		number : number
	}).success(function(data) {
		success(data.codes);
	}).error(error);
}
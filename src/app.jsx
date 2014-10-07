"use strict";

var React = require('react'),
	orgUnit = require('d2l-orgunit');

var Welcome = React.createClass({
	render: function() {
		return <div>
			<div>Hello {this.props.firstName} {this.props.lastName}!</div>
			<div>You are in orgUnit <b>{orgUnit.OrgUnitId}</b>.</div>
			<img src="/d2l/common/files/platform/navbar/logo_slim.png" />
		</div>;
	}
});

module.exports = function(node) {
	React.renderComponent(
		<Welcome firstName="Daryl" lastName="McMillan"/>,
		node
	);
};

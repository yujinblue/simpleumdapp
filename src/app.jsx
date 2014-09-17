"use strict";

var React = require('react'),
	orgUnit = require('d2l-orgunit');

var Welcome = React.createClass({
	render: function() {
		return <div>Hello {this.props.firstName} {this.props.lastName}, 
		you are in org-unit <b>{orgUnit.OrgUnitId}</b>.</div>;
	}
});

module.exports = function(node) {
	React.renderComponent(
		<Welcome firstName="Steve" lastName="McQueen"/>,
		node
	);
};
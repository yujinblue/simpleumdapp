"use strict";

var React = require('react');

var Welcome = React.createClass({
	render: function() {
		return <div>Hello {this.props.firstName} {this.props.lastName}</div>;
	}
})

module.exports = function(node) {
	React.renderComponent(
		<Welcome firstName="Steve" lastName="McQueen"/>,
		node
	);
};
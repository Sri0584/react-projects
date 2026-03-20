import React from "react";

const Loading = () => {
	return (
		<div
			className='loader'
			aria-busy='true'
			aria-live='polite'
			role='status'
			aria-label='Loading content, please wait..'
		></div>
	);
};

export default Loading;
